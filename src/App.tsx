import React, { useState, useEffect } from 'react';
import { CMOBriefingData, HealthFacility, Language, TransferRequisition, UserRole } from './types';
import { initialFacilities, initialTransfers } from './data/mockDistrictData';
import { translations } from './locales/translations';
import { fetchCMOBriefing } from './services/aiService';

import { Header } from './components/Header';
import { CMOBriefingCard } from './components/CMOBriefingCard';
import { DistrictMap } from './components/DistrictMap';
import { InventoryView } from './components/InventoryView';
import { RedistributionEngine } from './components/RedistributionEngine';
import { FootfallForecastView } from './components/FootfallForecastView';
import { BedCapacityView } from './components/BedCapacityView';
import { StaffAttendanceView } from './components/StaffAttendanceView';
import { DiagnosticsAuditView } from './components/DiagnosticsAuditView';

import { FieldUpdateModal } from './components/FieldUpdateModal';
import { AuditAssistantModal } from './components/AuditAssistantModal';
import { ReportExportModal } from './components/ReportExportModal';

import {
  AlertTriangle,
  Building2,
  Users,
  Bed,
  CheckCircle2,
  Package,
  Activity,
  ArrowRight,
  ShieldAlert,
  Radio,
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<UserRole>('cmo');
  const [currentTab, setCurrentTab] = useState<string>('overview');

  const [facilities, setFacilities] = useState<HealthFacility[]>(initialFacilities);
  const [transfers, setTransfers] = useState<TransferRequisition[]>(initialTransfers);
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility>(initialFacilities[1]);

  const [hasCustomBriefing, setHasCustomBriefing] = useState(false);
  const [cmoBriefing, setCmoBriefing] = useState<CMOBriefingData>(() => {
    const curT = translations.en;
    return {
      summary: curT.cmoDefaultSummary,
      criticalCenters: ['CHC Kotdwar', 'PHC Sultanpur'],
      topInterventions: [
        curT.cmoDefaultIntervention1,
        curT.cmoDefaultIntervention2,
        curT.cmoDefaultIntervention3,
      ],
      epidemiologicalRisk: curT.cmoDefaultRisk,
      generatedAt: new Date().toISOString(),
    };
  });

  // Modal visibility
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);

  // Live simulation toggle
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  const t = translations[language];

  // Update default CMO briefing when language switches if user hasn't generated a live custom one
  useEffect(() => {
    if (!hasCustomBriefing) {
      setCmoBriefing({
        summary: t.cmoDefaultSummary,
        criticalCenters: ['CHC Kotdwar', 'PHC Sultanpur'],
        topInterventions: [
          t.cmoDefaultIntervention1,
          t.cmoDefaultIntervention2,
          t.cmoDefaultIntervention3,
        ],
        epidemiologicalRisk: t.cmoDefaultRisk,
        generatedAt: new Date().toISOString(),
      });
    }
  }, [language, hasCustomBriefing, t]);

  // Periodic simulated live ticks
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setFacilities((prev) =>
        prev.map((f) => {
          // slight fluctuation in footfall and queue
          const footfallDelta = Math.floor(Math.random() * 3);
          const queueDelta = Math.random() > 0.5 ? 1 : -1;
          const newQueue = Math.max(2, f.footfall.activeQueue + queueDelta);

          // slight cold chain fluctuation
          const updatedInventory = f.inventory.map((inv) => {
            if (inv.coldChainRequired && inv.currentTempCelsius !== undefined) {
              const delta = (Math.random() - 0.5) * 0.2;
              return {
                ...inv,
                currentTempCelsius: Number((inv.currentTempCelsius + delta).toFixed(1)),
              };
            }
            return inv;
          });

          return {
            ...f,
            footfall: {
              ...f.footfall,
              today: f.footfall.today + footfallDelta,
              activeQueue: newQueue,
            },
            inventory: updatedInventory,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Aggregate Metrics for Top Strip
  const totalCenters = facilities.length;
  const criticalCenters = facilities.filter((f) => f.status === 'critical');
  const warningCenters = facilities.filter((f) => f.status === 'warning');
  const totalBeds = facilities.reduce((acc, f) => acc + f.beds.total, 0);
  const occupiedBeds = facilities.reduce((acc, f) => acc + f.beds.occupied, 0);
  const bedRate = Math.round((occupiedBeds / totalBeds) * 100);

  const totalSanctionedDocs = facilities.reduce((acc, f) => acc + f.doctors.sanctioned, 0);
  const totalPresentDocs = facilities.reduce((acc, f) => acc + f.doctors.present, 0);
  const docAttendanceRate = Math.round((totalPresentDocs / totalSanctionedDocs) * 100);

  const allDepletedDrugs = facilities.flatMap((f) =>
    f.inventory.filter((i) => i.daysRemaining < 3).map((i) => ({ ...i, facilityName: f.name }))
  );

  // Transfer approval handler
  const handleApproveTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((tr) => {
        if (tr.id === transferId) {
          if (tr.status === 'PROPOSED') {
            return { ...tr, status: 'IN_TRANSIT', approvedAt: new Date().toLocaleTimeString() };
          }
          if (tr.status === 'IN_TRANSIT') {
            // Apply stock change to target
            setFacilities((fPrev) =>
              fPrev.map((fac) => {
                if (fac.name === tr.targetFacility) {
                  return {
                    ...fac,
                    status: fac.status === 'critical' ? 'warning' : fac.status,
                    inventory: fac.inventory.map((inv) => {
                      if (inv.name.includes(tr.medicine) || tr.medicine.includes(inv.name)) {
                        const newStock = inv.currentStock + tr.transferQuantity;
                        const newDays = Number((newStock / inv.dailyBurnRate).toFixed(1));
                        return { ...inv, currentStock: newStock, daysRemaining: newDays };
                      }
                      return inv;
                    }),
                  };
                }
                return fac;
              })
            );
            return { ...tr, status: 'DELIVERED' };
          }
        }
        return tr;
      })
    );
  };

  // Facility update handler
  const handleUpdateFacility = (facilityId: string, updates: Partial<HealthFacility>) => {
    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, ...updates } : f))
    );
  };

  // SOS Requisition trigger
  const handleTriggerSOS = (facilityName: string, medicine: string, quantity: number) => {
    const hub = facilities.find((f) => f.type === 'DISTRICT_HOSPITAL') || facilities[0];
    const newReq: TransferRequisition = {
      id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
      medicine,
      sourceFacility: hub.name,
      sourceCurrentStock: 8000,
      sourceDaysRemaining: 40,
      targetFacility: facilityName,
      targetCurrentStock: 10,
      targetDaysRemaining: 0.8,
      transferQuantity: quantity,
      distanceKm: 22,
      estimatedTransitMinutes: 30,
      urgency: 'CRITICAL',
      rationale: `Emergency SOS Requisition dispatched directly from Central Medical Warehouse buffer.`,
      status: 'IN_TRANSIT',
    };
    setTransfers((prev) => [newReq, ...prev]);
  };

  // Initiate transfer from inventory row
  const handleInitiateTransferFromInventory = (medicineName: string, targetCenterName: string) => {
    setCurrentTab('redistribute');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        onLanguageChange={setLanguage}
        role={role}
        onRoleChange={setRole}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAssistantModal={() => setIsAssistantModalOpen(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* District Status Announcement Banner / Under-resourced flag */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  {t.underperformingCenters}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  {criticalCenters.length} Centers Flagged for CMO Direct Intervention
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                <strong>CHC Kotdwar</strong> (&lt;48h antibiotic stock, 100% emergency bed saturation, unexcused doctor absenteeism) and{' '}
                <strong>PHC Sultanpur</strong> (vaccine cold-chain breach 9.4°C, +68% diarrhea/fever surge).
              </p>
            </div>
          </div>

          {/* Live telemetry toggle */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setIsLiveSimulating(!isLiveSimulating)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                isLiveSimulating
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveSimulating ? 'text-teal-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{isLiveSimulating ? 'Live Telemetry Stream Active' : 'Start Simulated Live Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* 4 Quantitative District KPI Strips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>{t.totalFacilities}</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {totalCenters}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({criticalCenters.length} Critical)
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">1 Hospital · 3 CHCs · 4 PHCs</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>{t.stockoutRisks}</span>
              <Package className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">
              {allDepletedDrugs.length} Batches
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1">Under 72 hours inventory</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>{t.bedOccupancy}</span>
              <Bed className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {bedRate}%{' '}
              <span className="text-xs font-normal text-slate-500">
                ({occupiedBeds}/{totalBeds})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">2 Centers at 100% capacity</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>{t.doctorAttendance}</span>
              <Users className="w-3.5 h-3.5 text-teal-700" />
            </div>
            <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
              {docAttendanceRate}%{' '}
              <span className="text-xs font-normal text-slate-500">
                ({totalPresentDocs}/{totalSanctionedDocs})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Biometrically logged today</div>
          </div>
        </div>

        {/* Tab Views */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* CMO AI Situational Briefing */}
            <CMOBriefingCard
              briefing={cmoBriefing}
              onUpdateBriefing={setCmoBriefing}
              facilities={facilities}
              language={language}
            />

            {/* Interactive District Map & Node Inspector */}
            <DistrictMap
              facilities={facilities}
              selectedFacilityId={selectedFacility?.id}
              onSelectFacility={(fac) => {
                setSelectedFacility(fac);
              }}
              transfers={transfers}
              language={language}
            />

            {/* Pending Transfers Quick Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    High Priority Supply Rebalancing Pipeline
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Recommended lateral transfers to prevent zero-stock crises
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('redistribute')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <span>Open Full Redistribution Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {transfers.slice(0, 2).map((tr) => (
                  <div
                    key={tr.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pb-1.5 border-b border-slate-200">
                        <span>{tr.medicine}</span>
                        <span className="text-rose-700 font-bold">{tr.urgency}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
                        <span>{tr.sourceFacility} (Surplus)</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
                        <span className="font-semibold text-rose-900">{tr.targetFacility}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                        {tr.transferQuantity} Units · {tr.distanceKm} km · ~{tr.estimatedTransitMinutes} mins transit
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Status: {tr.status}</span>
                      {tr.status === 'PROPOSED' && (
                        <button
                          onClick={() => handleApproveTransfer(tr.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors shadow-2xs"
                        >
                          Approve &amp; Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            facilities={facilities}
            language={language}
            onInitiateTransfer={handleInitiateTransferFromInventory}
          />
        )}

        {currentTab === 'redistribute' && (
          <RedistributionEngine
            transfers={transfers}
            facilities={facilities}
            language={language}
            onApproveTransfer={handleApproveTransfer}
            onAddTransfer={(newTr) => setTransfers((prev) => [newTr, ...prev])}
          />
        )}

        {currentTab === 'footfall' && (
          <FootfallForecastView facilities={facilities} language={language} />
        )}

        {currentTab === 'beds' && (
          <BedCapacityView facilities={facilities} language={language} />
        )}

        {currentTab === 'staff' && (
          <StaffAttendanceView facilities={facilities} language={language} />
        )}

        {currentTab === 'diagnostics' && (
          <DiagnosticsAuditView facilities={facilities} language={language} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SwasthyaGrid Public Health &amp; Supply Chain Infrastructure · Devbhoomi District Grid
          </div>
          <div className="flex items-center gap-3">
            <span>Integrated with Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>IPHS &amp; WHO Guidelines Compliant</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isAuditModalOpen && (
        <FieldUpdateModal
          facilities={facilities}
          language={language}
          onClose={() => setIsAuditModalOpen(false)}
          onUpdateFacility={handleUpdateFacility}
          onTriggerSOS={handleTriggerSOS}
        />
      )}

      {isAssistantModalOpen && (
        <AuditAssistantModal
          facilities={facilities}
          language={language}
          onClose={() => setIsAssistantModalOpen(false)}
        />
      )}

      {isReportModalOpen && (
        <ReportExportModal
          facilities={facilities}
          transfers={transfers}
          language={language}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}
