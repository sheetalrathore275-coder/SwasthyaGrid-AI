import React, { useState } from 'react';
import { HealthFacility, Language, TransferRequisition } from '../types';
import { translations } from '../locales/translations';
import { Truck, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, Clock, FileCheck, Plus, RefreshCw } from 'lucide-react';

interface RedistributionEngineProps {
  transfers: TransferRequisition[];
  facilities: HealthFacility[];
  language: Language;
  onApproveTransfer: (transferId: string) => void;
  onAddTransfer: (newTransfer: TransferRequisition) => void;
}

export const RedistributionEngine: React.FC<RedistributionEngineProps> = ({
  transfers,
  facilities,
  language,
  onApproveTransfer,
  onAddTransfer,
}) => {
  const t = translations[language];
  const [showManualModal, setShowManualModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PROPOSED' | 'IN_TRANSIT' | 'DELIVERED'>('all');

  // Manual Transfer Form State
  const [sourceFac, setSourceFac] = useState(facilities[0]?.name || '');
  const [targetFac, setTargetFac] = useState(facilities[1]?.name || '');
  const [selectedMedicine, setSelectedMedicine] = useState('Amoxicillin 500mg Capsules');
  const [qty, setQty] = useState(300);

  const filteredTransfers = transfers.filter((tr) => {
    if (filterStatus === 'all') return true;
    return tr.status === filterStatus;
  });

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceFac || !targetFac || sourceFac === targetFac) return;

    const sourceObj = facilities.find((f) => f.name === sourceFac);
    const targetObj = facilities.find((f) => f.name === targetFac);
    const distance = Math.round(
      Math.abs((sourceObj?.coordinates.x || 50) - (targetObj?.coordinates.x || 50)) +
      Math.abs((sourceObj?.coordinates.y || 50) - (targetObj?.coordinates.y || 50))
    );

    const newTransfer: TransferRequisition = {
      id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
      medicine: selectedMedicine,
      sourceFacility: sourceFac,
      sourceCurrentStock: 1800,
      sourceDaysRemaining: 32,
      targetFacility: targetFac,
      targetCurrentStock: 140,
      targetDaysRemaining: 2.1,
      transferQuantity: Number(qty),
      distanceKm: Math.max(8, distance),
      estimatedTransitMinutes: Math.round(Math.max(8, distance) * 1.6),
      urgency: 'HIGH',
      rationale: `Manual lateral requisition approved to alleviate surge at ${targetFac}.`,
      status: 'PROPOSED',
    };

    onAddTransfer(newTransfer);
    setShowManualModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Benefit Statement */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              {t.redistributionEngine}
            </h2>
            <span className="text-xs text-teal-800 font-medium inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-700" />
              {t.spatialBalancing}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {t.redistributionDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.btnNewRequisition}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabAllRecommendations} ({transfers.length})
          </button>
          <button
            onClick={() => setFilterStatus('PROPOSED')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === 'PROPOSED' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabAwaitingSanction} ({transfers.filter((t) => t.status === 'PROPOSED').length})
          </button>
          <button
            onClick={() => setFilterStatus('IN_TRANSIT')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === 'IN_TRANSIT' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabActiveInTransit} ({transfers.filter((t) => t.status === 'IN_TRANSIT').length})
          </button>
          <button
            onClick={() => setFilterStatus('DELIVERED')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              filterStatus === 'DELIVERED' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabCompletedTransits} ({transfers.filter((t) => t.status === 'DELIVERED').length})
          </button>
        </div>
      </div>

      {/* Requisitions Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTransfers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-xs">
            {t.noTransfersMatch}
          </div>
        ) : (
          filteredTransfers.map((tr) => {
            const isProposed = tr.status === 'PROPOSED';
            const isInTransit = tr.status === 'IN_TRANSIT';
            const isDelivered = tr.status === 'DELIVERED';

            return (
              <div
                key={tr.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{tr.id}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-800">{tr.medicine}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span
                      className={`text-[11px] font-bold ${
                        tr.urgency === 'CRITICAL'
                          ? 'text-rose-700'
                          : tr.urgency === 'HIGH'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {tr.urgency}
                    </span>
                  </div>

                  {/* Order Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                        isProposed
                          ? 'bg-amber-100 text-amber-800'
                          : isInTransit
                          ? 'bg-sky-100 text-sky-800 animate-pulse'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {isProposed ? t.tabAwaitingSanction : isInTransit ? t.tabActiveInTransit : t.tabCompletedTransits}
                    </span>
                  </div>
                </div>

                {/* Transfer Corridor Visualization */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Source Node */}
                  <div className="md:col-span-4 bg-slate-50 p-3 rounded-md border border-slate-200">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      {t.sourceHub}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{tr.sourceFacility}</div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                      <span>{t.stock}: <strong className="tabular-nums">{tr.sourceCurrentStock.toLocaleString()}</strong></span>
                      <span className="text-teal-700 font-medium tabular-nums">{tr.sourceDaysRemaining} {t.days}</span>
                    </div>
                  </div>

                  {/* Transit Corridor Metrics */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2">
                    <div className="text-xs font-bold text-teal-800 tabular-nums">
                      {t.transferQuantity} {tr.transferQuantity.toLocaleString()}
                    </div>
                    <div className="w-full flex items-center gap-2 my-1.5 text-slate-400">
                      <div className="h-0.5 flex-1 bg-teal-600/40" />
                      <Truck className={`w-4 h-4 text-teal-700 ${isInTransit ? 'animate-bounce' : ''}`} />
                      <div className="h-0.5 flex-1 bg-teal-600/40" />
                      <ArrowRight className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 tabular-nums">
                      <span>{tr.distanceKm} km</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{tr.estimatedTransitMinutes} {t.mins}</span>
                      </span>
                    </div>
                  </div>

                  {/* Destination Node */}
                  <div className="md:col-span-4 bg-rose-50/60 p-3 rounded-md border border-rose-200">
                    <div className="text-[11px] text-rose-700 uppercase tracking-wider font-semibold">
                      {t.destinationHub}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{tr.targetFacility}</div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                      <span>{t.stock}: <strong className="tabular-nums text-rose-800">{tr.targetCurrentStock}</strong></span>
                      <span className="text-rose-700 font-bold tabular-nums">{tr.targetDaysRemaining} {t.days}</span>
                    </div>
                  </div>
                </div>

                {/* Rationale and Execution Actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 flex items-start gap-1.5 max-w-2xl">
                    <ShieldAlert className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <span>{tr.rationale}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {isProposed && (
                      <button
                        onClick={() => onApproveTransfer(tr.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.actionApproveTransfer}</span>
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        onClick={() => onApproveTransfer(tr.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.actionConfirmDelivery}</span>
                      </button>
                    )}

                    {isDelivered && (
                      <div className="inline-flex items-center gap-1 text-xs text-teal-800 font-medium">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{t.rebalanceCompleted}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Lateral Rebalance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              {t.modalCreateRequisition}
            </h3>
            <form onSubmit={handleCreateManual} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.lblSourceCenter}</label>
                <select
                  value={sourceFac}
                  onChange={(e) => setSourceFac(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name} ({fac.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.lblTargetCenter}</label>
                <select
                  value={targetFac}
                  onChange={(e) => setTargetFac(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name} ({fac.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.lblMedicineReagent}</label>
                <select
                  value={selectedMedicine}
                  onChange={(e) => setSelectedMedicine(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                >
                  <option value="Amoxicillin 500mg Capsules">Amoxicillin 500mg Capsules</option>
                  <option value="Paracetamol 500mg Tablets">Paracetamol 500mg Tablets</option>
                  <option value="ORS Electrolyte Sachets">ORS Electrolyte Sachets</option>
                  <option value="Rabies Vaccine (ARV) 0.5ml">Rabies Vaccine (ARV) 0.5ml</option>
                  <option value="Oxytocin Injection 5 IU/ml">Oxytocin Injection 5 IU/ml</option>
                  <option value="Dengue NS1 Ag Rapid Test Kits">Dengue NS1 Ag Rapid Test Kits</option>
                  <option value="Anti-Snake Venom (ASV)">Anti-Snake Venom (ASV)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.lblDispatchQty}</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-medium"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
                >
                  {t.btnSanctionTransfer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
