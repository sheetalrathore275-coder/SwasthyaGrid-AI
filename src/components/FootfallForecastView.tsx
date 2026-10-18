import React, { useState, useEffect } from 'react';
import { DemandForecastData, HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { fetchDemandForecast } from '../services/aiService';
import { Users, TrendingUp, AlertCircle, Clock, Sparkles, Calendar, Activity } from 'lucide-react';

interface FootfallForecastViewProps {
  facilities: HealthFacility[];
  language: Language;
}

export const FootfallForecastView: React.FC<FootfallForecastViewProps> = ({
  facilities,
  language,
}) => {
  const t = translations[language];
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility>(facilities[1] || facilities[0]);
  const [forecast, setForecast] = useState<DemandForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [season, setSeason] = useState('monsoon');

  useEffect(() => {
    loadForecast(selectedFacility, season);
  }, [selectedFacility.id, season]);

  const loadForecast = async (facility: HealthFacility, seasonChoice: string) => {
    setLoading(true);
    try {
      const data = await fetchDemandForecast(facility, seasonChoice);
      setForecast(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // High surge facilities (>15%)
  const surgingFacilities = facilities.filter((f) => f.footfall.surgePercent > 15);

  return (
    <div className="space-y-6">
      {/* High-Level Footfall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.districtTotalOpd}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {facilities.reduce((acc, f) => acc + f.footfall.today, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t.across8Nodes}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.surgingCenters}</div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">
            {surgingFacilities.length} {t.totalFacilities}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            {surgingFacilities.map((f) => f.name.replace('PHC ', '').replace('CHC ', '')).join(', ')}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.activeLiveQueue}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {facilities.reduce((acc, f) => acc + f.footfall.activeQueue, 0)} {t.patients}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t.awaitingConsult}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.districtAvgWait}</div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">
            {Math.round(
              facilities.reduce((acc, f) => acc + f.footfall.avgWaitTimeMins, 0) / facilities.length
            )}{' '}
            {t.mins}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t.peakDelaysKotdwar}</div>
        </div>
      </div>

      {/* Center Selector & Season Simulator */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">{t.inspectCenter}</span>
          <select
            value={selectedFacility.id}
            onChange={(e) => {
              const fac = facilities.find((f) => f.id === e.target.value);
              if (fac) setSelectedFacility(fac);
            }}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 font-medium focus:ring-1 focus:ring-teal-700 focus:outline-none"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.footfall.surgePercent > 0 ? `+${f.footfall.surgePercent}%` : `${f.footfall.surgePercent}%`})
              </option>
            ))}
          </select>
        </div>

        {/* Epidemiological Season Simulator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{t.epidemicDriver}</span>
          <div className="inline-flex p-0.5 bg-slate-100 rounded-md">
            <button
              onClick={() => setSeason('monsoon')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                season === 'monsoon' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.driverMonsoon}
            </button>
            <button
              onClick={() => setSeason('winter')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                season === 'winter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.driverWinter}
            </button>
            <button
              onClick={() => setSeason('summer')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                season === 'summer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.driverSummer}
            </button>
          </div>
        </div>
      </div>

      {/* Hourly Trend vs AI 7-Day Demand Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly OPD Footfall Today */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t.todayHourlyPattern} {selectedFacility.name}
              </h3>
              <div className="text-xs text-slate-500 mt-0.5">
                {t.opdTriageCurve}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">{t.peakQueue}</span>
              <div className="text-xs font-bold text-slate-900 tabular-nums">11:00 AM - 01:00 PM</div>
            </div>
          </div>

          {/* Clean Bar Chart */}
          <div className="mt-6 flex items-end justify-between gap-2 h-44 pt-4 border-b border-slate-200">
            {selectedFacility.footfall.hourlyHistory.map((val, idx) => {
              const maxVal = Math.max(...selectedFacility.footfall.hourlyHistory, 60);
              const heightPercent = Math.round((val / maxVal) * 100);
              const hourLabel = `${8 + idx}:00`;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] text-slate-500 tabular-nums font-medium">{val}</span>
                  <div
                    className="w-full max-w-[28px] bg-teal-700/80 hover:bg-teal-700 rounded-t transition-all"
                    style={{ height: `${heightPercent}%` }}
                    title={`${hourLabel} - ${val}`}
                  />
                  <span className="text-[9px] text-slate-400 tabular-nums mt-1 whitespace-nowrap">
                    {hourLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-teal-700 rounded-xs inline-block" />
              <span>{t.registeredPatients}</span>
            </span>
            <span className="tabular-nums">{t.avgWait} {selectedFacility.footfall.avgWaitTimeMins} {t.mins}</span>
          </div>
        </div>

        {/* Gemini AI 7-Day Demand Forecast */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {t.aiDemandForecast}
                </h3>
              </div>
              <span className="text-xs text-teal-800 font-medium tabular-nums">
                {forecast?.confidenceScore ? `${forecast.confidenceScore}% ${t.confidence}` : t.analyzingDistrict}
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-500">
                <Activity className="w-6 h-6 text-teal-700 animate-spin mx-auto mb-2" />
                {t.simulatingTrajectory}
              </div>
            ) : forecast ? (
              <div className="mt-4 space-y-4">
                {/* Driver Box */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 font-semibold block mb-0.5">{t.epidemiologicalAssessment}</strong>
                  {forecast.epidemiologicalDriver}
                </div>

                {/* 7-Day Projected Numbers */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    {t.projectedDailyVolume}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {forecast.projectedDailyFootfall.map((num, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 p-2 rounded text-center"
                      >
                        <div className="text-[10px] text-slate-500">{t.day}{i + 1}</div>
                        <div className="text-xs font-bold text-slate-900 tabular-nums mt-0.5">{num}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Stock-Out Accelerations */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    {t.highRiskBurnWarnings}
                  </div>
                  <div className="space-y-2">
                    {forecast.criticalStockOutRisks.map((risk, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-rose-50/70 border border-rose-200 rounded text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-rose-950">
                          <span>{risk.item}</span>
                          <span className="text-rose-700 tabular-nums font-bold">
                            {t.stockoutIn} {risk.stockOutInDays} {t.days}
                          </span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-1">
                          {t.burnSurge} <strong className="text-rose-800">{risk.burnRateIncrease}</strong> · {risk.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
