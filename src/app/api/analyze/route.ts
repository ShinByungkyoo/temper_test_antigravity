import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scores, maxSymbol, typeName } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API Key missing in Vercel settings." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      당신은 창의력 개발 전문 분석가입니다. 다음 결과를 바탕으로 창의력 중심의 심층 리포트를 마크다운 형식으로 작성하세요.
      - 유형: ${typeName} (${maxSymbol})
      - 점수: ☆(M):${scores["☆"] || 0}, ♥(S):${scores["♥"] || 0}, ▲(N):${scores["▲"] || 0}, ♬(C):${scores["♬"] || 0}
      
      작성 가이드:
      1. 창의적 강점 분석
      2. 발현 방해 요소 및 주의점
      3. 향상 조언
    `;

    const result = await model.generateContentStream(prompt);
    
    // Create a readable stream to pipe to the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (e: any) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("AI Streaming Error:", error);
    return Response.json({ error: "분석 중 오류 발생", details: error.message }, { status: 500 });
  }
}
