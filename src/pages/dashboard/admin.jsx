import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
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
import { List, Users, PlusCircle, UserPlus, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("dashboard");
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [bForm, setBForm] = useState({ name: "", location: "" });
  const [uForm, setUForm] = useState({ fullName: "", email: "", password: "", role: "doctor", branch: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Fetch data from Firebase
  const fetchData = async () => {
    const bSnap = await getDocs(collection(db, "branches"));
    const uSnap = await getDocs(collection(db, "users"));
    setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fill all fields!");
    await addDoc(collection(db, "branches"), bForm);
    setBForm({ name: "", location: "" });
    fetchData();
    setActiveView("branches");
  };

  const handleAddUser = async () => {
    if (!uForm.email || !uForm.password) return alert("Email & Password required");
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, uForm.email, uForm.password);
      await setDoc(doc(db, "users", res.user.uid), {
        fullName: uForm.fullName,
        email: uForm.email,
        role: uForm.role,
        branch: uForm.branch
      });
      setUForm({ fullName: "", email: "", password: "", role: "doctor", branch: "" });
      fetchData();
      setActiveView("users");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "add-branch"} onClick={() => setActiveView("add-branch")}>
                <PlusCircle size={18} /> Add Branch
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "add-user"} onClick={() => setActiveView("add-user")}>
                <UserPlus size={18} /> Add User
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

        {/* Table / Forms */}
        <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">

          {/* Branches Table */}
          {activeView === "branches" && (
            <>
              <h2 className="text-xl mb-4 font-semibold">Branches</h2>
              <Table className="border border-gray-300 dark:border-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(b => (
                    <TableRow key={b.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.location}</TableCell>
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
              <h2 className="text-xl mb-4 font-semibold">Users</h2>
              <Table className="border border-gray-300 dark:border-gray-700">
                <TableHeader>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Branch</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(u => (
                    <TableRow key={u.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <TableCell>{u.fullName}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{u.branch}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}

          {/* Add Branch Form */}
          {activeView === "add-branch" && (
            <div className="space-y-3 max-w-md">
              <Input placeholder="Branch Name" value={bForm.name} onChange={e => setBForm({...bForm, name: e.target.value})} />
              <Input placeholder="Location" value={bForm.location} onChange={e => setBForm({...bForm, location: e.target.value})} />
              <Button onClick={handleAddBranch} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Branch</Button>
            </div>
          )}

          {/* Add User Form */}
          {activeView === "add-user" && (
            <div className="space-y-3 max-w-md">
              <Input placeholder="Full Name" value={uForm.fullName} onChange={e => setUForm({...uForm, fullName: e.target.value})} />
              <Input placeholder="Email" value={uForm.email} onChange={e => setUForm({...uForm, email: e.target.value})} />
              <Input type="password" placeholder="Password" value={uForm.password} onChange={e => setUForm({...uForm, password: e.target.value})} />

              <select className="w-full p-2 border rounded" value={uForm.role} onChange={e => setUForm({...uForm, role: e.target.value})}>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>

              <select className="w-full p-2 border rounded" value={uForm.branch} onChange={e => setUForm({...uForm, branch: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>

              <Button onClick={handleAddUser} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="animate-spin" /> : "Create User"}
              </Button>
            </div>
          )}

        </div>
      </main>
    </SidebarProvider>
  );
}