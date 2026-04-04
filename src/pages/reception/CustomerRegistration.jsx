import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, getDocs, query, where, addDoc, doc, getDoc, onSnapshot, orderBy, serverTimestamp, updateDoc, increment } from "firebase/firestore";

// UI Components
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, UserPlus, MapPin, Search, Users, 
  ChevronLeft, ChevronRight, RefreshCcw, UserCheck 
} from "lucide-react";

const BANAADIR_DISTRICTS = [
  "Cabdiasiis", "Boondheere", "Dayniile", "Dharkeenley", "Hamar Jajab", 
  "Hamar Weyne", "Hodan", "Howlwadaag", "Huriwaa", "Kaaraan", "Kaxda", 
  "Shangaani", "Shibis", "Waaberi", "Wadajir", "Wardhiigley", "Warta Nabada", 
  "Yaaqshiid", "Garasbaaley", "Gubadley"
];

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
    department: "", doctorId: "", doctorName: "",
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
      const patientRef = await addDoc(collection(db, "patients"), {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        age: formData.age,
        gender: formData.gender,
        branch: myBranch,
        visitCount: 1,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "visits"), {
        patientId: patientRef.id,
        patientName: formData.fullName,
        visitNumber: 1,
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        phone: formData.phone,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        department: formData.department,
        branch: myBranch,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setOpen(false);
      resetForm();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        visitCount: increment(1)
      });

      const nextVisitNum = (selectedPatient.visitCount || 1) + 1;

      await addDoc(collection(db, "visits"), {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        visitNumber: nextVisitNum,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        address: selectedPatient.address,
        phone: selectedPatient.phone,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        department: formData.department,
        branch: myBranch,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setResendOpen(false);
      resetForm();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({ fullName: "", phone: "", address: "", age: "", gender: "", department: "", doctorId: "", doctorName: "" });
    setSelectedPatient(null);
  };

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPatients.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> Master Registry
          </h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Branch: {myBranch || "..."}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Find returning patient..." 
              className="pl-10 h-11 border-blue-100 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-black rounded-lg shadow-lg">
                <UserPlus size={18} className="mr-2" /> NEW PATIENT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-slate-950">
              <DialogHeader><DialogTitle className="text-2xl font-black text-blue-600 uppercase">Register New Profile</DialogTitle></DialogHeader>
              <form onSubmit={handleRegisterNew} className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-black uppercase">Full Name</label>
                  <Input placeholder="Enter name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase">Age</label><Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required /></div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase">Gender</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[11px] font-black uppercase">Phone</label><Input placeholder="61XXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase">District</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required>
                    <option value="">Select District</option>{BANAADIR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                   <p className="text-xs font-black text-blue-600 uppercase mb-3 underline">Initial Visit Assignment</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase">Department</label>
                        <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900 font-bold" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                          <option value="">Select</option><option value="Eye">Eye (Indhaha)</option><option value="Ear">Ear (Dhagaha)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase">Assign Doctor</label>
                        <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900" value={formData.doctorId} onChange={e => {
                          const docObj = doctors.find(d => d.id === e.target.value);
                          setFormData({...formData, doctorId: e.target.value, doctorName: docObj ? docObj.fullName : ""});
                        }} required>
                          <option value="">Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}
                        </select>
                      </div>
                   </div>
                </div>
                <Button type="submit" className="col-span-2 bg-blue-600 hover:bg-blue-700 h-12 font-black uppercase mt-4" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "REGISTER & SEND TO DOCTOR"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Saved Patient Info</TableCell>
              <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Visits</TableCell>
              <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">District</TableCell>
              <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((p) => (
              <TableRow key={p.id} className="hover:bg-accent/50 border-b dark:border-slate-800">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">{p.fullName?.charAt(0)}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight">{p.fullName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{p.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px] font-black px-2">
                        {p.visitCount || 1} Visits
                      </Badge>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{p.gender} • {p.age} Yrs</span>
                    </div>
                </TableCell>
                <TableCell className="text-center font-semibold text-xs"><MapPin size={12} className="inline mr-1 text-red-500" /> {p.address}</TableCell>
                <TableCell className="text-right pr-6">
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] h-9 shadow-md shadow-indigo-200 dark:shadow-none"
                    onClick={() => { setSelectedPatient(p); setResendOpen(true); }}
                  >
                    <RefreshCcw size={14} className="mr-1.5" /> RESEND TO DOCTOR
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/20 border-t">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Registered: {filteredPatients.length}</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 font-black" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></Button>
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-black text-xs">{currentPage} / {totalPages || 1}</div>
            <Button variant="outline" size="sm" className="h-8 font-black" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight size={14} /></Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent className="max-w-md dark:bg-slate-950 border-blue-500/20 border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-indigo-600">
              <UserCheck /> RETURNING VISIT
            </DialogTitle>
          </DialogHeader>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg mb-2">
             <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Patient Profile</p>
             <h3 className="font-bold text-lg">{selectedPatient?.fullName}</h3>
             <p className="text-xs opacity-70">{selectedPatient?.age} Yrs • {selectedPatient?.gender} • {selectedPatient?.address}</p>
             <Badge className="mt-2 bg-indigo-600">Returning for visit #{(selectedPatient?.visitCount || 1) + 1}</Badge>
          </div>
          <form onSubmit={handleResend} className="space-y-4 pt-2">
             <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-indigo-600">New Department</label>
                <select className="w-full p-3 rounded-md border-2 border-indigo-100 dark:border-slate-800 text-sm dark:bg-slate-900 font-bold" 
                  value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                  <option value="">Select</option><option value="Eye">Eye (Indhaha)</option><option value="Ear">Ear (Dhagaha)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-indigo-600">Assign To Doctor</label>
                <select className="w-full p-3 rounded-md border-2 border-indigo-100 dark:border-slate-800 text-sm dark:bg-slate-900" 
                  value={formData.doctorId} onChange={e => {
                    const docObj = doctors.find(d => d.id === e.target.value);
                    setFormData({...formData, doctorId: e.target.value, doctorName: docObj ? docObj.fullName : ""});
                  }} required>
                  <option value="">Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}
                </select>
              </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-black shadow-lg shadow-indigo-600/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "COMPLETE RESEND"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}