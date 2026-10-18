import React, { useState } from 'react';
import { HealthFacility, Language, TransferRequisition } from '../types';
import { translations } from '../locales/translations';
import { Navigation, AlertTriangle, CheckCircle, Bed, Users, Package, Eye } from 'lucide-react';

interface DistrictMapProps {
  facilities: HealthFacility[];
  selectedFacilityId?: string;
  onSelectFacility: (facility: HealthFacility) => void;
  transfers: TransferRequisition[];
  language: Language;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  transfers,
  language,
}) => {
  const t = translations[language];
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'chc' | 'phc'>('all');
  const [hoveredFacility, setHoveredFacility] = useState<HealthFacility | null>(null);

  const filteredFacilities = facilities.filter((f) => {
    if (filterType === 'critical') return f.status === 'critical';
    if (filterType === 'chc') return f.type === 'CHC';
    if (filterType === 'phc') return f.type === 'PHC';
    return true;
  });

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || hoveredFacility;

  // Central hub is District Hospital
  const hub = facilities.find((f) => f.type === 'DISTRICT_HOSPITAL') || facilities[0];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-700" />
            <span>{t.districtHealthMap}</span>
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            <span>{t.districtMapSub}</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.allNodes}
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterType === 'critical' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.criticalOnly}
          </button>
          <button
            onClick={() => setFilterType('chc')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterType === 'chc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.chcs}
          </button>
          <button
            onClick={() => setFilterType('phc')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterType === 'phc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.phcs}
          </button>
        </div>
      </div>

      {/* Map Layout: SVG District Network on Left, Quick Node Inspector on Right */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* SVG Canvas Area */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-2 min-h-[380px] flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-h-[440px] select-none"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.3" />
              </pattern>
            </defs>

            <rect width="100" height="100" fill="#090d16" />
            <rect width="100" height="100" fill="url(#grid)" />

            {/* District Boundary outline */}
            <path
              d="M 12 25 L 42 10 L 78 14 L 92 40 L 85 75 L 56 92 L 20 82 L 8 50 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="1.5,1.5"
            />

            {/* Connecting Supply Routes from Hub to all facilities */}
            {hub &&
              facilities.map((fac) => {
                if (fac.id === hub.id) return null;
                const isTransferRoute = transfers.some(
                  (t) =>
                    (t.sourceFacility === fac.name && t.targetFacility === hub.name) ||
                    (t.sourceFacility === hub.name && t.targetFacility === fac.name)
                );
                return (
                  <line
                    key={`hub-line-${fac.id}`}
                    x1={hub.coordinates.x}
                    y1={hub.coordinates.y}
                    x2={fac.coordinates.x}
                    y2={fac.coordinates.y}
                    stroke={isTransferRoute ? '#38bdf8' : '#334155'}
                    strokeWidth={isTransferRoute ? 0.9 : 0.4}
                    strokeDasharray={isTransferRoute ? '2,2' : undefined}
                    className={isTransferRoute ? 'animate-pulse' : ''}
                  />
                );
              })}

            {/* Inter-PHC/CHC Lateral Transfer Routes */}
            {transfers.map((tr) => {
              const src = facilities.find((f) => f.name.includes(tr.sourceFacility) || tr.sourceFacility.includes(f.name));
              const tgt = facilities.find((f) => f.name.includes(tr.targetFacility) || tr.targetFacility.includes(f.name));
              if (!src || !tgt) return null;
              return (
                <g key={`tr-${tr.id}`}>
                  <line
                    x1={src.coordinates.x}
                    y1={src.coordinates.y}
                    x2={tgt.coordinates.x}
                    y2={tgt.coordinates.y}
                    stroke="#f43f5e"
                    strokeWidth="0.9"
                    strokeDasharray="2,1.5"
                  />
                  <circle
                    cx={(src.coordinates.x + tgt.coordinates.x) / 2}
                    cy={(src.coordinates.y + tgt.coordinates.y) / 2}
                    r="1.2"
                    fill="#fb7185"
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {filteredFacilities.map((facility) => {
              const isSelected = selectedFacility?.id === facility.id;
              const isCritical = facility.status === 'critical';
              const isWarning = facility.status === 'warning';
              const isHub = facility.type === 'DISTRICT_HOSPITAL';

              let nodeColor = '#10b981';
              if (isCritical) nodeColor = '#f43f5e';
              else if (isWarning) nodeColor = '#f59e0b';

              return (
                <g
                  key={facility.id}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectFacility(facility)}
                  onMouseEnter={() => setHoveredFacility(facility)}
                  onMouseLeave={() => setHoveredFacility(null)}
                >
                  {isSelected && (
                    <circle
                      cx={facility.coordinates.x}
                      cy={facility.coordinates.y}
                      r="4.5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.6"
                      opacity="0.8"
                    />
                  )}

                  {isHub ? (
                    <polygon
                      points={`${facility.coordinates.x},${facility.coordinates.y - 3} ${facility.coordinates.x + 3},${facility.coordinates.y} ${facility.coordinates.x},${facility.coordinates.y + 3} ${facility.coordinates.x - 3},${facility.coordinates.y}`}
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                  ) : facility.type === 'CHC' ? (
                    <rect
                      x={facility.coordinates.x - 2.2}
                      y={facility.coordinates.y - 2.2}
                      width="4.4"
                      height="4.4"
                      rx="0.6"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                  ) : (
                    <circle
                      cx={facility.coordinates.x}
                      cy={facility.coordinates.y}
                      r="2.2"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                  )}

                  <text
                    x={facility.coordinates.x}
                    y={facility.coordinates.y + 4.8}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="2.4"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight={isSelected ? '700' : '500'}
                    className="pointer-events-none"
                  >
                    {facility.name.replace(' (Central Hub)', '').replace('PHC ', '').replace('CHC ', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Floating Legend */}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs p-2 rounded border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>{t.criticalDeficit}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>{t.warningWatchlist}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{t.nominal}</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              <span>{t.mapLegend}</span>
            </div>
          </div>
        </div>

        {/* Node Inspection Sidebar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          {selectedFacility ? (
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-medium">{selectedFacility.type} · {selectedFacility.block}</div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedFacility.name}</h3>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span>{t.moic} {selectedFacility.moicName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{selectedFacility.distanceFromHubKm} {t.kmToHub}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    selectedFacility.status === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedFacility.status === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedFacility.status === 'critical' ? t.criticalDeficit : selectedFacility.status === 'warning' ? t.warningWatchlist : t.nominal}
                </span>
              </div>

              {/* Vital Node Metrics */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{t.opdToday}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {selectedFacility.footfall.today}
                  </div>
                  <div className={`text-[10px] font-medium tabular-nums ${
                    selectedFacility.footfall.surgePercent > 15 ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    {selectedFacility.footfall.surgePercent > 0 ? '+' : ''}
                    {selectedFacility.footfall.surgePercent}% {t.vs7DayAvg}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Bed className="w-3 h-3 text-slate-400" />
                    <span>{t.bedOccupancy}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {Math.round((selectedFacility.beds.occupied / selectedFacility.beds.total) * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {selectedFacility.beds.occupied} / {selectedFacility.beds.total} {t.bedManagement.split(' ')[0]}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-slate-400" />
                    <span>{t.doctorsPresent}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {selectedFacility.doctors.present} / {selectedFacility.doctors.sanctioned}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedFacility.doctors.absent > 0 ? (
                      <span className="text-rose-600 font-medium">{selectedFacility.doctors.absent} {t.doctorsAbsent}</span>
                    ) : (
                      t.fullRosterActive
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>{t.stockWarning}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {selectedFacility.inventory.filter((i) => i.daysRemaining < 3).length} {t.items}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedFacility.inventory.filter((i) => i.daysRemaining < 3).length > 0 ? (
                      <span className="text-rose-600 font-medium">{t.criticalStockOut}</span>
                    ) : (
                      t.buffersAdequate
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Alerts in this node */}
              <div className="space-y-1.5 mt-2">
                <div className="text-[11px] font-semibold text-slate-700">{t.activeCenterAlerts}</div>
                {selectedFacility.alerts.length === 0 ? (
                  <div className="text-xs text-slate-500 py-1">{t.noAlerts}</div>
                ) : (
                  selectedFacility.alerts.slice(0, 2).map((alt) => (
                    <div
                      key={alt.id}
                      className="text-xs p-2 bg-white rounded border border-slate-200 flex items-start gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">{alt.title}</div>
                        <div className="text-[11px] text-slate-600">{alt.description}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">
              {t.mapInstruction}
            </div>
          )}

          {selectedFacility && (
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">{t.contact} {selectedFacility.phone}</span>
              <button
                onClick={() => onSelectFacility(selectedFacility)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.deepAudit}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
