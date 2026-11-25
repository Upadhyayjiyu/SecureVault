import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Upload, FileText, AlertCircle, CheckCircle2, Shield, Lock, FileSearch } from 'lucide-react';

const ScanFile = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    // 10MB check
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10 MB maximum size limit.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/scans/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate(`/scan/${res.data.id}`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'We could not process this file. Please check extension and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
          <FileSearch className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Document or Source File</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Scan PDF, DOCX, TXT, CSV, or code files up to 10MB. Uploaded files are deleted immediately after scanning.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleScanSubmit} className="space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/20'
              : file
              ? 'border-emerald-500/60 bg-slate-900/80'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            {file ? (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Upload className="w-7 h-7" />
              </div>
            )}

            <div>
              {file ? (
                <div>
                  <p className="text-base font-bold text-emerald-300">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB | Ready for exposure scan
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-semibold text-slate-200">
                    Drag and drop your file here, or <span className="text-cyan-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Supports .pdf, .docx, .txt, .csv, .py, .js, .ts, .env, .json, .yaml, .conf (Max 10 MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-4 rounded-xl font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center space-x-2 text-base disabled:opacity-40"
        >
          {loading ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-slate-950"></div>
              <span>Executing Sensitive Exposure Detection...</span>
            </div>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Start Security Scan</span>
            </>
          )}
        </button>
      </form>

      <div className="cyber-card p-5 rounded-2xl border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200 block mb-1">Privacy Guarantee</span>
          Uploaded files are stored in temporary memory strictly for scanning and deleted immediately upon completion. Raw secret keys are never retained.
        </div>
      </div>
    </div>
  );
};

export default ScanFile;
