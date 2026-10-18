import React from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../locales/translations';
import { Activity, ShieldCheck, User, Globe, PlusCircle, FileText, Bot } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenAuditModal: () => void;
  onOpenReportModal: () => void;
  onOpenAssistantModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onLanguageChange,
  role,
  onRoleChange,
  onOpenAuditModal,
  onOpenReportModal,
  onOpenAssistantModal,
}) => {
  const t = translations[language];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Bar Contract: Zone 1 Wordmark, Zone 2 Nav Links, Zone 3 Primary Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Text Element Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-teal-800 transition-colors"
            >
              {t.appName}
            </a>
          </div>

          {/* Zone 2: 4-5 Clean Single-Line Text Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('overview')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'overview'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navOverview}
            </button>
            <button
              onClick={() => onSelectTab('inventory')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'inventory'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navInventory}
            </button>
            <button
              onClick={() => onSelectTab('redistribute')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'redistribute'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navRedistribute}
            </button>
            <button
              onClick={() => onSelectTab('footfall')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'footfall'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navFootfall}
            </button>
            <button
              onClick={() => onSelectTab('beds')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'beds'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navBeds}
            </button>
            <button
              onClick={() => onSelectTab('staff')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'staff'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navStaff}
            </button>
            <button
              onClick={() => onSelectTab('diagnostics')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'diagnostics'
                  ? 'text-teal-700 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {t.navDiagnostics}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAssistantModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Open Clinical AI Assistant"
            >
              <Bot className="w-3.5 h-3.5 text-teal-700" />
              <span>{t.actionAIAssistant}</span>
            </button>
            <button
              onClick={onOpenAuditModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.actionQuickAudit}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Tab Navigation */}
      <div className="lg:hidden bg-white border-t border-slate-200 px-4 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs font-medium text-slate-600 py-2">
        <button
          onClick={() => onSelectTab('overview')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'overview'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navOverview}
        </button>
        <button
          onClick={() => onSelectTab('inventory')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'inventory'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navInventory}
        </button>
        <button
          onClick={() => onSelectTab('redistribute')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'redistribute'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navRedistribute}
        </button>
        <button
          onClick={() => onSelectTab('footfall')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'footfall'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navFootfall}
        </button>
        <button
          onClick={() => onSelectTab('beds')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'beds'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navBeds}
        </button>
        <button
          onClick={() => onSelectTab('staff')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'staff'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navStaff}
        </button>
        <button
          onClick={() => onSelectTab('diagnostics')}
          className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
            currentTab === 'diagnostics'
              ? 'bg-teal-700 text-white font-semibold shadow-2xs'
              : 'hover:text-slate-900 bg-slate-100'
          }`}
        >
          {t.navDiagnostics}
        </button>
      </div>

      {/* Sub-Header Operational Toolbar */}
      <div className="bg-slate-100/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Role Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{t.roleBadge}:</span>
            <div className="inline-flex p-0.5 bg-slate-200 rounded-md">
              <button
                onClick={() => onRoleChange('cmo')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  role === 'cmo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-700" />
                  {t.roleCMO}
                </span>
              </button>
              <button
                onClick={() => onRoleChange('moic')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  role === 'moic'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-sky-700" />
                  {t.roleMOIC}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Context & Language Switcher */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.actionExportReport}</span>
            </button>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-300">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="flex items-center gap-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange(l.code)}
                    className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                      language === l.code
                        ? 'bg-teal-700 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
