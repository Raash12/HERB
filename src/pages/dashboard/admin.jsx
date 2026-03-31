import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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
import { 
  List, Users, Loader2, X, Search, ChevronLeft, ChevronRight, 
  LayoutDashboard, Sun, Moon, Lock, ShieldCheck
} from "lucide-react";

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
  
  // Settings / Password State
  const [passwords, setPasswords] = useState({ current: "", new: "", repeat: "" });

  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

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

  // --- Password Change Logic ---
  const handleUpdatePassword = async () => {
    const { current, new: newPass, repeat } = passwords;
    if (!current || !newPass || !repeat) return alert("Fadlan buuxi dhammaan meelaha banaan!");
    if (newPass !== repeat) return alert("Password-ka cusub iyo ku celisku ma is laha!");
    if (newPass.length < 6) return alert("Password-ka cusub waa inuu ka badnaadaa 6 harf!");

    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      
      // Re-authenticate user
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPass);
      
      alert("Password-ka si guul leh ayaa loo beddelay!");
      setPasswords({ current: "", new: "", repeat: "" });
      setActiveView("dashboard");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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

            {/* PASSWORD SIDEBAR BUTTON */}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "settings"} onClick={() => setActiveView("settings")} className="h-12 rounded-lg font-bold hover:bg-blue-600/10 data-[active=true]:bg-blue-600 data-[active=true]:text-white mb-1">
                <Lock size={20} /> Password Change
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} className="w-full justify-start gap-3 h-10 font-bold uppercase text-[10px] text-slate-400 hover:text-white hover:bg-slate-800">
            {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button variant="destructive" onClick={() => navigate("/")} className="w-full font-bold uppercase text-xs h-10 shadow-lg shadow-red-900/20">Logout</Button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-6 md:p-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-y-auto text-slate-900 dark:text-slate-100">
        
        {/* DASHBOARD VIEW */}
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

        {/* TABLES VIEW */}
        {(activeView === "branches" || activeView === "users") && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input placeholder="Search..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => {
                if(activeView === "branches") { setEditBranchId(null); setBForm({ name: "", location: "" }); setShowBranchModal(true); }
                else { setEditUserId(null); setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true }); setShowUserModal(true); }
              }} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold uppercase text-xs">
                Add {activeView === "branches" ? "Branch" : "User"}
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-600">
                  <TableRow>
                    <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px]">Name</TableCell>
                    <TableCell className="text-white font-bold uppercase text-[10px]">{activeView === "branches" ? "Location" : "Role / Branch"}</TableCell>
                    <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px]">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(item => (
                    <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="py-4 pl-6 font-bold">{item.fullName || item.name}</TableCell>
                      <TableCell className="text-xs uppercase">{activeView === "branches" ? item.location : `${item.role} - ${item.branch}`}</TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          if(activeView === "branches") { setEditBranchId(item.id); setBForm({ name: item.name, location: item.location }); setShowBranchModal(true); }
                          else { setEditUserId(item.id); setUForm({ ...item, password: "" }); setShowUserModal(true); }
                        }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(activeView === "branches" ? "branches" : "users", item.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* PASSWORD CHANGE VIEW (IN-PAGE) */}
        {activeView === "settings" && (
          <div className="max-w-md mx-auto mt-10 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white dark:bg-slate-900 border-none shadow-xl p-8 rounded-2xl border-t-4 border-blue-600">
              <div className="text-center mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-blue-600" size={28} />
                </div>
                <h2 className="text-xl font-black uppercase">Change Password</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Update your admin credentials</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Current Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="h-12 dark:bg-slate-950" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="h-12 dark:bg-slate-950" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Repeat New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.repeat}
                    onChange={(e) => setPasswords({...passwords, repeat: e.target.value})}
                    className="h-12 dark:bg-slate-950" 
                  />
                </div>
                
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-black uppercase text-xs tracking-widest mt-4 shadow-lg shadow-blue-600/20"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* MODALS */}
        {(showBranchModal || showUserModal) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl relative border-t-8 border-blue-600">
              <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); }} className="absolute top-4 right-4 text-slate-300">
                <X size={24} />
              </button>
              <h2 className="text-xl font-black mb-6 text-blue-600 uppercase">
                {activeView === "branches" ? "Branch Settings" : "User Settings"}
              </h2>
              {/* Modal forms same as before... */}
              <div className="space-y-4">
                {activeView === "branches" ? (
                  <>
                    <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="h-12" />
                    <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} className="h-12" />
                  </>
                ) : (
                  <>
                    <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} className="h-11" />
                    <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} disabled={!!editUserId} className="h-11" />
                    {!editUserId && <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} className="h-11" />}
                  </>
                )}
                <Button onClick={activeView === "branches" ? handleAddBranch : handleAddUser} disabled={loading} className="w-full bg-blue-600 h-12 font-black text-xs uppercase tracking-widest">
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