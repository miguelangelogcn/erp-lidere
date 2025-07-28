
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function PUT(req: Request, { params }: { params: { fieldId: string } }) {
  const { fieldId } = params;
  const data = await req.json();
  await adminDb.collection('contactCustomFields').doc(fieldId).update(data);
  return NextResponse.json({ id: fieldId, ...data });
}

export async function DELETE(req: Request, { params }: { params: { fieldId: string } }) {
  const { fieldId } = params;
  await adminDb.collection('contactCustomFields').doc(fieldId).delete();
  return NextResponse.json({ message: 'Campo excluído com sucesso' });
}
