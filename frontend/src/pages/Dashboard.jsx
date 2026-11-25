import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { Shield, FileSearch, Code, AlertTriangle, ShieldAlert, History, ArrowRight, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await api.get('/scans');
        setScans(res.data);
      } catch (err) {
        console.error("Failed to load scan history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  // Compute metrics
  const totalScans = scans.length;
  const criticalFindings = scans.reduce((acc, s) => acc + (s.counts?.CRITICAL || 0), 0);
  const highFindings = scans.reduce((acc, s) => acc + (s.counts?.HIGH || 0), 0);
  const totalSensitiveItems = scans.reduce((acc, s) => acc + (s.finding_count || 0), 0);

  // Chart data
  const riskDistribution = [
    { name: 'CRITICAL', value: scans.filter(s => s.risk_level === 'CRITICAL').length, color: '#ef4444' },
    { name: 'HIGH', value: scans.filter(s => s.risk_level === 'HIGH').length, color: '#f97316' },
    { name: 'MEDIUM', value: scans.filter(s => s.risk_level === 'MEDIUM').length, color: '#eab308' },
    { name: 'LOW', value: scans.filter(s => s.risk_level === 'LOW').length, color: '#3b82f6' },
    { name: 'SAFE', value: scans.filter(s => s.risk_level === 'SAFE').length, color: '#22c55e' },
  ].filter(item => item.value > 0);

  const recentScans = scans.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden cyber-card p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Personal Exposure Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Security Operator'}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            "Protect your data before it becomes a breach." Scan source code and files for accidental key leaks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/scan-file"
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 text-sm"
          >
            <FileSearch className="w-4 h-4" />
            <span>Scan File</span>
          </Link>
          <Link
            to="/scan-text"
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Scan Text</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Scans Run</span>
            <History className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{totalScans}</div>
          <div className="mt-1 text-xs text-slate-500">Processed through scanner</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Threats</span>
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-red-400">{criticalFindings}</div>
          <div className="mt-1 text-xs text-slate-500">Private keys, DB URLs, Cloud credentials</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Leaks</span>
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-orange-400">{highFindings}</div>
          <div className="mt-1 text-xs text-slate-500">API keys, passwords, JWT tokens</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Items Detected</span>
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-100">{totalSensitiveItems}</div>
          <div className="mt-1 text-xs text-slate-500">Exposed elements flagged</div>
        </div>
      </div>

      {/* Analytics & Recent Scans split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Scans Table */}
        <div className="lg:col-span-2 cyber-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>Recent Scan History</span>
            </h2>
            <Link to="/scan-history" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading scan records...</div>
          ) : recentScans.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No scans performed yet. Click "Scan File" to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                    <th className="pb-3">Target File</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Risk Level</th>
                    <th className="pb-3">Findings</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentScans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 font-mono text-slate-200 text-xs max-w-[150px] truncate">
                        {s.filename}
                      </td>
                      <td className="py-3 font-bold text-slate-100">{s.risk_score}/100</td>
                      <td className="py-3">
                        <RiskBadge level={s.risk_level} size="sm" />
                      </td>
                      <td className="py-3 font-semibold text-slate-300 text-xs">
                        {s.finding_count} items
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/scan/${s.id}`}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors inline-block"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Risk Breakdown Chart */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>Risk Rating Distribution</span>
            </h2>
            {riskDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No scan data for distribution chart
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-900">
            Categorized by overall document risk rating
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
