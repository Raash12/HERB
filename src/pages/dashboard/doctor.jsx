import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase"; // Hubi in db halkan ku jiro
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Components
import DoctorAppointments from "../doctor/DoctorAppointments"; 

import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, Calendar, LogOut, Moon, Sun, Stethoscope,
  Users, CheckCircle2, Clock, TrendingUp, Loader2
} from "lucide-react";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  
  // States-ka xogta Database-ka
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    loading: true
  });

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  // --- DATABASE LOGIC: Halkan ayay xogta ka imaanaysaa ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Waxaan raadinaynaa bukaanada uu Doctor ID-goodu yahay ka hadda login-ka ah
    const q = query(
      collection(db, "patients"), 
      where("doctorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPatients = snapshot.docs.map(doc => doc.data());
      
      setStats({
        total: allPatients.length,
        completed: allPatients.filter(p => p.status === "completed").length,
        pending: allPatients.filter(p => p.status === "pending").length,
        loading: false
      });
    }, (error) => {
      console.error("Firestore Error:", error);
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

  // Xisaabinta boqolleyda (Success Rate)
  const successRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center gap-3 px-2 mb-8 mt-4 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0 shadow-lg shadow-blue-900/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">DOCTOR PORTAL</h1>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <LayoutDashboard size={20} />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "appointments"} onClick={() => setActiveView("appointments")}>
                <Calendar size={20} />
                <span>My Appointments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
          {/* Dark Mode Button */}
          <SidebarMenuButton onClick={toggleDark} className="h-9 rounded-lg text-xs w-full justify-start">
            {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
            <span className="font-medium ml-2">{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </SidebarMenuButton>
          
          {/* Logout Button - Isku xigaan hadda */}
          <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-9 rounded-lg text-xs w-full justify-start">
            <LogOut size={16} /> 
            <span className="font-medium ml-2">Logout Account</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-all duration-300 overflow-y-auto">
        
        {activeView === "dashboard" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight">Overview</h1>
              <p className="text-muted-foreground font-medium text-sm">Live data from your patient management system.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Visits</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.loading ? <Loader2 className="animate-spin h-6 w-6" /> : stats.total}</div>
                  <Badge variant="outline" className="mt-2 text-[10px] border-blue-200 text-blue-600">Total Scheduled</Badge>
                </CardContent>
              </Card>

              {/* Card 2: Completed */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.loading ? <Loader2 className="animate-spin h-6 w-6" /> : stats.completed}</div>
                  <p className="text-[10px] text-green-600 font-bold mt-1 uppercase">Processed</p>
                </CardContent>
              </Card>

              {/* Card 3: Pending */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats.loading ? <Loader2 className="animate-spin h-6 w-6" /> : stats.pending}</div>
                  <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">Waiting</p>
                </CardContent>
              </Card>

              {/* Card 4: Success Rate */}
              <Card className="border-none shadow-sm bg-white dark:bg-gray-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{successRate}%</div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full mt-3">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-8 bg-blue-600 text-white border-none shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="relative z-10 space-y-4 text-center md:text-left">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Ready to Work?</h2>
                  <p className="text-blue-100 text-sm max-w-sm">Waxaad hadda haysataa {stats.pending} bukaan oo ku sugaya. Guji badhanka si aad u bilowdo shaqada.</p>
                  <button 
                    onClick={() => setActiveView("appointments")}
                    className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-black text-xs hover:shadow-xl transition-all uppercase tracking-widest"
                  >
                    Start Consultation
                  </button>
                </div>
                <div className="opacity-10 hidden md:block">
                  <Stethoscope size={150} strokeWidth={1} />
                </div>
              </Card>

              <Card className="p-6 border-none shadow-sm bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-lg tracking-tight">Cloud Sync</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-black mt-1 tracking-widest">Database is live</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeView === "appointments" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <DoctorAppointments />
          </div>
        )}

      </main>
    </SidebarProvider>
  );
}