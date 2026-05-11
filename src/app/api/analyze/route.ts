// Force refresh build - 2026-05-12 08:14
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scores, maxSymbol, typeName } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Vercel 환경변수에 GOOGLE_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const prompt = `
      당신은 창의력 개발 전문 분석가입니다. 다음 진단 결과를 바탕으로 마크다운 형식의 심층 리포트를 작성하세요.
      - 우세 유형: ${typeName} (${maxSymbol})
      - 점수 분포: ☆:${scores["☆"] || 0}, ♥:${scores["♥"] || 0}, ▲:${scores["▲"] || 0}, ♬:${scores["♬"] || 0}
      
      1. 창의적 강점 (발상 스타일)
      2. 주의할 점 (방해 요소)
      3. 향상 조언
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("AI가 답변을 생성하지 못했습니다.");

    return Response.json({ result: text });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return Response.json({ 
      error: "AI 분석 중 오류가 발생했습니다.", 
      details: error.message 
    }, { status: 500 });
  }
}
