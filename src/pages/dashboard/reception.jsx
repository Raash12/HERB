import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, query, onSnapshot, where } from "firebase/firestore";

// Components
import CustomerRegistration from "../reception/CustomerRegistration";
import ReceptionPrescriptions from "../reception/ReceptionPrescriptions"; 

import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, UserPlus, LogOut, Moon, Sun, 
  Users, Clock, FileText, Lock, Loader2
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password Change State
  const [passwords, setPasswords] = useState({ current: "", new: "", repeat: "" });
  
  const lastSeenCount = useRef(0);
  const navigate = useNavigate();

  // Dark Mode Logic
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

    const unsubPatients = onSnapshot(collection(db, "patients"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      setStats({
        total: docs.length,
        pending: docs.filter(p => p.status === "pending" || p.status === "doctor").length,
      });
    });

    const qOrders = query(
      collection(db, "prescriptions"),
      where("sendTo", "==", currentUser.uid)
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const currentCount = snapshot.docs.length;
      if (currentCount > lastSeenCount.current && activeView !== "orders") {
        setShowBadge(true);
      }
      setNewOrdersCount(currentCount);
      if (activeView === "orders") {
        lastSeenCount.current = currentCount;
      }
    });

    return () => { unsubPatients(); unsubOrders(); };
  }, [activeView]);

  const handleOpenOrders = () => {
    setActiveView("orders");
    setShowBadge(false);
    lastSeenCount.current = newOrdersCount;
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
      alert("Cillad ayaa dhacday: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          <div className="p-6 mb-4 font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter">
            HERB <span className="text-slate-400 font-light text-sm italic">RECEPTION</span>
          </div>
          
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} className="h-11 rounded-xl mb-1">
                <LayoutDashboard size={18} /> <span className="font-bold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "registration"} onClick={() => setActiveView("registration")} className="h-11 rounded-xl mb-1">
                <UserPlus size={18} /> <span className="font-bold">Registration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === "orders"} 
                onClick={handleOpenOrders} 
                className="h-11 rounded-xl flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} /> <span className="font-bold">Prescriptions</span>
                </div>
                {showBadge && (
                  <Badge className="bg-red-500 text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full animate-bounce border-none shadow-lg">
                    {newOrdersCount - lastSeenCount.current > 0 ? newOrdersCount - lastSeenCount.current : "!"}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* PASSWORD CHANGE SIDEBAR BUTTON */}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "settings"} onClick={() => setActiveView("settings")} className="h-11 rounded-xl mb-1">
                <Lock size={18} /> <span className="font-bold">Change Password</span>
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
              <LogOut size={16} /> <span className="ml-2 font-bold">Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          
          {activeView === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  Reception <span className="text-blue-600">Overview</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Live Monitoring System</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Users size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Patients</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10"><Clock size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Waiting</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.pending}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><FileText size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescriptions</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{newOrdersCount}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeView === "registration" && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CustomerRegistration />
            </div>
          )}
          
          {activeView === "orders" && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 flex justify-between items-center border-b pb-4 dark:border-slate-800">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Prescriptions List</h2>
                <Badge className="bg-blue-600 text-white font-bold">{newOrdersCount} Total</Badge>
              </div>
              <ReceptionPrescriptions />
            </div>
          )}

          {/* PASSWORD CHANGE VIEW */}
          {activeView === "settings" && (
            <div className="max-w-md mx-auto mt-10 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white dark:bg-slate-900 border-none shadow-xl p-8 rounded-[2rem] border-t-4 border-blue-600">
                <div className="text-center mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-blue-600" size={28} />
                  </div>
                  <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white">Security Settings</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Update your login credentials</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Current Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="h-12 rounded-xl dark:bg-slate-950 border-slate-100 dark:border-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="h-12 rounded-xl dark:bg-slate-950 border-slate-100 dark:border-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Repeat New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.repeat}
                      onChange={(e) => setPasswords({...passwords, repeat: e.target.value})}
                      className="h-12 rounded-xl dark:bg-slate-950 border-slate-100 dark:border-slate-800" 
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-black uppercase text-xs tracking-widest mt-4 shadow-lg shadow-blue-600/20"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Update Password"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>
    </SidebarProvider>
  );
}