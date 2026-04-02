import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";

// UI Components
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MapPin, PlusCircle, List, UserPlus } from "lucide-react";

export default function AdminDashboard() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("list-branches"); // Kontaroolka waxa muuqanaya

  // Form States
  const [branchName, setBranchName] = useState("");
  const [location, setLocation] = useState("");
  const [branchPhone, setBranchPhone] = useState(""); // ADDED
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    const branchSnap = await getDocs(collection(db, "branches"));
    const userSnap = await getDocs(collection(db, "users"));
    setBranches(branchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleAddBranch = async () => {
    if (!branchName || !location || !branchPhone) return alert("Fill all fields including Phone");
    await addDoc(collection(db, "branches"), { name: branchName, location, phone: branchPhone });
    setBranchName(""); setLocation(""); setBranchPhone("");
    fetchData();
    setView("list-branches");
  };

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName, email, role, branch: selectedBranch
      });
      alert("User Created!");
      setFullName(""); setEmail(""); setPassword("");
      fetchData();
      setView("list-signups");
    } catch (err) { alert(err.message); }
  };

  // Pagination Logic
  const currentList = view === "list-branches" ? branches : users;
  const totalPages = Math.ceil(currentList.length / itemsPerPage) || 1;
  const paginatedData = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <div className="p-5 text-xl font-bold border-b border-gray-800">Admin Panel</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === "list-branches"} onClick={() => { setView("list-branches"); setCurrentPage(1); }}>
                <List size={18} /> List Branches
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === "list-signups"} onClick={() => { setView("list-signups"); setCurrentPage(1); }}>
                <Users size={18} /> List Signups
              </SidebarMenuButton>
            </SidebarMenuItem>
            <hr className="my-2 border-gray-700" />
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === "add-branch"} onClick={() => setView("add-branch")}>
                <PlusCircle size={18} /> Add Branch
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={view === "add-signup"} onClick={() => setView("add-signup")}>
                <UserPlus size={18} /> Add Signup
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4 flex justify-between items-center">
              <div><p className="text-sm opacity-80">Branches</p><h2 className="text-2xl font-bold">{branches.length}</h2></div>
              <MapPin size={32} className="opacity-40" />
            </CardContent>
          </Card>
          <Card className="bg-green-600 text-white">
            <CardContent className="p-4 flex justify-between items-center">
              <div><p className="text-sm opacity-80">Total Users</p><h2 className="text-2xl font-bold">{users.length}</h2></div>
              <Users size={32} className="opacity-40" />
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Views */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {view === "list-branches" && (
            <>
              <h2 className="text-xl font-bold mb-4">Branch List</h2>
              <Table>
                <TableHeader><TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Location</TableCell></TableRow></TableHeader>
                <TableBody>
                  {paginatedData.map(b => <TableRow key={b.id}><TableCell className="font-bold">{b.name}</TableCell><TableCell>{b.phone || "N/A"}</TableCell><TableCell>{b.location}</TableCell></TableRow>)}
                </TableBody>
              </Table>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}

          {view === "list-signups" && (
            <>
              <h2 className="text-xl font-bold mb-4">Users List</h2>
              <Table>
                <TableHeader><TableRow><TableCell>Name</TableCell><TableCell>Role</TableCell><TableCell>Branch</TableCell></TableRow></TableHeader>
                <TableBody>
                  {paginatedData.map(u => <TableRow key={u.id}><TableCell>{u.fullName}</TableCell><TableCell>{u.role}</TableCell><TableCell>{u.branch}</TableCell></TableRow>)}
                </TableBody>
              </Table>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}

          {view === "add-branch" && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold">Create New Branch</h2>
              <Input placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} />
              <Input placeholder="Telephone" value={branchPhone} onChange={e => setBranchPhone(e.target.value)} />
              <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
              <Button onClick={handleAddBranch} className="w-full">Save Branch</Button>
            </div>
          )}

          {view === "add-signup" && (
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold">Create New User</h2>
              <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <select className="w-full p-2 border rounded" value={role} onChange={e => setRole(e.target.value)}>
                <option value="doctor">Doctor</option>
                <option value="reception">Reception</option>
                <option value="admin">Admin</option>
              </select>
              <select className="w-full p-2 border rounded" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <Button onClick={handleSignup} className="w-full">Create Account</Button>
            </div>
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}