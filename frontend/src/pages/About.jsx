import React from 'react';
import { Shield, Lock, EyeOff, FileText, CheckCircle2, Server } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-200 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">About SecureVault</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Personal Data Exposure & Confidential Secret Detection System
        </p>
      </div>

      <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>Core Security Philosophy & Privacy Commitment</span>
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Accidental credential exposure in public repositories, shared logs, configuration files, and unencrypted documents is a leading root cause of modern enterprise security breaches. SecureVault was engineered specifically to answer:
        </p>
        <blockquote className="border-l-4 border-cyan-500 pl-4 py-1 text-cyan-300 italic text-sm">
          "What sensitive credentials or PII exist inside this document or source code, how severe is the exposure risk, and what exact steps should be taken to remediate it?"
        </blockquote>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <EyeOff className="w-5 h-5" />
            <span>Zero Raw Secret Retention</span>
          </div>
          <p className="text-sm text-slate-400">
            Detected secrets (API keys, JWT tokens, credit card numbers, passwords, private keys) are masked immediately upon detection. SecureVault NEVER stores unmasked raw credentials in MongoDB or log files.
          </p>
        </div>

        <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <Server className="w-5 h-5" />
            <span>In-Memory Document Lifetime</span>
          </div>
          <p className="text-sm text-slate-400">
            Uploaded PDF, DOCX, TXT, CSV, or source code files are parsed in memory and temporary file handles on disk are purged immediately after scanning completes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
