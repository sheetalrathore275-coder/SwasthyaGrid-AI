import React, { useState } from 'react';
import { CMOBriefingData, HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { fetchCMOBriefing } from '../services/aiService';
import { RefreshCw, Sparkles, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

interface CMOBriefingCardProps {
  briefing: CMOBriefingData;
  onUpdateBriefing: (briefing: CMOBriefingData) => void;
  facilities: HealthFacility[];
  language: Language;
}

export const CMOBriefingCard: React.FC<CMOBriefingCardProps> = ({
  briefing,
  onUpdateBriefing,
  facilities,
  language,
}) => {
  const t = translations[language];
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const updated = await fetchCMOBriefing('Devbhoomi District Grid', facilities, language);
      onUpdateBriefing(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      {/* Header with Doctor Profile and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <img
            src="/src/assets/images/medical_officer_profile_1792298769867.jpg"
            alt="District Chief Medical Officer Dr. Meera Rao"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-teal-600/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                {t.aiExecutiveBriefing}
              </h2>
              <span className="text-xs text-teal-800 font-medium inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-700" />
                Gemini 3.8 Flash
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{t.districtHealthCommand}</span>
              <span aria-hidden="true">·</span>
              <span>{t.devbhoomiSector}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-60 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t.analyzingDistrict : t.actionRefreshAI}</span>
        </button>
      </div>

      {/* Summary Narrative */}
      <div className="mt-4 text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-md border border-slate-200/80">
        <p className="font-normal">{briefing.summary}</p>
        {briefing.epidemiologicalRisk && (
          <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs text-amber-900 flex items-start gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>{t.epidemiologicalRisk} {briefing.epidemiologicalRisk}</span>
          </div>
        )}
      </div>

      {/* Structured Insights & Interventions Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Attention Centers */}
        <div className="p-3 bg-white border border-slate-200 rounded-md">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{t.immediateAttentionCenters}</span>
          </div>
          <div className="space-y-1.5">
            {briefing.criticalCenters.map((center, idx) => (
              <div
                key={idx}
                className="text-xs text-slate-700 flex items-center justify-between py-1 border-b border-slate-100 last:border-none"
              >
                <span className="font-medium text-rose-900">{center}</span>
                <span className="text-slate-500 text-[11px]">{t.interventionMandated}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div className="p-3 bg-white border border-slate-200 rounded-md">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>{t.authorizedDirectives}</span>
          </div>
          <ul className="space-y-1.5">
            {briefing.topInterventions.map((action, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug"
              >
                <span className="font-semibold text-teal-800 shrink-0 tabular-nums">{idx + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
