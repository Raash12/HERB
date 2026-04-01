import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

// UI Components
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarMenu, 
  SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Icons
import { 
  Users, Loader2, X, Search, ChevronLeft, ChevronRight, 
  LayoutDashboard, Sun, Moon, Lock, LogOut, Building2
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Forms State
  const [bForm, setBForm] = useState({ name: "", location: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });
  const [passwords, setPasswords] = useState({ current: "", new: "", repeat: "" });

  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // 1. Fetch Data Function (WAX KA BEDELAY)
  const fetchData = async () => {
    try {
      setLoading(true);
      const bSnap = await getDocs(collection(db, "branches"));
      const uSnap = await getDocs(collection(db, "users"));
      
      const bData = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const uData = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setBranches(bData);
      setUsers(uData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchData(); 
  }, []);

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

  // --- CRUD LOGIC ---
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fadlan buuxi!");
    try {
      setLoading(true);
      if (editBranchId) {
        await updateDoc(doc(db, "branches", editBranchId), bForm);
      } else {
        await addDoc(collection(db, "branches"), bForm);
      }
      setBForm({ name: "", location: "" });
      setEditBranchId(null);
      setShowBranchModal(false);
      fetchData(); // Refresh list
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
      setEditUserId(null);
      setShowUserModal(false);
      fetchData(); // Refresh list
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (coll, id) => {
    if (!window.confirm("Ma hubtaa?")) return;
    try {
      await deleteDoc(doc(db, coll, id));
      fetchData(); // Refresh list
    } catch (err) { alert(err.message); }
  };

  // Pagination & Filtering Logic
  const getFilteredData = () => {
    const data = activeView === "branches" ? branches : users;
    return data.filter(item => 
      (item.fullName || item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-blue-100 dark:border-blue-900/30">
        <SidebarContent>
          <div className="p-6 mb-4 font-black text-xl text-blue-600 dark:text-blue-500 tracking-tighter">
            HERB <span className="text-slate-400 font-light text-sm italic">ADMIN</span>
          </div>
          <SidebarMenu className="px-3">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => { setActiveView("dashboard"); setCurrentPage(1); }}>
                <LayoutDashboard size={18} /> <span className="font-bold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "branches"} onClick={() => { setActiveView("branches"); setCurrentPage(1); }}>
                <Building2 size={18} /> <span className="font-bold">Branches</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "users"} onClick={() => { setActiveView("users"); setCurrentPage(1); }}>
                <Users size={18} /> <span className="font-bold">Staff Members</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "settings"} onClick={() => setActiveView("settings")}>
                <Lock size={18} /> <span className="font-bold">Security</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
  <div className="flex flex-col gap-1">
    
    <SidebarMenuButton 
      onClick={toggleDark} 
      className="h-10 rounded-xl text-xs flex items-center"
    >
      {darkMode ? (
        <Sun size={16} className="text-yellow-500" />
      ) : (
        <Moon size={16} className="text-blue-500" />
      )}
      <span className="ml-2 font-bold">
        {darkMode ? "Light Mode" : "Dark Mode"}
      </span>
    </SidebarMenuButton>

    <SidebarMenuButton
      onClick={async () => { 
        await signOut(auth); 
        navigate("/"); 
      }}
      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 rounded-xl text-xs flex items-center"
    >
      <LogOut size={16} />
      <span className="ml-2 font-bold">Logout</span>
    </SidebarMenuButton>

  </div>
</SidebarFooter>
      </Sidebar>

      <main className="flex-1 bg-slate-50/40 dark:bg-[#020817] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          
          {activeView === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Building2 className="text-blue-600 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400">Total Branches</p>
                <h3 className="text-3xl font-black">{branches.length}</h3>
              </Card>
              <Card className="p-8 rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm">
                <Users className="text-emerald-500 mb-2" size={28} />
                <p className="text-[10px] font-black uppercase text-slate-400">Staff Count</p>
                <h3 className="text-3xl font-black">{users.length}</h3>
              </Card>
            </div>
          )}

          {(activeView === "branches" || activeView === "users") && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{activeView} List</h2>
                <Button onClick={() => activeView === "branches" ? setShowBranchModal(true) : setShowUserModal(true)} className="bg-blue-600 rounded-xl font-bold uppercase text-xs">
                  Add New {activeView === "branches" ? "Branch" : "Staff"}
                </Button>
              </div>

              <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex items-center gap-2">
                  <Search size={18} className="text-slate-400" />
                  <Input placeholder="Search records..." className="bg-transparent border-none focus-visible:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Table>
                  <TableHeader className="bg-blue-600">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="text-white font-bold py-4 pl-6 uppercase text-[10px]">Name</TableCell>
                      {activeView === "branches" ? (
                        <TableCell className="text-white font-bold uppercase text-[10px]">Location</TableCell>
                      ) : (
                        <>
                          <TableCell className="text-white font-bold uppercase text-[10px]">Role</TableCell>
                          <TableCell className="text-white font-bold uppercase text-[10px]">Branch</TableCell>
                        </>
                      )}
                      <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px]">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : paginatedData.map((item) => (
                      <TableRow key={item.id} className="border-slate-50 dark:border-slate-800">
                        <TableCell className="py-4 pl-6 font-bold">{item.fullName || item.name}</TableCell>
                        {activeView === "branches" ? (
                          <TableCell className="text-xs font-bold text-slate-500 uppercase">{item.location}</TableCell>
                        ) : (
                          <>
                            <TableCell className="text-xs uppercase font-bold">{item.role}</TableCell>
                            <TableCell className="text-xs font-bold text-blue-600 uppercase">{item.branch || "N/A"}</TableCell>
                          </>
                        )}
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
                <div className="p-4 flex items-center justify-between border-t dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16}/></Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16}/></Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* SECURITY VIEW - SIDAA HORE */}
          {activeView === "settings" && (
             <div className="max-w-md mx-auto mt-10">
               <Card className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border-t-4 border-blue-600 shadow-xl">
                 <h2 className="text-center font-black uppercase mb-6 flex items-center justify-center gap-2">
                   <Lock size={20}/> Security
                 </h2>
                 <div className="space-y-4">
                   <Input type="password" placeholder="Current Password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="h-12 rounded-xl" />
                   <Input type="password" placeholder="New Password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="h-12 rounded-xl" />
                   <Input type="password" placeholder="Repeat Password" value={passwords.repeat} onChange={(e) => setPasswords({...passwords, repeat: e.target.value})} className="h-12 rounded-xl" />
                   <Button className="w-full h-12 bg-blue-600 font-black uppercase text-xs tracking-widest rounded-xl">Update Password</Button>
                 </div>
               </Card>
             </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {(showBranchModal || showUserModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative border-t-8 border-blue-600">
            <button onClick={() => { setShowBranchModal(false); setShowUserModal(false); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><X size={24} /></button>
            <h2 className="text-xl font-black mb-6 uppercase">{activeView === "branches" ? "Branch Form" : "User Form"}</h2>
            <div className="space-y-4">
              {activeView === "branches" ? (
                <>
                  <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="h-12 rounded-xl" />
                  <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} className="h-12 rounded-xl" />
                  <Button onClick={handleAddBranch} disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase">{loading ? "Saving..." : "Save Branch"}</Button>
                </>
              ) : (
                <>
                  <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} className="h-12 rounded-xl" />
                  <Input placeholder="Email Address" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} className="h-12 rounded-xl" />
                  {!editUserId && <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} className="h-12 rounded-xl" />}
                  <select 
                    className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm" 
                    value={uForm.branch} 
                    onChange={e => setUForm({...uForm, branch: e.target.value})}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <select 
                    className="w-full h-12 rounded-xl border dark:border-slate-800 bg-transparent px-3 text-sm" 
                    value={uForm.role} 
                    onChange={e => setUForm({...uForm, role: e.target.value})}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="reception">Reception</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button onClick={handleAddUser} disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase">{loading ? "Saving..." : "Save User"}</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}