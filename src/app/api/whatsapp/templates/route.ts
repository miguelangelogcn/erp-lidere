import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID } = process.env;

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
    console.error("WhatsApp credentials are not set in environment variables.");
    return NextResponse.json({ error: 'Credenciais do WhatsApp não configuradas no servidor.' }, { status: 500 });
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Error from Meta API:", errorData);
        throw new Error(errorData.error?.message || 'Falha ao buscar modelos do WhatsApp.');
    }

    const data = await response.json();
    
    // Filtra apenas os modelos aprovados, que são os únicos que podem ser enviados
    const approvedTemplates = data.data.filter((template: any) => template.status === 'APPROVED');

    return NextResponse.json(approvedTemplates);

  } catch (error: any) {
    console.error("Failed to fetch WhatsApp templates:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
