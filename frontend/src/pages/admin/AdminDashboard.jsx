import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, FileSearch, ShieldAlert, AlertTriangle, Layers, Activity, Sliders, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load administrator statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-slate-500">Loading Administrator Dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="py-16 text-center text-red-400">{error || 'Failed to load stats.'}</div>;
  }

  // Format chart data
  const chartFindingsByType = Object.keys(stats.findings_by_type || {}).map((type) => ({
    name: type,
    count: stats.findings_by_type[type],
  }));

  const severityColors = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  };

  const chartFindingsBySeverity = Object.keys(stats.findings_by_severity || {}).map((sev) => ({
    name: sev,
    value: stats.findings_by_severity[sev],
    color: severityColors[sev] || '#64748b',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with quick sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-red-400" />
            <span>Administrator Command Console</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Global security analytics, user status, detection rule controls, and audit logs</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>User Accounts</span>
          </Link>
          <Link
            to="/admin/rules"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Detection Rules</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4 text-yellow-400" />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{stats.total_users}</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Scans</span>
            <FileSearch className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{stats.total_scans}</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Critical Scans</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-red-400">{stats.critical_scans}</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">High Risk Scans</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-orange-400">{stats.high_risk_scans}</div>
        </div>

        <div className="cyber-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Findings</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-100">{stats.total_findings}</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: Findings by Type */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Findings Breakdown by Threat Type</span>
          </h2>
          <div className="h-64">
            {chartFindingsByType.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No findings recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartFindingsByType}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Findings by Severity */}
        <div className="cyber-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Findings by Severity Level</span>
          </h2>
          <div className="h-64">
            {chartFindingsBySeverity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No severity data recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartFindingsBySeverity} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {chartFindingsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Recent Security Audit Feed</span>
        </h2>
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {stats.recent_activity.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  act.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {act.status}
                </span>
                <span className="font-bold text-slate-200">{act.action}</span>
                <span className="text-slate-400 font-sans">by {act.user_email}</span>
              </div>
              <span className="text-slate-500">{act.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
