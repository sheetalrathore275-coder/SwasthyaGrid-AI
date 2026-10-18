import React, { useState } from 'react';
import { HealthFacility, Language, MedicineItem } from '../types';
import { translations } from '../locales/translations';
import { Search, AlertTriangle, ShieldCheck, Thermometer, Filter, ArrowUpDown } from 'lucide-react';

interface InventoryViewProps {
  facilities: HealthFacility[];
  language: Language;
  onInitiateTransfer: (medicine: string, targetFacility: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  facilities,
  language,
  onInitiateTransfer,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'days' | 'stock' | 'burn'>('days');

  // Flatten all inventory items with facility context
  const allItems: Array<MedicineItem & { facilityName: string; facilityId: string }> = [];
  facilities.forEach((fac) => {
    fac.inventory.forEach((item) => {
      allItems.push({
        ...item,
        facilityName: fac.name,
        facilityId: fac.id,
      });
    });
  });

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.facilityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFacility = selectedFacilityId === 'all' || item.facilityId === selectedFacilityId;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesFacility && matchesCategory;
  });

  // Sort items
  filteredItems.sort((a, b) => {
    if (sortBy === 'days') return a.daysRemaining - b.daysRemaining;
    if (sortBy === 'stock') return b.currentStock - a.currentStock;
    if (sortBy === 'burn') return b.dailyBurnRate - a.dailyBurnRate;
    return 0;
  });

  // Counts for Early Horizon
  const criticalCount = allItems.filter((i) => i.daysRemaining < 3).length;
  const warningCount = allItems.filter((i) => i.daysRemaining >= 3 && i.daysRemaining <= 7).length;
  const healthyCount = allItems.filter((i) => i.daysRemaining > 7).length;

  // Cold-chain breaches
  const coldChainBreaches = allItems.filter(
    (i) => i.coldChainRequired && (i.tempBreach || (i.currentTempCelsius && (i.currentTempCelsius > 8 || i.currentTempCelsius < 2)))
  );

  return (
    <div className="space-y-6">
      {/* Horizon Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.criticalStockoutHorizon}</div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">{criticalCount} {t.batches}</div>
          <div className="text-xs text-slate-500 mt-1">{t.exhaustion72h}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.replenishmentWatchlist}</div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">{warningCount} {t.batches}</div>
          <div className="text-xs text-slate-500 mt-1">{t.inventory3to7d}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.stableBufferReserve}</div>
          <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">{healthyCount} {t.batches}</div>
          <div className="text-xs text-slate-500 mt-1">{t.bufferOver7d}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>{t.coldChainMonitor}</span>
            <Thermometer className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className={`text-2xl font-bold tabular-nums mt-1 ${coldChainBreaches.length > 0 ? 'text-rose-700' : 'text-teal-800'}`}>
            {coldChainBreaches.length > 0 ? `${coldChainBreaches.length} ${t.breachAlert}` : t.compliant100}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {coldChainBreaches.length > 0 ? t.sultanpurBreach : t.allTelemetryNormal}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Facility Filter */}
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="all">{t.allDistrictCenters}</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="all">{t.allCategories}</option>
              <option value="Antibiotic">{t.catAntibiotics}</option>
              <option value="Emergency">{t.catEmergency}</option>
              <option value="Maternal/Child">{t.catMaternal}</option>
              <option value="Vaccine">{t.catVaccines}</option>
              <option value="Analgesic">{t.catAnalgesics}</option>
            </select>

            {/* Sort Switcher */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-600">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>{t.sort}</span>
              <button
                onClick={() => setSortBy('days')}
                className={`px-1 font-medium ${sortBy === 'days' ? 'text-teal-700' : 'hover:text-slate-900'}`}
              >
                {t.daysLeft}
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSortBy('stock')}
                className={`px-1 font-medium ${sortBy === 'stock' ? 'text-teal-700' : 'hover:text-slate-900'}`}
              >
                {t.stock}
              </button>
            </div>
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t.colMedicineBatch}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colLocation}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colCategory}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colCurrentStock}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colDailyBurn}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colDaysLeft}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colColdChain}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {t.noInventoryMatch}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isCritical = item.daysRemaining < 3;
                  const isWarning = item.daysRemaining >= 3 && item.daysRemaining <= 7;

                  return (
                    <tr
                      key={`${item.facilityId}-${item.id}-${idx}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Name & Batch */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{t.batch} {item.batchNo}</span>
                          <span aria-hidden="true">·</span>
                          <span>{t.exp} {item.expiryDate}</span>
                        </div>
                      </td>

                      {/* Center */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.facilityName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        {item.category === 'Antibiotic' ? t.catAntibiotics :
                         item.category === 'Emergency' ? t.catEmergency :
                         item.category === 'Maternal/Child' ? t.catMaternal :
                         item.category === 'Vaccine' ? t.catVaccines :
                         item.category === 'Analgesic' ? t.catAnalgesics : item.category}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-semibold text-slate-900">{item.currentStock.toLocaleString()}</span>{' '}
                        <span className="text-[11px] text-slate-500">{item.unit}</span>
                        <div className="text-[10px] text-slate-400">{t.minBuffer} {item.minimumBuffer.toLocaleString()}</div>
                      </td>

                      {/* Burn */}
                      <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                        {item.dailyBurnRate} {item.unit}/day
                      </td>

                      {/* Days Left with Bar */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-bold ${
                              isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-teal-800'
                            }`}
                          >
                            {item.daysRemaining.toFixed(1)} {t.days}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-20 ml-auto h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${Math.min(100, (item.daysRemaining / 30) * 100)}%` }}
                          />
                        </div>
                      </td>

                      {/* Cold Chain Status */}
                      <td className="py-3 px-4">
                        {item.coldChainRequired ? (
                          <div className="flex items-center gap-1.5">
                            <Thermometer
                              className={`w-3.5 h-3.5 ${
                                item.tempBreach ? 'text-rose-600' : 'text-teal-700'
                              }`}
                            />
                            <span
                              className={`tabular-nums font-medium ${
                                item.tempBreach ? 'text-rose-700 font-semibold' : 'text-slate-700'
                              }`}
                            >
                              {item.currentTempCelsius?.toFixed(1)}°C
                            </span>
                            {item.tempBreach && (
                              <span className="text-[10px] text-rose-600 font-bold ml-1">
                                [BREACH &gt;8°C]
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{t.roomTemp}</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isCritical ? (
                          <button
                            onClick={() => onInitiateTransfer(item.name, item.facilityName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors whitespace-nowrap"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{t.btnRequisition}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onInitiateTransfer(item.name, item.facilityName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                          >
                            <span>{t.btnLateralShare}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
