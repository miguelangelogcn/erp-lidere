import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/deals/[dealId]/comments
export async function GET(
  req: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const { dealId } = params;
    const commentsSnapshot = await adminDb
      .collection('deals')
      .doc(dealId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .get();
      
    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Erro ao buscar comentários: ", error);
    return NextResponse.json({ error: 'Falha ao buscar comentários.' }, { status: 500 });
  }
}

// POST /api/deals/[dealId]/comments
export async function POST(
  req: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const { dealId } = params;
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'O texto do comentário é obrigatório.' }, { status: 400 });
    }

    const newComment = {
      text,
      createdAt: FieldValue.serverTimestamp(),
      // Opcional: Adicionar o ID do usuário logado
      // authorId: 'user_id_aqui', 
    };

    const commentRef = await adminDb
      .collection('deals')
      .doc(dealId)
      .collection('comments')
      .add(newComment);

    return NextResponse.json({ id: commentRef.id, ...newComment }, { status: 201 });

  } catch (error) {
    console.error("Erro ao adicionar comentário: ", error);
    return NextResponse.json({ error: 'Falha ao adicionar comentário.' }, { status: 500 });
  }
}
