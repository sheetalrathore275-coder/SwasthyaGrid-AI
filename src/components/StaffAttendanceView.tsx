import React, { useState } from 'react';
import { HealthFacility, Language, StaffMember } from '../types';
import { translations } from '../locales/translations';
import { UserCheck, AlertOctagon, Clock, Send, ShieldAlert, Phone, CheckCircle } from 'lucide-react';

interface StaffAttendanceViewProps {
  facilities: HealthFacility[];
  language: Language;
}

export const StaffAttendanceView: React.FC<StaffAttendanceViewProps> = ({
  facilities,
  language,
}) => {
  const t = translations[language];
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'absent' | 'on-duty' | 'specialist'>('all');
  const [notifiedStaffIds, setNotifiedStaffIds] = useState<string[]>([]);

  // Flatten all staff with facility context
  const allStaff: Array<StaffMember & { facilityName: string; facilityId: string }> = [];
  facilities.forEach((fac) => {
    fac.doctors.staff.forEach((st) => {
      allStaff.push({
        ...st,
        facilityName: fac.name,
        facilityId: fac.id,
      });
    });
  });

  const totalSanctioned = facilities.reduce((acc, f) => acc + f.doctors.sanctioned, 0);
  const totalPresent = facilities.reduce((acc, f) => acc + f.doctors.present, 0);
  const totalAbsent = totalSanctioned - totalPresent;
  const attendanceRate = Math.round((totalPresent / totalSanctioned) * 100);

  // Filter staff
  const filteredStaff = allStaff.filter((st) => {
    const matchesCenter = selectedCenterId === 'all' || st.facilityId === selectedCenterId;
    if (!matchesCenter) return false;
    if (statusFilter === 'absent') return st.status === 'absent' || st.status === 'leave';
    if (statusFilter === 'on-duty') return st.status === 'on-duty';
    if (statusFilter === 'specialist') return st.isSpecialist;
    return true;
  });

  const handleSendNotice = (staffId: string) => {
    setNotifiedStaffIds((prev) => [...prev, staffId]);
  };

  return (
    <div className="space-y-6">
      {/* Attendance Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.sanctionedPosts}</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalSanctioned}</div>
          <div className="text-xs text-slate-500 mt-1">{t.sanctionedEstablishment}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.physiciansClockedIn}</div>
          <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
            {totalPresent} <span className="text-xs text-slate-500 font-normal">({attendanceRate}%)</span>
          </div>
          <div className="text-xs text-teal-700 font-medium mt-1">{t.biometricVerified}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.unexcusedAbsent}</div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums mt-1">{totalAbsent} {t.statusAbsent}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">{t.actionableRules}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">{t.specialistDeficitFlags}</div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums mt-1">2 {t.totalFacilities}</div>
          <div className="text-xs text-slate-500 mt-1">CHC Kotdwar &amp; PHC Sultanpur</div>
        </div>
      </div>

      {/* Specialist Gap Warning Callout */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold block text-amber-950">
            {t.specialistCoverageFailure}
          </strong>
          <p className="text-amber-800">
            {t.specialistFailureDesc}
          </p>
        </div>
      </div>

      {/* Roster Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t.attendanceAudit}
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              {t.liveBiometricLogs}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by facility */}
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

            {/* Filter by status */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.allStaff}
              </button>
              <button
                onClick={() => setStatusFilter('absent')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'absent' ? 'bg-white text-rose-800 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.absentOnly}
              </button>
              <button
                onClick={() => setStatusFilter('specialist')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'specialist' ? 'bg-white text-teal-800 font-medium shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.specialists}
              </button>
            </div>
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t.colDoctorOfficer}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colLocation}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colDesignatedRole}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colBiometricClockIn}</th>
                <th className="py-2.5 px-4 font-semibold">{t.colAttendanceStatus}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.colAdminAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.map((staff) => {
                const isAbsent = staff.status === 'absent';
                const isLeave = staff.status === 'leave';
                const isOnCall = staff.status === 'on-call';
                const isOnDuty = staff.status === 'on-duty';
                const hasNotified = notifiedStaffIds.includes(staff.id);

                return (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{staff.phone}</span>
                        {staff.isSpecialist && (
                          <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-1 rounded ml-1">
                            {t.tagSpecialist}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Facility */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {staff.facilityName}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 text-slate-600">
                      {staff.role}
                    </td>

                    {/* Clock-In */}
                    <td className="py-3 px-4 tabular-nums">
                      {staff.biometricClockIn ? (
                        <div className="flex items-center gap-1 text-slate-900 font-medium">
                          <Clock className="w-3.5 h-3.5 text-teal-700" />
                          <span>{staff.biometricClockIn}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold text-[11px]">{t.noBiometricRecord}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          isOnDuty
                            ? 'bg-teal-100 text-teal-800'
                            : isAbsent
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : isLeave
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isOnDuty ? t.statusOnDuty : isAbsent ? t.statusAbsent : isLeave ? t.statusLeave : t.statusOnCall}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {isAbsent ? (
                        hasNotified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-teal-800 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t.noticeDispatched}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendNotice(staff.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3 h-3 text-rose-600" />
                            <span>{t.issueShowCause}</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">{t.regularDuty}</span>
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
