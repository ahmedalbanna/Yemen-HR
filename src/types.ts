export type Governorate = 
  | 'صنعاء' | 'عدن' | 'تعز' | 'حضرموت' | 'الحديدة' | 'إب' | 'أبين' | 'البيضاء' | 'لحج' 
  | 'مأرب' | 'المهرة' | 'عمران' | 'صعدة' | 'حجة' | 'ذمار' | 'شبوة' | 'المحويت' | 'ريمة' | 'الجوف' | 'سقطرى' | 'الضالع';

export interface Employee {
  id: string;
  name: string;
  nationalId: string;
  governorate: Governorate;
  hireDate: string;
  salary: number;
  position: string;
  department: string;
  status: 'active' | 'on_leave' | 'terminated';
  leaveBalance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'annual' | 'sick' | 'unpaid' | 'special';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  days: number;
}

export interface YemenLaborLawConfig {
  annualLeaveDays: number; // usually 30 in Yemen
  eosFirstXYears: number; // 5 years usually
  eosFirstXRate: number; // 0.5 month per year
  eosAfterXRate: number; // 1 month per year
}

export const DEFAULT_YEMEN_LAW: YemenLaborLawConfig = {
  annualLeaveDays: 30,
  eosFirstXYears: 5,
  eosFirstXRate: 0.5,
  eosAfterXRate: 1.0,
};
