import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, getDocs, serverTimestamp 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Icons
import { Loader2, Search, Pill, Send, Trash2, Glasses, Clock, History } from "lucide-react";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // --- STATES FOR OPTICAL ---
  const [values, setValues] = useState({
    RE: { sph: "", cyl: "", axis: "" },
    LE: { sph: "", cyl: "", axis: "" },
  });

  const [options, setOptions] = useState({
    distance: false, near: false, bifocal: false, progressive: false,
    singleVision: false, photoBrown: false, photoGrey: false, white: false,
    sunglasses: false, blueCut: false, highIndex: false, plasticCr39: false,
    crookesB1: false, crookesB2: false, halfEye: false, contactLenses: false, kaPto: false,
  });

  // --- STATES FOR MEDICAL ---
  const [inventory, setInventory] = useState([]);
  const [prescribedItems, setPrescribedItems] = useState([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);

  const recordsPerPage = 8;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "visits"), 
      where("doctorId", "==", currentUser.uid), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenMeds = async (visit) => {
    const invQ = query(collection(db, "branch_medicines"), where("branchId", "==", visit.branch));
    const invSnap = await getDocs(invQ);
    setInventory(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", visit.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    setPrescribedItems([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);
    setSelectedReception("");
  };

  const handleSendMedicalPrescription = async (visit) => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "medical_prescriptions"), {
        patientId: visit.patientId,
        visitId: visit.id,
        patientName: visit.patientName,
        doctorId: auth.currentUser.uid,
        doctorName: visit.doctorName || "Doctor",
        branch: visit.branch,
        sendTo: selectedReception,
        items: prescribedItems,
        status: "pending",
        category: "medical",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "visits", visit.id), { status: "completed" });
      await updateDoc(doc(db, "patients", visit.patientId), { lastVisitStatus: "completed" });

      alert("Dawada waa la diray ✅");
    } catch (err) { alert("Cillad ayaa dhacday!"); }
    setActionLoading(false);
  };

  const handleSendOpticalPrescription = async (visit) => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: visit.patientId,
        visitId: visit.id,
        patientName: visit.patientName,
        doctorId: auth.currentUser.uid,
        doctorName: visit.doctorName || "Doctor",
        branch: visit.branch,
        sendTo: selectedReception,
        values,
        options,
        status: "pending",
        category: "optical",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "visits", visit.id), { status: "completed" });
      await updateDoc(doc(db, "patients", visit.patientId), { lastVisitStatus: "completed" });
      
      alert("Optical sent ✅");
    } catch (err) { alert("Error!"); }
    setActionLoading(false);
  };

  const filtered = visits.filter(v => (v.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const currentData = filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
           <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600 flex items-center gap-3">
             <Clock className="text-orange-500" /> Patient Queue
           </h2>
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Live from Visits Collection</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
           <Input placeholder="Search queue..." className="w-72 pl-10 h-12 bg-card rounded-2xl border-blue-100 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-2xl border border-blue-50 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="text-white font-black py-6 pl-8 uppercase text-[11px] tracking-widest">Patient & Visit Info</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Live Status</TableCell>
              <TableCell className="text-white font-black text-right pr-8 uppercase text-[11px] tracking-widest">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map(v => (
              <TableRow key={v.id} className="hover:bg-blue-50/50 transition border-b border-blue-50">
                <TableCell className="py-5 pl-8">
                   <div className="flex items-center gap-2">
                     <div className="font-black uppercase text-sm text-slate-800">{v.patientName}</div>
                     <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[9px] border-amber-200 uppercase font-black">
                       Visit #{v.visitNumber || 1}
                     </Badge>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-indigo-600 text-[9px] h-4 font-black">{v.department}</Badge>
                      <span className="text-[10px] text-slate-400 font-bold">{v.phone}</span>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="outline" className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${v.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                     {v.status || 'pending'}
                   </Badge>
                </TableCell>
                <TableCell className="text-right pr-8 space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" disabled={v.status === 'completed'} size="sm" className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white" onClick={() => handleOpenMeds(v)}>
                        <Glasses size={14} className="mr-2" /> Optical
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Glasses /> Optical Exam</h2>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest mt-1">{v.patientName} | Visit #{v.visitNumber || 1}</p>
                      </div>
                      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-card">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Assign to Reception</label>
                          <select className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                            <option value="">Select Personnel</option>
                            {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {['RE', 'LE'].map((eye) => (
                            <div key={eye} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <h3 className="font-black text-blue-600 mb-3 text-xs tracking-widest uppercase">{eye === 'RE' ? 'Right Eye (RE)' : 'Left Eye (LE)'}</h3>
                              <div className="space-y-3">
                                {['sph', 'cyl', 'axis'].map((field) => (
                                  <div key={field} className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase text-slate-400 w-12">{field}</label>
                                    <Input className="h-9 w-28 text-center font-bold rounded-lg border-none bg-white" value={values[eye][field]} onChange={(e) => setValues({...values, [eye]: {...values[eye], [field]: e.target.value}})} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.keys(options).map((opt) => (
                            <div key={opt} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <Checkbox id={opt} checked={options[opt]} onCheckedChange={(checked) => setOptions({...options, [opt]: checked})} />
                              <label htmlFor={opt} className="text-[8px] font-black uppercase text-slate-600 cursor-pointer">{opt.replace(/([A-Z])/g, ' $1')}</label>
                            </div>
                          ))}
                        </div>
                        <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs" onClick={() => handleSendOpticalPrescription(v)}>
                          {actionLoading ? <Loader2 className="animate-spin" /> : "Dispatch Optical Order"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" disabled={v.status === 'completed'} size="sm" className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white" onClick={() => handleOpenMeds(v)}>
                        <Pill size={14} className="mr-2" /> Meds
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2"><Pill /> Medicine Prescription</h2>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest mt-1">{v.patientName} | Visit #{v.visitNumber || 1}</p>
                      </div>
                      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-card">
                         <select className="w-full h-12 rounded-xl bg-slate-50 px-4 text-sm font-bold border-none" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                          <option value="">Assign to Reception</option>
                          {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                        </select>
                        <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs" onClick={() => handleSendMedicalPrescription(v)}>
                          {actionLoading ? <Loader2 className="animate-spin" /> : "Dispatch Medical Order"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}