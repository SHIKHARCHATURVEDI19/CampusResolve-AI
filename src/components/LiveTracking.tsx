import React from 'react';
import { CheckCircle2, Clock, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

const STEPS = [
  { key: 'REPORTED', label: 'Reported', icon: AlertCircle },
  { key: 'ASSIGNED', label: 'Assigned', icon: Clock },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 },
  { key: 'VERIFIED', label: 'Verified', icon: ShieldCheck }
];

interface LiveTrackingProps {
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  interactive?: boolean;
}

export default function LiveTracking({ currentStatus, onStatusChange, interactive = false }: LiveTrackingProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full py-4 px-4 bg-slate-50/70 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between relative max-w-xl mx-auto">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 z-0"
          style={{ width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 90)}%` }}
        />
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div 
              key={step.key} 
              onClick={() => interactive && onStatusChange && onStatusChange(step.key)}
              className={`relative z-10 flex flex-col items-center select-none ${
                interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''
              }`}
            >
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shadow-sm ${
                  isDone 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' 
                    : 'bg-white border-slate-300 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-indigo-100 ring-offset-1' : ''}`}
                title={interactive ? `Click to advance to ${step.label}` : step.label}
              >
                <Icon size={16} />
              </div>
              <span className={`text-[11px] font-semibold mt-2 tracking-tight ${isDone ? 'text-indigo-950 font-bold' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
