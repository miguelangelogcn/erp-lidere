
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { z } from "zod";

const bulkDeleteSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, "Pelo menos um ID de contato é necessário."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Entrada inválida", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { contactIds } = validation.data;

    const batch = adminDb.batch();

    contactIds.forEach(id => {
        const contactRef = adminDb.collection("contacts").doc(id);
        batch.delete(contactRef);
    });

    await batch.commit();

    return NextResponse.json({
      message: `${contactIds.length} contato(s) excluído(s) com sucesso.`,
    });
  } catch (error: any) {
    console.error("Erro na exclusão em lote de contatos:", error);
    return NextResponse.json({ error: "Falha na exclusão em lote.", details: error.message }, { status: 500 });
  }
}
