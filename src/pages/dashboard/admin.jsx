import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

// PREMIUM COMPONENTS
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// CUSTOM VIEWS
import Medical from "../doctor/Medical"; 
import MedicalReport from "../../report/medicalReport";
import OpticalReport from "../../report/opticalReport";
import AdminPatients from "../reception/AdminPatients"; 
import SecuritySettings from "../../security/SecuritySettings";
import SalesReport from "../../report/SalesReport";
import StaffManagement from "../StaffManagement";
// HALKAN AYAA LAGU WACAY BRANCH MANAGEMENT
import BranchManagement from "../branches/BranchManagement"; 

// UI COMPONENTS
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ICONS
import {
  Users, LayoutDashboard, Sun, Moon, 
  Lock, LogOut, Building2, Activity, FileText, Eye, 
  UserRoundSearch, TrendingUp, Sparkles
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stockCount, setStockCount] = useState(0); 
  const [patientCount, setPatientCount] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bSnap, uSnap, sSnap, pSnap] = await Promise.all([
        getDocs(collection(db, "branches")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "branch_medicines")),
        getDocs(collection(db, "patients"))
      ]);

      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStockCount(sSnap.size); 
      setPatientCount(pSnap.size); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleDark = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem("darkMode", newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  // Chart Data
  const roleData = [
    { name: 'Doctors', value: users.filter(u => u.role === 'doctor').length, color: '#3b82f6' },
    { name: 'Reception', value: users.filter(u => u.role === 'reception').length, color: '#10b981' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#8b5cf6' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#020617]">
        {/* SIDEBAR */}
        <Sidebar className="border-r border-white/5 bg-[#0F172A] text-slate-400 h-screen shrink-0 shadow-2xl">
          <SidebarContent className="p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                <TrendingUp size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tighter text-white uppercase leading-none">HORSEED</h1>
                <span className="text-[9px] font-bold text-blue-400 tracking-[0.3em] uppercase">Control Center</span>
              </div>
            </div>
            
            <SidebarMenu className="space-y-2">
              <AdminNavItem label="Overview" icon={<LayoutDashboard size={18}/>} active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
              <AdminNavItem label="Patients" icon={<UserRoundSearch size={18}/>} active={activeView === "patients"} onClick={() => setActiveView("patients")} />
              <AdminNavItem label="Pharmacy" icon={<Activity size={18}/>} active={activeView === "medical"} onClick={() => setActiveView("medical")} />
              <AdminNavItem label="Branches" icon={<Building2 size={18}/>} active={activeView === "branches"} onClick={() => setActiveView("branches")} />
              <AdminNavItem label="Staff" icon={<Users size={18}/>} active={activeView === "users"} onClick={() => setActiveView("users")} />
              
              <div className="px-6 mt-8 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Reporting</div>
              <AdminNavItem label="Medical" icon={<FileText size={18}/>} active={activeView === "medical_report"} onClick={() => setActiveView("medical_report")} />
              <AdminNavItem label="Optical" icon={<Eye size={18}/>} active={activeView === "optical_report"} onClick={() => setActiveView("optical_report")} />
              <AdminNavItem label="Sales" icon={<TrendingUp size={18}/>} active={activeView === "sales_report"} onClick={() => setActiveView("sales_report")} />
              <AdminNavItem label="Security" icon={<Lock size={18}/>} active={activeView === "security"} onClick={() => setActiveView("security")} />
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-6 space-y-3 border-t border-white/5">
            <button onClick={toggleDark} className="flex items-center gap-4 w-full p-3 rounded-2xl text-slate-400 hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-widest">
              {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-400" />} Appearance
            </button>
            <button onClick={async () => { await signOut(auth); navigate("/"); }} className="flex items-center gap-4 text-red-400 font-black uppercase text-[10px] p-3 hover:bg-red-500/10 rounded-2xl transition-all w-full">
              <LogOut size={18} /> Exit System
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto p-10 space-y-10">
            
            {/* WELCOME BANNER */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-blue-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administrator</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight dark:text-white">
                    Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Analytics</span>
                  </h2>
                </div>
                <div className="bg-blue-600/5 p-4 rounded-3xl border border-blue-600/10">
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Global Patient Count</p>
                   <p className="text-3xl font-black dark:text-white">{patientCount}</p>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeView === "dashboard" && (
                <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AdminMiniStat label="Branches" val={branches.length} icon={<Building2/>} color="blue" />
                    <AdminMiniStat label="Total Personnel" val={users.length} icon={<Users/>} color="emerald" />
                    <AdminMiniStat label="Inventory" val={stockCount} icon={<Activity/>} color="indigo" />
                    <AdminMiniStat label="Security Log" val="Secure" icon={<Lock/>} color="rose" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3.5rem] bg-white dark:bg-slate-900 p-10 overflow-hidden">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[{n: 'Jan', v: 20}, {n: 'Feb', v: 45}, {n: 'Mar', v: 38}, {n: 'Apr', v: patientCount}]}>
                            <defs>
                              <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                            <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={4} fill="url(#adminGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white dark:bg-slate-900 p-10 flex flex-col items-center">
                       <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-6">Staff Roles</h3>
                       <div className="h-[200px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                               {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                             </Pie>
                             <Tooltip />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* BRANCHES VIEW - HADDA WAA COMPONENT GOONI AH */}
              {activeView === "branches" && (
                <BranchManagement branches={branches} fetchData={fetchData} />
              )}

              {/* CALLING OTHER MODULAR VIEWS */}
              {activeView === "users" && <StaffManagement users={users} branches={branches} fetchData={fetchData} />}
              {activeView === "patients" && <AdminPatients />}
              {activeView === "medical" && <Medical />}
              {activeView === "medical_report" && <MedicalReport />}
              {activeView === "optical_report" && <OpticalReport />}
              {activeView === "sales_report" && <SalesReport />}
              {activeView === "security" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AdminNavItem({ label, icon, active, onClick }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={onClick} className={`w-full flex items-center gap-4 h-14 px-4 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <div>{icon}</div>
        <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminMiniStat({ label, val, icon, color }) {
  const colors = { blue: "text-blue-500 bg-blue-500/10", emerald: "text-emerald-500 bg-emerald-500/10", indigo: "text-indigo-500 bg-indigo-500/10", rose: "text-rose-500 bg-rose-500/10" };
  return (
    <Card className="border-none shadow-xl p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 transition-transform hover:-translate-y-2">
      <div className={`${colors[color]} p-3 rounded-2xl w-fit mb-4`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-3xl font-black dark:text-white tracking-tighter">{val}</h4>
    </Card>
  );
}