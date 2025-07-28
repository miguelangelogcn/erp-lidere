import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

const campaignSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório"),
  body: z.string().min(1, "O corpo da mensagem é obrigatório"),
  contactIds: z.array(z.string()).min(1, "Selecione ao menos um contato"),
});

export async function POST(request: Request) {
  try {
    const jsonBody = await request.json();
    const validation = campaignSchema.safeParse(jsonBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { name, body, contactIds } = validation.data;

    const newCampaignRef = await adminDb.collection("campaigns").add({
        name,
        body,
        contactIds,
        createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: newCampaignRef.id }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
