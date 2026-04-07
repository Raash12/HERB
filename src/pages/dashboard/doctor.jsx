import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../../firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
// Add FileText here
import { 
  LayoutDashboard, Calendar, LogOut, Moon, Sun, Stethoscope,
  Users, CheckCircle2, Clock, TrendingUp, Loader2, Activity, Lock, KeyRound,
  FileText, Pill 
} from "lucide-react";

// Components
import DoctorAppointments from "../doctor/DoctorAppointments"; 
import MedicalPrescription from "../doctor/MedicalPrescription"; 
import PrescriptionPage from "../doctor/PrescriptionPage"; 
import DoctorPrescriptionView from "../doctor/DoctorPrescriptionView";

// UI Components
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(null); 
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0, completed: 0, pending: 0, loading: true
  });

  // Security State
  const [passwords, setPasswords] = useState({ current: "", new: "", repeat: "" });

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

    const q = query(collection(db, "patients"), where("doctorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPatients = snapshot.docs.map(doc => doc.data());
      setStats({
        total: allPatients.length,
        completed: allPatients.filter(p => p.status === "completed").length,
        pending: allPatients.filter(p => p.status === "pending" || p.status === "doctor").length,
        loading: false
      });
    }, (error) => {
      setStats(prev => ({ ...prev, loading: false }));
    });
    return () => unsubscribe();
  }, []);

  const toggleDark = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem("darkMode", newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Password Update Logic
  const handleUpdatePassword = async () => {
    const { current, new: newPass, repeat } = passwords;
    if (!current || !newPass || !repeat) return alert("Fadlan buuxi meelaha banaan!");
    if (newPass !== repeat) return alert("Password-ka cusub iyo ku celisku ma is laha!");
    
    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      alert("Password-ka si guul leh ayaa loo beddelay!");
      setPasswords({ current: "", new: "", repeat: "" });
      setActiveView("dashboard");
    } catch (err) { 
      alert("Cillad: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center gap-3 px-4 mb-8 mt-6">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Stethoscope size={22} className="text-white" />
            </div>
            <h1 className="font-black text-xl tracking-tighter text-slate-800 dark:text-white uppercase">
              HERB<span className="text-blue-600 font-light">DOC</span>
            </h1>
          </div>

          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => {setActiveView("dashboard"); setSelectedPatientId(null);}}>
                <LayoutDashboard size={20} />
                <span className="font-bold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "appointments" || activeView === "medical" || activeView === "eye"} onClick={backToAppointments}>
                <Calendar size={20} />
                <span className="font-bold">Appointments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "security"} onClick={() => setActiveView("security")}>
                <Lock size={20} />
                <span className="font-bold">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
              

            <SidebarMenuItem>
  <SidebarMenuButton 
    isActive={activeView === "prescriptions"} 
    onClick={() => {
      setActiveView("prescriptions");
      setSelectedPatientId(null); // Clear patient selection when moving to general view
    }}
  >
    <FileText size={20} />
    <span className="font-bold uppercase text-[11px] tracking-wider">Prescriptions</span>
  </SidebarMenuButton>
</SidebarMenuItem>


          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
          <div className="flex flex-col gap-1">
            <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs flex items-center">
              {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              <span className="ml-2 font-bold">{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>

            <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 rounded-xl text-xs flex items-center">
              <LogOut size={16} />
              <span className="ml-2 font-bold">Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all duration-300 overflow-y-auto">
        
        {activeView === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight uppercase">Dashboard</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Hospital Management System</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Visits" value={stats.total} icon={<Users className="text-blue-600" />} color="blue" loading={stats.loading} />
              <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" loading={stats.loading} />
              <StatCard title="Waiting" value={stats.pending} icon={<Clock className="text-orange-500" />} color="orange" loading={stats.loading} />
              <StatCard title="Success Rate" value={`${successRate}%`} icon={<TrendingUp className="text-purple-500" />} color="purple" progress={successRate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-10 bg-blue-600 text-white border-none shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                  <Badge className="bg-blue-400/30 text-white border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1">Quick Action</Badge>
                  <h2 className="text-4xl font-black uppercase leading-none tracking-tighter">Manage your <br/> Patients Now</h2>
                  <p className="text-blue-100 text-sm font-medium max-w-sm">Waxaad haysataa {stats.pending} bukaan oo ku sugaya Consultation.</p>
                  <div className="flex gap-4">
                    <button onClick={backToAppointments} className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs hover:shadow-2xl transition-all uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={16} /> View Appointments
                    </button>
                  </div>
                </div>
                <Activity size={200} className="absolute -right-10 -bottom-10 text-white/10 group-hover:scale-110 transition-transform duration-700" />
              </Card>

              <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-xl uppercase tracking-tighter">System Live</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-[0.2em]">Firestore Connected</p>
                </div>
              </Card> 
            </div>
          </div>
        )}

        {/* SECURITY VIEW */}
        {activeView === "security" && (
          <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom-4 mt-10">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Security Settings</h2>
              <p className="text-slate-400 text-sm uppercase font-bold text-[10px] tracking-widest">Update your credentials</p>
            </div>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Current Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                  value={passwords.current} 
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1 text-slate-400">New Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                  value={passwords.new} 
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Repeat New Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                  value={passwords.repeat} 
                  onChange={(e) => setPasswords({...passwords, repeat: e.target.value})} 
                />
              </div>

              <Button 
                onClick={handleUpdatePassword} 
                disabled={loading} 
                className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest mt-4 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
              </Button>
            </Card>
          </div>
        )}

        {/* APPOINTMENTS & PRESCRIPTIONS VIEWS */}
        {activeView === "appointments" && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <DoctorAppointments onOpenMedical={openMedical} onOpenEye={openEye} />
          </div>
        )}

        {activeView === "medical" && selectedPatientId && (
          <div className="animate-in zoom-in-95 duration-500">
            <MedicalPrescription patientId={selectedPatientId} onBack={backToAppointments} />
          </div>
        )}

        {activeView === "eye" && selectedPatientId && (
          <div className="animate-in zoom-in-95 duration-500">
            <PrescriptionPage patientId={selectedPatientId} onBack={backToAppointments} />
          </div>
        )}
        {activeView === "prescriptions" && (
          <div className="animate-in zoom-in-95 duration-500">
            <DoctorPrescriptionView />
          </div>
        )}

      </main>
    </SidebarProvider>
  );
}

function StatCard({ title, value, icon, color, loading, progress }) {
  const colors = { blue: "bg-blue-600", emerald: "bg-emerald-500", orange: "bg-orange-500", purple: "bg-purple-500" };
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden relative transition-transform hover:scale-[1.02]">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colors[color]}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">{icon}</div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-4xl font-black tracking-tighter">
          {loading ? <Loader2 className="animate-spin h-8 w-8 text-slate-300" /> : value}
        </div>
        {progress !== undefined && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4">
            <div className={`${colors[color]} h-full rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}