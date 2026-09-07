import React, { useState } from 'react';
import { Issue, HotspotMapPoint, User, IssueStatus, College } from '../types/index.ts';
import HotspotMap from './HotspotMap.tsx';
import WorkerStats from './WorkerStats.tsx';
import IssueCard from './IssueCard.tsx';
import AddConcernedPersonModal from './AddConcernedPersonModal.tsx';
import { 
  ShieldCheck, 
  Users, 
  Map, 
  ListFilter, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Wrench,
  Search,
  Filter,
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  HardHat,
  Briefcase
} from 'lucide-react';

interface AdminDashboardProps {
  currentCollege: College;
  currentUser: User;
  issues: Issue[];
  hotspots: HotspotMapPoint[];
  workers: User[];
  onStatusChange: (id: string, newStatus: IssueStatus, notes?: string, assignedTo?: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onUpvote: (id: string) => void;
  onRefreshData: () => void;
}

export default function AdminDashboard({
  currentCollege,
  currentUser,
  issues,
  hotspots,
  workers,
  onStatusChange,
  onSelectIssue,
  onUpvote,
  onRefreshData
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'UNASSIGNED' | 'DISPATCH_MAP' | 'CONCERNED_PERSONS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Metrics
  const totalIssues = issues.length;
  const unassignedCount = issues.filter(i => !i.assigned_to && i.status === 'REPORTED').length;
  const inProgressCount = issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length;
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED' || i.status === 'VERIFIED').length;
  const criticalCount = issues.filter(i => i.priority_score >= 7.0 && i.status !== 'RESOLVED' && i.status !== 'VERIFIED').length;

  const filteredIssues = issues.filter(iss => {
    if (activeTab === 'UNASSIGNED') {
      if (iss.assigned_to || iss.status === 'RESOLVED' || iss.status === 'VERIFIED') return false;
    }
    const matchesDept = deptFilter === 'ALL' || iss.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || iss.status === statusFilter;
    const matchesSearch = 
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShieldCheck size={14} />
            <span>Campus Administrative & Dispatch Command</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Admin Console: {currentCollege.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.email}). You can register new department staff/technicians, delegate tickets, and monitor dispatch.
          </p>
        </div>

        {/* Primary Action Button: Add Concerned Person */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <UserPlus size={17} />
            <span>+ Add Concerned Person</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Grievances</div>
          <div className="text-3xl font-black text-slate-900">{totalIssues}</div>
          <div className="text-[11px] text-slate-500">Across all 5 departments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-amber-700 tracking-wider flex items-center justify-between">
            <span>Needs Delegation</span>
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600">{unassignedCount}</div>
          <div className="text-[11px] text-amber-800">Tickets awaiting staff assignment</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-rose-700 tracking-wider">High Risk (&gt;7.0)</div>
          <div className="text-3xl font-black text-rose-600">{criticalCount}</div>
          <div className="text-[11px] text-rose-700">Immediate attention needed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-indigo-700 tracking-wider">Active Staff On Duty</div>
          <div className="text-3xl font-black text-indigo-600">{workers.length}</div>
          <div className="text-[11px] text-indigo-700">Concerned persons available</div>
        </div>
      </div>

      {/* Staff Load Balancing Dashboard */}
      <WorkerStats workers={workers} />

      {/* Admin Operations Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter size={15} />
            <span>All Incidents ({issues.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('UNASSIGNED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'UNASSIGNED'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Unassigned Queue ({unassignedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('DISPATCH_MAP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'DISPATCH_MAP'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map size={15} />
            <span>Satellite Hotspots</span>
          </button>
          {/* Concerned Persons Directory Tab */}
          <button
            onClick={() => setActiveTab('CONCERNED_PERSONS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'CONCERNED_PERSONS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={15} />
            <span>Concerned Persons Directory ({workers.length})</span>
          </button>
        </div>

        {/* Filters */}
        {activeTab !== 'DISPATCH_MAP' && activeTab !== 'CONCERNED_PERSONS' && (
          <div className="flex items-center gap-3">
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Departments</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="IT">IT</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Concerned Persons Directory Window */}
      {activeTab === 'CONCERNED_PERSONS' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <HardHat size={20} className="text-amber-600" />
                <span>Concerned Persons & Department Specialists</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff registered below are automatically included in the AI least-connections load-balancer for this college.
              </p>
            </div>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-fit"
            >
              <UserPlus size={15} />
              <span>+ Register New Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{worker.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {worker.enrollment_or_emp_id || 'EMP-STAFF'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {worker.department}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate">{worker.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-400" />
                    <span>{worker.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span>{worker.available_hours || '09:00 AM - 06:00 PM'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Active Backlog:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    (worker.active_tickets || 0) === 0 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {worker.active_tickets || 0} active tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'DISPATCH_MAP' ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Satellite Dispatch Hotspots: {currentCollege.name}
              </h3>
              <p className="text-xs text-slate-500">
                High-definition satellite map showing cluster heat areas. Click on any marker to reassign staff.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {hotspots.length} Active Hotspots
            </span>
          </div>
          <HotspotMap
            hotspots={hotspots}
            onSelectIssue={(id) => {
              const found = issues.find(i => i.id === id);
              if (found) onSelectIssue(found);
            }}
          />
        </div>
      ) : (
        /* Issues Table / Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Showing {filteredIssues.length} Incidents</span>
            <span className="text-indigo-600 font-bold">
              Admin Mode: Click status step directly on cards to advance lifecycle
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">No complaints match your criteria in this queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onUpvote={onUpvote}
                  onStatusChange={(id, st) => onStatusChange(id, st)}
                  onSelect={onSelectIssue}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Concerned Person Modal Window */}
      <AddConcernedPersonModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        collegeId={currentCollege.id}
        collegeName={currentCollege.name}
        onSuccess={onRefreshData}
      />
    </div>
  );
}
