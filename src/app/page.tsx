"use client";

import React, { useState, useEffect } from "react";
import testData from "@/data.json";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(-1); // -1: Intro, 0~19: Questions, 20: Result
  const [answers, setAnswers] = useState<Record<number, Record<string, number>>>({});
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const questions = testData.questions;
  const currentQuestion = questions[currentStep];
  const rawData = testData as any;

  const handleStart = () => setCurrentStep(0);

  const handleScoreChange = (choiceKey: string, score: number) => {
    setAnswers(prev => {
      const qAnswers = { ...(prev[currentQuestion.id] || {}) };
      for (const [k, v] of Object.entries(qAnswers)) {
        if (v === score) delete qAnswers[k];
      }
      qAnswers[choiceKey] = score;
      return { ...prev, [currentQuestion.id]: qAnswers };
    });
  };

  const handleNext = () => {
    const qAnswers = answers[currentQuestion.id] || {};
    if (Object.keys(qAnswers).length !== 4) {
      alert("모든 항목에 점수를 매겨주세요.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => setCurrentStep(prev => prev - 1);

  const calculateResult = () => {
    const scores: Record<string, number> = { "♥": 0, "☆": 0, "▲": 0, "♬": 0 };
    questions.forEach(q => {
      const qAnswers = answers[q.id];
      const scoringMap = rawData.scoring[q.id.toString()];
      if (qAnswers && scoringMap) {
        for (const [choiceKey, score] of Object.entries(qAnswers)) {
          const symbol = scoringMap[choiceKey];
          if (symbol && scores[symbol] !== undefined) scores[symbol] += score;
        }
      }
    });

    let maxSymbol = "♥";
    let maxVal = -1;
    for (const [sym, val] of Object.entries(scores)) {
      if (val > maxVal) {
        maxVal = val;
        maxSymbol = sym;
      }
    }
    return { scores, maxSymbol, typeName: rawData.types[maxSymbol] };
  };

  const [calculatedResult, setCalculatedResult] = useState<any>(null);

  useEffect(() => {
    if (currentStep === questions.length) {
      const res = calculateResult();
      setCalculatedResult(res);
      fetchAiResult(res);
    }
  }, [currentStep]);

  const fetchAiResult = async (res: any) => {
    setIsLoadingAi(true);
    setAiError(null);
    setAiResult("");
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: res.scores,
          maxSymbol: res.maxSymbol,
          typeName: res.typeName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "분석 실패");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("스트림 실패");
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setAiResult(prev => (prev || "") + chunk);
      }
    } catch (err: any) {
      setAiError("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (currentStep === -1) {
    return (
      <main className="min-h-screen bg-white flex flex-col font-sans text-black">
        <header className="border-b-4 border-black py-4 px-6 flex justify-between items-center bg-white sticky top-0 z-50">
          <div className="font-black text-2xl tracking-tighter uppercase">ROOT4 TEMPER TEST</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="border-4 border-black max-w-2xl w-full p-12 text-center relative bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-6xl font-black mb-8 tracking-tighter uppercase leading-none">Temper<br/>Test</h1>
            <p className="text-lg font-bold mb-10 leading-relaxed border-t-2 border-black pt-6">
              각 문항의 4가지 항목에 대해 1~4점까지 중복 없이 점수를 매겨주세요.<br />
              <span className="text-sm uppercase tracking-widest mt-4 block">(4 = 가장 잘 부합됨 / 1 = 거의 부합되지 않음)</span>
            </p>
            <button onClick={handleStart} className="bg-black text-white font-black py-5 px-16 border-4 border-black hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xl">
              Start Test
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (currentStep >= questions.length) {
    if (!calculatedResult) return null;
    return (
      <main className="min-h-screen bg-white flex flex-col font-sans text-black p-6 md:p-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="border-4 border-black p-8 md:p-12 mb-8 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-6xl font-black tracking-tighter uppercase mb-8">Result</h2>
            
            <div className="grid md:grid-cols-3 border-4 border-black mb-12 bg-black gap-1">
              <div className="bg-white p-8">
                <div className="text-xs font-black uppercase tracking-widest mb-4 opacity-50">Type</div>
                <div className="text-6xl font-black mb-2">{calculatedResult.maxSymbol}</div>
                <div className="text-2xl font-black">{calculatedResult.typeName}</div>
              </div>
              <div className="md:col-span-2 bg-white p-8">
                <div className="text-xs font-black uppercase tracking-widest mb-6 opacity-50">Score Distribution</div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {Object.entries(calculatedResult.scores).map(([sym, val]: [any, any]) => (
                    <div key={sym}>
                      <div className="flex justify-between font-black text-sm mb-2 uppercase">
                        <span>{sym} {rawData.types[sym]}</span>
                        <span>{val} PT</span>
                      </div>
                      <div className="w-full border-2 border-black h-4 bg-white">
                        <div className="bg-black h-full" style={{ width: `${(val / 80) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t-4 border-black pt-12">
              <h3 className="text-3xl font-black uppercase mb-8 italic">AI Analysis Report</h3>
              {isLoadingAi && !aiResult ? (
                <div className="py-20 text-center border-2 border-black border-dashed">
                  <div className="w-12 h-12 bg-black mx-auto animate-spin mb-6"></div>
                  <div className="font-black uppercase tracking-widest">Analyzing Personality...</div>
                </div>
              ) : aiError ? (
                <div className="p-8 border-4 border-black text-center bg-red-50">
                  <p className="font-black mb-4">{aiError}</p>
                  <button onClick={() => fetchAiResult(calculatedResult)} className="bg-black text-white px-8 py-3 font-black uppercase">Retry</button>
                </div>
              ) : (
                <div className="p-8 border-4 border-black bg-white font-bold leading-relaxed whitespace-pre-wrap text-lg">
                  {aiResult || "분석 결과를 생성 중입니다..."}
                </div>
              )}
            </div>
          </div>
          
          <button onClick={() => window.location.reload()} className="w-full bg-white border-4 border-black py-6 font-black text-2xl uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            Restart Test
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans text-black">
      <header className="border-b-4 border-black py-4 px-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="font-black text-xl tracking-tighter uppercase">ROOT4 TEMPER TEST</div>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-3 py-1 border-2 border-black font-black text-xs uppercase hover:bg-black hover:text-white">Home</button>
          <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-3 py-1 border-2 border-black font-black text-xs uppercase hover:bg-black hover:text-white">Skip</button>
          <button onClick={() => setCurrentStep(questions.length)} className="px-3 py-1 border-2 border-black font-black text-xs uppercase hover:bg-black hover:text-white">Finish</button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col">
        <div className="text-sm font-black mb-4 uppercase tracking-widest opacity-50">[ {currentStep + 1} / {questions.length} ]</div>
        <div className="border-4 border-black p-8 md:p-12 mb-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black leading-tight tracking-tight italic">{currentStep + 1}. {currentQuestion.text}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-black border-4 border-black">
          {Object.entries(currentQuestion.choices).map(([choiceKey, choiceText], index) => (
            <div key={choiceKey} className="bg-white p-8 flex flex-col justify-between group hover:bg-gray-50">
              <div className="font-bold text-xl mb-10 leading-snug">{index + 1}. {choiceText as string}</div>
              <div className="flex justify-between border-t-2 border-black pt-6">
                {[1, 2, 3, 4].map(score => (
                  <button
                    key={score}
                    onClick={() => handleScoreChange(choiceKey, score)}
                    className={`w-12 h-12 border-2 border-black font-black text-lg transition-all ${
                      answers[currentQuestion.id]?.[choiceKey] === score ? "bg-black text-white scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]" : "bg-white text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between gap-6">
          <button onClick={handlePrev} disabled={currentStep === 0} className="flex-1 py-4 border-4 border-black font-black uppercase tracking-widest disabled:opacity-20 hover:bg-black hover:text-white transition-all">Prev</button>
          <button onClick={handleNext} className="flex-[2] py-4 bg-black text-white border-4 border-black font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Next Question</button>
        </div>
      </div>
    </main>
  );
}
