import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Log inicial para provar que a rota foi chamada
    console.log("===================================");
    console.log("API DE CRIAÇÃO DE CAMPANHA FOI ACIONADA");
    console.log("===================================");

    // Tenta ler o corpo da requisição para verificar se há erro no parsing
    const body = await request.json();
    console.log("DADOS RECEBIDOS DO FORMULÁRIO:", body);

    // Retorna uma resposta de sucesso para o frontend
    return NextResponse.json({ 
      message: "Teste da API bem-sucedido! A rota foi chamada e os dados foram recebidos." 
    });

  } catch (error: any) {
    // Se o erro estiver no parsing do JSON ou em outro lugar, ele será logado aqui
    console.error("ERRO DENTRO DA API DE TESTE:", error);
    return NextResponse.json({ error: 'Falha dentro da API de teste.' }, { status: 500 });
  }
}
