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
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Users, Loader2, X, Search, Filter } from "lucide-react";

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
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Reset pagination when filter changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, branchFilter, activeView]);

  // Actions (Same as your code)
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fill all fields!");
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

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Delete this branch?")) return;
    try {
      await deleteDoc(doc(db, "branches", id));
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleAddUser = async () => {
    if (!uForm.email || (!editUserId && !uForm.password)) return alert("Email & Password required");
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

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleToggleActive = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { active: !user.active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch (err) { alert(err.message); }
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-gray-900 text-gray-100 border-r border-gray-700">
        <SidebarContent>
          <div className="p-4 text-xl font-bold tracking-wider text-indigo-400">ADMIN PANEL</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <List size={18} /> Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "branches"} onClick={() => setActiveView("branches")}>
                <List size={18} /> Branches
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "users"} onClick={() => setActiveView("users")}>
                <Users size={18} /> Users
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="flex flex-col gap-2 p-4">
          <Button onClick={() => setDarkMode(!darkMode)} className="w-full bg-gray-800 hover:bg-gray-700">
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </Button>
          <Button variant="destructive" onClick={() => navigate("/")} className="w-full">Logout</Button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-all overflow-y-auto">

        {activeView === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl">
              <CardContent className="p-6">
                <p className="uppercase text-xs opacity-80">Total Branches</p>
                <h2 className="text-4xl font-bold">{branches.length}</h2>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
              <CardContent className="p-6">
                <p className="uppercase text-xs opacity-80">Total Users</p>
                <h2 className="text-4xl font-bold">{users.length}</h2>
              </CardContent>
            </Card>
          </div>
        )}

        {(activeView === "branches" || activeView === "users") && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            {/* --- Filter Bar --- */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <Input 
                  placeholder={activeView === "branches" ? "Search branch or location..." : "Search name or email..."}
                  className="pl-10 border-indigo-100 dark:border-gray-700 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {activeView === "users" && (
                <>
                  <select 
                    className="p-2 rounded-md border border-indigo-100 dark:border-gray-700 bg-transparent text-sm focus:ring-2 ring-indigo-500 outline-none"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="reception">Reception</option>
                  </select>

                  <select 
                    className="p-2 rounded-md border border-indigo-100 dark:border-gray-700 bg-transparent text-sm focus:ring-2 ring-indigo-500 outline-none"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                  >
                    <option value="all">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </>
              )}

              <Button 
                onClick={() => {
                  if(activeView === "branches") { setEditBranchId(null); setBForm({ name: "", location: "" }); setShowBranchModal(true); }
                  else { setEditUserId(null); setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true }); setShowUserModal(true); }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white ml-auto"
              >
                Add {activeView === "branches" ? "Branch" : "User"}
              </Button>
            </div>

            {/* --- Table Section --- */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                  <TableRow>
                    {activeView === "branches" ? (
                      <>
                        <TableCell className="font-bold">Name</TableCell>
                        <TableCell className="font-bold">Location</TableCell>
                        <TableCell className="font-bold">Actions</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-bold">Name</TableCell>
                        <TableCell className="font-bold">Role</TableCell>
                        <TableCell className="font-bold">Branch</TableCell>
                        <TableCell className="font-bold">Status</TableCell>
                        <TableCell className="font-bold">Actions</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map(item => (
                      <TableRow key={item.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition">
                        {activeView === "branches" ? (
                          <>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => { setEditBranchId(item.id); setBForm({ name: item.name, location: item.location }); setShowBranchModal(true); }}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteBranch(item.id)}>Delete</Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{item.fullName}</TableCell>
                            <TableCell><span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 capitalize">{item.role}</span></TableCell>
                            <TableCell>{item.branch || "—"}</TableCell>
                            <TableCell>
                              <Button size="sm" className={item.active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"} onClick={() => handleToggleActive(item)}>
                                {item.active ? "Active" : "Inactive"}
                              </Button>
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600" onClick={() => { setEditUserId(item.id); setUForm({ ...item, password: "" }); setShowUserModal(true); }}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(item.id)}>Delete</Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-500 italic">No matching records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}

        {/* Modals remain exactly same but updated styles to match indigo theme */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-2xl relative border border-indigo-100 dark:border-gray-800">
              <button onClick={() => setShowBranchModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-indigo-600">{editBranchId ? "Edit Branch" : "Add New Branch"}</h2>
              <div className="space-y-4">
                <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="focus:ring-indigo-500"/>
                <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} className="focus:ring-indigo-500"/>
                <Button onClick={handleAddBranch} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
                  {loading ? <Loader2 className="animate-spin" /> : editBranchId ? "Update Branch" : "Save Branch"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-2xl relative border border-indigo-100 dark:border-gray-800">
              <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-indigo-600">{editUserId ? "Edit User Account" : "Register New User"}</h2>
              <div className="space-y-3">
                <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} />
                <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} disabled={!!editUserId}/>
                <Input type="password" placeholder={editUserId ? "Leave blank to keep current" : "Password"} value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} />
                <select className="w-full p-2.5 border rounded-md dark:bg-gray-800 border-gray-200 dark:border-gray-700" value={uForm.role} onChange={e => setUForm({...uForm, role: e.target.value})}>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                  <option value="reception">Reception</option>
                </select>
                <select className="w-full p-2.5 border rounded-md dark:bg-gray-800 border-gray-200 dark:border-gray-700" value={uForm.branch} onChange={e => setUForm({...uForm, branch: e.target.value})}>
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <Button onClick={handleAddUser} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg mt-4">
                  {loading ? <Loader2 className="animate-spin" /> : editUserId ? "Update Account" : "Create Account"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </SidebarProvider>
  );
}