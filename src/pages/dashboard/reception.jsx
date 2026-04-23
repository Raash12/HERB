import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where, getDoc, doc, orderBy } from "firebase/firestore";

// Charts
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Components
import CustomerRegistration from "../reception/CustomerRegistration";
import ReceptionPrescriptions from "../reception/ReceptionPrescriptions"; 
import SecuritySettings from "../../security/SecuritySettings";

// UI Components
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Icons
import { 
  LayoutDashboard, UserPlus, LogOut, Moon, Sun, 
  Users, Search, FileText, ChevronLeft, ChevronRight, 
  User as UserIcon, CalendarCheck, ShieldCheck, Activity, Zap
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [userName, setUserName] = useState(""); 
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });
  const [prescriptions, setPrescriptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const navigate = useNavigate();

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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const setupListeners = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserBranch(userData.branch || "");
        setUserName(userData.fullName || userData.name || "Reception");
      }

      const branch = userDoc.exists() ? userDoc.data().branch : "";
      if (!branch) return;

      const qPatients = query(collection(db, "patients"), where("branch", "==", branch));
      const unsubPatients = onSnapshot(qPatients, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const todayStr = new Date().toLocaleDateString('en-CA'); 

        setStats(prev => ({
          ...prev,
          total: docs.length,
          today: docs.filter(p => (p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-CA') : "") === todayStr).length
        }));

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const grouped = docs.reduce((acc, p) => {
          const day = p.createdAt ? days[p.createdAt.toDate().getDay()] : 'Sun';
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});
        setChartData(days.map(d => ({ time: d, load: grouped[d] || 0 })));
      });

      const qPres = query(collection(db, "prescriptions"), where("branch", "==", branch), orderBy("createdAt", "desc"));
      const unsubPres = onSnapshot(qPres, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPrescriptions(data);
        setStats(prev => ({ ...prev, pending: data.length }));
      });

      return () => { unsubPatients(); unsubPres(); };
    };

    setupListeners();
  }, []);

  const filteredData = prescriptions.filter(item => 
    (item.patientName || item.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* FIXED SIDEBAR */}
        <Sidebar className="border-r border-white/5 bg-[#0F172A] text-slate-400 h-screen shrink-0">
          <SidebarContent className="p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/40">
                <Activity size={20} className="text-white" />
              </div>
              <h1 className="font-black text-lg tracking-tighter text-white uppercase">HORSEED</h1>
            </div>
            
            <SidebarMenu className="space-y-2">
              <NavItem label="Overview" icon={<LayoutDashboard size={20} />} active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
              <NavItem label="Register" icon={<UserPlus size={20} />} active={activeView === "registration"} onClick={() => setActiveView("registration")} />
              <NavItem label="Prescriptions" icon={<FileText size={20} />} active={activeView === "prescriptions"} onClick={() => { setActiveView("prescriptions"); setCurrentPage(1); }} />
              <NavItem label="Privacy" icon={<ShieldCheck size={20} />} active={activeView === "settings"} onClick={() => setActiveView("settings")} />
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-6 space-y-4 border-t border-white/5">
            <button onClick={toggleDark} className="flex items-center gap-4 w-full p-3 rounded-2xl text-slate-400 hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-widest">
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-400" />}
              Theme
            </button>
            <button onClick={async () => { await signOut(auth); navigate("/"); }} className="flex items-center gap-4 text-red-400 font-black uppercase text-[10px] p-3 hover:bg-red-500/10 rounded-2xl transition-all">
              <LogOut size={20} /> Exit System
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#020617] p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
            
            {activeView === "dashboard" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <MiniStat label="Total Patients" value={stats.total} icon={<Users size={18}/>} color="blue" />
                  <MiniStat label="Admissions Today" value={stats.today} icon={<CalendarCheck size={18}/>} color="emerald" />
                  <MiniStat label="Pending Logs" value={stats.pending} icon={<FileText size={18}/>} color="indigo" />
                  <MiniStat label="Clinic Status" value="Active" icon={<Activity size={18}/>} color="rose" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-black uppercase text-xs tracking-[0.3em] text-slate-400">Reception Throughput</h3>
                        <p className="text-2xl font-black tracking-tighter dark:text-white">Patient Intake Velocity</p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Live Sync</Badge>
                    </div>
                    
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <defs>
                            <linearGradient id="recGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                          <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 'bold'}} />
                          <Area type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={4} fill="url(#recGradient)" animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="border-none shadow-2xl rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                      <Zap className="mb-6 opacity-40" size={32} />
                      <h3 className="text-2xl font-black tracking-tighter mb-4 leading-tight">Patient Care Gateway.</h3>
                      <p className="text-blue-100/80 text-xs leading-relaxed font-medium">
                        "Your efficiency at registration ensures patients move through the clinic faster. Accuracy here is the first step of medical excellence."
                      </p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-200">
                      {userBranch} Branch Active
                    </div>
                    <Activity size={250} className="absolute -right-20 -bottom-20 opacity-10 rotate-12" />
                  </Card>
                </div>
              </>
            )}

            {activeView === "prescriptions" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl">
                  <div className="relative w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      placeholder="Search Patients..." 
                      className="pl-14 h-14 border-none bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-bold uppercase" 
                      value={searchTerm} 
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                  </div>
                  <Badge className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">
                    {filteredData.length} Prescriptions Found
                  </Badge>
                </div>

                <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <ReceptionPrescriptions data={paginatedData} />
                  <div className="p-8 flex items-center justify-between border-t dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry {((currentPage - 1) * itemsPerPage) + 1} — {Math.min(currentPage * itemsPerPage, filteredData.length)}</span>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="h-12 w-12 rounded-2xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18}/></Button>
                      <Button variant="outline" size="sm" className="h-12 w-12 rounded-2xl" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18}/></Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeView === "settings" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
            {activeView === "registration" && <div className="animate-in fade-in duration-500"><CustomerRegistration /></div>}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Logic Helper Components
function NavItem({ label, icon, active, onClick }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 p-4 h-14 rounded-2xl transition-all duration-300 relative group ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      >
        <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{icon}</div>
        <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function MiniStat({ label, value, icon, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
  };
  return (
    <Card className="border-none shadow-xl p-8 rounded-[3.5rem] bg-white dark:bg-slate-900 hover:-translate-y-2 transition-transform duration-500">
      <div className={`${colors[color]} p-3 rounded-2xl w-fit mb-4`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
    </Card>
  );
}