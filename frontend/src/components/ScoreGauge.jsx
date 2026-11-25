import React from 'react';

const ScoreGauge = ({ score = 0, level = 'SAFE' }) => {
  const getGradient = (scoreVal) => {
    if (scoreVal >= 81) return ['#ef4444', '#b91c1c']; // Critical Red
    if (scoreVal >= 61) return ['#f97316', '#c2410c']; // High Orange
    if (scoreVal >= 41) return ['#eab308', '#a16207']; // Medium Yellow
    if (scoreVal >= 21) return ['#3b82f6', '#1d4ed8']; // Low Blue
    return ['#22c55e', '#15803d']; // Safe Green
  };

  const [startColor, stopColor] = getGradient(score);
  const strokeDashoffset = 440 - (440 * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          className="text-slate-800"
          fill="transparent"
        />
        <circle
          cx="96"
          cy="96"
          r="70"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeDasharray="440"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={stopColor} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold text-slate-100 tracking-tight">{score}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">/ 100</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-300">{level}</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
