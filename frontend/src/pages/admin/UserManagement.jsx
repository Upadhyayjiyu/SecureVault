import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, ToggleLeft, ToggleRight, Shield, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users${search ? `?search=${search}` : ''}`);
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const toggleUserStatus = async (user) => {
    if (user.role === 'ADMIN') {
      alert("Administrator accounts cannot be disabled.");
      return;
    }

    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? res.data : u));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>User Account Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage registered accounts and disable or enable platform access</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
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
          <div className="py-16 text-center text-slate-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{u.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-300">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                        u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(u)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-red-950/60 text-red-400 hover:bg-red-900/80 border border-red-800/60'
                              : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-800/60'
                          }`}
                        >
                          {u.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{u.status === 'active' ? 'Disable Account' : 'Enable Account'}</span>
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
    </div>
  );
};

export default UserManagement;
