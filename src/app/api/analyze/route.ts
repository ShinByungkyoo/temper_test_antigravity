import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scores, maxSymbol, typeName } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured on the server." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using 2.5 flash based on API key tier

    const prompt = `
      당신은 창의력 및 잠재력 개발 전문 분석가입니다.
      사용자가 방금 진단 테스트를 마쳤습니다. 다음은 사용자의 최종 결과입니다:
      - 우세 유형: ${typeName} (${maxSymbol})
      - 점수 분포: ☆ (주도형M): ${scores["☆"]}점, ♥ (S섬세형): ${scores["♥"]}점, ▲ (비범형N): ${scores["▲"]}점, ♬ (C은둔형): ${scores["♬"]}점

      이 점수 분포와 우세 유형을 바탕으로 사용자의 **창의력(Creativity)** 관점에 초점을 맞춘 심층 진단 리포트를 작성해주세요. 
      아래 세 가지 섹션으로 나누어 작성해주되, 창의적 잠재력을 일깨워주는 통찰력 있고 영감을 주는 어조로 작성하세요. (각 섹션은 1~2단락 내외)
      1. 창의력 관점에서의 성격 분석 (현재의 창의적 강점과 고유의 아이디어 발상 스타일)
      2. 창의력 발현을 방해할 수 있는 요소 및 주의할 점
      3. 창의력을 비약적으로 향상시키기 위한 구체적인 실천 조언
      반드시 마크다운 형식(Markdown)으로 응답을 작성해 주세요.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Failed to generate AI result" }, { status: 500 });
  }
}
