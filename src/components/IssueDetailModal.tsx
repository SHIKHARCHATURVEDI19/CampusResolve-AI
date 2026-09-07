import React, { useState } from 'react';
import { Issue, IssueStatus, User } from '../types/index.ts';
import LiveTracking from './LiveTracking.tsx';
import { X, Calendar, MapPin, HardHat, History, UserCheck, ShieldCheck } from 'lucide-react';

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: IssueStatus, notes?: string, assignedTo?: string) => void;
  currentUserRole?: string;
  collegeWorkers?: User[];
}

export default function IssueDetailModal({ 
  issue, 
  onClose, 
  onStatusChange,
  currentUserRole = 'STUDENT',
  collegeWorkers = []
}: IssueDetailModalProps) {
  const [note, setNote] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(issue?.assigned_to || '');

  if (!issue) return null;

  const isAdmin = currentUserRole === 'COLLEGE_ADMIN' || currentUserRole === 'SUPER_ADMIN';

  const handleAdvance = (status: IssueStatus) => {
    onStatusChange(issue.id, status, note.trim() || undefined);
    setNote('');
  };

  const handleAssignWorker = () => {
    if (!selectedWorkerId) return;
    onStatusChange(issue.id, 'ASSIGNED', note.trim() || undefined, selectedWorkerId);
    setNote('');
  };

  // Filter workers in the relevant department
  const eligibleWorkers = collegeWorkers.filter(w => w.department === issue.department);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {issue.department}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Priority: {issue.priority_score.toFixed(1)}
              </span>
              {isAdmin && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <ShieldCheck size={12} /> Admin Mode
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{issue.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tracking */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Status Lifecycle Progression
            </h4>
            <LiveTracking
              currentStatus={issue.status}
              interactive={isAdmin}
              onStatusChange={(s) => isAdmin && handleAdvance(s as IssueStatus)}
            />
            {!isAdmin && (
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Live automated status tracking. Only department staff or college admins can transition status.
              </p>
            )}
          </div>

          {/* Admin Delegation Section */}
          {isAdmin && (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <UserCheck size={16} className="text-amber-700" />
                <span>Admin Delegation: Assign College Staff Worker</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full sm:w-auto flex-1 px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Available Technician --</option>
                  {eligibleWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department}) - {w.active_tickets || 0} active tickets
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignWorker}
                  disabled={!selectedWorkerId}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-600/20"
                >
                  Delegate to Technician
                </button>
              </div>
            </div>
          )}

          {/* Description & image */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Incident Overview</h4>
            <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
              {issue.description}
            </p>

            {issue.image_url && (
              <div className="mt-3">
                <img
                  src={issue.image_url}
                  alt="Incident proof"
                  className="w-full max-h-64 object-cover rounded-xl border border-slate-200"
                />
              </div>
            )}
          </div>

          {/* Meta details: Reporter, Location, Assigned Worker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Lodged By (Reporter) Card */}
            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                <UserCheck size={14} />
                <span>Lodged By (Reporter)</span>
              </div>
              <p className="font-bold text-slate-800">
                {issue.reporter ? issue.reporter.name : 'Verified Student'}
              </p>
              <p className="text-[11px] text-slate-600 truncate font-mono">
                {issue.reporter?.email || 'N/A'}
              </p>
              {issue.reporter?.phone && (
                <p className="text-[10px] text-slate-500 font-mono">
                  Tel: {issue.reporter.phone}
                </p>
              )}
            </div>

            {/* Campus Location Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <MapPin size={14} className="text-indigo-600" />
                <span>Campus Location</span>
              </div>
              <p className="font-bold text-slate-800">{issue.location_name}</p>
              <p className="font-mono text-[11px] text-slate-400">
                Lat: {issue.latitude.toFixed(5)}, Lng: {issue.longitude.toFixed(5)}
              </p>
            </div>

            {/* Assigned Staff Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <HardHat size={14} className="text-amber-600" />
                <span>Assigned Staff Worker</span>
              </div>
              <p className="font-bold text-slate-800">
                {issue.assigned_worker ? issue.assigned_worker.name : 'Unassigned (In queue)'}
              </p>
              <p className="text-[11px] text-slate-400">
                Scoped to department specialists
              </p>
            </div>
          </div>

          {/* Timeline History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Audit Timeline Log (PostGIS & DB Synchronized)
              </h4>
            </div>

            <div className="space-y-2.5">
              {issue.timeline && issue.timeline.length > 0 ? (
                issue.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 uppercase tracking-wide">
                        {event.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600">{event.notes}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No timeline events recorded yet.</p>
              )}
            </div>
          </div>

          {/* Admin / Staff Update Controls */}
          {isAdmin && (
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Update Status With Staff / Inspection Notes
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add resolution notes or inspection details..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdvance('IN_PROGRESS')}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    Set In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvance('RESOLVED')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvance('VERIFIED')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
