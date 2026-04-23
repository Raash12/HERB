import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";

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
  User as UserIcon, CalendarCheck, ShieldCheck 
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [userName, setUserName] = useState(""); 
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [prescriptions, setPrescriptions] = useState([]);
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
        setUserName(userData.displayName || userData.name || currentUser.email.split('@')[0]);
      }

      const branch = userDoc.exists() ? userDoc.data().branch : "";
      if (!branch) return;

      // Stats Logic for Total and Today
      const qPatients = query(collection(db, "patients"), where("branch", "==", branch));
      const unsubPatients = onSnapshot(qPatients, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const todayStr = new Date().toLocaleDateString('en-CA'); 

        setStats({
          total: docs.length,
          today: docs.filter(p => (p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-CA') : "") === todayStr).length
        });
      });

      const qPres = query(collection(db, "prescriptions"), where("sendTo", "==", currentUser.uid));
      const unsubPres = onSnapshot(qPres, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPrescriptions(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });

      return () => {
        unsubPatients();
        unsubPres();
      };
    };

    setupListeners();
  }, [activeView]);

  const filteredData = prescriptions.filter(item => 
    (item.patientName || item.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          <div className="p-6 mb-4">
            <div className="font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter uppercase">
              HERB <span className="text-slate-400 font-light text-sm italic tracking-normal">Reception</span>
            </div>
            {userName && (
              <Badge variant="outline" className="mt-2 text-[10px] border-blue-200 text-blue-500 uppercase">
                <UserIcon size={10} className="mr-1" /> {userName}
              </Badge>
            )}
          </div>
          
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <LayoutDashboard size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "registration"} onClick={() => setActiveView("registration")}>
                <UserPlus size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Registration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "orders"} onClick={() => { setActiveView("orders"); setCurrentPage(1); }}>
                <FileText size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Prescriptions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "settings"} onClick={() => setActiveView("settings")}>
                <ShieldCheck size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs flex items-center">
              {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              <span className="ml-2 font-bold uppercase">{darkMode ? "Light" : "Dark"}</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={async () => { await signOut(auth); navigate("/"); }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 rounded-xl text-xs flex items-center">
              <LogOut size={16} />
              <span className="ml-2 font-bold uppercase">Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {activeView === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">Analytics Overview</h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{userBranch} Branch</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <Card className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Patients</p>
                    <h3 className="text-2xl font-black">{stats.total}</h3>
                  </div>
                </Card>

                <Card className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                    <CalendarCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">New Today</p>
                    <h3 className="text-2xl font-black">{stats.today}</h3>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeView === "orders" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm">
                <div className="relative w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="Search patient..." 
                    className="pl-12 h-11 border-none bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold" 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  />
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">
                  {filteredData.length} Records
                </Badge>
              </div>
              <Card className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <ReceptionPrescriptions data={paginatedData} />
                <div className="p-4 flex items-center justify-between border-t dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2 pr-4">
                    <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={14}/>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={14}/>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeView === "settings" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
          {activeView === "registration" && <div className="animate-in fade-in duration-500"><CustomerRegistration /></div>}
        </div>
      </main>
    </SidebarProvider>
  );
}