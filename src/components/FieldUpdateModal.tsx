import React, { useState } from 'react';
import { HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { X, CheckCircle, PlusCircle, AlertTriangle, Truck } from 'lucide-react';

interface FieldUpdateModalProps {
  facilities: HealthFacility[];
  language: Language;
  onClose: () => void;
  onUpdateFacility: (facilityId: string, updates: Partial<HealthFacility>) => void;
  onTriggerSOS: (facilityName: string, medicine: string, quantity: number) => void;
}

export const FieldUpdateModal: React.FC<FieldUpdateModalProps> = ({
  facilities,
  language,
  onClose,
  onUpdateFacility,
  onTriggerSOS,
}) => {
  const t = translations[language];
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[1]?.id || facilities[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'daily_log' | 'sos_request'>('daily_log');

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  // Daily log state
  const [opdFootfall, setOpdFootfall] = useState(selectedFacility?.footfall.today || 120);
  const [activeQueue, setActiveQueue] = useState(selectedFacility?.footfall.activeQueue || 15);
  const [occupiedBeds, setOccupiedBeds] = useState(selectedFacility?.beds.occupied || 5);
  const [doctorsPresent, setDoctorsPresent] = useState(selectedFacility?.doctors.present || 2);
  const [dispensedDrug, setDispensedDrug] = useState('Amoxicillin 500mg Capsules');
  const [dispensedUnits, setDispensedUnits] = useState(40);
  const [statusMessage, setStatusMessage] = useState('');

  // SOS state
  const [sosDrug, setSosDrug] = useState('Amoxicillin 500mg Capsules');
  const [sosQty, setSosQty] = useState(500);
  const [sosUrgency, setSosUrgency] = useState<'CRITICAL' | 'HIGH'>('CRITICAL');

  const handleFacilityChange = (id: string) => {
    setSelectedFacilityId(id);
    const fac = facilities.find((f) => f.id === id);
    if (fac) {
      setOpdFootfall(fac.footfall.today);
      setActiveQueue(fac.footfall.activeQueue);
      setOccupiedBeds(fac.beds.occupied);
      setDoctorsPresent(fac.doctors.present);
    }
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    // Apply updates to facility
    const updatedInventory = selectedFacility.inventory.map((item) => {
      if (item.name.includes(dispensedDrug)) {
        const newStock = Math.max(0, item.currentStock - dispensedUnits);
        const newDays = item.dailyBurnRate > 0 ? Number((newStock / item.dailyBurnRate).toFixed(1)) : item.daysRemaining;
        return {
          ...item,
          currentStock: newStock,
          daysRemaining: newDays,
        };
      }
      return item;
    });

    onUpdateFacility(selectedFacility.id, {
      footfall: {
        ...selectedFacility.footfall,
        today: Number(opdFootfall),
        activeQueue: Number(activeQueue),
      },
      beds: {
        ...selectedFacility.beds,
        occupied: Number(occupiedBeds),
        available: selectedFacility.beds.total - Number(occupiedBeds),
      },
      doctors: {
        ...selectedFacility.doctors,
        present: Number(doctorsPresent),
        absent: selectedFacility.doctors.sanctioned - Number(doctorsPresent),
      },
      inventory: updatedInventory,
    });

    setStatusMessage(t.rebalanceCompleted);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSendSOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    onTriggerSOS(selectedFacility.name, sosDrug, Number(sosQty));
    setStatusMessage(`${t.btnTransmitSos}: ${sosDrug} (${sosQty} units)`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t.fieldModalTitle}
            </h3>
            <div className="text-xs text-slate-500">
              {t.fieldModalSub}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facility Selector */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.reportingFacility}
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => handleFacilityChange(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-1 focus:ring-teal-700 focus:outline-none"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.type} · {fac.block})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('daily_log')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'daily_log'
                ? 'border-teal-700 text-teal-800 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 bg-slate-50'
            }`}
          >
            {t.tabDailyLog}
          </button>
          <button
            onClick={() => setActiveTab('sos_request')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'sos_request'
                ? 'border-rose-700 text-rose-800 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 bg-slate-50'
            }`}
          >
            {t.tabEmergencySos}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {statusMessage ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-md text-center text-xs text-teal-900">
              <CheckCircle className="w-8 h-8 text-teal-700 mx-auto mb-2" />
              <p className="font-semibold">{statusMessage}</p>
            </div>
          ) : activeTab === 'daily_log' ? (
            <form onSubmit={handleSaveDailyLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.lblOpdToday}</label>
                  <input
                    type="number"
                    min="0"
                    value={opdFootfall}
                    onChange={(e) => setOpdFootfall(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 tabular-nums focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.lblActiveQueue}</label>
                  <input
                    type="number"
                    min="0"
                    value={activeQueue}
                    onChange={(e) => setActiveQueue(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 tabular-nums focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.lblBedsOccupied} (Total: {selectedFacility?.beds.total})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedFacility?.beds.total}
                    value={occupiedBeds}
                    onChange={(e) => setOccupiedBeds(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 tabular-nums focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.lblDoctorsOnDuty} (Sanctioned: {selectedFacility?.doctors.sanctioned})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedFacility?.doctors.sanctioned}
                    value={doctorsPresent}
                    onChange={(e) => setDoctorsPresent(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 tabular-nums focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <div className="font-semibold text-slate-800">{t.logMedicineDispensation}</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={dispensedDrug}
                    onChange={(e) => setDispensedDrug(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 text-[11px]"
                  >
                    <option value="Amoxicillin 500mg">Amoxicillin 500mg</option>
                    <option value="Paracetamol 500mg">Paracetamol 500mg</option>
                    <option value="ORS Electrolyte">ORS Electrolyte</option>
                    <option value="Rabies Vaccine">Rabies Vaccine (ARV)</option>
                    <option value="Oxytocin Injection">Oxytocin Injection</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder={t.placeholderUnits}
                    value={dispensedUnits}
                    onChange={(e) => setDispensedUnits(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-[11px] tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-medium"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded shadow-xs"
                >
                  {t.btnSyncDailyReturn}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendSOS} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 leading-snug">
                {t.emergencyChannelNotice}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.lblCriticallyDepleted}</label>
                <select
                  value={sosDrug}
                  onChange={(e) => setSosDrug(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-rose-700 focus:outline-none"
                >
                  <option value="Amoxicillin 500mg Capsules">Amoxicillin 500mg Capsules</option>
                  <option value="Paracetamol 500mg Tablets">Paracetamol 500mg Tablets</option>
                  <option value="ORS Electrolyte Sachets">ORS Electrolyte Sachets</option>
                  <option value="Rabies Vaccine (ARV) 0.5ml">Rabies Vaccine (ARV) 0.5ml</option>
                  <option value="Oxytocin Injection 5 IU/ml">Oxytocin Injection 5 IU/ml</option>
                  <option value="Dengue NS1 Ag Rapid Test Kits">Dengue NS1 Ag Rapid Test Kits</option>
                  <option value="Anti-Snake Venom (ASV)">Anti-Snake Venom (ASV)</option>
                  <option value="IV Normal Saline 500ml">IV Normal Saline 500ml</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.lblEmergencyUnits}</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={sosQty}
                    onChange={(e) => setSosQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 tabular-nums focus:ring-1 focus:ring-rose-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.lblPriorityClassification}</label>
                  <select
                    value={sosUrgency}
                    onChange={(e) => setSosUrgency(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-rose-800 focus:ring-1 focus:ring-rose-700 focus:outline-none"
                  >
                    <option value="CRITICAL">{t.optCritical24h}</option>
                    <option value="HIGH">{t.optHigh48h}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-medium"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{t.btnTransmitSos}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
