import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { z } from "zod";

const fieldSchema = z.object({
    label: z.string().min(1, "O rótulo é obrigatório."),
    key: z.string().min(1, "A chave é obrigatória.").regex(/^[a-zA-Z0-9_]+$/, "A chave deve conter apenas letras, números e underscores."),
    fieldType: z.enum(["text", "number", "date", "url", "email"]),
    order: z.number().int().min(0),
    required: z.boolean(),
});

// GET /api/settings/employee-fields
export async function GET() {
    try {
        const fieldsSnapshot = await adminDb.collection("employeeCustomFields").orderBy("order").get();
        const fields = fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(fields);
    } catch (error) {
        console.error("Erro ao buscar campos customizáveis:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

// POST /api/settings/employee-fields
export async function POST(request: Request) {
    try {
        const jsonBody = await request.json();
        const validation = fieldSchema.safeParse(jsonBody);

        if (!validation.success) {
            return NextResponse.json({ error: "Dados inválidos", details: validation.error.flatten() }, { status: 400 });
        }

        const newFieldRef = await adminDb.collection("employeeCustomFields").add(validation.data);

        return NextResponse.json({ id: newFieldRef.id, ...validation.data }, { status: 201 });

    } catch (error) {
        console.error("Erro ao criar campo customizável:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
