
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const bulkTagSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, "Pelo menos um ID de contato é necessário."),
  tag: z.string().min(1, "A tag é obrigatória."),
  action: z.enum(["add", "remove"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = bulkTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Entrada inválida", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { contactIds, tag, action } = validation.data;

    const batch = adminDb.batch();

    const operation = action === 'add' 
        ? FieldValue.arrayUnion(tag) 
        : FieldValue.arrayRemove(tag);

    contactIds.forEach(id => {
        const contactRef = adminDb.collection("contacts").doc(id);
        batch.update(contactRef, { tags: operation });
    });

    await batch.commit();

    const actionText = action === 'add' ? 'adicionada a' : 'removida de';

    return NextResponse.json({
      message: `Tag '${tag}' ${actionText} ${contactIds.length} contato(s) com sucesso.`,
    });
  } catch (error: any) {
    console.error("Erro na operação em lote de tags:", error);
    return NextResponse.json({ error: "Falha na operação com tags.", details: error.message }, { status: 500 });
  }
}

    