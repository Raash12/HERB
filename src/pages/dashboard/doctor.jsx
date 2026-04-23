import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase"; 
import { collection, query, where, onSnapshot, getDoc, doc, orderBy } from "firebase/firestore";

// Charts
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, CartesianGrid } from 'recharts';

// Icons - ALL ICONS INCLUDED HERE
import { 
  LayoutDashboard, LogOut, Moon, Sun, Lock, Activity, ChevronRight, ChevronLeft,
  HeartPulse, Thermometer, Microscope, Pill, UserCheck, Syringe, ClipboardList,
  Stethoscope // <--- ADDED THIS TO FIX THE ERROR
} from "lucide-react";

// Components & UI
import DoctorAppointments from "../doctor/DoctorAppointments"; 
import DoctorPrescriptionView from "../doctor/DoctorPrescriptionView";
import SecuritySettings from "../../security/SecuritySettings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [userName, setUserName] = useState("");
  const [userBranch, setUserBranch] = useState("");
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, pharmacyCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [topPatient, setTopPatient] = useState({ name: "Loading...", visits: 0, initials: ".." });

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
    const user = auth.currentUser;
    if (!user) return;

    const fetchDynamicData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.fullName || userData.name || "Doctor");
        setUserBranch(userData.branch || "General");
      }

      const q = query(
        collection(db, "visits"), 
        where("doctorId", "==", user.uid), 
        orderBy("createdAt", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const allVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const completed = allVisits.filter(v => v.status === "completed").length;
        const total = allVisits.length;
        
        setStats({
          total: total,
          completed: completed,
          pending: total - completed,
          pharmacyCount: allVisits.filter(v => v.needsMedicine === true || v.status === "pharmacy").length 
        });

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const groupedData = allVisits.reduce((acc, visit) => {
          const day = visit.createdAt ? days[visit.createdAt.toDate().getDay()] : 'Unknown';
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});

        const formattedChart = days.map(day => ({
          time: day,
          load: groupedData[day] || 0
        }));
        setChartData(formattedChart);

        const patientCounts = allVisits.reduce((acc, visit) => {
          const pName = visit.patientName || "Unknown Patient";
          acc[pName] = (acc[pName] || 0) + 1;
          return acc;
        }, {});

        const sortedPatients = Object.entries(patientCounts).sort((a, b) => b[1] - a[1]);
        if (sortedPatients.length > 0) {
          const [name, count] = sortedPatients[0];
          setTopPatient({
            name: name,
            visits: count,
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          });
        }
      });
    };

    let unsub;
    fetchDynamicData().then(u => unsub = u);
    return () => unsub && unsub();
  }, []);

  const radialData = [{ name: 'Efficiency', value: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0, fill: '#3b82f6' }];

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${darkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]'}`}>
      
      {/* SIDEBAR */}
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} h-screen flex-shrink-0 bg-[#0F172A] border-r border-white/5 flex flex-col sticky top-0 z-50 transition-all duration-500 shadow-2xl`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            {!isCollapsed && (
              <div className="flex items-center gap-3 animate-in fade-in duration-500">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/40">
                  <HeartPulse size={20} className="text-white" />
                </div>
                <h1 className="font-black text-lg tracking-tighter text-white">HORSEED</h1>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-xl bg-white/5 text-slate-400 mx-auto hover:text-white transition-colors">
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="space-y-3">
            <NavBtn icon={<LayoutDashboard size={20}/>} label="Overview" active={activeView === "dashboard"} collapsed={isCollapsed} onClick={() => setActiveView("dashboard")} />
            <NavBtn icon={<ClipboardList size={20}/>} label="Patient Logs" active={activeView === "appointments"} collapsed={isCollapsed} onClick={() => setActiveView("appointments")} />
            <NavBtn icon={<Syringe size={20}/>} label="Treatments" active={activeView === "prescriptions"} collapsed={isCollapsed} onClick={() => setActiveView("prescriptions")} />
            <NavBtn icon={<Lock size={20}/>} label="Privacy" active={activeView === "security"} collapsed={isCollapsed} onClick={() => setActiveView("security")} />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4 border-t border-white/5">
           <button onClick={toggleDark} className="flex items-center gap-4 w-full p-3 rounded-2xl text-slate-400 hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-widest overflow-hidden">
             {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-400" />}
             {!isCollapsed && "Theme"}
           </button>
           <button onClick={() => {signOut(auth); navigate("/");}} className="flex items-center gap-4 text-red-400 font-black uppercase text-[10px] p-3 hover:bg-red-500/10 rounded-2xl transition-all overflow-hidden">
             <LogOut size={20} /> {!isCollapsed && "Exit System"}
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeView === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <MiniStat label="Total Patient" value={stats.total} icon={<Microscope size={18}/>} color="blue" />
              <MiniStat label="Avg Temp" value="36.6°" icon={<Thermometer size={18}/>} color="emerald" />
              <MiniStat label="Ready/Done" value={stats.completed} icon={<UserCheck size={18}/>} color="indigo" />
              <MiniStat label="Pharmacy" value={stats.pharmacyCount} icon={<Pill size={18}/>} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 overflow-hidden relative">
                <div className="flex justify-between items-center mb-6">
                   <div>
                     <h3 className="font-black uppercase text-xs tracking-[0.3em] text-slate-400">Clinical Data Stream</h3>
                     <p className="text-2xl font-black tracking-tighter dark:text-white">Visit Frequency (Weekly)</p>
                   </div>
                   <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Live Sync</Badge>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                      <defs>
                        <linearGradient id="medGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 'bold'}} cursor={{stroke: '#3b82f6', strokeWidth: 2}} />
                      <Area type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={4} fill="url(#medGradient)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* BRAND MISSION CARD - FIXED Stethoscope HERE */}
              <Card className="border-none shadow-2xl rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <Stethoscope className="mb-6 opacity-40" size={32} />
                  <h3 className="text-2xl font-black tracking-tighter mb-4 leading-tight">Superior Care through Digital Precision.</h3>
                  <p className="text-blue-100/80 text-xs leading-relaxed font-medium">
                    "At Horseed Medical, our commitment to excellence is powered by real-time diagnostics and patient-centric data. We analyze, optimize, and elevate the standard of ocular health through every digital touchpoint."
                  </p>
                </div>
                <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Clinical Integrity Verified</p>
                </div>
                <Activity size={250} className="absolute -right-20 -bottom-20 opacity-10 rotate-12" />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="border-none shadow-xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 border border-slate-50 dark:border-slate-800 group transition-all hover:border-blue-500/30">
                  <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-6">Patient Spotlight</h3>
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center text-3xl font-black text-blue-600 group-hover:scale-110 transition-transform duration-500">
                        {topPatient.initials}
                     </div>
                     <div>
                        <h4 className="text-xl font-black dark:text-white">{topPatient.name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Most Frequent Visitor</p>
                        <div className="flex gap-2">
                           <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-none font-bold text-[9px] uppercase">{topPatient.visits} Visits</Badge>
                           <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-none font-bold text-[9px] uppercase">Trusted Account</Badge>
                        </div>
                     </div>
                  </div>
               </Card>
               
               <Card className="border-none shadow-xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 border border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</p>
                     <h4 className="text-4xl font-black dark:text-white">{radialData[0].value.toFixed(0)}%</h4>
                  </div>
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={radialData}>
                        <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
               </Card>
            </div>
          </div>
        )}

        {activeView === "security" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
        {activeView === "appointments" && <DoctorAppointments />}
        {activeView === "prescriptions" && <DoctorPrescriptionView />}
      </main>
    </div>
  );
}

// Subcomponents
function NavBtn({ icon, label, active, collapsed, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{icon}</div>
      {!collapsed && <span className="font-black uppercase text-[10px] tracking-widest whitespace-nowrap">{label}</span>}
      {collapsed && <div className="absolute left-20 bg-blue-600 text-white text-[9px] font-black px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest shadow-2xl z-[100]">{label}</div>}
    </button>
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
    <Card className="border-none shadow-xl p-8 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 hover:-translate-y-2 transition-transform duration-500">
      <div className={`${colors[color]} p-3 rounded-2xl w-fit mb-4`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
    </Card>
  );
}