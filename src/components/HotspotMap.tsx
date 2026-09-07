import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMapEvents } from 'react-leaflet';
import { HotspotMapPoint } from '../types/index.ts';
import { Flame, MapPin, Layers, Satellite, Compass } from 'lucide-react';
import L from 'leaflet';

// Custom clean pin icon
const customPinIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="
    background: #4f46e5;
    width: 26px;
    height: 26px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="width: 7px; height: 7px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26]
});

export type MapStyleKey = 'SATELLITE' | 'HYBRID' | 'STREET' | 'DARK';

interface TileConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const TILE_PROVIDERS: Record<MapStyleKey, TileConfig> = {
  SATELLITE: {
    name: 'Satellite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  },
  HYBRID: {
    name: 'Detailed Campus',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20
  },
  STREET: {
    name: 'Street / Buildings',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  },
  DARK: {
    name: 'Dark Tactical',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20
  }
};

interface HotspotMapProps {
  hotspots: HotspotMapPoint[];
  onSelectIssue?: (id: string) => void;
  selectableLocation?: boolean;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (pos: { lat: number; lng: number }) => void;
  compact?: boolean;
}

function LocationPicker({ onSelect }: { onSelect: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function HotspotMap({
  hotspots,
  onSelectIssue,
  selectableLocation = false,
  selectedPosition,
  onPositionSelect,
  compact = false
}: HotspotMapProps) {
  const centerLat = 28.4744;
  const centerLng = 77.5040;
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('SATELLITE');

  const currentTile = TILE_PROVIDERS[mapStyle];

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 ${
      compact ? 'h-[260px]' : 'h-[500px]'
    }`}>
      {/* Responsive Compact Header Controls (inside container with overflow protection) */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
        {/* Layer Switcher */}
        <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1 text-[11px] pointer-events-auto">
          <Layers size={13} className="text-indigo-600 hidden sm:inline" />
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as MapStyleKey)}
            className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer py-0.5"
          >
            {(Object.keys(TILE_PROVIDERS) as MapStyleKey[]).map((key) => (
              <option key={key} value={key} className="text-slate-800">
                {TILE_PROVIDERS[key].name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Legend (hidden or minimal on compact mode) */}
        {!compact && (
          <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-slate-200/80 text-[11px] flex items-center gap-2.5 pointer-events-auto font-medium text-slate-700">
            <Flame size={13} className="text-red-500" />
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-[10px]">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[10px]">Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-[10px]">Low</span>
            </div>
          </div>
        )}
      </div>

      {/* Pinpoint Helper Prompt */}
      {selectableLocation && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 text-white px-3 py-1 rounded-full shadow-lg backdrop-blur-sm text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 pointer-events-none whitespace-nowrap">
          <Compass size={12} className="text-indigo-400 animate-spin" />
          <span>Click anywhere on map to position pin</span>
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={17}
        maxZoom={currentTile.maxZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          key={mapStyle}
          attribution={currentTile.attribution}
          url={currentTile.url}
          maxZoom={currentTile.maxZoom}
        />

        {selectableLocation && onPositionSelect && (
          <LocationPicker onSelect={onPositionSelect} />
        )}

        {/* Precise High-Definition Pin Marker when selected */}
        {selectedPosition && (
          <Marker
            position={[selectedPosition.lat, selectedPosition.lng]}
            icon={customPinIcon}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1 font-sans">
                <p className="font-bold text-indigo-700 flex items-center gap-1">
                  <MapPin size={12} /> Pinpointed Exact Incident Spot
                </p>
                <p className="font-mono text-slate-500 text-[10px]">
                  {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic AI Hotspot Markers */}
        {hotspots.map((point) => {
          const isHighPriority = point.priority_score >= 7.0;
          const isMedPriority = point.priority_score >= 4.0;
          const strokeColor = isHighPriority ? '#ef4444' : isMedPriority ? '#f59e0b' : '#38bdf8';
          const fillColor = isHighPriority ? '#f87171' : isMedPriority ? '#fbbf24' : '#60a5fa';
          const radius = Math.min(Math.max(point.priority_score * 3.8, 12), 34);

          return (
            <React.Fragment key={point.id}>
              <CircleMarker
                center={[point.lat, point.lng]}
                radius={radius * 1.5}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.18,
                  weight: 1,
                  dashArray: '3, 4'
                }}
              />

              <CircleMarker
                center={[point.lat, point.lng]}
                radius={radius}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: fillColor,
                  fillOpacity: 0.9,
                  weight: 2.5
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px] space-y-2 font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {point.department}
                      </span>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isHighPriority ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        Score: {point.priority_score.toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">
                        {point.title}
                      </h4>
                      <div className="flex items-center text-xs text-slate-500 gap-1 mt-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{point.location_name}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">
                        Status: <strong className="text-slate-800">{point.status}</strong>
                      </span>
                      {onSelectIssue && (
                        <button
                          type="button"
                          onClick={() => onSelectIssue(point.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          View Audit &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
