import React, { useState } from 'react';
import { Issue, HotspotMapPoint, User, IssueStatus, College } from '../types/index.ts';
import HotspotMap from './HotspotMap.tsx';
import IssueCard from './IssueCard.tsx';
import { 
  PlusCircle, 
  Map, 
  ListFilter, 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface StudentDashboardProps {
  currentCollege: College;
  currentUser: User;
  issues: Issue[];
  hotspots: HotspotMapPoint[];
  onOpenReportModal: () => void;
  onUpvote: (id: string) => void;
  onSelectIssue: (issue: Issue) => void;
}

export default function StudentDashboard({
  currentCollege,
  currentUser,
  issues,
  hotspots,
  onOpenReportModal,
  onUpvote,
  onSelectIssue
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'MY_ISSUES' | 'CAMPUS_FEED' | 'MAP'>('MY_ISSUES');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Filter issues reported specifically by this student
  const myReportedIssues = issues.filter(i => i.reporter_id === currentUser.id);

  // Status metrics for this student
  const myResolvedCount = myReportedIssues.filter(i => i.status === 'RESOLVED' || i.status === 'VERIFIED').length;
  const myActiveCount = myReportedIssues.filter(i => i.status === 'REPORTED' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length;

  const currentIssuesList = activeTab === 'MY_ISSUES' ? myReportedIssues : issues;

  const filteredIssues = currentIssuesList.filter(iss => {
    const matchesDept = deptFilter === 'ALL' || iss.department === deptFilter;
    const matchesSearch = 
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Student Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-sm border border-white/20">
            <Sparkles size={13} className="text-indigo-200" />
            <span>Student Grievance & Facility Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hi, {currentUser.name} 👋
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg leading-relaxed">
            Report any electrical, WiFi, cleanliness, or security issues in {currentCollege.name}. Track resolution milestones in real time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto px-6 py-3.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-sm"
          >
            <PlusCircle size={18} />
            <span>Report New Issue</span>
          </button>
        </div>
      </div>

      {/* Student Quick Stats (Personal Track Record) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{myReportedIssues.length}</div>
            <div className="text-xs font-medium text-slate-500">My Lodged Grievances</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{myActiveCount}</div>
            <div className="text-xs font-medium text-slate-500">Being Actively Worked On</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{myResolvedCount}</div>
            <div className="text-xs font-medium text-slate-500">Successfully Resolved</div>
          </div>
        </div>
      </div>

      {/* Tabs: My Issues vs Campus Community Feed vs Satellite Map */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('MY_ISSUES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'MY_ISSUES'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={15} />
            <span>My Reported Issues ({myReportedIssues.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CAMPUS_FEED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'CAMPUS_FEED'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter size={15} />
            <span>Campus Community Feed ({issues.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MAP')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'MAP'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map size={15} />
            <span>Campus Satellite Map</span>
          </button>
        </div>

        {/* Filter controls */}
        {activeTab !== 'MAP' && (
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="IT">IT & Network</option>
              <option value="HOUSEKEEPING">Sanitation</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
        )}
      </div>

      {/* Map View */}
      {activeTab === 'MAP' ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {currentCollege.name} - Incident Locations
              </h3>
              <p className="text-xs text-slate-500">
                Satellite HD view showing campus issue hotspots. Upvote existing issues to escalate priority.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {hotspots.length} Incidents Pinpointed
            </span>
          </div>
          <HotspotMap
            hotspots={hotspots}
            onSelectIssue={(id) => {
              const f = issues.find(i => i.id === id);
              if (f) onSelectIssue(f);
            }}
          />
        </div>
      ) : (
        /* Issues Card List */
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <p className="text-slate-500 text-sm font-medium">
                {activeTab === 'MY_ISSUES'
                  ? "You haven't reported any grievances yet. Click 'Report New Issue' above to lodge one."
                  : "No community grievances match your selected category."}
              </p>
              {activeTab === 'MY_ISSUES' && (
                <button
                  onClick={onOpenReportModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  Report First Grievance
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onUpvote={onUpvote}
                  onStatusChange={() => {}} // Students view-only status
                  onSelect={onSelectIssue}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
