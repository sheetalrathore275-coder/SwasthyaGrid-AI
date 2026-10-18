import React, { useState } from 'react';
import { HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { Bed, AlertTriangle, ShieldCheck, ArrowRight, Share2, CheckCircle2 } from 'lucide-react';

interface BedCapacityViewProps {
  facilities: HealthFacility[];
  language: Language;
}

export const BedCapacityView: React.FC<BedCapacityViewProps> = ({
  facilities,
  language,
}) => {
  const t = translations[language];
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');
  const [diversionSent, setDiversionSent] = useState(false);

  // Compute district totals
  const totalBeds = facilities.reduce((acc, f) => acc + f.beds.total, 0);
  const occupiedBeds = facilities.reduce((acc, f) => acc + f.beds.occupied, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const districtOccupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  // Saturated centers (>90% occupancy)
  const saturatedFacilities = facilities.filter((f) => f.beds.occupied / f.beds.total >= 0.9);

  const displayedFacilities = selectedCenterId === 'all'
    ? facilities
    : facilities.filter((f) => f.id === selectedCenterId);

  const handleBroadcastDiversion = () => {
    setDiversionSent(true);
    setTimeout(() => {
      setDiversionSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* High-Level Bed KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.districtTotalBeds}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalBeds} {t.bedManagement.split(' ')[0]}</div>
          <div className="text-xs text-slate-500 mt-1">{t.acrossFacilities}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.currentlyOccupied}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {occupiedBeds} <span className="text-xs text-slate-500 font-normal">({districtOccupancyRate}%)</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{t.districtUtilization}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.vacantReadyBeds}</div>
          <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">{availableBeds}</div>
          <div className="text-xs text-teal-700 font-medium mt-1">{t.availableImmediateTriage}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>{t.criticalSaturation}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">
            {saturatedFacilities.length} {t.totalFacilities}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            {saturatedFacilities.map((f) => f.name.replace('PHC ', '').replace('CHC ', '')).join(', ')}
          </div>
        </div>
      </div>

      {/* Saturated Warning Banner with Patient Diversion Protocol */}
      {saturatedFacilities.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">{t.wardSaturationAlert}</strong>
              <span>
                {t.wardSaturationDesc}
              </span>
              {diversionSent && (
                <div className="mt-2 text-teal-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  <span>{t.diversionBroadcasted}</span>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 self-end md:self-auto">
            <button
              onClick={handleBroadcastDiversion}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded transition-colors whitespace-nowrap shadow-xs"
            >
              {t.broadcastDiversion}
            </button>
          </div>
        </div>
      )}

      {/* Facilities Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.wardCapacityBreakdown}</h3>
            <div className="text-xs text-slate-500 mt-0.5">{t.realtimeBedTelemetry}</div>
          </div>

          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
          >
            <option value="all">{t.allDistrictCenters}</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t.colHealthCenter}</th>
                <th className="py-2.5 px-4 font-semibold text-center">{t.colGeneralWard}</th>
                <th className="py-2.5 px-4 font-semibold text-center">{t.colMaternityLabor}</th>
                <th className="py-2.5 px-4 font-semibold text-center">{t.colEmergencyTrauma}</th>
                <th className="py-2.5 px-4 font-semibold text-center">{t.colOxygenICU}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colTotalOccupancy}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colDiversionStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedFacilities.map((fac) => {
                const total = fac.beds.total;
                const occ = fac.beds.occupied;
                const rate = Math.round((occ / total) * 100);
                const isOverloaded = rate >= 90;

                return (
                  <tr key={fac.id} className="hover:bg-slate-50 transition-colors">
                    {/* Facility Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fac.name}</div>
                      <div className="text-[11px] text-slate-500">{fac.type} · {fac.block}</div>
                    </td>

                    {/* General Ward */}
                    <td className="py-3 px-4 text-center tabular-nums">
                      <span className="font-medium text-slate-900">
                        {fac.beds.categories.general.occupied} / {fac.beds.categories.general.total}
                      </span>
                    </td>

                    {/* Maternity */}
                    <td className="py-3 px-4 text-center tabular-nums">
                      <span
                        className={`font-medium ${
                          fac.beds.categories.maternity.occupied >= fac.beds.categories.maternity.total &&
                          fac.beds.categories.maternity.total > 0
                            ? 'text-rose-700 font-bold'
                            : 'text-slate-900'
                        }`}
                      >
                        {fac.beds.categories.maternity.occupied} / {fac.beds.categories.maternity.total}
                      </span>
                      {fac.beds.categories.maternity.occupied >= fac.beds.categories.maternity.total &&
                        fac.beds.categories.maternity.total > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold">{t.wardFull}</div>
                        )}
                    </td>

                    {/* Emergency */}
                    <td className="py-3 px-4 text-center tabular-nums">
                      <span
                        className={`font-medium ${
                          fac.beds.categories.emergency.occupied >= fac.beds.categories.emergency.total &&
                          fac.beds.categories.emergency.total > 0
                            ? 'text-rose-700 font-bold'
                            : 'text-slate-900'
                        }`}
                      >
                        {fac.beds.categories.emergency.occupied} / {fac.beds.categories.emergency.total}
                      </span>
                      {fac.beds.categories.emergency.occupied >= fac.beds.categories.emergency.total &&
                        fac.beds.categories.emergency.total > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold">{t.wardFull}</div>
                        )}
                    </td>

                    {/* Oxygen / ICU */}
                    <td className="py-3 px-4 text-center tabular-nums">
                      <span className="font-medium text-slate-900">
                        {fac.beds.categories.oxygen.occupied} / {fac.beds.categories.oxygen.total}
                      </span>
                    </td>

                    {/* Total Occupancy & Bar */}
                    <td className="py-3 px-4 text-right tabular-nums">
                      <div className="font-bold text-slate-900">
                        {occ} / {total} ({rate}%)
                      </div>
                      <div className="w-20 ml-auto h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rate >= 90 ? 'bg-rose-600' : rate >= 75 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </td>

                    {/* Diversion Status */}
                    <td className="py-3 px-4 text-right">
                      {isOverloaded ? (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          {t.divertNonCritical}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          {t.admissionsOpen}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
