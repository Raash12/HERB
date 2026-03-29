import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List, Users, Loader2, X } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [bForm, setBForm] = useState({ name: "", location: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true });

  const [editBranchId, setEditBranchId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Fetch data
  const fetchData = async () => {
    const bSnap = await getDocs(collection(db, "branches"));
    const uSnap = await getDocs(collection(db, "users"));
    setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useEffect(() => { fetchData(); }, []);

  // Branch Actions
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fill all fields!");
    try {
      setLoading(true);
      if (editBranchId) {
        // Edit branch
        await updateDoc(doc(db, "branches", editBranchId), bForm);
        setBranches(prev => prev.map(b => b.id === editBranchId ? { id: b.id, ...bForm } : b));
      } else {
        // Add branch
        const docRef = await addDoc(collection(db, "branches"), bForm);
        setBranches(prev => [...prev, { id: docRef.id, ...bForm }]);
      }
      setBForm({ name: "", location: "" });
      setEditBranchId(null);
      setShowBranchModal(false);
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Delete this branch?")) return;
    try {
      await deleteDoc(doc(db, "branches", id));
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (err) { alert(err.message); }
  };

  // User Actions
  const handleAddUser = async () => {
    if (!uForm.email || (!editUserId && !uForm.password)) return alert("Email & Password required");
    try {
      setLoading(true);
      if (editUserId) {
        // Edit user
        const updateData = { ...uForm };
        if (!uForm.password) delete updateData.password;
        await updateDoc(doc(db, "users", editUserId), updateData);
        setUsers(prev => prev.map(u => u.id === editUserId ? { id: u.id, ...updateData } : u));
      } else {
        // Add user
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

  // Pagination
  const activeData = activeView === "branches" ? branches : users;
  const totalPages = Math.ceil(activeData.length / itemsPerPage) || 1;
  const paginatedData = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <Sidebar className="bg-gray-900/80 backdrop-blur-xl text-gray-100 border-r border-gray-700 transition-colors duration-300">
        <SidebarContent>
          <div className="p-4 text-xl font-bold tracking-wider">ADMIN DASHBOARD</div>
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
          <Button onClick={() => setDarkMode(!darkMode)} className="w-full">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button variant="destructive" onClick={() => navigate("/")} className="w-full">Logout</Button>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-800 dark:text-gray-200 transition-all duration-300">

        {/* Dashboard Cards */}
        {activeView === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:scale-[1.02] transition">
              <CardContent className="p-6">
                <p className="uppercase text-xs opacity-80">Total Branches</p>
                <h2 className="text-3xl font-bold">{branches.length}</h2>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:scale-[1.02] transition">
              <CardContent className="p-6">
                <p className="uppercase text-xs opacity-80">Total Users</p>
                <h2 className="text-3xl font-bold">{users.length}</h2>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Branches Table */}
        {activeView === "branches" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Branches</h2>
              <Button onClick={() => { setEditBranchId(null); setBForm({ name: "", location: "" }); setShowBranchModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Branch
              </Button>
            </div>

            <Table className="border border-gray-300 dark:border-gray-700">
              <TableHeader>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(b => (
                  <TableRow key={b.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.location}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => { setEditBranchId(b.id); setBForm({ name: b.name, location: b.location }); setShowBranchModal(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteBranch(b.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

        {/* Users Table */}
        {activeView === "users" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Users</h2>
              <Button onClick={() => { setEditUserId(null); setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "", active: true }); setShowUserModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add User
              </Button>
            </div>

            <Table className="border border-gray-300 dark:border-gray-700">
              <TableHeader>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(u => (
                  <TableRow key={u.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <TableCell>{u.fullName}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell>{u.branch}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={u.active ? "default" : "destructive"} onClick={() => handleToggleActive(u)}>
                        {u.active ? "Active" : "Inactive"}
                      </Button>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => { setEditUserId(u.id); setUForm({ fullName: u.fullName, email: u.email, password: "", role: u.role, branch: u.branch, active: u.active }); setShowUserModal(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

        {/* Branch Modal */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md relative">
              <button onClick={() => setShowBranchModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-3">{editBranchId ? "Edit Branch" : "Add Branch"}</h2>
              <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} className="mb-2"/>
              <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} />
              <Button onClick={handleAddBranch} disabled={loading} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="animate-spin" /> : editBranchId ? "Update Branch" : "Save Branch"}
              </Button>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md relative">
              <button onClick={() => setShowUserModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-3">{editUserId ? "Edit User" : "Add User"}</h2>
              <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} className="mb-2"/>
              <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} className="mb-2" disabled={!!editUserId}/>
              <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} className="mb-2"/>
              <select className="w-full p-2 border rounded mt-2" value={uForm.role} onChange={e => setUForm({...uForm, role: e.target.value})}>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
              <select className="w-full p-2 border rounded mt-2" value={uForm.branch} onChange={e => setUForm({...uForm, branch: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={uForm.active} onChange={e => setUForm({...uForm, active: e.target.checked})} />
                  Active
                </label>
              </div>
              <Button onClick={handleAddUser} disabled={loading} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="animate-spin" /> : editUserId ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        )}

      </main>
    </SidebarProvider>
  );
}