import React, { useState } from 'react';
import { DiagnosticTest, HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { Activity, AlertTriangle, CheckCircle, Wrench, Package, Search } from 'lucide-react';

interface DiagnosticsAuditViewProps {
  facilities: HealthFacility[];
  language: Language;
}

export const DiagnosticsAuditView: React.FC<DiagnosticsAuditViewProps> = ({
  facilities,
  language,
}) => {
  const t = translations[language];
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issue' | 'available'>('all');
  const [fixedTestIds, setFixedTestIds] = useState<string[]>([]);

  // Flatten diagnostic tests with facility info
  const allTests: Array<DiagnosticTest & { facilityName: string; facilityId: string }> = [];
  facilities.forEach((fac) => {
    fac.diagnostics.forEach((diag) => {
      allTests.push({
        ...diag,
        facilityName: fac.name,
        facilityId: fac.id,
      });
    });
  });

  const totalTests = allTests.length;
  const operationalCount = allTests.filter((t) => t.status === 'Available').length;
  const issueCount = totalTests - operationalCount;
  const totalConductedToday = allTests.reduce((acc, t) => acc + t.testsConductedToday, 0);

  const filteredTests = allTests.filter((test) => {
    const matchesCenter = selectedCenterId === 'all' || test.facilityId === selectedCenterId;
    if (!matchesCenter) return false;
    if (statusFilter === 'issue') return test.status !== 'Available';
    if (statusFilter === 'available') return test.status === 'Available';
    return true;
  });

  const handleFixTest = (testId: string) => {
    setFixedTestIds((prev) => [...prev, testId]);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.testsConductedToday}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {totalConductedToday.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">{t.pathSerologyRad}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.testAvailability}</div>
          <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
            {Math.round((operationalCount / totalTests) * 100)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">{operationalCount} / {totalTests} {t.labsActive}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.reagentOutages}</div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">{issueCount}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">{t.requiresBiomedical}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.avgTurnaround}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">22 {t.mins}</div>
          <div className="text-xs text-slate-500 mt-1">{t.sampleToResult}</div>
        </div>
      </div>

      {/* Main Diagnostic Audits Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.diagnosticAudit}</h3>
            <div className="text-xs text-slate-500 mt-0.5">
              {t.liveDiagnosticAudit}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.allTests}
              </button>
              <button
                onClick={() => setStatusFilter('issue')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'issue' ? 'bg-white text-rose-800 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.downReagentOut} ({issueCount})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'available' ? 'bg-white text-teal-800 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.operational}
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t.colTestName}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colLocation}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colDiscipline}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colTestsConducted}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colReagentBuffer}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colStatus}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colRemediation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTests.map((test) => {
                const isFixed = fixedTestIds.includes(`${test.facilityId}-${test.id}`);
                const effectiveStatus = isFixed ? 'Available' : test.status;
                const isAvailable = effectiveStatus === 'Available';

                return (
                  <tr key={`${test.facilityId}-${test.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{test.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {t.turnaround} {isAvailable ? `${test.avgTurnaroundMins} ${t.mins}` : t.halted}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {test.facilityName}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {test.category}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                      {test.testsConductedToday}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={`font-bold ${
                          test.reagentDaysLeft === 0
                            ? 'text-rose-700'
                            : test.reagentDaysLeft < 5
                            ? 'text-amber-700'
                            : 'text-teal-800'
                        }`}
                      >
                        {isFixed ? `14 ${t.days}` : `${test.reagentDaysLeft} ${t.days}`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          isAvailable
                            ? 'bg-teal-100 text-teal-800'
                            : effectiveStatus === 'Reagent Out'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : effectiveStatus === 'Device Down'
                            ? 'bg-purple-100 text-purple-800 font-bold'
                            : 'bg-amber-100 text-amber-800 font-bold'
                        }`}
                      >
                        {effectiveStatus === 'Available' ? t.statusAvailable :
                         effectiveStatus === 'Reagent Out' ? t.statusReagentOut :
                         effectiveStatus === 'Device Down' ? t.statusDeviceDown : t.statusTechAbsent}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isAvailable ? (
                        <button
                          onClick={() => handleFixTest(`${test.facilityId}-${test.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors whitespace-nowrap shadow-xs"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{t.dispatchFix}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-teal-800 font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{t.operational}</span>
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
