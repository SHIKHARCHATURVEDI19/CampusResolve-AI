import React from 'react';
import { User } from '../types/index.ts';
import { Users, HardHat, Briefcase, Activity } from 'lucide-react';

interface WorkerStatsProps {
  workers: User[];
  onWorkerClick?: (worker: User) => void;
}

const DEPT_COLORS: Record<string, string> = {
  MAINTENANCE: 'border-amber-200 bg-amber-50 text-amber-800',
  IT: 'border-blue-200 bg-blue-50 text-blue-800',
  HOUSEKEEPING: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  SECURITY: 'border-red-200 bg-red-50 text-red-800',
  ACADEMICS: 'border-purple-200 bg-purple-50 text-purple-800',
};

export default function WorkerStats({ workers }: WorkerStatsProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department Staff Load-Balancing</h3>
            <p className="text-xs text-slate-500">Live active ticket counts (Least Connections Auto-Routing)</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
          <Activity size={12} className="animate-pulse" /> Active Dispatch
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workers.map((worker) => {
          const count = worker.active_tickets || 0;
          const isHighLoad = count >= 3;
          const isAvailable = count === 0;

          return (
            <div
              key={worker.id}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{worker.name}</h4>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                      DEPT_COLORS[worker.department || ''] || 'bg-slate-100 text-slate-600'
                    }`}>
                      {worker.department}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    isAvailable 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : isHighLoad 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {count} active
                  </span>
                </div>
              </div>

              <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isHighLoad ? 'bg-rose-500' : count > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
