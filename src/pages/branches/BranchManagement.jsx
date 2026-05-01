import React, { useState } from "react";
import { collection, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";

// UI COMPONENTS
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ICONS
import { Building2, Trash2, Edit3, X, Phone, ChevronLeft, ChevronRight } from "lucide-react";

export default function BranchManagement({ branches, fetchData }) {
  const [loading, setLoading] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editBranchId, setEditBranchId] = useState(null);
  const [bForm, setBForm] = useState({ name: "", location: "", phone: "" });

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleAddBranch = async () => {
    if (!bForm.name || !bForm.location) return alert("Fadlan buuxi meelaha banaan!");
    try {
      setLoading(true);
      if (editBranchId) {
        await updateDoc(doc(db, "branches", editBranchId), bForm);
      } else {
        await addDoc(collection(db, "branches"), bForm);
      }
      setBForm({ name: "", location: "", phone: "" });
      setShowBranchModal(false);
      setEditBranchId(null);
      fetchData(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ma hubtaa inaad tirtirto laantan?")) return;
    try {
      await deleteDoc(doc(db, "branches", id));
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // PAGINATION LOGIC
  const totalPages = Math.ceil(branches.length / itemsPerPage) || 1;
  const paginatedBranches = branches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl">
        <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Branch Network</h2>
        <Button 
          onClick={() => setShowBranchModal(true)} 
          className="bg-blue-600 rounded-xl h-12 px-8 font-black uppercase text-[10px] shadow-lg"
        >
          Add New Branch
        </Button>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow className="border-none">
              <TableCell className="font-black py-6 pl-10 uppercase text-[10px] text-slate-400 tracking-widest">Identity</TableCell>
              <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Location</TableCell>
              <TableCell className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Contact Phone</TableCell>
              <TableCell className="font-black text-right pr-10 uppercase text-[10px] text-slate-400 tracking-widest">Management</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBranches.map((b) => (
              <TableRow key={b.id} className="border-slate-50 dark:border-slate-800 transition-colors">
                <TableCell className="py-6 pl-10 font-black uppercase text-sm dark:text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Building2 size={14} className="text-blue-600" />
                    </div>
                    {b.name}
                  </div>
                </TableCell>
                <TableCell className="text-[11px] font-bold text-slate-500 uppercase">{b.location}</TableCell>
                <TableCell className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {b.phone || "No Phone"}
                </TableCell>
                <TableCell className="text-right pr-10 space-x-2">
                  <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => { setEditBranchId(b.id); setBForm(b); setShowBranchModal(true); }}>
                    <Edit3 size={16} />
                  </Button>
                  <Button variant="ghost" className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
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

      {/* BRANCH MODAL */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative border border-white/10">
            <button onClick={() => { setShowBranchModal(false); setEditBranchId(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter dark:text-white flex items-center gap-3">
              <Building2 className="text-blue-600" /> {editBranchId ? "Update" : "Register"} Branch
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Branch Name</label>
                <Input placeholder="E.G. MAIN BRANCH" value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Contact Phone</label>
                <Input placeholder="E.G. +252 61XXXXXXX" value={bForm.phone} onChange={e => setBForm({ ...bForm, phone: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Location</label>
                <Input placeholder="E.G. MOGADISHU, SOMALIA" value={bForm.location} onChange={e => setBForm({ ...bForm, location: e.target.value })} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold uppercase text-[10px] px-6" />
              </div>
              <Button disabled={loading} onClick={handleAddBranch} className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-blue-500/30">
                {loading ? "SAVING..." : "CONFIRM BRANCH"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}