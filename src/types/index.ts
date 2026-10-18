export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

export type UserRole = 'cmo' | 'moic'; // CMO = District Admin, MOIC = Health Center Officer

export type FacilityType = 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL';

export type OperationalStatus = 'normal' | 'warning' | 'critical';

export interface MedicineItem {
  id: string;
  name: string;
  category: 'Antibiotic' | 'Maternal/Child' | 'Emergency' | 'Analgesic' | 'Chronic' | 'Vaccine';
  currentStock: number;
  minimumBuffer: number;
  dailyBurnRate: number;
  daysRemaining: number;
  unit: string;
  batchNo: string;
  expiryDate: string;
  coldChainRequired: boolean;
  currentTempCelsius?: number;
  tempBreach?: boolean;
}

export interface BedCategory {
  total: number;
  occupied: number;
}

export interface BedData {
  total: number;
  occupied: number;
  available: number;
  categories: {
    general: BedCategory;
    maternity: BedCategory;
    emergency: BedCategory;
    oxygen: BedCategory;
  };
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'MOIC' | 'Pediatrician' | 'Gynecologist' | 'General Duty Medical Officer' | 'Staff Nurse' | 'Pharmacist' | 'Lab Technician';
  biometricClockIn?: string;
  status: 'on-duty' | 'absent' | 'on-call' | 'leave';
  phone: string;
  isSpecialist: boolean;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'Pathology' | 'Serology' | 'Radiology' | 'Biochemistry';
  status: 'Available' | 'Reagent Out' | 'Device Down' | 'Tech Absent';
  testsConductedToday: number;
  reagentDaysLeft: number;
  avgTurnaroundMins: number;
}

export interface FacilityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  type: 'stockout' | 'surge' | 'doctor_absent' | 'bed_saturation' | 'cold_chain' | 'diagnostic_down';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: FacilityType;
  block: string;
  address: string;
  coordinates: { x: number; y: number }; // SVG map coordinates 0-100%
  distanceFromHubKm: number;
  moicName: string;
  phone: string;
  status: OperationalStatus;
  footfall: {
    today: number;
    yesterday: number;
    surgePercent: number;
    activeQueue: number;
    avgWaitTimeMins: number;
    hourlyHistory: number[]; // 10 hourly data points 08:00 - 17:00
  };
  beds: BedData;
  doctors: {
    sanctioned: number;
    present: number;
    absent: number;
    staff: StaffMember[];
  };
  inventory: MedicineItem[];
  diagnostics: DiagnosticTest[];
  alerts: FacilityAlert[];
  performanceScore: number; // 0-100 health index
}

export interface TransferRequisition {
  id: string;
  medicine: string;
  sourceFacility: string;
  sourceCurrentStock: number;
  sourceDaysRemaining: number;
  targetFacility: string;
  targetCurrentStock: number;
  targetDaysRemaining: number;
  transferQuantity: number;
  distanceKm: number;
  estimatedTransitMinutes: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rationale: string;
  status: 'PROPOSED' | 'APPROVED' | 'IN_TRANSIT' | 'DELIVERED';
  approvedAt?: string;
  vehicleAssigned?: string;
}

export interface DemandForecastData {
  facilityName: string;
  forecastDays: number;
  projectedDailyFootfall: number[];
  projectedBedSaturationDay: number;
  criticalStockOutRisks: Array<{
    item: string;
    burnRateIncrease: string;
    stockOutInDays: number;
    recommendation: string;
  }>;
  epidemiologicalDriver: string;
  confidenceScore: number;
}

export interface CMOBriefingData {
  summary: string;
  criticalCenters: string[];
  topInterventions: string[];
  epidemiologicalRisk: string;
  generatedAt: string;
}
