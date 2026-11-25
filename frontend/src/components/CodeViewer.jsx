import React from 'react';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

const CodeViewer = ({ findings = [] }) => {
  if (!findings || findings.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Lock className="w-12 h-12 mx-auto text-emerald-400 mb-3 opacity-80" />
        <p className="font-semibold text-slate-200">No Sensitive Exposing Lines Detected</p>
        <p className="text-sm text-slate-400 mt-1">
          Your scanned text is clear of recognized credentials, PII, and secret tokens.
        </p>
      </div>
    );
  }

  // Sort findings by line number
  const sortedFindings = [...findings].sort((a, b) => a.line_number - b.line_number);

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-950/40 border-l-4 border-red-500 text-red-200';
      case 'HIGH':
        return 'bg-orange-950/40 border-l-4 border-orange-500 text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-950/40 border-l-4 border-yellow-500 text-yellow-200';
      default:
        return 'bg-blue-950/30 border-l-4 border-blue-500 text-blue-200';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs sm:text-sm">
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          <span className="text-slate-400 text-xs font-sans ml-2 font-medium">
            Highlighted Exposing Line Snippets (Masked Output)
          </span>
        </div>
        <span className="text-slate-400 text-xs font-sans">
          {sortedFindings.length} Threat{sortedFindings.length === 1 ? '' : 's'} Flagged
        </span>
      </div>

      <div className="divide-y divide-slate-800/60 overflow-x-auto">
        {sortedFindings.map((f, idx) => (
          <div key={f.finding_id || idx} className={`p-4 transition-colors ${getSeverityStyle(f.severity)}`}>
            <div className="flex items-start justify-between mb-1.5 font-sans">
              <div className="flex items-center space-x-2">
                <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-700">
                  Line {f.line_number}
                </span>
                <span className="font-bold text-xs tracking-wide uppercase px-2 py-0.5 rounded bg-slate-900/80">
                  {f.type}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/40">
                  {f.severity}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {(f.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="bg-slate-950/80 rounded p-2.5 my-2 border border-slate-800/80 overflow-x-auto text-slate-200">
              <code>{f.surrounding_context}</code>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 font-sans mt-2">
              <div className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium">Masked Value:</span>
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 border border-slate-700">
                  {f.masked_value}
                </code>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 font-sans mt-1.5 flex items-start space-x-1">
              <span className="font-semibold text-slate-300">Action:</span>
              <span>{f.recommendation}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeViewer;
