import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";

const WEBHOOK_URL = 'https://hook.us2.make.com/hbe7xtra9uteosr9yovfd43n4q5tblwr';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;

  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
  }

  try {
    // 1. Fetch the campaign
    const campaignRef = adminDb.collection("campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    const campaignData = campaignSnap.data();
    if (!campaignData) {
      return NextResponse.json({ error: "Campaign data is invalid" }, { status: 500 });
    }

    // 2. Fetch contacts if they exist
    const { contactIds, name: campaignTitle, body: campaignBody } = campaignData;
    if (!contactIds || contactIds.length === 0) {
      return NextResponse.json({ error: "No contacts assigned to this campaign" }, { status: 400 });
    }

    const contactsQuery = adminDb.collection("contacts").where(adminDb.FieldPath.documentId(), "in", contactIds);
    const contactsSnap = await contactsQuery.get();
    
    const contacts: Contact[] = contactsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Contact));

    // 3. Prepare and dispatch all webhooks in parallel
    const webhookPromises = contacts.map(contact => {
      const payload = {
        nome: contact.name,
        email: contact.email,
        telefone: contact.phone || '',
        titulo: campaignTitle,
        corpo: campaignBody,
      };

      return fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    const results = await Promise.allSettled(webhookPromises);

    const successfulDispatches = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Dispatched ${successfulDispatches} of ${contacts.length} webhooks for campaign ${campaignId}.`);
    
    // Check for any failed dispatches to report
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to send webhook for contact ${contacts[index].id}:`, result.reason);
        }
    });

    return NextResponse.json({
      message: `${successfulDispatches} webhooks dispatched successfully.`,
      dispatchedCount: successfulDispatches
    });

  } catch (error: any) {
    console.error(`Error sending campaign ${campaignId}:`, error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
