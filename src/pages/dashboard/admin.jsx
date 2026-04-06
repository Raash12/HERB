import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

// COMPONENTS
import MedicalReport from "../../report/medicalReport";
import OpticalReport from "../../report/opticalReport";

// UI COMPONENTS (Shadcn UI)
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ICONS
import {
  Users, Loader2, X, Search, ChevronLeft, ChevronRight,
  LayoutDashboard, Sun, Moon, Lock, LogOut, Building2, Activity, Trash2, Edit3, Plus, KeyRound, FileText, Eye
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Forms
  const [bForm, setBForm] = useState({ name: "", location: "", phone: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });
  const [sForm, setSForm] = useState({ medicineName: "", quantity: "", price: "", branchId: "" });
  const [passForm, setPassForm] = useState({ current: "", new: "", repeat: "" });

  // Modals/Edit IDs
  const [editStockId, setEditStockId] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bSnap = await getDocs(collection(db, "branches"));
      const uSnap = await getDocs(collection(db, "users"));
      const sSnap = await getDocs(collection(db, "branch_medicines"));

      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStock(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  // --- ACTIONS ---
  const handleUpdatePassword = async () => {
    if (passForm.new !== passForm.repeat) return alert("Passwords do not match!");
    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passForm.new);
      alert("Password updated successfully!");
      setPassForm({ current: "", new: "", repeat: "" });
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleSaveStock = async () => {
    if (!sForm.medicineName || !sForm.quantity || !sForm.branchId) return alert("Fadlan buuxi!");
    try {
      setLoading(true);
      const stockData = { ...sForm, medicineName: sForm.medicineName.toLowerCase(), quantity: Number(sForm.quantity), price: Number(sForm.price || 0) };
      editStockId ? await updateDoc(doc(db, "branch_medicines", editStockId), stockData) : await addDoc(collection(db, "branch_medicines"), stockData);
      setSForm({ medicineName: "", quantity: "", price: "", branchId: "" });
      setShowStockModal(false); setEditStockId(null); fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

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

  // --- FILTER & PAGINATION LOGIC ---
  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeView === "branches") return branches.filter(b => b.name?.toLowerCase().includes(term));
    if (activeView === "users") return users.filter(u => u.fullName?.toLowerCase().includes(term) || u.branch?.toLowerCase().includes(term));
    if (activeView === "medical") return stock.filter(s => s.medicineName?.toLowerCase().includes(term));
    return [];
  };

  const dataToDisplay = filteredData();
  const totalPages = Math.ceil(dataToDisplay.length / itemsPerPage) || 1;
  const paginatedData = dataToDisplay.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          <div className="p-6 mb-4 font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter uppercase">
            HERB <span className="text-slate-400 font-light text-sm italic">Admin</span>
          </div>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <LayoutDashboard size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "medical"} onClick={() => { setActiveView("medical"); setCurrentPage(1); setSearchTerm(""); }}>
                <Activity size={18} className="text-blue-500" /> <span className="font-bold text-xs uppercase tracking-wider">Pharmacy Stock</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "branches"} onClick={() => { setActiveView("branches"); setCurrentPage(1); setSearchTerm(""); }}>
                <Building2 size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Branches</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "users"} onClick={() => { setActiveView("users"); setCurrentPage(1); setSearchTerm(""); }}>
                <Users size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Staff</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-6 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Analytics & Reports
            </div>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "medical_report"} onClick={() => setActiveView("medical_report")}>
                <FileText size={18} className="text-emerald-500" /> <span className="font-bold text-xs uppercase tracking-wider">Medical Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "optical_report"} onClick={() => setActiveView("optical_report")}>
                <Eye size={18} className="text-purple-500" /> <span className="font-bold text-xs uppercase tracking-wider">Optical Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "security"} onClick={() => setActiveView("security")}>
                <Lock size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
           <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs flex items-center mb-1">
              {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              <span className="ml-2 font-bold uppercase">{darkMode ? "Light" : "Dark"} Mode</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={async () => { await signOut(auth); navigate("/"); }} className="text-red-500 h-10 rounded-xl text-xs flex items-center">
              <LogOut size={16} /> <span className="ml-2 font-bold uppercase">Logout</span>
            </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">

          {/* DASHBOARD OVERVIEW */}
          {activeView === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Building2 className="text-blue-600 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400">Branches</p>
                <h3 className="text-3xl font-black">{branches.length}</h3>
              </Card>
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Users className="text-emerald-500 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400">Total Staff</p>
                <h3 className="text-3xl font-black">{users.length}</h3>
              </Card>
              <Card className="p-8 rounded-[1.5rem] bg-blue-600 text-white border-none shadow-sm cursor-pointer" onClick={() => setActiveView("medical")}>
                <Activity className="mb-2" size={28} />
                <p className="text-[10px] font-black uppercase opacity-80">Pharmacy Inventory</p>
                <h3 className="text-xl font-black">Manage Stock ({stock.length}) →</h3>
              </Card>
            </div>
          )}

          {/* MAIN TABLES (BRANCHES / USERS / MEDICAL) */}
        {/* MAIN TABLES (BRANCHES / USERS / MEDICAL) */}
          {(activeView === "branches" || activeView === "users" || activeView === "medical") && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">{activeView === "users" ? "Staff Management" : activeView}</h2>
                <Button onClick={() => {
                  if (activeView === "branches") setShowBranchModal(true);
                  else if (activeView === "users") setShowUserModal(true);
                  else setShowStockModal(true);
                }} className="bg-blue-600 rounded-xl font-bold uppercase text-[10px]">
                  Add New {activeView.slice(0, -1)}
                </Button>
              </div>

              <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex items-center gap-2">
                  <Search size={18} className="text-slate-400" />
                  <Input 
                    placeholder={`Search ${activeView}...`} 
                    className="bg-transparent border-none focus-visible:ring-0" 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  />
                </div>
                <Table>
                  <TableHeader className="bg-blue-600/5">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-bold py-4 pl-6 uppercase text-[10px] text-blue-600">
                        {activeView === "users" ? "Full Name" : "Name"}
                      </TableCell>
                      {activeView === "users" && <TableCell className="font-bold uppercase text-[10px] text-blue-600">Branch</TableCell>}
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">
                        {activeView === "branches" ? "Location" : activeView === "users" ? "Role" : "Quantity"}
                      </TableCell>

                      {/* ADDED UNIT PRICE HEADER */}
                      {activeView === "medical" && <TableCell className="font-bold uppercase text-[10px] text-blue-600">Unit Price</TableCell>}
                      
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">
                        {activeView === "medical" ? "Total Value" : ""}
                      </TableCell>
                      
                      <TableCell className="font-bold text-right pr-6 uppercase text-[10px] text-blue-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => {
                      // MATH: Calculate Unit Price
                      const unitPrice = activeView === "medical" && item.quantity > 0 
                        ? (item.price / item.quantity).toFixed(2) 
                        : "0.00";

                      return (
                        <TableRow key={item.id} className="border-slate-50 dark:border-slate-800">
                         <TableCell className="py-4 pl-6 font-bold uppercase text-slate-700">
  <div className="flex flex-col">
    {item.medicineName}
    {/* This shows the Branch Name specifically for this medicine */}
    <span className="text-[9px] text-blue-500 font-black tracking-widest mt-1">
      LOCATION: {item.branchId || "MAIN"}
    </span>
  </div>
</TableCell>
                          
                          {activeView === "users" && (
                            <TableCell>
                              <Badge variant="outline" className="text-blue-600 border-blue-200 uppercase text-[9px] font-black">
                                {item.branch || "No Branch"}
                              </Badge>
                            </TableCell>
                          )}

                          <TableCell className="text-xs font-bold text-slate-500 uppercase">
                            {item.location || item.role || item.quantity}
                          </TableCell>

                          {/* ADDED UNIT PRICE CELL */}
                          {activeView === "medical" && (
                            <TableCell className="font-bold text-slate-400">
                              ${unitPrice}
                            </TableCell>
                          )}
                          

                          {activeView === "medical" && (
                            <TableCell className="font-bold text-emerald-600">
                              ${item.price.toFixed(2)}
                            </TableCell>
                          )}

                          <TableCell className="text-right pr-6 space-x-1">
                            <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => {
                              if (activeView === "branches") { setEditBranchId(item.id); setBForm(item); setShowBranchModal(true); }
                              else if (activeView === "users") { setEditUserId(item.id); setUForm({ ...item, password: "" }); setShowUserModal(true); }
                              else { setEditStockId(item.id); setSForm(item); setShowStockModal(true); }
                            }}><Edit3 size={16} /></Button>
                            <Button variant="ghost" size="sm" className="text-red-500 font-bold" onClick={() => handleDelete(activeView === "medical" ? "branch_medicines" : activeView, item.id)}><Trash2 size={16} /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {/* ... (Pagination Controls stay the same) ... */}
                {/* PAGINATION CONTROLS */}
                <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="rounded-lg h-8 w-8 p-0"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeView === "medical_report" && <MedicalReport />}
          {activeView === "optical_report" && <OpticalReport />}
          {activeView === "security" && (
             <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom-4 mt-10">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="text-blue-600" size={32} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Security</h2>
                </div>
                <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 space-y-4">
                    <Input type="password" placeholder="Current Password" value={passForm.current} onChange={e => setPassForm({ ...passForm, current: e.target.value })} className="h-12 rounded-xl" />
                    <Input type="password" placeholder="New Password" value={passForm.new} onChange={e => setPassForm({ ...passForm, new: e.target.value })} className="h-12 rounded-xl" />
                    <Input type="password" placeholder="Repeat Password" value={passForm.repeat} onChange={e => setPassForm({ ...passForm, repeat: e.target.value })} className="h-12 rounded-xl" />
                    <Button onClick={handleUpdatePassword} disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                </Card>
             </div>
          )}
        </div>
      </main>

      {/* MODALS (STAY THE SAME WITH BRANCH SELECTION) */}
      {(showBranchModal || showUserModal || showStockModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative border-t-8 border-blue-600">
            <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); setShowStockModal(false); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><X size={24} /></button>
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Manage {activeView}</h2>
            <div className="space-y-4">
              {showUserModal && (
                <>
                  <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({ ...uForm, fullName: e.target.value })} className="h-12 rounded-xl" />
                  <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({ ...uForm, email: e.target.value })} className="h-12 rounded-xl" />
                  {!editUserId && <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({ ...uForm, password: e.target.value })} className="h-12 rounded-xl" />}
                  <select className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm font-bold" value={uForm.branch} onChange={e => setUForm({ ...uForm, branch: e.target.value })}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <select className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm font-bold" value={uForm.role} onChange={e => setUForm({ ...uForm, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="reception">Reception</option>
                  </select>
                  <Button onClick={handleAddUser} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">Save Staff</Button>
                </>
              )}
              {showBranchModal && (
                <>
                  <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} className="h-12 rounded-xl" />
                  <Input placeholder="Telephone" value={bForm.phone} onChange={e => setBForm({ ...bForm, phone: e.target.value })} className="h-12 rounded-xl" />
                  <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({ ...bForm, location: e.target.value })} className="h-12 rounded-xl" />
                  <Button onClick={handleAddBranch} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">Save Branch</Button>
                </>
              )}
              {showStockModal && (
                <>
                  <Input placeholder="Medicine Name" value={sForm.medicineName} onChange={e => setSForm({ ...sForm, medicineName: e.target.value })} className="h-12 rounded-xl" />
                  <Input type="number" placeholder="Quantity" value={sForm.quantity} onChange={e => setSForm({ ...sForm, quantity: e.target.value })} className="h-12 rounded-xl" />
                  <Input type="number" placeholder="Price" value={sForm.price} onChange={e => setSForm({ ...sForm, price: e.target.value })} className="h-12 rounded-xl" />
                  <select className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm font-bold" value={sForm.branchId} onChange={e => setSForm({ ...sForm, branchId: e.target.value })}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <Button onClick={handleSaveStock} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">Save Stock</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}