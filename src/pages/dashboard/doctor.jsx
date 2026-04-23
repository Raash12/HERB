import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase"; 
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

// Icons
import { 
  LayoutDashboard, Calendar, LogOut, Moon, Sun, Stethoscope,
  Users, CheckCircle2, Clock, TrendingUp, Loader2, Activity, Lock, 
  FileText
} from "lucide-react";

// Components
import DoctorAppointments from "../doctor/DoctorAppointments"; 
import MedicalPrescription from "../doctor/MedicalPrescription"; 
import OpticalPrescriptionPage from "../doctor/OpticalPrescriptionPage";
import DoctorPrescriptionView from "../doctor/DoctorPrescriptionView";
import SecuritySettings from "../../security/SecuritySettings";

// UI Components
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(null); 
  const [darkMode, setDarkMode] = useState(false);
  
  // User & Branch States
  const [userName, setUserName] = useState("");
  const [userBranch, setUserBranch] = useState("");

  const [stats, setStats] = useState({
    total: 0, completed: 0, pending: 0, loading: true
  });

  // Navigation Handlers
  const openMedical = (id) => { setSelectedPatientId(id); setActiveView("medical"); };
  const openEye = (id) => { setSelectedPatientId(id); setActiveView("eye"); };
  const backToAppointments = () => { setSelectedPatientId(null); setActiveView("appointments"); };

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserAndStats = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.fullName || userData.name);
        setUserBranch(userData.branch);

        // Aqri bukaannada dhakhtarka ee branch-kaas kaliya
        const q = query(
          collection(db, "patients"), 
          where("doctorId", "==", user.uid),
          where("branch", "==", userData.branch)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allPatients = snapshot.docs.map(doc => doc.data());
          setStats({
            total: allPatients.length,
            completed: allPatients.filter(p => p.status === "completed").length,
            pending: allPatients.filter(p => p.status === "pending" || p.status === "doctor").length,
            loading: false
          });
        });
        return unsubscribe;
      }
    };

    let unsub;
    fetchUserAndStats().then(u => unsub = u);
    return () => unsub && unsub();
  }, []);

  const toggleDark = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem("darkMode", newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <div className="px-6 mb-8 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Stethoscope size={22} className="text-white" />
              </div>
              <h1 className="font-black text-xl tracking-tighter uppercase">
                HERB<span className="text-blue-600">DOC</span>
              </h1>
            </div>
            
            {/* --- KALIYA USER NAME --- */}
            <div className="flex items-center gap-2 px-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter truncate">
                 {userName || "Loading..."}
               </p>
            </div>
          </div>

          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => {setActiveView("dashboard"); setSelectedPatientId(null);}}>
                <LayoutDashboard size={20} />
                <span className="font-bold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "appointments"} onClick={backToAppointments}>
                <Calendar size={20} />
                <span className="font-bold">Appointments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "prescriptions"} onClick={() => setActiveView("prescriptions")}>
                <FileText size={20} />
                <span className="font-bold">Prescriptions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "security"} onClick={() => setActiveView("security")}>
                <Lock size={20} />
                <span className="font-bold">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
          <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs mb-1">
            {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
            <span className="ml-2 font-bold">{darkMode ? "Light" : "Dark"}</span>
          </SidebarMenuButton>
          <SidebarMenuButton onClick={() => {signOut(auth); navigate("/");}} className="text-red-500 h-10 rounded-xl text-xs">
            <LogOut size={16} />
            <span className="ml-2 font-bold">Logout</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        
        {activeView === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight uppercase">Dashboard</h1>
              {/* --- BRANCH INFO --- */}
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                Active Branch: <span className="text-blue-600">{userBranch || "..." }</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Branch Visits" value={stats.total} icon={<Users className="text-blue-600" />} color="blue" loading={stats.loading} />
              <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" loading={stats.loading} />
              <StatCard title="Waiting" value={stats.pending} icon={<Clock className="text-orange-500" />} color="orange" loading={stats.loading} />
              <StatCard title="Success Rate" value={`${successRate}%`} icon={<TrendingUp className="text-purple-500" />} color="purple" progress={successRate} />
            </div>

            <Card className="p-10 bg-blue-600 text-white border-none shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <Badge className="bg-blue-400/30 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">Branch Analytics</Badge>
                <h2 className="text-4xl font-black uppercase tracking-tighter">
                  {userBranch} Status
                </h2>
                <p className="text-blue-100 text-sm font-medium">
                   Dhakhtar {userName}, hadda waxaa branch-ka {userBranch} kuu jooga {stats.pending} bukaan.
                </p>
              </div>
              <Activity size={200} className="absolute -right-10 -bottom-10 text-white/10" />
            </Card>
          </div>
        )}

        {/* View-yada kale halkooda ha joogaan */}
        {activeView === "security" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
        {activeView === "appointments" && <DoctorAppointments onOpenMedical={openMedical} onOpenEye={openEye} />}
        {activeView === "medical" && selectedPatientId && <MedicalPrescription patientId={selectedPatientId} onBack={backToAppointments} />}
        {activeView === "eye" && selectedPatientId && <OpticalPrescriptionPage patientId={selectedPatientId} onBack={backToAppointments} />}
        {activeView === "prescriptions" && <DoctorPrescriptionView />}
      </main>
    </SidebarProvider>
  );
}

function StatCard({ title, value, icon, color, loading, progress }) {
  const colors = { blue: "bg-blue-600", emerald: "bg-emerald-500", orange: "bg-orange-500", purple: "bg-purple-500" };
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colors[color]}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">{icon}</div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-4xl font-black">
          {loading ? <Loader2 className="animate-spin h-8 w-8 text-slate-300" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}