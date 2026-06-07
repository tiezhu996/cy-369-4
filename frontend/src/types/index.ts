export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}

export type CampsiteStatus = "available" | "occupied" | "maintenance";
export type CampsiteType = "tent" | "rv" | "cabin";

export interface Campsite {
  id: string;
  name: string;
  type: CampsiteType;
  area: number;
  facilities: string[];
  basePrice: number;
  imageUrl: string;
}

export interface Booking {
  id: string;
  campsiteId: string;
  customerName: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled";
}

export interface MaintenanceRecord {
  id: string;
  campsiteId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "scheduled" | "in_progress" | "completed";
}

export interface DayCampsiteStatus {
  campsiteId: string;
  campsiteName: string;
  status: CampsiteStatus;
  bookingId?: string;
  customerName?: string;
  maintenanceId?: string;
  maintenanceReason?: string;
}
