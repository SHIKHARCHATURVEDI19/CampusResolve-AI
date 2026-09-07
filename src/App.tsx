import React, { useState, useEffect } from 'react';
import { Issue, HotspotMapPoint, User, IssueStatus, College, UserRole } from './types/index.ts';
import ReportIssueModal from './components/ReportIssueModal.tsx';
import IssueDetailModal from './components/IssueDetailModal.tsx';
import LandingPage from './components/LandingPage.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import SuperAdminDashboard from './components/SuperAdminDashboard.tsx';
import { 
  PlusCircle, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  Building2, 
  UserCheck, 
  GraduationCap, 
  Crown 
} from 'lucide-react';

export default function App() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCollege, setCurrentCollege] = useState<College | null>(null);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [hotspots, setHotspots] = useState<HotspotMapPoint[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Colleges on mount
  useEffect(() => {
    fetch('/api/colleges')
      .then(res => res.json())
      .then(data => {
        setColleges(data);
        if (data.length > 0 && !currentCollege) {
          setCurrentCollege(data[0]);
        }
      })
      .catch(err => console.error('Failed to load colleges:', err));
  }, []);

  const handleLogin = async (role: UserRole, collegeId: string, email?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, collegeId, email })
      });
      const user = await res.json();
      handleVerifiedLogin(user);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedLogin = (user: User) => {
    setCurrentUser(user);
    if (user.college_id) {
      const col = colleges.find(c => c.id === user.college_id) || colleges[0];
      setCurrentCollege(col);
    } else if (colleges.length > 0) {
      setCurrentCollege(colleges[0]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const fetchData = async () => {
    if (!currentCollege) return;
    try {
      setLoading(true);
      const cid = currentCollege.id;
      const [issuesRes, hotspotsRes, workersRes] = await Promise.all([
        fetch(`/api/issues?collegeId=${cid}`),
        fetch(`/api/issues/hotspots?collegeId=${cid}`),
        fetch(`/api/workers?collegeId=${cid}`)
      ]);

      const [issuesData, hotspotsData, workersData] = await Promise.all([
        issuesRes.json(),
        hotspotsRes.json(),
        workersRes.json()
      ]);

      setIssues(issuesData);
      setHotspots(hotspotsData);
      setWorkers(workersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentCollege) {
      fetchData();
    }
  }, [currentUser, currentCollege]);

  const handleUpvote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/upvote`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: IssueStatus, notes?: string, assignedTo?: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          notes, 
          changedBy: currentUser?.id,
          assignedTo
        })
      });
      if (res.ok) {
        await fetchData();
        if (selectedIssue && selectedIssue.id === id) {
          const updated = issues.find(i => i.id === id);
          if (updated) {
            setSelectedIssue({ 
              ...updated, 
              status: newStatus,
              assigned_to: assignedTo !== undefined ? assignedTo : updated.assigned_to 
            });
          }
        }
      }
    } catch (err) {
      console.error('Status transition failed:', err);
    }
  };

  // If not logged in, show Landing Page with Email OTP verification & Quick demo logins
  if (!currentUser) {
    return (
      <LandingPage
        colleges={colleges}
        onLogin={handleLogin}
        onVerifiedLogin={handleVerifiedLogin}
      />
    );
  }

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isCollegeAdmin = currentUser.role === 'COLLEGE_ADMIN';
  const isStudent = currentUser.role === 'STUDENT';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white ${
              isSuperAdmin 
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 shadow-amber-200' 
                : isCollegeAdmin 
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-200'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-200'
            }`}>
              {isSuperAdmin ? <Crown size={22} /> : isCollegeAdmin ? <ShieldCheck size={22} /> : <GraduationCap size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-900 tracking-tight text-lg">CampusResolve AI</h1>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isSuperAdmin
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : isCollegeAdmin 
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}>
                  {isSuperAdmin && <Crown size={11} />}
                  {isCollegeAdmin && <UserCheck size={11} />}
                  {isStudent && <GraduationCap size={11} />}
                  {isSuperAdmin ? 'Super Admin Console' : isCollegeAdmin ? 'College Admin Console' : 'Student Portal'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 size={12} className="text-indigo-600" />
                <span className="font-semibold text-slate-700">
                  {isSuperAdmin ? 'Global Multi-Campus Governance' : currentCollege?.name}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
              <span className="text-[11px] text-slate-400">{currentUser.email}</span>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Students have direct prominent Report button */}
            {isStudent && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold text-xs sm:text-sm transition"
              >
                <PlusCircle size={16} />
                <span>Report Grievance</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Sign Out / Switch Account"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard - Divided by Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isSuperAdmin ? (
          <SuperAdminDashboard
            currentUser={currentUser}
            colleges={colleges}
          />
        ) : isCollegeAdmin ? (
          <AdminDashboard
            currentCollege={currentCollege!}
            currentUser={currentUser}
            issues={issues}
            hotspots={hotspots}
            workers={workers}
            onStatusChange={handleStatusChange}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
            onUpvote={handleUpvote}
            onRefreshData={fetchData}
          />
        ) : (
          <StudentDashboard
            currentCollege={currentCollege!}
            currentUser={currentUser}
            issues={issues}
            hotspots={hotspots}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onUpvote={handleUpvote}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
          />
        )}
      </main>

      {/* Modals */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => fetchData()}
        currentUser={currentUser}
        collegeId={currentCollege?.id}
      />

      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusChange={handleStatusChange}
        currentUserRole={currentUser.role}
        collegeWorkers={workers}
      />
    </div>
  );
}
