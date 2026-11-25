import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { History, Search, Trash2, FileText, Download, AlertCircle } from 'lucide-react';

const ScanHistory = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/scans');
      setScans(res.data);
    } catch (err) {
      setError('Failed to fetch scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;

    try {
      await api.delete(`/scans/${id}`);
      setScans(scans.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete scan record.");
    }
  };

  const handleDownloadPDF = async (id, filename, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await api.get(`/scans/${id}/report`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SecureVault_Report_${filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF security report.");
    }
  };

  const filteredScans = scans.filter((s) => {
    const matchesSearch = s.filename.toLowerCase().includes(search.toLowerCase());
    const matchesSev = severityFilter === 'ALL' || s.risk_level === severityFilter;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Security Scan History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review past exposure audit results and download reports</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="SAFE">SAFE</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="cyber-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading scan history...</div>
        ) : filteredScans.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No matching scan records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                  <th className="p-4">Target File</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Scan Date</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Findings</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-200 text-xs">
                      {s.filename}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-400">{s.file_type}</td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-100">{s.risk_score}/100</td>
                    <td className="p-4">
                      <RiskBadge level={s.risk_level} size="sm" />
                    </td>
                    <td className="p-4 font-semibold text-slate-300 text-xs">
                      {s.finding_count} item{s.finding_count === 1 ? '' : 's'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/scan/${s.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 text-xs font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </Link>

                      <button
                        onClick={(e) => handleDownloadPDF(s.id, s.filename, e)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                        title="Download PDF Security Audit Report"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-red-950/60 text-red-400 hover:bg-red-900/80 text-xs font-semibold transition-colors"
                        title="Delete scan history record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistory;
