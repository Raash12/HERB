import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

// PREMIUM COMPONENTS
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// CUSTOM VIEWS
import Medical from "../doctor/Medical"; 
import MedicalReport from "../../report/medicalReport";
import OpticalReport from "../../report/opticalReport";
import AdminPatients from "../reception/AdminPatients"; 
import SecuritySettings from "../../security/SecuritySettings";

// UI COMPONENTS
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ICONS
import {
  Users, X, Search, ChevronLeft, ChevronRight, LayoutDashboard, Sun, Moon, 
  Lock, LogOut, Building2, Activity, Trash2, Edit3, FileText, Eye, 
  UserRoundSearch, Zap, TrendingUp, Sparkles, UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stockCount, setStockCount] = useState(0); 
  const [patientCount, setPatientCount] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Forms
  const [bForm, setBForm] = useState({ name: "", location: "", phone: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });
  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bSnap, uSnap, sSnap, pSnap] = await Promise.all([
        getDocs(collection(db, "branches")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "branch_medicines")),
        getDocs(collection(db, "patients"))
      ]);

      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStockCount(sSnap.size); 
      setPatientCount(pSnap.size); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  // --- LOGIC HELPERS ---
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fadlan buuxi!");
    try {
      setLoading(true);
      editBranchId ? await updateDoc(doc(db, "branches", editBranchId), bForm) : await addDoc(collection(db, "branches"), bForm);
      setBForm({ name: "", location: "", phone: "" }); setShowBranchModal(false); setEditBranchId(null); fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleAddUser = async () => {
    if (!uForm.email || (!editUserId && !uForm.password)) return alert("Email iyo Password!");
    try {
      setLoading(true);
      if (editUserId) {
        await updateDoc(doc(db, "users", editUserId), uForm);
      } else {
        const res = await createUserWithEmailAndPassword(auth, uForm.email, uForm.password);
        await setDoc(doc(db, "users", res.user.uid), { ...uForm, id: res.user.uid });
      }
      setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });
      setShowUserModal(false); setEditUserId(null); fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (coll, id) => {
    if (!window.confirm("Ma hubtaa?")) return;
    try { await deleteDoc(doc(db, coll, id)); fetchData(); } catch (err) { alert(err.message); }
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeView === "branches") return branches.filter(b => b.name?.toLowerCase().includes(term));
    if (activeView === "users") return users.filter(u => u.fullName?.toLowerCase().includes(term) || u.branch?.toLowerCase().includes(term));
    return [];
  };

  const dataToDisplay = filteredData();
  const totalPages = Math.ceil(dataToDisplay.length / itemsPerPage) || 1;
  const paginatedData = dataToDisplay.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Chart Data: Staff Role Distribution
  const roleData = [
    { name: 'Doctors', value: users.filter(u => u.role === 'doctor').length, color: '#3b82f6' },
    { name: 'Reception', value: users.filter(u => u.role === 'reception').length, color: '#10b981' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#8b5cf6' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#020617]">
        {/* FIXED SIDEBAR */}
        <Sidebar className="border-r border-white/5 bg-[#0F172A] text-slate-400 h-screen shrink-0 shadow-2xl">
          <SidebarContent className="p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
                <TrendingUp size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tighter text-white uppercase leading-none">HORSEED</h1>
                <span className="text-[9px] font-bold text-blue-400 tracking-[0.3em] uppercase">Control Center</span>
              </div>
            </div>
            
            <SidebarMenu className="space-y-2">
              <AdminNavItem label="Overview" icon={<LayoutDashboard size={18}/>} active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
              <AdminNavItem label="Patients" icon={<UserRoundSearch size={18}/>} active={activeView === "patients"} onClick={() => setActiveView("patients")} />
              <AdminNavItem label="Pharmacy" icon={<Activity size={18}/>} active={activeView === "medical"} onClick={() => setActiveView("medical")} />
              <AdminNavItem label="Branches" icon={<Building2 size={18}/>} active={activeView === "branches"} onClick={() => setActiveView("branches")} />
              <AdminNavItem label="Staff" icon={<Users size={18}/>} active={activeView === "users"} onClick={() => setActiveView("users")} />
              
              <div className="px-6 mt-8 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Reporting</div>
              <AdminNavItem label="Medical" icon={<FileText size={18}/>} active={activeView === "medical_report"} onClick={() => setActiveView("medical_report")} />
              <AdminNavItem label="Optical" icon={<Eye size={18}/>} active={activeView === "optical_report"} onClick={() => setActiveView("optical_report")} />
              <AdminNavItem label="Security" icon={<Lock size={18}/>} active={activeView === "security"} onClick={() => setActiveView("security")} />
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-6 space-y-3 border-t border-white/5">
            <button onClick={toggleDark} className="flex items-center gap-4 w-full p-3 rounded-2xl text-slate-400 hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-widest">
              {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-400" />} Appearance
            </button>
            <button onClick={async () => { await signOut(auth); navigate("/"); }} className="flex items-center gap-4 text-red-400 font-black uppercase text-[10px] p-3 hover:bg-red-500/10 rounded-2xl transition-all w-full">
              <LogOut size={18} /> Exit System
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto p-10 space-y-10">
            
            {/* ADMIN WELCOME BANNER */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-blue-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administrator</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight dark:text-white">
                    Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Analytics</span>
                  </h2>
                  <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">Monitoring {branches.length} branches across the organization</p>
                </div>
                <div className="bg-blue-600/5 p-4 rounded-3xl border border-blue-600/10">
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Global Patient Count</p>
                   <p className="text-3xl font-black dark:text-white">{patientCount}</p>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeView === "dashboard" && (
                <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  {/* STATS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AdminMiniStat label="Branches" val={branches.length} icon={<Building2/>} color="blue" />
                    <AdminMiniStat label="Total Personnel" val={users.length} icon={<Users/>} color="emerald" />
                    <AdminMiniStat label="Inventory" val={stockCount} icon={<Zap/>} color="indigo" />
                    <AdminMiniStat label="Security Log" val="Secure" icon={<Lock/>} color="rose" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* CHART AREA */}
                    <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3.5rem] bg-white dark:bg-slate-900 p-10 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-1">Growth Overview</h3>
                          <p className="text-2xl font-black tracking-tighter dark:text-white">Patient Enrollment Trends</p>
                        </div>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            {n: 'Jan', v: 20}, {n: 'Feb', v: 45}, {n: 'Mar', v: 38}, {n: 'Apr', v: patientCount}
                          ]}>
                            <defs>
                              <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                            <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={4} fill="url(#adminGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* PIE CHART STAFF DISTRIBUTION */}
                    <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white dark:bg-slate-900 p-10 flex flex-col items-center">
                       <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-6">Staff Roles</h3>
                       <div className="h-[200px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                               {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                             </Pie>
                             <Tooltip />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                       <div className="mt-4 space-y-2 w-full">
                          {roleData.map(r => (
                            <div key={r.name} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                              <span className="text-[10px] font-black uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: r.color}} /> {r.name}
                              </span>
                              <span className="font-black">{r.value}</span>
                            </div>
                          ))}
                       </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* TABLE VIEWS (Branches / Users) */}
              {(activeView === "branches" || activeView === "users") && (
                <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">
                        {activeView === "users" ? "Staff Directory" : "Branch Network"}
                      </h2>
                    </div>
                    <div className="flex gap-4">
                      <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input placeholder="Search..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-bold uppercase" />
                      </div>
                      <Button onClick={() => activeView === "branches" ? setShowBranchModal(true) : setShowUserModal(true)} className="bg-blue-600 rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20">
                        Add New
                      </Button>
                    </div>
                  </div>

                  <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow className="border-none">
                          <TableCell className="font-black py-6 pl-10 uppercase text-[10px] text-slate-400 tracking-widest">Identity</TableCell>
                          {activeView === "users" && <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Placement</TableCell>}
                          <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">{activeView === "branches" ? "Location" : "Privilege"}</TableCell>
                          <TableCell className="font-black text-right pr-10 uppercase text-[10px] text-slate-400 tracking-widest">Management</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((item) => (
                          <TableRow key={item.id} className="border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <TableCell className="py-6 pl-10">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xs uppercase">{(item.fullName || item.name).substring(0,2)}</div>
                                  <p className="font-black uppercase text-sm dark:text-white">{item.fullName || item.name}</p>
                               </div>
                            </TableCell>
                            {activeView === "users" && (
                              <TableCell>
                                <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase">
                                  {item.branch || "Global"}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="text-[11px] font-bold text-slate-500 uppercase">
                              {item.location || item.role}
                            </TableCell>
                            <TableCell className="text-right pr-10 space-x-2">
                              <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-blue-50 text-blue-600" onClick={() => {
                                if (activeView === "branches") { setEditBranchId(item.id); setBForm(item); setShowBranchModal(true); }
                                else { setEditUserId(item.id); setUForm({ ...item, password: "" }); setShowUserModal(true); }
                              }}><Edit3 size={16} /></Button>
                              <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-red-50 text-red-500" onClick={() => handleDelete(activeView, item.id)}><Trash2 size={16} /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-8 flex items-center justify-between border-t dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry {paginatedData.length} of {dataToDisplay.length}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" className="h-12 w-12 rounded-2xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18}/></Button>
                        <Button variant="outline" className="h-12 w-12 rounded-2xl" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18}/></Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeView === "patients" && <AdminPatients />}
              {activeView === "medical" && <Medical />}
              {activeView === "medical_report" && <MedicalReport />}
              {activeView === "optical_report" && <OpticalReport />}
              {activeView === "security" && <SecuritySettings onSuccess={() => setActiveView("dashboard")} />}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* MODALS - STYLED PREMIUM */}
      {(showBranchModal || showUserModal) && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative border border-white/10">
            <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); }} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter dark:text-white flex items-center gap-3">
              <UserCheck className="text-blue-600" /> {editUserId || editBranchId ? "Update" : "Register"} {activeView === "users" ? "Staff" : "Branch"}
            </h2>
            <div className="space-y-4">
              {showUserModal && (
                <>
                  <Input placeholder="FULL NAME" value={uForm.fullName} onChange={e => setUForm({ ...uForm, fullName: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />
                  <Input placeholder="EMAIL ADDRESS" value={uForm.email} onChange={e => setUForm({ ...uForm, email: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />
                  {!editUserId && <Input type="password" placeholder="PASSWORD" value={uForm.password} onChange={e => setUForm({ ...uForm, password: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />}
                  <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-4 text-[10px] font-black uppercase tracking-widest" value={uForm.branch} onChange={e => setUForm({ ...uForm, branch: e.target.value })}>
                    <option value="">SELECT BRANCH</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-4 text-[10px] font-black uppercase tracking-widest" value={uForm.role} onChange={e => setUForm({ ...uForm, role: e.target.value })}>
                    <option value="doctor">DOCTOR</option>
                    <option value="reception">RECEPTION</option>
                    <option value="admin">ADMIN</option>
                  </select>
                  <Button onClick={handleAddUser} className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase tracking-widest mt-4">SAVE DATA</Button>
                </>
              )}
              {showBranchModal && (
                <>
                  <Input placeholder="BRANCH NAME" value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />
                  <Input placeholder="CONTACT PHONE" value={bForm.phone} onChange={e => setBForm({ ...bForm, phone: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />
                  <Input placeholder="LOCATION / CITY" value={bForm.location} onChange={e => setBForm({ ...bForm, location: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px]" />
                  <Button onClick={handleAddBranch} className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase tracking-widest mt-4">CONFIRM BRANCH</Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </SidebarProvider>
  );
}

// PREMIUM NAV HELPER
function AdminNavItem({ label, icon, active, onClick }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={onClick} className={`w-full flex items-center gap-4 h-14 px-4 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <div className={active ? 'scale-110' : ''}>{icon}</div>
        <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// PREMIUM STAT CARD
function AdminMiniStat({ label, val, icon, color }) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  };
  return (
    <Card className="border-none shadow-xl p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 transition-transform hover:-translate-y-2">
      <div className={`${colors[color]} p-3 rounded-2xl w-fit mb-4`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-3xl font-black dark:text-white tracking-tighter">{val}</h4>
    </Card>
  );
}