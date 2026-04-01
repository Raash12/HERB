import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

// COMPONENTS
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
  const [bForm, setBForm] = useState({ name: "", location: "" });
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

  // --- SECURITY: CHANGE PASSWORD ---
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
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: ADD/UPDATE STOCK ---
  const handleSaveStock = async () => {
    if(!sForm.medicineName || !sForm.quantity || !sForm.branchId) return alert("Fadlan buuxi!");
    try {
      setLoading(true);
      const stockData = {
        medicineName: sForm.medicineName.toLowerCase(),
        quantity: Number(sForm.quantity),
        price: Number(sForm.price || 0),
        branchId: sForm.branchId
      };
      if (editStockId) {
        await updateDoc(doc(db, "branch_medicines", editStockId), stockData);
      } else {
        await addDoc(collection(db, "branch_medicines"), stockData);
      }
      setSForm({ medicineName: "", quantity: "", price: "", branchId: "" });
      setEditStockId(null); setShowStockModal(false); fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fadlan buuxi!");
    try {
      setLoading(true);
      editBranchId ? await updateDoc(doc(db, "branches", editBranchId), bForm) : await addDoc(collection(db, "branches"), bForm);
      setBForm({ name: "", location: "" }); setEditBranchId(null); setShowBranchModal(false); fetchData();
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
      setEditUserId(null); setShowUserModal(false); fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (coll, id) => {
    if (!window.confirm("Ma hubtaa?")) return;
    try { await deleteDoc(doc(db, coll, id)); fetchData(); } catch (err) { alert(err.message); }
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeView === "branches") return branches.filter(b => b.name?.toLowerCase().includes(term));
    if (activeView === "users") return users.filter(u => u.fullName?.toLowerCase().includes(term));
    if (activeView === "medical") return stock.filter(s => s.medicineName?.toLowerCase().includes(term));
    return [];
  };

  const dataToDisplay = filteredData();
  const paginatedData = dataToDisplay.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(dataToDisplay.length / itemsPerPage) || 1;

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
              <SidebarMenuButton isActive={activeView === "medical"} onClick={() => { setActiveView("medical"); setCurrentPage(1); }}>
                <Activity size={18} className="text-blue-500" /> <span className="font-bold text-xs uppercase tracking-wider">Pharmacy Stock</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "branches"} onClick={() => { setActiveView("branches"); setCurrentPage(1); }}>
                <Building2 size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Branches</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "users"} onClick={() => { setActiveView("users"); setCurrentPage(1); }}>
                <Users size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Staff</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* --- REPORTS SECTION --- */}
            <div className="px-6 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Analytics & Reports
            </div>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "medical_report"} onClick={() => { setActiveView("medical_report"); setCurrentPage(1); }}>
                <FileText size={18} className="text-emerald-500" /> <span className="font-bold text-xs uppercase tracking-wider">Medical Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "optical_report"} onClick={() => { setActiveView("optical_report"); setCurrentPage(1); }}>
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
          <div className="flex flex-col gap-1">
            <SidebarMenuButton onClick={toggleDark} className="h-10 rounded-xl text-xs flex items-center">
              {darkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              <span className="ml-2 font-bold uppercase">{darkMode ? "Light" : "Dark"} Mode</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={async () => { await signOut(auth); navigate("/"); }} className="text-red-500 h-10 rounded-xl text-xs flex items-center">
              <LogOut size={16} /> <span className="ml-2 font-bold uppercase">Logout</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          
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

          {activeView === "medical" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Inventory Management</h2>
                <div className="flex gap-3">
                   <Badge className="bg-blue-100 text-blue-600 border-none px-4 py-1 rounded-lg font-bold uppercase">{stock.length} Items</Badge>
                   <Button onClick={() => { setEditStockId(null); setSForm({medicineName:"", quantity:"", price:"", branchId:""}); setShowStockModal(true); }} className="bg-blue-600 rounded-xl font-bold uppercase text-[10px] h-9">
                      <Plus size={14} className="mr-1" /> Add Stock
                   </Button>
                </div>
              </div>
              <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex items-center gap-2">
                  <Search size={18} className="text-slate-400" />
                  <Input placeholder="Search medicine..." className="bg-transparent border-none focus-visible:ring-0" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
                <Table>
                  <TableHeader className="bg-blue-600/5">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-bold py-4 pl-6 uppercase text-[10px] text-blue-600">Medicine</TableCell>
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">Branch</TableCell>
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">Stock</TableCell>
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">Price</TableCell>
                      <TableCell className="font-bold text-right pr-6 uppercase text-[10px] text-blue-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id} className="border-slate-50 dark:border-slate-800">
                        <TableCell className="py-4 pl-6 font-bold uppercase">{item.medicineName}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-500 uppercase">{item.branchId}</TableCell>
                        <TableCell>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                             {item.quantity} UNITS
                           </span>
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">${item.price}</TableCell>
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => { setEditStockId(item.id); setSForm(item); setShowStockModal(true); }}><Edit3 size={16} /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 font-bold" onClick={() => handleDelete("branch_medicines", item.id)}><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* REPORTS VIEWS */}
          {activeView === "medical_report" && (
            <div className="animate-in fade-in">
              <MedicalReport />
            </div>
          )}

          {activeView === "optical_report" && (
            <div className="animate-in fade-in">
              <OpticalReport />
            </div>
          )}

          {activeView === "security" && (
            <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom-4 mt-10">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Security Settings</h2>
                <p className="text-slate-400 text-sm">Update your account password</p>
              </div>

              <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Current Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                    value={passForm.current} 
                    onChange={e => setPassForm({...passForm, current: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-slate-400">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                    value={passForm.new} 
                    onChange={e => setPassForm({...passForm, new: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Repeat New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
                    value={passForm.repeat} 
                    onChange={e => setPassForm({...passForm, repeat: e.target.value})} 
                  />
                </div>

                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={loading} 
                  className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest mt-4 shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </Card>
            </div>
          )}

          {(activeView === "branches" || activeView === "users") && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">{activeView}</h2>
                <Button onClick={() => activeView === "branches" ? setShowBranchModal(true) : setShowUserModal(true)} className="bg-blue-600 rounded-xl font-bold uppercase text-xs">
                  Add {activeView === "branches" ? "Branch" : "Staff"}
                </Button>
              </div>
              <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-600/5">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-bold py-4 pl-6 uppercase text-[10px] text-blue-600">Name</TableCell>
                      <TableCell className="font-bold uppercase text-[10px] text-blue-600">{activeView === "branches" ? "Location" : "Role"}</TableCell>
                      <TableCell className="font-bold text-right pr-6 uppercase text-[10px] text-blue-600">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id} className="border-slate-50 dark:border-slate-800">
                        <TableCell className="py-4 pl-6 font-bold">{item.fullName || item.name}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-500 uppercase">{item.location || item.role}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => {
                            if(activeView === "branches") { setEditBranchId(item.id); setBForm(item); setShowBranchModal(true); }
                            else { setEditUserId(item.id); setUForm({...item, password: ""}); setShowUserModal(true); }
                          }}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-500 font-bold" onClick={() => handleDelete(activeView, item.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative border-t-8 border-blue-600 animate-in zoom-in-95">
             <button onClick={() => setShowStockModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><X size={24} /></button>
             <h2 className="text-xl font-black mb-6 uppercase tracking-tight">{editStockId ? "Edit Stock" : "Add New Stock"}</h2>
             <div className="space-y-4">
                <Input placeholder="Medicine Name" value={sForm.medicineName} onChange={e => setSForm({...sForm, medicineName: e.target.value})} className="h-12 rounded-xl" />
                <Input type="number" placeholder="Quantity" value={sForm.quantity} onChange={e => setSForm({...sForm, quantity: e.target.value})} className="h-12 rounded-xl" />
                <Input type="number" placeholder="Price" value={sForm.price} onChange={e => setSForm({...sForm, price: e.target.value})} className="h-12 rounded-xl" />
                <select className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm font-bold" value={sForm.branchId} onChange={e => setSForm({...sForm, branchId: e.target.value})}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <Button onClick={handleSaveStock} disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">{loading ? "Processing..." : "Save Stock"}</Button>
             </div>
          </div>
        </div>
      )}

      {(showBranchModal || showUserModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative border-t-8 border-blue-600 animate-in zoom-in-95">
              <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><X size={24} /></button>
              <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Details</h2>
              <div className="space-y-4">
                {activeView === "branches" ? (
                  <>
                    <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="h-12 rounded-xl" />
                    <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} className="h-12 rounded-xl" />
                    <Button onClick={handleAddBranch} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">Save Branch</Button>
                  </>
                ) : (
                  <>
                    <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} className="h-12 rounded-xl" />
                    <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} className="h-12 rounded-xl" />
                    {!editUserId && <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} className="h-12 rounded-xl" />}
                    <select className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm font-bold" value={uForm.branch} onChange={e => setUForm({...uForm, branch: e.target.value})}>
                      <option value="">Select Branch</option>
                      {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <Button onClick={handleAddUser} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest">Save User</Button>
                  </>
                )}
              </div>
            </div>
        </div>
      )}
    </SidebarProvider>
  );
}