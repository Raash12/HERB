import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, onSnapshot } from "firebase/firestore";

// Components
import CustomerRegistration from "../reception/CustomerRegistration";

import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, UserPlus, LogOut, Moon, Sun, 
  Users, UserCheck, Clock, PlusCircle, Loader2 
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, loading: true });
  const navigate = useNavigate();

  // --- DARK MODE LOGIC ---
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

  // --- DATABASE LOGIC (REAL-TIME STATS) ---
  useEffect(() => {
    const q = collection(db, "patients");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPatients = snapshot.docs.map(doc => doc.data());
      setStats({
        total: allPatients.length,
        pending: allPatients.filter(p => p.status === "pending").length,
        completed: allPatients.filter(p => p.status === "completed").length,
        loading: false
      });
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          {/* Logo Section - Font size reduced */}
          <div className="p-5 font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter">
            HERB <span className="text-gray-400 font-light text-base italic">RECEPTION</span>
          </div>
          
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === "dashboard"} 
                onClick={() => setActiveView("dashboard")}
                className="h-10 rounded-lg transition-all text-sm"
              >
                <LayoutDashboard size={18} /> <span className="font-semibold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === "registration"} 
                onClick={() => setActiveView("registration")}
                className="h-10 rounded-lg transition-all text-sm"
              >
                <UserPlus size={18} /> <span className="font-semibold">Registration</span>
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

      <main className="flex-1 bg-slate-50/50 dark:bg-[#020817] text-foreground transition-all duration-300 min-h-screen overflow-y-auto">
        
        {/* --- OVERVIEW VIEW --- */}
        {activeView === "dashboard" && (
          <div className="p-6 space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h1 className="text-2xl font-black tracking-tight uppercase text-gray-800 dark:text-gray-100">Reception</h1>
                <p className="text-muted-foreground font-medium text-xs">Patient management & queuing system.</p>
              </div>
              <Button 
                onClick={() => setActiveView("registration")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-600/20 px-5 h-9 text-xs"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> NEW PATIENT
              </Button>
            </div>

            {/* Stats Grid - Font and Padding reduced */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Registered</CardTitle>
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {stats.loading ? <Loader2 className="animate-spin h-5 w-5" /> : stats.total}
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">Database Records</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Awaiting Doctor</CardTitle>
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {stats.loading ? <Loader2 className="animate-spin h-5 w-5" /> : stats.pending}
                  </div>
                  <Badge variant="outline" className="mt-1 bg-orange-50 dark:bg-orange-950/20 text-orange-600 border-none font-black text-[9px] h-4">QUEUED</Badge>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Treated Today</CardTitle>
                  <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">
                    {stats.loading ? <Loader2 className="animate-spin h-5 w-5" /> : stats.completed}
                  </div>
                  <p className="text-[9px] text-indigo-500 font-bold mt-0.5 uppercase tracking-tighter">Visits Done</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Action Banner - Font sizes reduced */}
            <Card className="border-none shadow-lg bg-blue-600 text-white p-6 rounded-2xl overflow-hidden relative group">
               <div className="relative z-10 space-y-3">
                  <h2 className="text-xl font-black italic tracking-tighter uppercase">Reception Workflow</h2>
                  <p className="text-blue-50 text-xs max-w-xs leading-relaxed">Register new patients and assign them to available doctors in real-time.</p>
                  <Button 
                    variant="secondary" 
                    onClick={() => setActiveView("registration")}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-black px-5 h-9 rounded-lg text-[10px] uppercase tracking-wider shadow-lg"
                  >
                    Start Registration
                  </Button>
               </div>
               <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-105 transition-transform duration-700">
                  <UserPlus size={180} />
               </div>
            </Card>
          </div>
        )}

        {/* --- REGISTRATION VIEW --- */}
        {activeView === "registration" && (
          <div className="p-6 animate-in slide-in-from-bottom-4 duration-500">
            <CustomerRegistration />
          </div>
        )}
      </main>
    </SidebarProvider>
  );
}