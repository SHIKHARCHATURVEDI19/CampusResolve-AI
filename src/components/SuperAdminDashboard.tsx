import React, { useState, useEffect } from 'react';
import { User, College, UserRole, DepartmentType } from '../types/index.ts';
import { 
  Crown, 
  Building2, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  ArrowUpRight,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentUser: User;
  colleges: College[];
}

export default function SuperAdminDashboard({ currentUser, colleges }: SuperAdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = selectedCollegeId === 'ALL' ? '/api/users' : `/api/users?collegeId=${selectedCollegeId}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedCollegeId]);

  const handleRoleChange = async (userId: string, newRole: UserRole, collegeId?: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, collegeId })
      });
      const data = await res.json();
      setFeedback(`Updated ${data.user?.name} to ${newRole}`);
      fetchUsers();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => {
    if (u.role === 'SUPER_ADMIN') return false; // Don't modify own super-admin in table
    const matchesCollege = selectedCollegeId === 'ALL' || u.college_id === selectedCollegeId;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.enrollment_or_emp_id && u.enrollment_or_emp_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCollege && matchesSearch;
  });

  const adminCount = users.filter(u => u.role === 'COLLEGE_ADMIN').length;
  const staffCount = users.filter(u => u.role === 'STAFF').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  return (
    <div className="space-y-6">
      {/* Super Admin Executive Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-700 to-amber-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-amber-200 text-xs font-bold border border-amber-300/30">
            <Crown size={15} className="text-yellow-300" />
            <span>University Chancellor & Super Admin Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Institutional Governance & Admin Delegation
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            You hold global authority across all campuses. Promote faculty or senior staff to <strong>College Admins</strong>, or reallocate roles between institutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-black/25 rounded-2xl border border-white/20 text-right backdrop-blur-md">
            <div className="text-xs text-amber-200 font-semibold">Total System Accounts</div>
            <div className="text-2xl font-black text-white">{users.length} Users</div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{adminCount}</div>
            <div className="text-xs font-medium text-slate-500">Authorized College Admins</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-600">{staffCount}</div>
            <div className="text-xs font-medium text-slate-500">Department Technicians</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{studentCount}</div>
            <div className="text-xs font-medium text-slate-500">Registered Students</div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* User Management Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Role Authority & Admin Assignment Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Select any student or staff member and elevate them to College Admin for their respective campus.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, ID..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700"
            >
              <option value="ALL">All Campuses</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">User Profile</th>
                <th className="p-3.5">Campus Affiliation</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5 text-right">Super Admin Action (Assign Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredUsers.map((user) => {
                const userCollege = colleges.find(c => c.id === user.college_id);
                const isCollegeAdmin = user.role === 'COLLEGE_ADMIN';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCollegeAdmin 
                            ? 'bg-amber-100 text-amber-800' 
                            : user.role === 'STAFF' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCollegeAdmin && <Shield size={12} className="text-amber-600" />}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email} &bull; {user.enrollment_or_emp_id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700">
                        {userCollege?.name || 'Unassigned'}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">{userCollege?.code}</div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                        isCollegeAdmin
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : user.role === 'STAFF'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 font-medium">
                      {user.department || '—'}
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      {isCollegeAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleRoleChange(user.id, 'STUDENT', user.college_id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition"
                        >
                          Demote from Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRoleChange(user.id, 'COLLEGE_ADMIN', user.college_id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition shadow-sm shadow-amber-600/30 flex items-center gap-1.5 ml-auto"
                        >
                          <ShieldCheck size={13} />
                          <span>Make College Admin</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
