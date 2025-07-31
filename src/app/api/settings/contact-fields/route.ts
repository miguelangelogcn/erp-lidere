import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

export async function GET() {
  const fieldsSnapshot = await adminDb.collection('contactCustomFields').orderBy('order').get();
  const fields = fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(fields);
}

export async function POST(req: Request) {
  const data = await req.json();
  const docRef = await adminDb.collection('contactCustomFields').add(data);
  return NextResponse.json({ id: docRef.id, ...data }, { status: 201 });
}
