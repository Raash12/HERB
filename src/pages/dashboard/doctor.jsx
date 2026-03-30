import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, Users, Calendar, ClipboardList, 
  LogOut, Moon, Sun, Stethoscope 
} from "lucide-react";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  // Dark Mode Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 mb-8 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0 shadow-lg shadow-blue-900/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight truncate whitespace-nowrap text-white">
              DOCTOR PORTAL
            </h1>
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
                <span>Appointments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "patients"} onClick={() => setActiveView("patients")}>
                <Users size={20} />
                <span>My Patients</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "records"} onClick={() => setActiveView("records")}>
                <ClipboardList size={20} />
                <span>Medical Records</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-2">
            <SidebarMenuButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
            
            <SidebarMenuButton onClick={handleLogout} className="text-red-400 hover:bg-red-900/20">
              <LogOut size={20} />
              <span>Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* MAIN CONTENT Area */}
      <main className="flex-1 p-8 transition-all duration-300 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-y-auto">
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Doctor Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                  Ku soo dhowow nidaamka maamulka caafimaadka.
                </p>
              </div>
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none px-5 py-1.5 text-sm font-medium">
                Active Session
              </Badge>
            </div>

            <hr className="my-8 border-gray-100 dark:border-gray-800" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-hover hover:border-blue-500/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Today's Visits</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400">14</p>
               </div>
               <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-hover hover:border-blue-500/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">New Reports</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">5</p>
               </div>
               <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-hover hover:border-blue-500/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pending Surgery</p>
                  <p className="text-3xl font-black text-orange-600 dark:text-orange-400">2</p>
               </div>
               <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-hover hover:border-blue-500/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Patients</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">1.2k</p>
               </div>
            </div>

            {/* Quick Actions Placeholder */}
            <div className="mt-12 p-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                  <ClipboardList size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Ma jirto ballan hadda kuu dhow</h3>
                <p className="text-gray-500 max-w-xs mt-2">Marka ballamadu soo baxaan, halkan ayaad ka arki doontaa liiska bukaannada.</p>
            </div>

          </CardContent>
        </Card>
      </main>
    </SidebarProvider>
  );
}