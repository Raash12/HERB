import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, onSnapshot, query, where, getDoc, doc } from "firebase/firestore";

// Components
import CustomerRegistration from "../reception/CustomerRegistration";
import ReceptionPrescriptions from "../reception/ReceptionPrescriptions"; 

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
  Users, Clock, FileText, Lock, Search, ChevronLeft, ChevronRight, Loader2, KeyRound 
} from "lucide-react";

export default function ReceptionDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [prescriptions, setPrescriptions] = useState([]);
  const [showBadge, setShowBadge] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  // Security State
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

  // Real-time Data Listeners
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 1. PATIENTS STATS LISTENER
    const unsubPatients = onSnapshot(collection(db, "patients"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      setStats({
        total: docs.length,
        pending: docs.filter(p => p.status === "pending" || p.status === "doctor").length,
      });
    });

    // 2. OPTICAL LISTENER
    const unsubOpt = onSnapshot(query(collection(db, "prescriptions"), where("sendTo", "==", currentUser.uid)), async (snap) => {
      const optData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        let name = data.patientName || "Unnamed Patient";
        if (!data.patientName && data.patientId) {
          const pDoc = await getDoc(doc(db, "patients", data.patientId));
          if (pDoc.exists()) name = pDoc.data().fullName || pDoc.data().name;
        }
        return { id: d.id, ...data, category: 'optical', displayName: name };
      }));
      setPrescriptions(prev => {
        const filtered = prev.filter(p => p.category !== 'optical');
        return [...filtered, ...optData].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    });

    // 3. MEDICAL LISTENER (FIXED: Added Name Fetching)
    const unsubMed = onSnapshot(query(collection(db, "medical_prescriptions"), where("sendTo", "==", currentUser.uid)), async (snap) => {
      const medData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        
        // Priority 1: Check patientInfo (common in medical records)
        // Priority 2: Check standard patientName field
        let name = data.patientInfo?.name || data.patientInfo?.fullName || data.patientName || "Unnamed Medical";
        
        // Priority 3: Fetch from 'patients' collection if name is still generic
        if (name.includes("Unnamed") && data.patientId) {
          const pDoc = await getDoc(doc(db, "patients", data.patientId));
          if (pDoc.exists()) name = pDoc.data().fullName || pDoc.data().name;
        }

        return { 
          id: d.id, 
          ...data, 
          category: 'medical', 
          displayName: name 
        };
      }));

      setPrescriptions(prev => {
        if (medData.length > lastSeenCount.current && activeView !== "orders") setShowBadge(true);
        const filtered = prev.filter(p => p.category !== 'medical');
        return [...filtered, ...medData].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    });

    return () => { unsubPatients(); unsubOpt(); unsubMed(); };
  }, [activeView]);

  const filteredData = prescriptions.filter(item => 
    (item.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    } catch (err) { alert("Cillad: " + err.message); } finally { setLoading(false); }
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          <div className="p-6 mb-4 font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter uppercase">
            HERB <span className="text-slate-400 font-light text-sm italic tracking-normal">Reception</span>
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
              <SidebarMenuButton isActive={activeView === "orders"} onClick={() => { setActiveView("orders"); setShowBadge(false); setCurrentPage(1); lastSeenCount.current = prescriptions.length; }}>
                <FileText size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Prescriptions</span>
                {showBadge && <Badge className="bg-red-500 ml-auto animate-bounce text-[10px]">New</Badge>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "settings"} onClick={() => setActiveView("settings")}>
                <Lock size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
          <div className="flex flex-col gap-1">
            <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs flex items-center">
              {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              <span className="ml-2 font-bold uppercase">{darkMode ? "Light" : "Dark"}</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={async () => { await signOut(auth); navigate("/"); }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 rounded-xl text-xs flex items-center transition-all">
              <LogOut size={16} />
              <span className="ml-2 font-bold uppercase">Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          
          {activeView === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Users className="text-blue-600 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Patients</p>
                <h3 className="text-3xl font-black">{stats.total}</h3>
              </Card>
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Clock className="text-orange-500 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">In Waiting</p>
                <h3 className="text-3xl font-black">{stats.pending}</h3>
              </Card>
            </div>
          )}

          {activeView === "orders" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-xl shadow-blue-100/10 dark:shadow-none">
                <div className="relative w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="Search by patient name..." 
                    className="pl-12 h-12 border-none bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold focus-visible:ring-2 ring-blue-500" 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  />
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-6 py-2 rounded-xl border-blue-100 dark:border-blue-900/30 font-black tracking-widest">
                  {filteredData.length} RECORDS
                </Badge>
              </div>
              
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <ReceptionPrescriptions data={paginatedData} />
                <div className="p-4 flex items-center justify-between border-t dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2 pr-4">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={16}/>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={16}/>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeView === "settings" && (
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

          {activeView === "registration" && (
            <div className="animate-in fade-in"><CustomerRegistration /></div>
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}