import React, { useState } from "react";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";
import { 
  Search, Edit3, Trash2, X, UserCheck, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffManagement({ users, branches, fetchData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uForm, setUForm] = useState({ 
    fullName: "", email: "", password: "", role: "doctor", branch: "", active: true 
  });

  const itemsPerPage = 6;

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
      setShowUserModal(false); 
      setEditUserId(null); 
      fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto shaqaalahan?")) return;
    try { await deleteDoc(doc(db, "users", id)); fetchData(); } catch (err) { alert(err.message); }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl">
        <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Staff Directory</h2>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              placeholder="Search staff..." 
              value={searchTerm} 
              onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
              className="pl-10 w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-bold uppercase outline-none px-4" 
            />
          </div>
          <Button onClick={() => { setEditUserId(null); setShowUserModal(true); }} className="bg-blue-600 rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
            Add New Staff
          </Button>
        </div>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="border-none">
              <TableCell className="font-black py-6 pl-10 uppercase text-[10px] text-slate-400 tracking-widest">Identity</TableCell>
              <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Placement</TableCell>
              <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Status</TableCell>
              <TableCell className="font-black text-right pr-10 uppercase text-[10px] text-slate-400 tracking-widest">Management</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((user) => (
              <TableRow key={user.id} className="border-slate-50 dark:border-slate-800 transition-colors">
                <TableCell className="py-6 pl-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                      {user.fullName?.substring(0,2)}
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm dark:text-white">{user.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{user.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase">
                    {user.branch || "Global"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${user.active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"} border-none px-4 py-1 rounded-full text-[9px] font-black uppercase`}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-10 space-x-2">
                  <Button variant="ghost" className="h-10 w-10 rounded-xl text-blue-600" onClick={() => {
                    setEditUserId(user.id);
                    setUForm({ ...user, password: "" });
                    setShowUserModal(true);
                  }}><Edit3 size={16} /></Button>
                  <Button variant="ghost" className="h-10 w-10 rounded-xl text-red-500" onClick={() => handleDelete(user.id)}><Trash2 size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">
                Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm disabled:opacity-30"
                >
                    <ChevronLeft size={16} />
                </Button>
                <Button 
                    variant="ghost" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm disabled:opacity-30"
                >
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
      </Card>

      {/* MODAL SECTION - SIDII HORE */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowUserModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            <h2 className="text-xl font-black mb-8 uppercase dark:text-white tracking-tighter">
                {editUserId ? "Update Staff Member" : "Register Staff Member"}
            </h2>
            <div className="space-y-4">
              <Input placeholder="FULL NAME" value={uForm.fullName} onChange={e => setUForm({ ...uForm, fullName: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              <Input placeholder="EMAIL ADDRESS" value={uForm.email} onChange={e => setUForm({ ...uForm, email: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              {!editUserId && <Input type="password" placeholder="PASSWORD" value={uForm.password} onChange={e => setUForm({ ...uForm, password: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />}
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Assigned Branch</label>
                <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-6 text-[10px] font-black uppercase outline-none" value={uForm.branch} onChange={e => setUForm({ ...uForm, branch: e.target.value })}>
                    <option value="">SELECT BRANCH</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Employment Status</label>
                <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-6 text-[10px] font-black uppercase outline-none" value={uForm.active} onChange={e => setUForm({ ...uForm, active: e.target.value === "true" })}>
                    <option value="true">ACTIVE (Wuu Shaqaynayaa)</option>
                    <option value="false">INACTIVE (Laga Joojiyay)</option>
                </select>
              </div>

              <Button onClick={handleAddUser} disabled={loading} className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-blue-500/30">
                {loading ? "SAVING..." : "SAVE STAFF DATA"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}