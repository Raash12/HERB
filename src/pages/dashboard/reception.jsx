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
  LayoutDashboard, UserPlus, CalendarCheck, Receipt, 
  LogOut, Moon, Sun, Headphones 
} from "lucide-react";

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  // Markay darkMode isbeddesho, ku dar class-ka "dark" HTML-ka sare
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
          <div className="flex items-center gap-3 px-2 mb-8 overflow-hidden">
            <div className="bg-emerald-600 p-2 rounded-lg shrink-0">
              <Headphones size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight truncate whitespace-nowrap text-white">
              RECEPTION
            </h1>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "registration"} onClick={() => setActiveView("registration")}>
                <UserPlus size={20} />
                <span>New Registration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "booking"} onClick={() => setActiveView("booking")}>
                <CalendarCheck size={20} />
                <span>Book Appointment</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "billing"} onClick={() => setActiveView("billing")}>
                <Receipt size={20} />
                <span>Billing / Invoices</span>
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

      {/* MAIN CONTENT - Halkan ayaa isbeddelka laga sameeyay */}
      <main className="flex-1 p-8 transition-all duration-300 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-y-auto">
        
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Reception Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Fadlan hubi diiwaangelinta bukaanka cusub.
                </p>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-4 py-1">
                Front Desk
              </Badge>
            </div>

            <hr className="my-6 border-gray-100 dark:border-gray-800" />

            {/* Tusaale ahaan: Meel xogta lagu qoro ama Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <p className="text-sm font-medium opacity-60">Today's Patients</p>
                  <p className="text-2xl font-bold">24</p>
               </div>
               <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <p className="text-sm font-medium opacity-60">Pending Invoices</p>
                  <p className="text-2xl font-bold">12</p>
               </div>
               <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <p className="text-sm font-medium opacity-60">New Bookings</p>
                  <p className="text-2xl font-bold">8</p>
               </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </SidebarProvider>
  );
}