import React, { useState, useEffect } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Calculator, 
  CalendarClock, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  UserCheck,
  PlaneTakeoff,
  Award,
  Wallet,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Employee, LeaveRequest, Governorate } from './types';
import { format, differenceInYears, differenceInMonths, differenceInDays, addYears, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { auth, db, googleProvider, handleFirestoreError } from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc,
  setDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';

type View = 'dashboard' | 'employees' | 'eos' | 'leaves' | 'reports';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if Admin
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else if (currentUser.email === 'ahmedalbanna966@gmail.com') {
          // Bootstrap Admin
          await setDoc(doc(db, 'admins', currentUser.uid), {
            email: currentUser.email,
            role: 'admin'
          });
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) return;

    const employeesQuery = isAdmin 
      ? collection(db, 'employees') 
      : query(collection(db, 'employees'), where('createdBy', '==', user.uid));

    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(data);
    }, (err) => console.error("Employee list error:", err));

    const leavesQuery = isAdmin 
      ? collection(db, 'leave_requests') 
      : query(collection(db, 'leave_requests'), where('requestedBy', '==', user.uid));

    const unsubLeaves = onSnapshot(leavesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      setLeaveRequests(data);
    }, (err) => console.error("Leaves list error:", err));

    return () => {
      unsubEmployees();
      unsubLeaves();
    };
  }, [user, isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleAddEmployee = async () => {
    if (!user || !isAdmin) return;
    try {
      const newEmp = {
        name: 'موظف جديد',
        nationalId: Math.floor(Math.random() * 1000000000).toString(),
        governorate: 'صنعاء' as Governorate,
        hireDate: new Date().toISOString().split('T')[0],
        salary: 100000,
        position: 'متدرب',
        department: 'التشغيل',
        status: 'active' as const,
        leaveBalance: 30,
        createdBy: user.uid,
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'employees'), newEmp);
    } catch (error) {
      handleFirestoreError(error, 'create', 'employees');
    }
  };

  const handleLogout = () => signOut(auth);

  const handleRequestLeave = async (employee: Employee) => {
    if (!user) return;
    try {
      const request = {
        employeeId: employee.id,
        employeeName: employee.name,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        type: 'annual' as const,
        status: 'pending' as const,
        reason: 'طلب إجازة تجريبي',
        days: 1,
        requestedBy: user.uid,
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'leave_requests'), request);
    } catch (error) {
      handleFirestoreError(error, 'create', 'leave_requests');
    }
  };

  // EOS Calculation Helper
  const calculateEOS = (employee: Employee) => {
    const start = parseISO(employee.hireDate);
    const end = new Date(); // Assume today for active, or use termination date
    
    const years = differenceInYears(end, start);
    const remainingMonths = differenceInMonths(end, addYears(start, years));
    const totalDays = differenceInDays(end, start);
    
    let eosAmount = 0;
    
    // Yemeni Standard Logic (often): 
    // - 0.5 month per year for first 5 years
    // - 1 month per year thereafter
    // OR 1 month per year flat (very common)
    // We will implement the common 1 month per year calculation
    
    const decimalYears = totalDays / 365.25;
    eosAmount = decimalYears * employee.salary;

    return {
      amount: Math.round(eosAmount),
      totalYears: years,
      totalMonths: remainingMonths
    };
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold tracking-tight">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans px-4" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 whitespace-nowrap">يمن <span className="text-indigo-600">HR</span> & الامتثال</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">سجل الدخول لإدارة القوى العاملة، حساب مستحقات نهاية الخدمة، ومراقبة الامتثال للقوانين المحلية.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            الدخول عبر جوجل
          </button>
          
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">نظام محمي وفق معايير الامتثال اليمنية</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white" dir="rtl">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-l border-slate-200 h-full flex flex-col z-20 shadow-sm overflow-hidden"
      >
        <div className="h-16 p-6 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold shrink-0">
            HR
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap text-slate-800"
            >
              نظام إدارة الموارد
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto pt-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
            { id: 'employees', icon: Users, label: 'الموظفين' },
            { id: 'leaves', icon: PlaneTakeoff, label: 'الإجازات' },
            { id: 'eos', icon: Calculator, label: 'التأمينات' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative",
                currentView === item.id 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", currentView === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
              {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="font-bold text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-500" /> : <Menu className="w-5 h-5 text-slate-500" />}
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              {currentView === 'dashboard' && 'لوحة التحكم'}
              {currentView === 'employees' && 'بيانات الموظفين'}
              {currentView === 'leaves' && 'إدارة الإجازات'}
              {currentView === 'eos' && 'حساب مستحقات نهاية الخدمة'}
              {currentView === 'reports' && 'تقارير الامتثال'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="بحث سريع..."
                className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pr-10 pl-4 w-60 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">مدير الموارد البشرية</p>
                <p className="text-sm font-bold text-slate-800">أحمد سالم</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-indigo-600">
                AS
              </div>
            </div>
          </div>
        </header>

        {/* View Port */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'إجمالي الموظفين', value: employees.length, badge: '+3 هذا الشهر', badgeColor: 'bg-emerald-50 text-emerald-600' },
                    { label: 'مخصص نهاية الخدمة (ر.ي)', value: '12,450,000', badge: 'حسب قانون العمل', badgeColor: 'bg-slate-100 text-slate-500' },
                    { label: 'رصيد إجازات مستحق', value: '1,240', sub: 'يوم', badge: 'متوسط 22 يوم/موظف', badgeColor: 'bg-indigo-50 text-indigo-600' },
                    { label: 'التزامات التأمينات', value: '98%', badge: 'تقرير المطابقة', badgeColor: 'bg-orange-50 text-orange-600 underline cursor-pointer' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all">
                      <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold tracking-tight text-slate-800">
                        {stat.value} {stat.sub && <span className="text-lg font-normal text-slate-400">{stat.sub}</span>}
                      </h3>
                      <div className={cn("mt-3 text-[10px] font-bold uppercase tracking-wider inline-block px-2 py-1 rounded", stat.badgeColor)}>
                        {stat.badge}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="font-bold text-slate-800">توزيع الرواتب والامتثال المحلي</h4>
                        <p className="text-xs text-slate-400 mt-1">بيانات الربع الحالي مقارنة بالعام الماضي</p>
                      </div>
                      <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                        <option>البيانات السنوية</option>
                        <option>البيانات الشهرية</option>
                      </select>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'المالية', val: 4000 },
                          { name: 'التقنية', val: 6500 },
                          { name: 'الموارد', val: 2400 },
                          { name: 'العمليات', val: 5800 },
                          { name: 'المبيعات', val: 3200 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#F1F5F9' }}
                          />
                          <Bar dataKey="val" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg shadow-indigo-900/10">
                      <h4 className="font-bold text-lg mb-2">محاكي مخصص الخدمة</h4>
                      <p className="text-xs text-indigo-200 mb-6 leading-relaxed">احسب مستحقات الموظف بناءً على آخر راتب وسنوات الخدمة وفق المادة (120).</p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-indigo-300 block mb-1 tracking-widest">الراتب الأساسي الأخير</label>
                          <input type="text" className="w-full bg-indigo-800/50 border border-indigo-700/50 rounded-lg p-2.5 text-sm outline-none focus:border-white/40 transition-all font-mono" defaultValue="250,000 ر.ي" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-indigo-300 block mb-1 tracking-widest">تاريخ الانتهاء</label>
                          <input type="date" className="w-full bg-indigo-800/50 border border-indigo-700/50 rounded-lg p-2.5 text-sm text-white outline-none focus:border-white/40 transition-all" defaultValue="2024-12-31" />
                        </div>
                        <button className="w-full bg-white text-indigo-900 py-3 rounded-lg font-bold text-sm shadow-xl shadow-indigo-950/20 active:scale-95 transition-all mt-4">إجراء الحساب</button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-xl flex-1 shadow-sm">
                      <h4 className="font-bold text-sm mb-4 text-slate-800">أحدث تنبيهات اللوائح</h4>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start border-r-2 border-orange-500 pr-4">
                          <div>
                            <p className="text-xs font-bold">تحديث قانون التأمينات</p>
                            <p className="text-[11px] text-slate-500">مراجعة نسب الاستقطاع للموظفين الجدد.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start border-r-2 border-indigo-500 pr-4">
                          <div>
                            <p className="text-xs font-bold">رصيد الإجازات السنوية</p>
                            <p className="text-[11px] text-slate-500">24 موظفاً سيتجاوز رصيدهم 60 يوماً.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'employees' && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">بيانات الموظفين</h3>
                    <p className="text-sm text-slate-500">إدارة الامتثال المحلي والبيانات الشخصية</p>
                  </div>
                  <button 
                    onClick={handleAddEmployee}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة موظف جديد
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 text-sm">سجلات القوى العاملة</h4>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">محدث الآن</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                          <th className="px-6 py-4">الموظف</th>
                          <th className="px-6 py-4">البطاقة الوطنية</th>
                          <th className="px-6 py-4">المحافظة</th>
                          <th className="px-6 py-4">القسم</th>
                          <th className="px-6 py-4 text-left">مكافأة الخدمة (ر.ي)</th>
                          <th className="px-6 py-4 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-50">
                        {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-700 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{emp.position}</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500 tracking-tighter">{emp.nationalId}</td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{emp.governorate}</td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-bold">{emp.department}</td>
                            <td className="px-6 py-4 text-left font-bold text-slate-800 font-mono">
                              {(emp.salary * (differenceInDays(new Date(), parseISO(emp.hireDate)) / 365.25)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                                emp.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                                emp.status === 'on_leave' ? "bg-amber-50 text-amber-600" :
                                "bg-slate-100 text-slate-400"
                              )}>
                                {emp.status === 'active' ? 'نشط' :
                                 emp.status === 'on_leave' ? 'إجازة' : 'منتهي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'eos' && (
              <motion.div 
                key="eos"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-[#F27D26]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Calculator className="w-10 h-10 text-[#F27D26]" />
                  </div>
                  <h3 className="text-3xl font-black">حاسبة مستحقات نهاية الخدمة</h3>
                  <p className="text-[#141414]/60 max-w-lg mx-auto leading-relaxed">
                    يتم احتساب مستحقات الموظف بناءً على قانون العمل اليمني: راتب شهر عن كل سنة خدمة (أو حسب نظام الشركة الداخلي المعتمد).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-xl space-y-6">
                    <h4 className="font-bold text-lg border-b border-[#141414]/5 pb-4">بيانات الحساب</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#141414]/40 uppercase tracking-widest mb-2">اختر الموظف</label>
                        <select className="w-full bg-[#141414]/5 border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-black outline-none appearance-none">
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#141414]/40 uppercase tracking-widest mb-2">آلية الاحتساب</label>
                          <select className="w-full bg-[#141414]/5 border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-black outline-none appearance-none">
                            <option>قانون العمل القياسي</option>
                            <option>نظام الشركة الخاص</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#141414]/40 uppercase tracking-widest mb-2">تاريخ انتهاء الخدمة</label>
                          <input type="date" className="w-full bg-[#141414]/5 border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-black outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-4 flex gap-4">
                        <FileText className="text-amber-600 w-5 h-5 shrink-0 mt-1" />
                        <div className="text-sm text-amber-800 leading-relaxed">
                          <strong>ملاحظة قانونية:</strong> يتم احتساب آخر راتب أساسي تقاضاه الموظف كأساس للحساب وفق المادة 120 من قانون العمل.
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-black text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all tracking-tight">
                      توليد التقرير المالي
                    </button>
                  </div>

                  <div className="bg-[#141414] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <h4 className="font-bold text-lg border-b border-white/10 pb-4 mb-8">النتائج التقديرية</h4>
                    
                    <div className="space-y-10">
                      <div>
                        <p className="text-white/50 text-sm mb-2">المبلغ الإجمالي المستحق</p>
                        <div className="flex items-baseline gap-4">
                          <h2 className="text-5xl font-black">{calculateEOS(employees[0]).amount.toLocaleString()}</h2>
                          <span className="text-xl font-medium text-white/40 tracking-tight">ريال يمني</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                        <div>
                          <p className="text-white/50 text-xs uppercase font-bold tracking-widest mb-2">مدة الخدمة</p>
                          <p className="text-xl font-bold">
                            {calculateEOS(employees[0]).totalYears} سنوات و {calculateEOS(employees[0]).totalMonths} أشهر
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs uppercase font-bold tracking-widest mb-2">الراتب الأساسي</p>
                          <p className="text-xl font-bold">{employees[0].salary.toLocaleString()} ر.ي</p>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-white/5">
                          <span className="text-white/50">بدل سكن (غير مدرج)</span>
                          <span className="font-mono">0.00</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-white/5">
                          <span className="text-white/50">استقطاعات (سلف)</span>
                          <span className="text-red-400 font-mono">- 0.00</span>
                        </div>
                        <div className="flex justify-between py-2 mt-4">
                          <span className="font-bold">الصافي النهائي للتصفية</span>
                          <span className="font-bold text-green-400 underline decoration-2 underline-offset-8">
                            {calculateEOS(employees[0]).amount.toLocaleString()} ر.ي
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'leaves' && (
              <motion.div 
                key="leaves"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-[#141414]/5 shadow-sm">
                      <h4 className="font-bold mb-4">ملخص الإجازات</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#141414]/60">طلبات نشطة</span>
                          <span className="font-bold">12</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#141414]/60">إجازات سنوية</span>
                          <span className="font-bold text-blue-600">8</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#141414]/60">إجازات مرضية</span>
                          <span className="font-bold text-red-600">2</span>
                        </div>
                        <div className="w-full bg-[#141414]/5 h-2 rounded-full mt-4 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[65%]" />
                        </div>
                        <p className="text-[10px] text-center text-[#141414]/40 mt-2 tracking-widest font-bold">نسبة الغياب: 4%</p>
                      </div>
                    </div>

                    <div className="bg-black text-white p-6 rounded-3xl shadow-xl">
                      <div className="flex gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                          <PlaneTakeoff className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-white/50">تقديم طلب</p>
                          <p className="font-bold tracking-tight">إجازة جديدة</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed mb-6">
                        تأكد من موازنة فريقك قبل الموافقة على الطلبات المتشابهة في نفس الفترة الزمنية.
                      </p>
                      <button className="w-full bg-[#F27D26] text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform">
                        افتح نموذج الطلب
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-white rounded-3xl border border-[#141414]/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center">
                      <h4 className="font-bold">الطلبات المعلقة والموافقة</h4>
                      <div className="flex gap-2">
                        <button className="px-4 py-1 rounded-full bg-[#141414] text-white text-xs font-bold">الكل</button>
                        <button className="px-4 py-1 rounded-full bg-[#141414]/5 text-[#141414]/60 text-xs">قيد الانتظار</button>
                        <button className="px-4 py-1 rounded-full bg-[#141414]/5 text-[#141414]/60 text-xs">تمت الموافقة</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="text-[#141414]/40 text-xs uppercase tracking-widest border-b border-[#141414]/5">
                            <th className="px-6 py-4">الموظف</th>
                            <th className="px-6 py-4">النوع</th>
                            <th className="px-6 py-4">الفترة</th>
                            <th className="px-6 py-4">العدد (أيام)</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]/5 font-medium text-sm">
                          {leaveRequests.map(lr => (
                            <tr key={lr.id} className="hover:bg-[#141414]/5 transition-colors">
                              <td className="px-6 py-4 font-bold">{lr.employeeName}</td>
                              <td className="px-6 py-4">
                                <span className="bg-[#141414]/5 px-2 py-1 rounded">
                                  {lr.type === 'annual' ? 'سنوية' : lr.type === 'sick' ? 'مرضية' : 'أخرى'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono">
                                {lr.startDate} - {lr.endDate}
                              </td>
                              <td className="px-6 py-4">{lr.days}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1",
                                  lr.status === 'approved' ? "text-green-600" : "text-amber-600"
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", lr.status === 'approved' ? "bg-green-600" : "bg-amber-600 animate-pulse")} />
                                  {lr.status === 'approved' ? 'مقبولة' : 'معلقة'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button className="text-[#141414]/40 hover:text-black transition-colors">
                                  عرض التفاصيل
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[
                  { title: 'تقرير الامتثال السنوي', desc: 'مراجعة بيانات التأمينات الإلزامية والضرائب المستقطعة لكل موظف.', icon: FileText, trend: '+5%' },
                  { title: 'إحصائيات النوع الاجتماعي', desc: 'توزيع القوى العاملة حسب النوع الاجتماعي والفئات العمرية.', icon: Award, trend: 'مستقر' },
                  { title: 'سجل التظلمات والنزاعات', desc: 'قاعدة بيانات للنزاعات العمالية المحلولة والنشطة في المحاكم.', icon: Users, trend: '-2' },
                  { title: 'مؤشرات أداء الموارد البشرية', desc: 'قياسات الدوران الوظيفي، تكلفة التوظيف، وسرعة سد الفجوات.', icon: TrendingUp, trend: '+12%' },
                  { title: 'تحديث بيانات البطائق الشخصية', desc: 'سجل لتواريخ انتهاء الهويات الوطنية وجوازات السفر للموظفين.', icon: UserCheck, trend: 'مستقر' },
                  { title: 'تقييم كلفة الإجازات', desc: 'تقرير مفصل عن كلفة الأيام غير الإنتاجية والتعويضات المدفوعة.', icon: PlaneTakeoff, trend: '+8%' },
                ].map((report, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm hover:translate-y-[-4px] hover:shadow-xl transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-[#141414]/5 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                        <report.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{report.trend}</span>
                    </div>
                    <h5 className="font-bold text-lg mb-3">{report.title}</h5>
                    <p className="text-sm text-[#141414]/50 leading-relaxed">{report.desc}</p>
                    <div className="mt-8 flex items-center justify-between text-xs font-bold tracking-widest uppercase text-[#141414]/30 group-hover:text-[#F27D26] transition-colors">
                      <span>فتح التقرير الكامل</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Bar Info */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-400 shrink-0 z-20">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> خادم متصل: صنعاء</span>
          <span className="h-3 w-px bg-slate-300" />
          <span>المنطقة الزمنية (GMT+3)</span>
        </div>
        <div className="flex gap-4 font-mono uppercase tracking-widest">
          <span>v2.1.0-LOCAL-YE</span>
          <span className="text-indigo-600 font-bold">● نظام نشط</span>
        </div>
      </footer>
    </div>
  );
}
