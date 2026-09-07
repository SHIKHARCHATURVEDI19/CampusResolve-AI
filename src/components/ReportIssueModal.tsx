import React, { useState } from 'react';
import { X, MapPin, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import HotspotMap from './HotspotMap.tsx';

import { User } from '../types/index.ts';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  currentUser?: User | null;
  collegeId?: string;
}

const PRESET_LOCATIONS = [
  { name: 'Central Library (2nd Floor)', lat: 28.4744, lng: 77.5040 },
  { name: 'Hostel Block B (3rd Floor)', lat: 28.4755, lng: 77.5028 },
  { name: 'North Gate 4', lat: 28.4768, lng: 77.5055 },
  { name: 'Computer Center / IT Labs', lat: 28.4735, lng: 77.5032 },
  { name: 'Student Cafeteria', lat: 28.4748, lng: 77.5048 },
  { name: 'Mechanical Workshop', lat: 28.4760, lng: 77.5065 }
];

export default function ReportIssueModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentUser,
  collegeId
}: ReportIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState(PRESET_LOCATIONS[0].name);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: PRESET_LOCATIONS[0].lat,
    lng: PRESET_LOCATIONS[0].lng
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<any | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleLocationPresetChange = (name: string) => {
    setLocationName(name);
    const found = PRESET_LOCATIONS.find(l => l.name === name);
    if (found) {
      setCoords({ lat: found.lat, lng: found.lng });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    setDuplicateAlert(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          latitude: coords.lat,
          longitude: coords.lng,
          locationName,
          imageUrl: imageUrl.trim() || undefined,
          reporterId: currentUser?.id,
          collegeId: collegeId || currentUser?.college_id
        })
      });

      const data = await res.json();

      if (data.isDuplicate) {
        setDuplicateAlert(data);
      } else {
        setSuccessInfo(data);
        setTimeout(() => {
          onSuccess(data);
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      alert('Error filing issue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Sticky Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Report Campus Grievance</h2>
              <p className="text-xs text-slate-500">AI auto-routing, deduplication & severity scoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Duplicate Notification Banner */}
          {duplicateAlert && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm">Duplicate Detected Nearby!</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Matches an existing incident within 100 meters.
                  </p>
                  <div className="mt-2 text-xs bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="font-semibold text-slate-700">Consolidated into:</span> {duplicateAlert.issue?.title}
                    <div className="text-emerald-700 font-semibold mt-0.5">
                      &bull; Upvotes bumped to {duplicateAlert.issue?.upvotes} &bull; Priority elevated to {duplicateAlert.issue?.priority_score}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSuccess(duplicateAlert.issue);
                  onClose();
                }}
                className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition"
              >
                View Consolidated Incident &rarr;
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
              <div>
                <div className="font-bold text-sm">Grievance Successfully Registered!</div>
                <div className="text-xs text-emerald-700">
                  Department: <span className="font-semibold">{successInfo.department}</span> | Priority Score: <span className="font-semibold">{successInfo.priority_score}</span>
                </div>
              </div>
            </div>
          )}

          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Reporting as indicator */}
            {currentUser && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Reporting Grievance As: </span>
                    <strong className="text-slate-800">{currentUser.name}</strong>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-mono">({currentUser.email})</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentUser.role}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Issue Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken water pipe in 1st floor washroom"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Detailed Description
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, hazards, or specific room details. AI will extract severity and category..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Campus Location
                </label>
                <select
                  value={locationName}
                  onChange={(e) => handleLocationPresetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                >
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Image Proof (URL)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Compact map picker with dedicated height and no overflow bleed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <MapPin size={13} className="text-indigo-600" />
                  Pinpoint Incident (Click map to position)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
              <HotspotMap
                hotspots={[]}
                selectableLocation={true}
                selectedPosition={coords}
                onPositionSelect={(pos) => setCoords(pos)}
                compact={true}
              />
            </div>
          </form>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80 shrink-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="report-form"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-200 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Routing via AI...
              </>
            ) : (
              <>Submit & Auto-Assign</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
