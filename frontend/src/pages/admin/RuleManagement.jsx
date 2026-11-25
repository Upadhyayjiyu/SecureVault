import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import { Sliders, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const RuleManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Custom rule creation form modal state
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('Custom Pattern');
  const [regex, setRegex] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [recommendation, setRecommendation] = useState('');

  const fetchRules = async () => {
    try {
      const res = await api.get('/admin/rules');
      setRules(res.data);
    } catch (err) {
      setError('Failed to fetch detection rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRuleStatus = async (rule) => {
    const newStatus = rule.status === 'enabled' ? 'disabled' : 'enabled';
    try {
      const res = await api.patch(`/admin/rules/${rule.rule_id}`, { status: newStatus });
      setRules(rules.map(r => r.rule_id === rule.rule_id ? res.data : r));
    } catch (err) {
      alert("Failed to toggle rule status.");
    }
  };

  const handleSeverityChange = async (rule, newSev) => {
    try {
      const res = await api.patch(`/admin/rules/${rule.rule_id}`, { severity: newSev });
      setRules(rules.map(r => r.rule_id === rule.rule_id ? res.data : r));
    } catch (err) {
      alert("Failed to update rule severity.");
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/admin/rules', {
        type: type.toUpperCase(),
        category: category,
        regex: regex,
        severity: severity,
        recommendation: recommendation || 'Review custom secret detection pattern match.'
      });
      setRules([...rules, res.data]);
      setShowModal(false);
      setType('');
      setRegex('');
      setRecommendation('');
      setSuccessMsg("Custom detection rule created successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid regex rule submission.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Delete this custom rule?")) return;
    try {
      await api.delete(`/admin/rules/${ruleId}`);
      setRules(rules.filter(r => r.rule_id !== ruleId && r.id !== ruleId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete rule.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>Detection Rule Engine Configurator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configure active scanners, adjust severity weights, and create custom regex rules</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Detection Rule</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-4 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="cyber-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading detection rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                  <th className="p-4">Rule Name / Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Regex Pattern</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {rules.map((r) => (
                  <tr key={r.id || r.rule_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-cyan-400">
                      {r.type} {r.is_custom && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-1">CUSTOM</span>}
                    </td>
                    <td className="p-4 text-slate-300 font-sans">{r.category}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate" title={r.regex}>
                      <code>{r.regex}</code>
                    </td>
                    <td className="p-4">
                      <select
                        value={r.severity}
                        onChange={(e) => handleSeverityChange(r, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'enabled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => toggleRuleStatus(r)}
                        className={`p-1.5 rounded transition-colors ${
                          r.status === 'enabled' ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Toggle Enable/Disable"
                      >
                        {r.status === 'enabled' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>

                      {r.is_custom && (
                        <button
                          onClick={() => handleDeleteRule(r.rule_id)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Custom Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Create Custom Detection Rule</h2>

            <form onSubmit={handleCreateRule} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Rule Identifier / Type</label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. INTERNAL_TOKEN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Regex Pattern</label>
                <input
                  type="text"
                  required
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  placeholder="e.g. (?i)\bint_secret_[a-z0-9]{16}\b"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-cyan-300 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1">Remediation Guidance</label>
                <input
                  type="text"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="e.g. Revoke internal access token immediately."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleManagement;
