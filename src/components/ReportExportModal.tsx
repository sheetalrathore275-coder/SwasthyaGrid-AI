import React from 'react';
import { HealthFacility, Language, TransferRequisition } from '../types';
import { translations } from '../locales/translations';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

interface ReportExportModalProps {
  facilities: HealthFacility[];
  transfers: TransferRequisition[];
  language: Language;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  facilities,
  transfers,
  language,
  onClose,
}) => {
  const t = translations[language];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      districtName: 'Devbhoomi District Health Grid',
      generatedAt: new Date().toISOString(),
      facilities: facilities.map((f) => ({
        name: f.name,
        type: f.type,
        status: f.status,
        opdToday: f.footfall.today,
        bedOccupancy: `${f.beds.occupied}/${f.beds.total}`,
        doctorAttendance: `${f.doctors.present}/${f.doctors.sanctioned}`,
        criticalStockItems: f.inventory.filter((i) => i.daysRemaining < 3),
      })),
      transfers: transfers,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SwasthyaGrid_District_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = ['Facility', 'Type', 'Medicine', 'Batch', 'Current Stock', 'Daily Burn', 'Days Left', 'Cold Chain'];
    const rows: string[] = [];

    facilities.forEach((f) => {
      f.inventory.forEach((i) => {
        rows.push([
          `"${f.name}"`,
          f.type,
          `"${i.name}"`,
          i.batchNo,
          i.currentStock,
          i.dailyBurnRate,
          i.daysRemaining.toFixed(1),
          i.coldChainRequired ? `${i.currentTempCelsius}°C` : 'N/A',
        ].join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SwasthyaGrid_District_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-teal-700 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t.reportTitle}
              </h3>
              <div className="text-xs text-slate-500">
                {t.reportSub}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono text-slate-800 bg-slate-50/50">
          <div className="border border-slate-200 bg-white p-4 rounded space-y-3 shadow-2xs">
            <div className="text-center pb-2 border-b border-slate-200">
              <div className="font-bold text-sm text-slate-900 uppercase tracking-wider font-sans">
                {t.adminHeader}
              </div>
              <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                {t.cmoOffice}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {t.generated} {new Date().toLocaleString()} · {t.securityRef} SG-AUD-849201
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <strong>{t.totalFacilities}:</strong> {facilities.length} {t.activeCenters}
              </div>
              <div>
                <strong>{t.districtTotalOpd}:</strong> {facilities.reduce((acc, f) => acc + f.footfall.today, 0)} {t.patients}
              </div>
              <div>
                <strong>{t.bedOccupancy}:</strong>{' '}
                {Math.round(
                  (facilities.reduce((acc, f) => acc + f.beds.occupied, 0) /
                    facilities.reduce((acc, f) => acc + f.beds.total, 0)) *
                    100
                )}%
              </div>
              <div>
                <strong>{t.doctorAttendance}:</strong>{' '}
                {Math.round(
                  (facilities.reduce((acc, f) => acc + f.doctors.present, 0) /
                    facilities.reduce((acc, f) => acc + f.doctors.sanctioned, 0)) *
                    100
                )}%
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="font-bold text-slate-900 mb-1">{t.criticalCentersHeading}</div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-[11px]">
                <li>CHC Kotdwar: Amoxicillin &amp; ARV &lt;48h; Maternity beds 100% full; 2 Specialists unexcused absent.</li>
                <li>PHC Sultanpur: Cold-chain fridge 9.4°C excursion breach; +68% waterborne gastroenteritis surge.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="font-bold text-slate-900 mb-1">{t.sanctionedOrdersHeading}</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                {transfers.slice(0, 4).map((tr) => (
                  <li key={tr.id}>
                    {tr.id}: {tr.transferQuantity} {tr.medicine} ({tr.sourceFacility} ➔ {tr.targetFacility}) · {tr.status}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500 font-sans">
              <span>{t.verifiedByIot}</span>
              <span className="font-semibold text-slate-700">{t.cmoSignature}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>{t.btnDownloadCsv}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.btnDownloadJson}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium"
            >
              {t.btnClose}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.btnPrint}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
