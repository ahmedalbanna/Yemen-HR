import { Employee, LeaveRequest } from '../types';

export const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    name: 'أحمد صالح اليافعي',
    nationalId: '1029384756',
    governorate: 'حضرموت',
    hireDate: '2018-03-15',
    salary: 150000,
    position: 'مدير العمليات',
    department: 'الإدارة',
    status: 'active',
    leaveBalance: 22,
  },
  {
    id: 'EMP002',
    name: 'فاطمة حسن علي',
    nationalId: '1928374650',
    governorate: 'صنعاء',
    hireDate: '2020-06-01',
    salary: 120000,
    position: 'محاسب أول',
    department: 'المالية',
    status: 'active',
    leaveBalance: 15,
  },
  {
    id: 'EMP003',
    name: 'محمد عبدالله باوزير',
    nationalId: '2134567890',
    governorate: 'عدن',
    hireDate: '2015-11-10',
    salary: 200000,
    position: 'مهندس نظم',
    department: 'تقنية المعلومات',
    status: 'on_leave',
    leaveBalance: 8,
  },
  {
    id: 'EMP004',
    name: 'سارة عبدالرحمن',
    nationalId: '3241567809',
    governorate: 'تعز',
    hireDate: '2022-01-20',
    salary: 85000,
    position: 'أخصائي موارد بشرية',
    department: 'الموارد البشرية',
    status: 'active',
    leaveBalance: 25,
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR001',
    employeeId: 'EMP003',
    employeeName: 'محمد عبدالله باوزير',
    startDate: '2024-04-20',
    endDate: '2024-04-25',
    type: 'annual',
    status: 'approved',
    reason: 'إجازة عائلية',
    days: 5,
  },
  {
    id: 'LR002',
    employeeId: 'EMP001',
    employeeName: 'أحمد صالح اليافعي',
    startDate: '2024-05-01',
    endDate: '2024-05-03',
    type: 'annual',
    status: 'pending',
    reason: 'سفر داخلي',
    days: 3,
  }
];
