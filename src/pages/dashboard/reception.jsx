import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, getDoc, doc, orderBy } from "firebase/firestore";

// UI Components
import CustomerRegistration from "../reception/CustomerRegistration";
import ReceptionPrescriptions from "../reception/ReceptionPrescriptions"; 
import SecuritySettings from "../../security/SecuritySettings";
import QuickSale from "../reception/QuickSale"; 

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, UserPlus, LogOut, Moon, Sun, Users, 
  Search, FileText, Activity, Zap, ShieldCheck, 
  ChevronLeft, ChevronRight, Loader2, ShoppingCart
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [opticalPrescriptions, setOpticalPrescriptions] = useState([]);
  const [medicalPrescriptions, setMedicalPrescriptions] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  // Theme Logic
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

  // Real-time Data Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const branch = userDoc.exists() ? userDoc.data().branch : "";
        setUserBranch(branch);

        if (branch) {
          const qPatients = query(collection(db, "patients"), where("branch", "==", branch));
          const unsubPatients = onSnapshot(qPatients, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const todayStr = new Date().toLocaleDateString('en-CA');
            setStats(prev => ({
              ...prev,
              total: docs.length,
              today: docs.filter(p => p.createdAt?.toDate()?.toLocaleDateString('en-CA') === todayStr).length
            }));
          });

          const qOptical = query(collection(db, "prescriptions"), where("branch", "==", branch), orderBy("createdAt", "desc"));
          const unsubOptical = onSnapshot(qOptical, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'optical' }));
            setOpticalPrescriptions(data);
          });

          const qMedical = query(collection(db, "medical_prescriptions"), where("branch", "==", branch), orderBy("createdAt", "desc"));
          const unsubMedical = onSnapshot(qMedical, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), category: 'medical' }));
            setMedicalPrescriptions(data);
            setInitialLoading(false);
          });

          return () => {
            unsubPatients();
            unsubOptical();
            unsubMedical();
          };
        }
      } else {
        navigate("/");
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const combined = [...opticalPrescriptions, ...medicalPrescriptions].sort((a, b) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    setAllPrescriptions(combined);
    setStats(prev => ({ 
      ...prev, 
      pending: combined.filter(o => o.status !== 'completed' && o.status !== 'paid').length 
    }));
  }, [opticalPrescriptions, medicalPrescriptions]);

  const filteredData = allPrescriptions.filter(item => 
    (item.patientName || item.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (initialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="border-r border-white/5 bg-[#0F172A] text-slate-400 h-screen shrink-0">
          <SidebarContent className="p-6">
            <div className="flex items-center gap-3 mb-10 px-2 text-white">
              <Activity size={20} className="bg-blue-600 p-1 rounded" />
              <h1 className="font-black text-lg tracking-tighter uppercase">HORSEED</h1>
            </div>
            <SidebarMenu className="space-y-2">
              <NavItem label="Overview" icon={<LayoutDashboard size={20} />} active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
              <NavItem label="Register" icon={<UserPlus size={20} />} active={activeView === "registration"} onClick={() => setActiveView("registration")} />
              <NavItem label="Direct Sale" icon={<ShoppingCart size={20} />} active={activeView === "quicksale"} onClick={() => setActiveView("quicksale")} />
              <NavItem label="Prescriptions" icon={<FileText size={20} />} active={activeView === "prescriptions"} onClick={() => setActiveView("prescriptions")} />
              <NavItem label="Privacy" icon={<ShieldCheck size={20} />} active={activeView === "settings"} onClick={() => setActiveView("settings")} />
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-white/5">
            <button onClick={toggleDark} className="flex items-center gap-4 w-full p-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 rounded-xl transition-colors">
              {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-400" />} Theme
            </button>
            <button onClick={() => signOut(auth).then(() => navigate("/"))} className="flex items-center gap-4 w-full p-3 text-red-400 text-[10px] font-black uppercase hover:bg-red-500/10 rounded-xl mt-2 transition-colors">
              <LogOut size={18} /> Exit System
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#020617] p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeView === "dashboard" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                <MiniStat label="Total Patients" value={stats.total} icon={<Users size={18}/>} color="blue" />
                <MiniStat label="Admissions Today" value={stats.today} icon={<Activity size={18}/>} color="emerald" />
                <MiniStat label="Pending Orders" value={stats.pending} icon={<FileText size={18}/>} color="indigo" />
                <MiniStat label="Status" value="Active" icon={<Zap size={18}/>} color="rose" />
              </div>
            )}

            {activeView === "quicksale" && <QuickSale />}

            {activeView === "prescriptions" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl">
                  <div className="relative w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      placeholder="Search Patients..." 
                      className="pl-14 h-14 border-none bg-slate-50 dark:bg-slate-800 rounded-2xl focus-visible:ring-blue-500" 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                  </div>
                  <Badge className="bg-blue-600 px-6 py-2 rounded-xl uppercase text-[10px] font-black">
                    {filteredData.length} Found
                  </Badge>
                </div>

                <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <ReceptionPrescriptions data={paginatedData} />
                  
                  <div className="p-8 flex items-center justify-between border-t dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-3">
                      <Button variant="outline" className="h-10 w-10 rounded-xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                        <ChevronLeft size={18}/>
                      </Button>
                      <Button variant="outline" className="h-10 w-10 rounded-xl" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                        <ChevronRight size={18}/>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeView === "registration" && <CustomerRegistration />}
            {activeView === "settings" && <SecuritySettings />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Helpers
function NavItem({ label, icon, active, onClick }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={onClick} className={`w-full flex items-center gap-4 p-4 h-14 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
        {icon} <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function MiniStat({ label, value, icon, color }) {
  const colors = { 
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10", 
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10", 
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10", 
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-500/10" 
  };
  return (
    <Card className="border-none shadow-xl p-8 rounded-[3rem] bg-white dark:bg-slate-900 transform transition-transform hover:scale-[1.02]">
      <div className={`${colors[color]} p-3 rounded-2xl w-fit mb-4`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black tracking-tighter dark:text-white">{value}</h4>
    </Card>
  );
}