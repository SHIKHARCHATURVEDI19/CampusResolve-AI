import React from 'react';
import { Issue, IssueStatus } from '../types/index.ts';
import LiveTracking from './LiveTracking.tsx';
import { ThumbsUp, MapPin, Calendar, HardHat, AlertCircle, ShieldAlert } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onUpvote: (id: string) => void;
  onStatusChange: (id: string, newStatus: IssueStatus) => void;
  onSelect: (issue: Issue) => void;
}

const DEPT_BADGES: Record<string, string> = {
  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  IT: 'bg-blue-50 text-blue-700 border-blue-200',
  HOUSEKEEPING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SECURITY: 'bg-rose-50 text-rose-700 border-rose-200',
  ACADEMICS: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function IssueCard({ issue, onUpvote, onStatusChange, onSelect }: IssueCardProps) {
  const isHighPriority = issue.priority_score >= 7.0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between">
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              DEPT_BADGES[issue.department] || 'bg-slate-100 text-slate-700'
            }`}>
              {issue.department}
            </span>

            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isHighPriority ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {isHighPriority && <ShieldAlert size={12} />}
              Priority: {issue.priority_score.toFixed(1)}
            </span>

            <span className="text-[11px] text-slate-500 font-medium">
              Severity: <strong>{issue.severity}/5</strong>
            </span>
          </div>

          <button
            onClick={() => onUpvote(issue.id)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200 text-xs font-semibold transition shrink-0"
            title="Upvote / Confirm this issue"
          >
            <ThumbsUp size={13} />
            <span>{issue.upvotes}</span>
          </button>
        </div>

        {/* Title & Description */}
        <div>
          <h3 
            onClick={() => onSelect(issue)}
            className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition leading-snug"
          >
            {issue.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        </div>

        {/* Location & Image Preview */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin size={13} className="text-indigo-500 shrink-0" />
            <span className="truncate max-w-[200px]">{issue.location_name}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar size={12} />
            <span>{new Date(issue.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Reporter & Assigned Worker Details */}
        <div className="space-y-1.5">
          {/* Reported By Info */}
          <div className="bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                {issue.reporter?.name ? issue.reporter.name.charAt(0) : 'S'}
              </div>
              <span className="text-slate-600">Reported By:</span>
              <strong className="text-slate-800">
                {issue.reporter ? issue.reporter.name : 'Verified Student'}
              </strong>
            </div>
            <span className="text-[10px] text-indigo-700 font-mono">
              {issue.reporter?.email ? issue.reporter.email.split('@')[0] : 'student'}
            </span>
          </div>

          {/* Assigned Worker Banner */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <HardHat size={14} className="text-slate-500" />
              <span className="text-slate-600">Assigned Tech:</span>
              <strong className="text-slate-800">
                {issue.assigned_worker ? issue.assigned_worker.name : 'Unassigned (In queue)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Live Tracking Timeline Component */}
        <div className="pt-1">
          <LiveTracking
            currentStatus={issue.status}
            interactive={true}
            onStatusChange={(newStatus) => onStatusChange(issue.id, newStatus as IssueStatus)}
          />
        </div>
      </div>

      {/* Footer link */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Click step above to transition status</span>
        <button
          onClick={() => onSelect(issue)}
          className="font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          View Full Audit Timeline &rarr;
        </button>
      </div>
    </div>
  );
}
