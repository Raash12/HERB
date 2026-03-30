import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import {
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from "@/components/ui/sidebar";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Users, Loader2, X, Search, ChevronLeft, ChevronRight, LayoutDashboard, Sun, Moon } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [bForm, setBForm] = useState({ name: "", location: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });

  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Dark Mode Toggle Logic
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const fetchData = async () => {
    const bSnap = await getDocs(collection(db, "branches"));
    const uSnap = await getDocs(collection(db, "users"));
    setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useEffect(() => { fetchData(); }, []);

  // --- Filter Logic ---
  const getFilteredData = () => {
    if (activeView === "branches") {
      return branches.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeView === "users") {
      return users.filter(u => {
        const matchesSearch = (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesBranch = branchFilter === "all" || u.branch === branchFilter;
        return matchesSearch && matchesRole && matchesBranch;
      });
    }
    return [];
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, branchFilter, activeView]);

  // Handle Active/Inactive Toggle
  const handleToggleActive = async (user) => {
    try {
      const newStatus = !user.active;
      await updateDoc(doc(db, "users", user.id), { active: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
    } catch (err) { alert("Error updating status: " + err.message); }
  };

  // Actions
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fadlan buuxi meelaha banaan!");
    try {
      setLoading(true);
      if (editBranchId) {
        await updateDoc(doc(db, "branches", editBranchId), bForm);
        setBranches(prev => prev.map(b => b.id === editBranchId ? { id: b.id, ...bForm } : b));
      } else {
        const docRef = await addDoc(collection(db, "branches"), bForm);
        setBranches(prev => [...prev, { id: docRef.id, ...bForm }]);
      }
      setBForm({ name: "", location: "" });
      setEditBranchId(null);
      setShowBranchModal(false);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleAddUser = async () => {
    if (!uForm.email || (!editUserId && !uForm.password)) return alert("Email & Password ayaa loo baahan yahay");
    try {
      setLoading(true);
      if (editUserId) {
        const updateData = { ...uForm };
        if (!uForm.password) delete updateData.password;
        await updateDoc(doc(db, "users", editUserId), updateData);
        setUsers(prev => prev.map(u => u.id === editUserId ? { id: u.id, ...updateData } : u));
      } else {
        const res = await createUserWithEmailAndPassword(auth, uForm.email, uForm.password);
        const newUser = { id: res.user.uid, ...uForm };
        await setDoc(doc(db, "users", res.user.uid), newUser);
        setUsers(prev => [...prev, newUser]);
      }
      setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });
      setEditUserId(null);
      setShowUserModal(false);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (coll, id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto?")) return;
    try {
      await deleteDoc(doc(db, coll, id));
      if (coll === "branches") setBranches(prev => prev.filter(b => b.id !== id));
      else setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-slate-900 border-r border-slate-800 text-white transition-colors duration-300">
        <SidebarContent>
          <div className="p-6 text-xl font-black text-blue-500 tracking-tighter uppercase">ADMIN PANEL</div>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} className="h-12 rounded-lg font-bold hover:bg-blue-600/10 data-[active=true]:bg-blue-600 data-[active=true]:text-white mb-1">
                <LayoutDashboard size={20} /> Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "branches"} onClick={() => setActiveView("branches")} className="h-12 rounded-lg font-bold hover:bg-blue-600/10 data-[active=true]:bg-blue-600 data-[active=true]:text-white mb-1">
                <List size={20} /> Branches
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "users"} onClick={() => setActiveView("users")} className="h-12 rounded-lg font-bold hover:bg-blue-600/10 data-[active=true]:bg-blue-600 data-[active=true]:text-white mb-1">
                <Users size={20} /> Staff Users
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t border-slate-800 flex flex-col gap-2">
          {/* Dark Mode Toggle above Logout */}
          <Button 
            variant="ghost" 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full justify-start gap-3 h-10 font-bold uppercase text-[10px] text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          
          <Button variant="destructive" onClick={() => navigate("/")} className="w-full font-bold uppercase text-xs h-10 shadow-lg shadow-red-900/20">Logout</Button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-6 md:p-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-y-auto text-slate-900 dark:text-slate-100">

        {activeView === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm p-6 border-l-4 border-blue-600">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Branches</p>
              <h2 className="text-4xl font-black mt-1 dark:text-white">{branches.length}</h2>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-none shadow-sm p-6 border-l-4 border-emerald-500">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff Users</p>
              <h2 className="text-4xl font-black mt-1 dark:text-white">{users.length}</h2>
            </Card>
          </div>
        )}

        {(activeView === "branches" || activeView === "users") && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search records..." 
                    className="pl-10 h-11 border-slate-200 dark:border-slate-700 bg-transparent focus:ring-blue-600 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {activeView === "users" && (
                  <select className="h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-blue-500" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="reception">Reception</option>
                  </select>
                )}
              </div>
              <Button onClick={() => {
                if(activeView === "branches") { setEditBranchId(null); setBForm({ name: "", location: "" }); setShowBranchModal(true); }
                else { setEditUserId(null); setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true }); setShowUserModal(true); }
              }} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold uppercase text-xs shadow-lg shadow-blue-600/20">
                Add {activeView === "branches" ? "Branch" : "User"}
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-600">
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Name</TableCell>
                    <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest">{activeView === "branches" ? "Location" : "Role / Branch"}</TableCell>
                    <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Status</TableCell>
                    <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map(item => (
                      <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition">
                        <TableCell className="py-4 pl-6">
                           <div className="font-bold">{item.fullName || item.name}</div>
                           <div className="text-[10px] text-slate-400 font-mono uppercase">{item.email || "Branch Office"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                            {activeView === "branches" ? item.location : `${item.role} - ${item.branch || "Global"}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <button 
                            onClick={() => activeView === "users" && handleToggleActive(item)}
                            disabled={activeView === "branches"}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${item.active !== false ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'} ${activeView === "users" ? 'hover:scale-105 active:opacity-70 cursor-pointer' : 'cursor-default'}`}
                          >
                            {item.active !== false ? "Active" : "Inactive"}
                          </button>
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase border-slate-200 dark:border-slate-700 bg-transparent" onClick={() => {
                             if(activeView === "branches") { setEditBranchId(item.id); setBForm({ name: item.name, location: item.location }); setShowBranchModal(true); }
                             else { setEditUserId(item.id); setUForm({ ...item, password: "" }); setShowUserModal(true); }
                          }}>Edit</Button>
                          <Button size="sm" variant="destructive" className="h-8 text-[10px] font-bold uppercase" onClick={() => handleDelete(activeView === "branches" ? "branches" : "users", item.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400 font-bold uppercase text-xs">No Records Found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase bg-white dark:bg-slate-900" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={14} className="mr-1"/> Prev
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button key={i} onClick={() => setCurrentPage(i + 1)} className={`h-8 w-8 text-[10px] font-bold ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'}`}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase bg-white dark:bg-slate-900" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next <ChevronRight size={14} className="ml-1"/>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        {(showBranchModal || showUserModal) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl relative border-t-8 border-blue-600">
              <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); }} className="absolute top-4 right-4 text-slate-300 hover:text-blue-600 transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-xl font-black mb-6 text-blue-600 uppercase tracking-tight">
                {activeView === "branches" ? (editBranchId ? "Update Branch" : "Add New Branch") : (editUserId ? "Update Staff Account" : "Create Staff Account")}
              </h2>
              <div className="space-y-4">
                {activeView === "branches" ? (
                  <>
                    <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="h-12 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                    <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} className="h-12 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                  </>
                ) : (
                  <>
                    <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} className="h-11 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                    <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} disabled={!!editUserId} className="h-11 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                    {!editUserId && <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} className="h-11 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800" />}
                    <div className="grid grid-cols-2 gap-3">
                      <select className="h-11 px-3 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs uppercase bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500" value={uForm.role} onChange={e => setUForm({...uForm, role: e.target.value})}>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                        <option value="reception">Reception</option>
                      </select>
                      <select className="h-11 px-3 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs uppercase bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500" value={uForm.branch} onChange={e => setUForm({...uForm, branch: e.target.value})}>
                        <option value="">Select Branch</option>
                        {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <Button onClick={activeView === "branches" ? handleAddBranch : handleAddUser} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-black uppercase text-xs tracking-widest mt-4 shadow-lg shadow-blue-600/20">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Record"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </SidebarProvider>
  );
}