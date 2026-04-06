import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, getDocs, query, where, addDoc, doc, getDoc, onSnapshot, orderBy, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { handleInvoicePrint } from "../../utils/printHandlers";

// UI Components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, UserPlus, MapPin, Search, Users, RefreshCcw, Printer } from "lucide-react";

const BANAADIR_DISTRICTS = ["Cabdiasiis", "Boondheere", "Dayniile", "Dharkeenley", "Hamar Jajab", "Hamar Weyne", "Hodan", "Howlwadaag", "Huriwaa", "Kaaraan", "Kaxda", "Shangaani", "Shibis", "Waaberi", "Wadajir", "Wardhiigley", "Warta Nabada", "Yaaqshiid", "Garasbaaley", "Gubadley"];

export default function CustomerRegistration() {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [myBranch, setMyBranch] = useState(""); 
  const [open, setOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [formData, setFormData] = useState({
    fullName: "", phone: "", address: "", age: "", gender: "", 
    department: "", doctorId: "", doctorName: "", amount: ""
  });

  useEffect(() => {
    const fetchContext = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        const branchName = userSnap.data().branch;
        setMyBranch(branchName);
        const qDoc = query(collection(db, "users"), where("role", "==", "doctor"), where("branch", "==", branchName));
        const docSnap = await getDocs(qDoc);
        setDoctors(docSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    if (!myBranch) return;
    const q = query(collection(db, "patients"), where("branch", "==", myBranch), orderBy("fullName", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [myBranch]);

  const handleRegisterNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pRef = await addDoc(collection(db, "patients"), {
        fullName: formData.fullName, phone: formData.phone, address: formData.address,
        age: formData.age, gender: formData.gender, branch: myBranch, visitCount: 1, createdAt: serverTimestamp(),
        lastAmount: formData.amount, lastDept: formData.department, doctorName: formData.doctorName
      });

      const vData = {
        patientId: pRef.id, patientName: formData.fullName, visitNumber: 1,
        age: formData.age, gender: formData.gender, doctorId: formData.doctorId,
        doctorName: formData.doctorName, department: formData.department,
        amount: formData.amount, branch: myBranch, status: "pending", createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "visits"), vData);
      handleInvoicePrint({ ...formData, id: pRef.id }, vData);
      setOpen(false);
      resetForm();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "patients", selectedPatient.id), {
        visitCount: increment(1), 
        lastAmount: formData.amount, 
        lastDept: formData.department,
        doctorName: formData.doctorName 
      });

      const vData = {
        patientId: selectedPatient.id, patientName: selectedPatient.fullName,
        visitNumber: (selectedPatient.visitCount || 1) + 1, age: selectedPatient.age,
        gender: selectedPatient.gender, doctorId: formData.doctorId, doctorName: formData.doctorName,
        department: formData.department, amount: formData.amount, branch: myBranch, 
        status: "pending", createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "visits"), vData);
      handleInvoicePrint(selectedPatient, vData);
      setResendOpen(false);
      resetForm();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const resetForm = () => setFormData({ fullName: "", phone: "", address: "", age: "", gender: "", department: "", doctorId: "", doctorName: "", amount: "" });

  const filteredPatients = patients.filter(p => p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm));
  const currentRecords = filteredPatients.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2"><Users className="text-blue-600" size={28} /> MASTER REGISTRY</h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Branch: {myBranch || "..."}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search patient..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-black"><UserPlus size={18} className="mr-2" /> NEW PATIENT</Button>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow>
              <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Patient Info</TableCell>
              <TableCell className="text-white font-bold text-center uppercase text-[10px]">Visits</TableCell>
              <TableCell className="text-white font-bold text-center uppercase text-[10px]">District</TableCell>
              <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px]">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((p) => (
              <TableRow key={p.id} className="hover:bg-accent/50 border-b">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">{p.fullName?.charAt(0)}</div>
                    <div><div className="text-sm font-bold">{p.fullName}</div><div className="text-[10px] text-muted-foreground">{p.phone}</div></div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px] font-black">{p.visitCount || 1} Visits</Badge>
                </TableCell>
                <TableCell className="text-center font-semibold text-xs"><MapPin size={12} className="inline mr-1 text-red-500" /> {p.address}</TableCell>
                <TableCell className="text-right pr-6 flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="border-green-600 text-green-600 font-bold h-9 text-[10px]" onClick={() => handleInvoicePrint(p, { amount: p.lastAmount || 0, department: p.lastDept || 'Service', doctorName: p.doctorName || 'General' })}><Printer size={14} className="mr-1" /> INVOICE</Button>
                  <Button size="sm" className="bg-indigo-600 font-bold h-9 text-[10px]" onClick={() => { setSelectedPatient(p); setResendOpen(true); }}><RefreshCcw size={14} className="mr-1" /> RESEND</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* NEW PATIENT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-blue-600 uppercase">Register New Profile</DialogTitle>
            <DialogDescription>Add a new patient to the system and generate a receipt.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterNew} className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2"><label className="text-[11px] font-black uppercase">Full Name</label><Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required /></div>
            <div><label className="text-[11px] font-black uppercase">Age</label><Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required /></div>
            <div><label className="text-[11px] font-black uppercase">Gender</label><select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            <div><label className="text-[11px] font-black uppercase">Phone</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
            <div><label className="text-[11px] font-black uppercase">District</label><select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required><option value="">Select District</option>{BANAADIR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="col-span-2 grid grid-cols-3 gap-3 border-t pt-4">
              <div><label className="text-[11px] font-black uppercase">Dept</label><select className="w-full p-2.5 border rounded-md text-sm dark:bg-slate-900" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required><option value="">Select</option><option value="Eye">Eye</option><option value="Ear">Ear</option></select></div>
              <div><label className="text-[11px] font-black uppercase">Doctor</label><select className="w-full p-2.5 border rounded-md text-sm dark:bg-slate-900" value={formData.doctorId} onChange={e => { const d = doctors.find(x => x.id === e.target.value); setFormData({...formData, doctorId: e.target.value, doctorName: d?.fullName || ""}) }} required><option value="">Select</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select></div>
              <div><label className="text-[11px] font-black uppercase text-red-600">Amount ($)</label><Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
            </div>
            <Button type="submit" className="col-span-2 bg-blue-600 h-12 font-black uppercase mt-2">{loading ? <Loader2 className="animate-spin" /> : "REGISTER & PRINT"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* RESEND DIALOG */}
      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent className="max-w-md dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-indigo-600">RETURNING VISIT</DialogTitle>
            <DialogDescription>Process a returning visit for {selectedPatient?.fullName}.</DialogDescription>
          </DialogHeader>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg">
             <h3 className="font-bold">{selectedPatient?.fullName}</h3>
             <Badge className="mt-2 bg-indigo-600">Visit #{(selectedPatient?.visitCount || 1) + 1}</Badge>
          </div>
          <form onSubmit={handleResend} className="space-y-4 pt-2">
             <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-black uppercase">Dept</label><select className="w-full p-2.5 border rounded-md text-sm dark:bg-slate-900 font-bold" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required><option value="">Select</option><option value="Eye">Eye</option><option value="Ear">Ear</option></select></div>
                <div><label className="text-[11px] font-black uppercase text-red-600">Amount ($)</label><Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
             </div>
             <div><label className="text-[11px] font-black uppercase">Assign Doctor</label><select className="w-full p-2.5 border rounded-md text-sm dark:bg-slate-900" value={formData.doctorId} onChange={e => { const d = doctors.find(x => x.id === e.target.value); setFormData({...formData, doctorId: e.target.value, doctorName: d?.fullName || ""}) }} required><option value="">Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}</select></div>
             <Button type="submit" className="w-full bg-indigo-600 h-12 font-black shadow-lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "COMPLETE & PRINT"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}