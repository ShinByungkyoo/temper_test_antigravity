"use client";

import React, { useState, useEffect } from "react";
import testData from "@/data.json";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(-1); // -1: Intro, 0~19: Questions, 20: Result
  const [answers, setAnswers] = useState<Record<number, Record<string, number>>>({});
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // answers shape: { questionId: { "1": 4, "2": 2, "3": 1, "4": 3 } } // choice index -> score
  
  const questions = testData.questions;
  const currentQuestion = questions[currentStep];
  const rawData = testData as any;

  const handleStart = () => setCurrentStep(0);

  const handleScoreChange = (choiceKey: string, score: number) => {
    setAnswers(prev => {
      const qAnswers = { ...(prev[currentQuestion.id] || {}) };
      
      // If another choice has this score, remove it from that choice
      for (const [k, v] of Object.entries(qAnswers)) {
        if (v === score) {
          delete qAnswers[k];
        }
      }
      
      qAnswers[choiceKey] = score;
      return { ...prev, [currentQuestion.id]: qAnswers };
    });
  };

  const handleNext = () => {
    const qAnswers = answers[currentQuestion.id] || {};
    if (Object.keys(qAnswers).length !== 4) {
      alert("모든 항목에 점수(1~4)를 매겨주세요. 점수는 중복될 수 없습니다.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const calculateResult = () => {
    const scores: Record<string, number> = { "♥": 0, "☆": 0, "▲": 0, "♬": 0 };
    
    questions.forEach(q => {
      const qAnswers = answers[q.id];
      const scoringMap = rawData.scoring[q.id.toString()];
      if (qAnswers && scoringMap) {
        for (const [choiceKey, score] of Object.entries(qAnswers)) {
          const symbol = scoringMap[choiceKey];
          if (symbol && scores[symbol] !== undefined) {
            scores[symbol] += score;
          }
        }
      }
    });

    // Find the max score
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

  const [calculatedResult, setCalculatedResult] = useState<{scores: any, maxSymbol: string, typeName: string} | null>(null);

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
    setAiResult(""); // Initialize as empty for streaming
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
        throw new Error(errorData.error || "분석 결과를 가져오는 중 오류가 발생했습니다.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("분석 스트림을 시작할 수 없습니다.");

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setAiResult(prev => (prev || "") + chunk);
      }
    } catch (err: any) {
      console.error("AI Fetch Error:", err);
      setAiError(err.message || "서버와의 통신에 실패했습니다.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (currentStep === -1) {
    return (
      <main className="min-h-screen bg-white flex flex-col font-sans text-black">
        <header className="border-b border-black py-4 px-6 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tighter uppercase">ROOT4 TEMPER TEST</div>
          <div className="text-xs font-medium uppercase tracking-widest">About / Work / Contact</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="border border-black max-w-2xl w-full p-12 text-center relative">
            <h1 className="text-5xl font-extrabold mb-8 tracking-tighter uppercase">Temper Test</h1>
            <p className="text-base font-medium mb-10 leading-relaxed border-t border-black pt-6">
              이 테스트는 총 20개의 문항으로 이루어져 있습니다.<br />
              각 문항의 4가지 항목에 대해 <strong>1점부터 4점까지 중복 없이</strong> 점수를 매겨주세요.<br />
              <span className="text-xs uppercase tracking-widest mt-4 block">(4 = 가장 잘 부합됨 / 1 = 거의 부합되지 않음)</span>
            </p>
            <button 
              onClick={handleStart}
              className="bg-black hover:bg-white hover:text-black text-white font-extrabold py-4 px-12 border border-black transition-colors uppercase tracking-widest text-sm"
            >
              Start Test
            </button>
            <div className="absolute top-0 left-0 w-3 h-3 border-r border-b border-black"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-l border-b border-black"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-r border-t border-black"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-l border-t border-black"></div>
          </div>
        </div>

        <div className="marquee-container">
          <div className="marquee-content">
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
          </div>
        </div>
      </main>
    );
  }

  if (currentStep >= questions.length && calculatedResult) {
    return (
      <main className="min-h-screen bg-white flex flex-col font-sans text-black">
        <header className="border-b border-black py-4 px-6 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tighter uppercase">ROOT4 TEMPER TEST</div>
          <div className="text-sm font-bold uppercase tracking-widest">[ RESULT ]</div>
        </header>

        <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col">
          <div className="border border-black p-8 md:p-12 mb-8 relative bg-white">
            <h2 className="text-6xl font-extrabold tracking-tighter uppercase mb-2">Result</h2>
            <div className="border-t border-black w-16 mb-8 mt-4"></div>
            
            <div className="flex flex-col md:flex-row gap-px bg-black border border-black mb-12">
              <div className="flex-1 bg-white p-8">
                <div className="text-xs font-bold uppercase tracking-widest mb-4">Core Type</div>
                <div className="text-5xl font-black tracking-tighter mb-2">{calculatedResult?.maxSymbol || "N/A"}</div>
                <div className="text-3xl font-bold">{calculatedResult?.typeName || "Unknown Type"}</div>
              </div>
              
              <div className="flex-[2] bg-white p-8">
                <div className="text-xs font-bold uppercase tracking-widest mb-6">Score Distribution</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {calculatedResult && Object.entries(calculatedResult.scores).map(([sym, val]) => {
                    const scoresArr = Object.values(calculatedResult.scores) as number[];
                    const maxVal = scoresArr.length > 0 ? Math.max(...scoresArr) : 1;
                    const percentage = maxVal > 0 ? ((val as number) / maxVal) * 100 : 0;
                    return (
                      <div key={sym} className="flex flex-col">
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className="tracking-widest uppercase">{sym} {rawData.types[sym] || ""}</span>
                          <span>{val as number} PT</span>
                        </div>
                        <div className="w-full border border-black h-4 bg-white relative">
                          <div className="absolute top-0 left-0 h-full bg-black" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-8">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8 flex items-center">
                AI Analysis Report
              </h3>
              
              {isLoadingAi ? (
                <div className="flex flex-col items-center justify-center py-16 border border-black">
                  <div className="w-8 h-8 bg-black animate-spin mb-6"></div>
                  <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Analyzing Data...</p>
                </div>
              ) : aiError ? (
                <div className="border border-black p-8 text-center bg-white">
                  <p className="font-bold text-lg mb-4">{aiError}</p>
                  <button onClick={() => fetchAiResult(calculatedResult)} className="px-6 py-2 border border-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors">
                    Retry
                  </button>
                </div>
              ) : aiResult ? (
                <div className="p-8 border border-black bg-white font-medium leading-relaxed whitespace-pre-wrap">
                  {/* Safely render AI text directly without ReactMarkdown initially to check for stability */}
                  {aiResult}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-black text-center italic text-sm">
                  분석 대기 중...
                </div>
              )}
            </div>

            <div className="absolute -top-3 -left-3 w-6 h-6 border-r border-b border-black bg-white"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 border-l border-b border-black bg-white"></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-r border-t border-black bg-white"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-l border-t border-black bg-white"></div>
          </div>
          
          <div className="flex justify-center mb-12">
            <button 
              onClick={() => {
                setCurrentStep(-1);
                setAnswers({});
                setCalculatedResult(null);
                setAiResult(null);
              }}
              className="px-12 py-4 bg-white border-2 border-black font-extrabold text-lg uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="marquee-container mt-auto">
          <div className="marquee-content">
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
            <span className="marquee-text">ROOT AROUND, LOOK AROUND</span>
          </div>
        </div>
      </main>
    );
  }

  const qAnswers = answers[currentQuestion.id] || {};
  const isNextDisabled = Object.keys(qAnswers).length !== 4;

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans text-black">
      <header className="border-b border-black py-4 px-6 flex justify-between items-center">
        <div className="font-extrabold text-xl tracking-tighter uppercase">ROOT4 TEMPER TEST</div>
        <div className="text-sm font-bold uppercase tracking-widest">[ {String(currentStep + 1).padStart(2, '0')} / {questions.length} ]</div>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col">
        <div className="flex justify-end gap-2 mb-4">
          <button 
            onClick={() => {
              setCurrentStep(-1);
              setAnswers({});
              setCalculatedResult(null);
              setAiResult(null);
            }} 
            className="px-4 py-2 border border-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors"
          >
            처음으로
          </button>
          <button 
            onClick={() => setCurrentStep(prev => prev + 1)} 
            className="px-4 py-2 border border-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors"
          >
            건너뛰기
          </button>
          <button 
            onClick={() => setCurrentStep(questions.length)} 
            className="px-4 py-2 border border-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors"
          >
            끝으로
          </button>
        </div>
        <div className="border border-black p-8 relative mb-12">
          <h2 className="text-2xl font-bold leading-snug tracking-tight">{currentStep + 1}. {currentQuestion.text}</h2>
          
          <div className="absolute -top-3 -left-3 w-6 h-6 border-r border-b border-black bg-white"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 border-l border-b border-black bg-white"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-r border-t border-black bg-white"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-l border-t border-black bg-white"></div>
        </div>

        {(currentQuestion as any).imageUrl && (
          <div className="mb-12 flex justify-center border border-black p-4">
            <img src={(currentQuestion as any).imageUrl} alt="보기 이미지" className="max-w-full h-auto grayscale contrast-125" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black border border-black flex-1 content-start">
          {Object.entries(currentQuestion.choices).map(([choiceKey, choiceText], index) => {
            if (!choiceText) return null;
            return (
              <div key={choiceKey} className="bg-white p-6 flex flex-col justify-between">
                <div className="font-medium text-lg mb-8">{index + 1}. {choiceText as string}</div>
                <div className="flex justify-between border-t border-black pt-4">
                  {[1, 2, 3, 4].map(score => {
                    const isSelected = qAnswers[choiceKey] === score;
                    const isScoreUsedElsewhere = Object.entries(qAnswers).some(([k, v]) => k !== choiceKey && v === score);
                    
                    return (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(choiceKey, score)}
                        className={`w-10 h-10 border transition-all font-bold text-sm ${
                          isSelected 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-black border-black hover:bg-black hover:text-white"
                        }`}
                        title={`${score}점`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-between border-t border-black pt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-8 py-3 font-bold uppercase tracking-widest text-sm border transition-colors ${
              currentStep === 0 ? "text-gray-300 border-gray-200 cursor-not-allowed" : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            className="px-12 py-3 font-bold uppercase tracking-widest text-sm border transition-all bg-black text-white border-black hover:bg-white hover:text-black"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
