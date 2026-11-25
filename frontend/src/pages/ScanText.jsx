import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Code, Shield, AlertCircle, Sparkles } from 'lucide-react';

const ScanText = () => {
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('Pasted_Snippet.txt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please paste text or source code to scan.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/scans/text', {
        text: text,
        filename: filename || 'Pasted_Text.txt'
      });
      navigate(`/scan/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze text snippet.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSample = () => {
    const sampleCode = `DATABASE_URL=mysql://admin:password123@localhost:3306/app
API_KEY=sk-proj-948fha823nflk20948fh109485
user_email=example@gmail.com
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5
`;
    setText(sampleCode);
    setFilename('config_sample.env');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
          <Code className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Paste Text or Source Code</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Paste configuration files, logs, environment variables, or source code snippets to scan for exposures.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleScanSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Snippet Label / File Reference
            </label>
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-xs text-cyan-400 hover:underline flex items-center space-x-1 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Risky Sample Snippet</span>
            </button>
          </div>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. server_config.env or app.js"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-sm mb-4 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Text / Source Content
          </label>
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste code, env vars, database connection strings, JWT tokens, or notes here..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-sm leading-relaxed"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="w-full py-4 rounded-xl font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center space-x-2 text-base disabled:opacity-40"
        >
          {loading ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
              <span>Executing Detection Engine...</span>
            </div>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Scan for Sensitive Data</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ScanText;
