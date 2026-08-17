import React, { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";
import { 
  Search, Edit3, Trash2, X, ChevronLeft, ChevronRight, ChevronDown, Check 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function StaffManagement({ users = [], branches = [], fetchData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  
  const initialForm = { 
    fullName: "", email: "", password: "", role: "reception", branch: [], active: true 
  };
  
  const [uForm, setUForm] = useState(initialForm);
  const itemsPerPage = 6;

  // Helper si uu 'i' iyo 'ii' iyo spaces-ka u barbardhigo
  const normStr = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/ii/g, "i").replace(/\s+/g, "").trim();
  };

  // Function xogta branch-yada user-ka waafajinaya magaca saxda ah ee `branches`
  const sanitizeBranches = (userBranches, availableBranches = branches) => {
    if (!userBranches) return [];
    const list = Array.isArray(userBranches) ? userBranches : [userBranches];

    const cleaned = [];
    list.forEach((ub) => {
      if (typeof ub !== "string" || !ub.trim()) return;

      // Smart match le'eg magaca rasmiga ah ee branches
      const matchedBranch = availableBranches.find((b) => normStr(b.name) === normStr(ub));

      if (matchedBranch) {
        if (!cleaned.some(c => normStr(c) === normStr(matchedBranch.name))) {
          cleaned.push(matchedBranch.name);
        }
      } else {
        const trimmed = ub.trim();
        if (!cleaned.some(c => normStr(c) === normStr(trimmed))) {
          cleaned.push(trimmed);
        }
      }
    });

    return cleaned;
  };

  useEffect(() => {
    console.log("=== [StaffManagement Loaded] ===");
  }, [users, branches]);

  const resetForm = () => {
    setUForm(initialForm);
    setEditUserId(null);
    setIsBranchDropdownOpen(false);
  };

  const handleBranchChange = (branchName) => {
    const currentBranches = sanitizeBranches(uForm.branch, branches);
    
    const exists = currentBranches.some(
      (b) => normStr(b) === normStr(branchName)
    );

    let updatedBranches = [];
    if (exists) {
      updatedBranches = currentBranches.filter(
        (b) => normStr(b) !== normStr(branchName)
      );
    } else {
      updatedBranches = [...currentBranches, branchName.trim()];
    }

    // Clean final list
    const finalCleanList = sanitizeBranches(updatedBranches, branches);

    console.log("Updated User Branches:", finalCleanList);
    setUForm({
      ...uForm,
      branch: finalCleanList
    });
  };

  const handleAddUser = async () => {
    if (!uForm.email || (!editUserId && !uForm.password)) {
      return alert("Email iyo Password lama huraan waa!");
    }
    
    try {
      setLoading(true);

      const { password, ...cleanFormData } = uForm;

      // Clean/Sanitize branch list before sending to Firebase
      const cleanBranchList = sanitizeBranches(uForm.branch, branches);

      const userData = {
        ...cleanFormData,
        fullName: uForm.fullName.trim(),
        email: uForm.email.trim(),
        role: uForm.role.toLowerCase(),
        branch: cleanBranchList,
        updatedAt: Date.now()
      };

      console.log("Saving User to Firestore...", { editUserId, userData });

      if (editUserId) {
        await updateDoc(doc(db, "users", editUserId), userData);
      } else {
        const res = await createUserWithEmailAndPassword(auth, uForm.email, uForm.password);
        const newUserData = {
          ...userData,
          id: res.user.uid,
          createdAt: Date.now()
        };
        await setDoc(doc(db, "users", res.user.uid), newUserData);
      }

      resetForm();
      setShowUserModal(false); 
      if (fetchData) fetchData();
    } catch (err) { 
      console.error("Error saving user:", err);
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto shaqaalahan?")) return;
    try { 
      await deleteDoc(doc(db, "users", id)); 
      if (fetchData) fetchData(); 
    } catch (err) { 
      alert(err.message); 
    }
  };

  const sortedUsers = [...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const filteredUsers = sortedUsers.filter(u => {
    const branchString = Array.isArray(u.branch) ? u.branch.join(" ") : (u.branch || "");
    return (
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      branchString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const getSelectedBranchesLabel = () => {
    const cleanList = sanitizeBranches(uForm.branch, branches);
    if (cleanList.length === 0) {
      return "SELECT BRANCHES";
    }
    if (cleanList.length === 1) {
      return cleanList[0];
    }
    return `${cleanList.length} BRANCHES SELECTED`;
  };

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
          <Button onClick={() => { resetForm(); setShowUserModal(true); }} className="bg-blue-600 rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest text-white">
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
            {paginatedData.map((user) => {
              const displayBranches = sanitizeBranches(user.branch, branches);
              return (
                <TableRow key={user.id} className="border-slate-50 dark:border-slate-800 transition-colors">
                  <TableCell className="py-6 pl-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                        {user.fullName?.substring(0,2)}
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm dark:text-white">{user.fullName}</p>
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-200 text-blue-600">{user.role}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {displayBranches.length > 0 ? (
                        displayBranches.map((b, i) => (
                          <Badge key={i} className="bg-indigo-500/10 text-indigo-500 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase">
                            {b}
                          </Badge>
                        ))
                      ) : (
                        <Badge className="bg-slate-500/10 text-slate-500 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          Global
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${user.active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"} border-none px-4 py-1 rounded-full text-[9px] font-black uppercase`}>
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10 space-x-2">
                    <Button variant="ghost" className="h-10 w-10 rounded-xl text-blue-600" onClick={() => {
                      setEditUserId(user.id);
                      
                      const cleanedBranches = sanitizeBranches(user.branch, branches);
                      setUForm({ 
                        ...user, 
                        password: "",
                        branch: cleanedBranches
                      });
                      setShowUserModal(true);
                    }}><Edit3 size={16} /></Button>
                    <Button variant="ghost" className="h-10 w-10 rounded-xl text-red-500" onClick={() => handleDelete(user.id)}><Trash2 size={16} /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
                <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm disabled:opacity-30"><ChevronLeft size={16} /></Button>
                <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm disabled:opacity-30"><ChevronRight size={16} /></Button>
            </div>
        </div>
      </Card>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => { setShowUserModal(false); resetForm(); }} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            
            <h2 className="text-xl font-black mb-8 uppercase dark:text-white tracking-tighter">
                {editUserId ? "Update Staff Member" : "Register Staff Member"}
            </h2>
            <div className="space-y-4">
              <Input placeholder="FULL NAME" value={uForm.fullName} onChange={e => setUForm({ ...uForm, fullName: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              <Input placeholder="EMAIL ADDRESS" value={uForm.email} onChange={e => setUForm({ ...uForm, email: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              {!editUserId && <Input type="password" placeholder="PASSWORD" value={uForm.password} onChange={e => setUForm({ ...uForm, password: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />}
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Shaqada (Role)</label>
                <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-6 text-[10px] font-black uppercase outline-none dark:text-white" value={uForm.role} onChange={e => setUForm({ ...uForm, role: e.target.value })}>
                    <option value="reception">RECEPTION</option>
                    <option value="doctor">DOCTOR</option>
                    <option value="admin">ADMIN</option>
                </select>
              </div>

              <div className="space-y-1 relative">
                <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Assigned Branches</label>
                
                <button
                  type="button"
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-6 text-[10px] font-black uppercase outline-none dark:text-white flex items-center justify-between border-none"
                >
                  <span className={uForm.branch?.length ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                    {getSelectedBranchesLabel()}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isBranchDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isBranchDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsBranchDropdownOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-2 shadow-2xl max-h-48 overflow-y-auto space-y-1">
                      {branches.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase p-3">No branches available</p>
                      ) : (
                        branches.map((b) => {
                          const currentBranches = sanitizeBranches(uForm.branch, branches);
                          const isChecked = currentBranches.some(
                            (selectedBranch) => normStr(selectedBranch) === normStr(b.name)
                          );

                          return (
                            <div
                              key={b.id}
                              onClick={() => handleBranchChange(b.name)}
                              className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <span className="text-[10px] font-black uppercase dark:text-slate-200">
                                {b.name}
                              </span>
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"}`}>
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">Employment Status</label>
                <select className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 px-6 text-[10px] font-black uppercase outline-none dark:text-white" value={uForm.active} onChange={e => setUForm({ ...uForm, active: e.target.value === "true" })}>
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                </select>
              </div>

              <Button onClick={handleAddUser} disabled={loading} className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-blue-500/30 text-white">
                {loading ? "SAVING..." : "SAVE STAFF DATA"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}