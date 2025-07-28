import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const fileContent = await file.text();

    // Analisa apenas uma linha para pegar os cabeçalhos de forma eficiente
    const result = Papa.parse(fileContent, {
      header: true,
      preview: 1, // Limita a análise a apenas 1 linha após o cabeçalho
      skipEmptyLines: true,
    });

    if (!result.meta.fields) {
        return NextResponse.json({ error: 'Não foi possível ler os cabeçalhos do arquivo.' }, { status: 400 });
    }

    return NextResponse.json({ headers: result.meta.fields });

  } catch (error) {
    console.error("Erro ao analisar cabeçalhos: ", error);
    return NextResponse.json({ error: 'Falha ao processar o arquivo.' }, { status: 500 });
  }
}
