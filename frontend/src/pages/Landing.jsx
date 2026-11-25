import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSearch, Lock, EyeOff, Cpu, CheckCircle2, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

const Landing = () => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-lg shadow-cyan-500/10">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Real-Time Sensitive Data Exposure Detection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Protect Your Data Before It Becomes A <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Security Breach</span>.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Scan source code, documents, logs, and text for accidentally exposed API keys, JWT tokens, database URLs, PII, and credentials in milliseconds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
            >
              <span>Scan Your First File</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center"
            >
              Log In to Portal
            </Link>
          </div>

          {/* Key Security Promises Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <EyeOff className="w-6 h-6 text-cyan-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-200">Zero Raw Retention</div>
                <div className="text-xs text-slate-400">Secrets masked instantly</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Lock className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-200">Temp Storage Only</div>
                <div className="text-xs text-slate-400">Files purged post-scan</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Cpu className="w-6 h-6 text-yellow-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-200">Entropy Engine</div>
                <div className="text-xs text-slate-400">Shannon randomness check</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-slate-200">Risk Scoring</div>
                <div className="text-xs text-slate-400">0–100 threat rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detection Capabilities Section */}
      <section className="py-20 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white tracking-tight">Multi-Layer Exposure Detection</h2>
            <p className="mt-3 text-slate-400">
              SecureVault inspects structure, context, patterns, and entropy to identify exposed sensitive targets.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="cyber-card p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Critical Credentials</h3>
              <p className="mt-2 text-sm text-slate-400">
                Detects Private Keys (RSA, DSA, EC), Database URLs (MySQL, Postgres, MongoDB), AWS/Cloud Credentials, and JWT session tokens.
              </p>
            </div>

            <div className="cyber-card p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-5">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">API Keys & Tokens</h3>
              <p className="mt-2 text-sm text-slate-400">
                Identifies OpenAI keys, GitHub tokens, Slack OAuth tokens, Stripe secret keys, and hardcoded `API_KEY` assignments in code.
              </p>
            </div>

            <div className="cyber-card p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Financial & PII Data</h3>
              <p className="mt-2 text-sm text-slate-400">
                Luhn-validated credit card numbers, email addresses, phone numbers, and internal IP address disclosures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Files Banner */}
      <section className="py-16 border-t border-slate-900 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-6">Supported Document & Code File Types</h3>
          <div className="flex flex-wrap justify-center gap-3 font-mono text-sm font-semibold text-slate-300">
            {['.PDF', '.DOCX', '.TXT', '.CSV', '.PY', '.JS', '.TS', '.TSX', '.JSX', '.ENV', '.CONF', '.JSON', '.YAML', '.JAVA', '.CPP', '.PHP', '.HTML', '.CSS'].map((ext) => (
              <span key={ext} className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                {ext}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
