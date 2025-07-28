import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { z } from "zod";

const fieldUpdateSchema = z.object({
    label: z.string().min(1, "O rótulo é obrigatório.").optional(),
    key: z.string().min(1, "A chave é obrigatória.").regex(/^[a-zA-Z0-9_]+$/, "A chave deve conter apenas letras, números e underscores.").optional(),
    fieldType: z.enum(["text", "number", "date", "url", "email"]).optional(),
    order: z.number().int().min(0).optional(),
    required: z.boolean().optional(),
}).partial();


interface RouteParams {
    params: {
        fieldId: string;
    }
}

// PUT /api/settings/employee-fields/[fieldId]
export async function PUT(request: Request, { params }: RouteParams) {
    const { fieldId } = params;
    try {
        const jsonBody = await request.json();
        const validation = fieldUpdateSchema.safeParse(jsonBody);

        if (!validation.success) {
            return NextResponse.json({ error: "Dados inválidos", details: validation.error.flatten() }, { status: 400 });
        }
        
        if (Object.keys(validation.data).length === 0) {
            return NextResponse.json({ error: "Nenhum dado para atualizar fornecido." }, { status: 400 });
        }

        const fieldRef = adminDb.collection("employeeCustomFields").doc(fieldId);
        await fieldRef.update(validation.data);

        return NextResponse.json({ message: "Campo atualizado com sucesso." });

    } catch (error) {
        console.error(`Erro ao atualizar campo ${fieldId}:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

// DELETE /api/settings/employee-fields/[fieldId]
export async function DELETE(request: Request, { params }: RouteParams) {
    const { fieldId } = params;
    try {
        const fieldRef = adminDb.collection("employeeCustomFields").doc(fieldId);
        await fieldRef.delete();

        return NextResponse.json({ message: "Campo excluído com sucesso." });

    } catch (error) {
        console.error(`Erro ao excluir campo ${fieldId}:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
