import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import ScoreGauge from '../components/ScoreGauge';
import CodeViewer from '../components/CodeViewer';
import { Shield, Download, FileText, CheckCircle2, AlertTriangle, ShieldAlert, ArrowLeft, Filter, Search, Lock, Info } from 'lucide-react';

const ScanResult = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchScanDetail = async () => {
      try {
        const res = await api.get(`/scans/${id}`);
        setScan(res.data);
      } catch (err) {
        setError("Could not locate security scan report.");
      } finally {
        setLoading(false);
      }
    };
    fetchScanDetail();
  }, [id]);

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/scans/${id}/report`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SecureVault_Report_${scan.filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export PDF security report.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-cyan-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <p className="text-sm font-semibold text-slate-400">Fetching Security Exposure Audit Data...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 cyber-card rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Scan Report Not Found</h2>
        <p className="text-slate-400 text-sm">{error || "The requested scan report ID does not exist or has been deleted."}</p>
        <Link to="/scan-history" className="inline-block px-4 py-2 bg-slate-800 text-cyan-400 rounded-xl font-semibold text-sm">
          Return to Scan History
        </Link>
      </div>
    );
  }

  const findings = scan.findings || [];
  const filteredFindings = findings.filter((f) => {
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesQuery = f.type.toLowerCase().includes(search.toLowerCase()) || f.masked_value.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link to="/scan-history" className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:underline mb-2 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Scan History</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>SECUREVAULT SCAN REPORT</span>
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">
            Target: <span className="text-slate-200">{scan.filename}</span> | Type: {scan.file_type} | Scanned: {new Date(scan.created_at).toLocaleString()}
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 text-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF Report</span>
        </button>
      </div>

      {/* Main Score & Summary Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Gauge Card */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <ScoreGauge score={scan.risk_score} level={scan.risk_level} />
          <div className="mt-4">
            <RiskBadge level={scan.risk_level} size="lg" />
          </div>
          <p className="text-xs text-slate-500 mt-3">Overall calculated document threat severity rating</p>
        </div>

        {/* Severity Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="cyber-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">CRITICAL</div>
            <div className="text-3xl font-extrabold text-red-400 my-2">{scan.counts?.CRITICAL || 0}</div>
            <div className="text-[11px] text-slate-500">Private keys, DB URLs, Cloud credentials</div>
          </div>

          <div className="cyber-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">HIGH</div>
            <div className="text-3xl font-extrabold text-orange-400 my-2">{scan.counts?.HIGH || 0}</div>
            <div className="text-[11px] text-slate-500">API keys, passwords, JWT tokens</div>
          </div>

          <div className="cyber-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">MEDIUM</div>
            <div className="text-3xl font-extrabold text-yellow-400 my-2">{scan.counts?.MEDIUM || 0}</div>
            <div className="text-[11px] text-slate-500">Internal network IP disclosures</div>
          </div>

          <div className="cyber-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">LOW</div>
            <div className="text-3xl font-extrabold text-blue-400 my-2">{scan.counts?.LOW || 0}</div>
            <div className="text-[11px] text-slate-500">Personal emails and phone PII</div>
          </div>

          <div className="col-span-2 sm:col-span-4 cyber-card p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>All secret values displayed below have been masked for security compliance.</span>
            </div>
            <span className="font-mono text-slate-300 font-semibold">{scan.finding_count} Total Finding{scan.finding_count === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* Code / Text Line Highlighter Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span>Line-by-Line Exposed Secret Viewer</span>
        </h2>
        <CodeViewer findings={findings} />
      </div>

      {/* Findings Table Section with Search and Filtering */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Detailed Exposure Findings ({filteredFindings.length})</span>
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter findings..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div className="cyber-card rounded-2xl border border-slate-800 overflow-hidden">
          {filteredFindings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching findings for selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                    <th className="p-4">Line</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Confidence</th>
                    <th className="p-4">Masked Value</th>
                    <th className="p-4">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredFindings.map((f, idx) => (
                    <tr key={f.finding_id || idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-bold text-slate-300">L{f.line_number}</td>
                      <td className="p-4 font-bold text-cyan-400">{f.type}</td>
                      <td className="p-4">
                        <RiskBadge level={f.severity} size="sm" />
                      </td>
                      <td className="p-4 text-slate-300">{(f.confidence * 100).toFixed(0)}%</td>
                      <td className="p-4 font-semibold text-slate-200">{f.masked_value}</td>
                      <td className="p-4 text-slate-400 font-sans">{f.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Remediation & General Best Practices Section */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Security Remediation & Defense Recommendations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1 text-sm">Credential Hygiene</span>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Rotate all flagged API keys, database passwords, and JWT secrets immediately.</li>
              <li>Move plain credentials to environment variables or dedicated secret vaults (AWS Secrets Manager, HashiCorp Vault).</li>
              <li>Revoke exposed private keys and re-issue fresh key pairs.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1 text-sm">Prevention Best Practices</span>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Add git pre-commit hooks (`gitleaks`, `git-secrets`) to prevent committing raw secrets.</li>
              <li>Enforce least-privilege access permissions on database credentials.</li>
              <li>Enable Multi-Factor Authentication (MFA) across all administrative cloud accounts.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResult;
