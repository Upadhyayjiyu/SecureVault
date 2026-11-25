import React from 'react';
import { Shield, Lock, Activity } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-8 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-300">SecureVault Detection Engine</span>
          <span className="text-slate-600">|</span>
          <span>v1.0.0 Production</span>
        </div>

        <div className="flex items-center space-x-6 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Data Retention Architecture</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engine Status: Active</span>
          </div>
        </div>

        <div className="text-center md:text-right text-slate-600">
          Uploaded files are processed in-memory and permanently deleted after scanning.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
