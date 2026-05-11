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
      // fetchAiResult(res); // Temporarily disable AI to verify UI stability
    }
  }, [currentStep]);

  if (currentStep === -1) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black">
        <div className="border-4 border-black p-12 text-center max-w-xl">
          <h1 className="text-6xl font-black mb-8 uppercase tracking-tighter">Temper Test</h1>
          <button onClick={handleStart} className="bg-black text-white px-12 py-4 font-bold text-xl uppercase hover:bg-white hover:text-black border-2 border-black transition-all">
            Start Test
          </button>
        </div>
      </main>
    );
  }

  if (currentStep >= questions.length && calculatedResult) {
    return (
      <main className="min-h-screen bg-white p-6 md:p-12 text-black">
        <div className="max-w-4xl mx-auto border-4 border-black p-8">
          <h2 className="text-4xl font-black mb-8 uppercase">Your Result</h2>
          <div className="bg-black text-white p-8 mb-8">
            <div className="text-sm font-bold uppercase tracking-widest mb-2">Type</div>
            <div className="text-5xl font-black">{calculatedResult.maxSymbol} {calculatedResult.typeName}</div>
          </div>
          
          <div className="grid gap-6 mb-8">
            {Object.entries(calculatedResult.scores).map(([sym, val]: [any, any]) => (
              <div key={sym} className="border-2 border-black p-4">
                <div className="flex justify-between font-bold mb-2 uppercase">
                  <span>{sym} {rawData.types[sym]}</span>
                  <span>{val} PT</span>
                </div>
                <div className="w-full bg-gray-200 h-4">
                  <div className="bg-black h-full" style={{ width: `${(val / 80) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => window.location.reload()} className="w-full border-4 border-black py-4 font-black text-xl uppercase hover:bg-black hover:text-white transition-all">
            Restart
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col p-6 text-black">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col py-12">
        <div className="text-sm font-bold mb-4 uppercase tracking-widest">[ {currentStep + 1} / {questions.length} ]</div>
        <div className="border-4 border-black p-8 mb-12">
          <h2 className="text-2xl font-bold">{currentQuestion.text}</h2>
        </div>

        <div className="grid gap-4">
          {Object.entries(currentQuestion.choices).map(([choiceKey, choiceText], index) => (
            <div key={choiceKey} className="border-2 border-black p-6">
              <div className="font-bold mb-4">{index + 1}. {choiceText as string}</div>
              <div className="flex justify-between">
                {[1, 2, 3, 4].map(score => (
                  <button
                    key={score}
                    onClick={() => handleScoreChange(choiceKey, score)}
                    className={`w-12 h-12 border-2 border-black font-black ${
                      answers[currentQuestion.id]?.[choiceKey] === score ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between">
          <button onClick={handlePrev} disabled={currentStep === 0} className="px-8 py-3 border-2 border-black font-bold uppercase disabled:opacity-30">Prev</button>
          <button onClick={handleNext} className="px-12 py-3 bg-black text-white font-bold uppercase border-2 border-black">Next</button>
        </div>
      </div>
    </main>
  );
}
