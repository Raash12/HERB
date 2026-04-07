import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, getDocs, serverTimestamp, 
  limit, startAfter, endBefore, limitToLast, deleteDoc
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { 
  Loader2, Search, Pill, Trash2, Glasses, ClipboardList, 
  Stethoscope, ChevronLeft, ChevronRight, User, AlertCircle
} from "lucide-react";

export default function DoctorAppointments() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Control States
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [opticalOpen, setOpticalOpen] = useState(false);
  const [activeVisit, setActiveVisit] = useState(null);

  // --- PAGINATION STATES ---
  const [firstDoc, setFirstDoc] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- MEDICAL STATES ---
  const [complain, setComplain] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [inventory, setInventory] = useState([]);
  const [prescribedItems, setPrescribedItems] = useState([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);

  // --- OPTICAL STATES ---
  const [ipd, setIpd] = useState("");
  const [values, setValues] = useState({
    RE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
    LE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
  });
  const [options, setOptions] = useState({
    distance: false, near: false, bifocal: false, progressive: false,
    singleVision: false, photoBrown: false, photoGrey: false, white: false,
    sunglasses: false, blueCut: false, highIndex: false, plasticCr39: false,
    contactlenses: false, crookesB1: false, crookesB2: false, halfEye: false, kaPto: false,
  });

  // --- FETCH LOGIC ---
  useEffect(() => {
    const unsubscribe = fetchVisits();
    return () => unsubscribe && unsubscribe();
  }, []);

  const fetchVisits = (direction = "initial") => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    let q;

    if (direction === "next" && lastDoc) {
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else if (direction === "prev" && firstDoc) {
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        endBefore(firstDoc),
        limitToLast(pageSize)
      );
    } else {
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setFirstDoc(snap.docs[0]);
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        if (direction === "initial") setVisits([]);
      }
      setLoading(false);
    });
  };

  const handleNextPage = () => {
    setPage(p => p + 1);
    fetchVisits("next");
  };

  const handlePrevPage = () => {
    setPage(p => Math.max(p - 1, 1));
    fetchVisits("prev");
  };

  // --- DELETE LOGIC ---
  const handleDeleteVisit = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment record?")) {
      try {
        await deleteDoc(doc(db, "visits", id));
        alert("Record deleted successfully.");
      } catch (err) {
        alert("Error deleting record.");
      }
    }
  };

  // --- MEDICAL MODAL HELPERS ---
  const handleOpenMeds = async (visit) => {
    setActiveVisit(visit);
    setComplain("");
    setDiagnosis("");
    setPrescribedItems([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);
    setSelectedReception("");
    
    // Fetch Data
    const invQ = query(collection(db, "branch_medicines"), where("branchId", "==", visit.branch));
    const invSnap = await getDocs(invQ);
    setInventory(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", visit.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    setMedicalOpen(true);
  };

  const handleSendMedical = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "medical_prescriptions"), {
        patientId: activeVisit.patientId,
        visitId: activeVisit.id,
        patientName: activeVisit.patientName,
        doctorId: auth.currentUser.uid,
        doctorName: activeVisit.doctorName || "Doctor",
        branch: activeVisit.branch,
        sendTo: selectedReception,
        complain,
        diagnosis,
        items: prescribedItems,
        status: "pending",
        category: "medical",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "visits", activeVisit.id), { 
        medsSent: true,
        status: activeVisit.opticalSent ? "completed" : "processing" 
      });

      setMedicalOpen(false); // Hide Modal
      alert("Dawada iyo Warbixinta waa la diray ✅");
    } catch (err) { alert("Error saving medical data!"); }
    setActionLoading(false);
  };

  // --- OPTICAL MODAL HELPERS ---
  const handleOpenOptical = async (visit) => {
    setActiveVisit(visit);
    setSelectedReception("");
    setIpd("");
    setValues({
      RE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
      LE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
    });
    setOptions(Object.fromEntries(Object.keys(options).map(key => [key, false])));

    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", visit.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    setOpticalOpen(true);
  };

  const handleSendOptical = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: activeVisit.patientId,
        visitId: activeVisit.id,
        patientName: activeVisit.patientName,
        doctorId: auth.currentUser.uid,
        doctorName: activeVisit.doctorName || "Doctor",
        branch: activeVisit.branch,
        sendTo: selectedReception,
        values,
        options,
        ipd,
        status: "pending",
        category: "optical",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "visits", activeVisit.id), { 
        opticalSent: true, 
        status: activeVisit.medsSent ? "completed" : "processing" 
      });

      setOpticalOpen(false); // Hide Modal
      alert("Optical Prescription sent ✅");
    } catch (err) { alert("Error saving optical data!"); }
    setActionLoading(false);
  };

  if (loading && page === 1) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-black text-5xl tracking-tighter uppercase text-blue-600 leading-none">Appointments</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 bg-white px-4 py-1.5 rounded-full shadow-sm inline-block border border-blue-50">
            HORSEED WATCH & Optical System
          </p>
        </div>
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <Input 
            placeholder="Search patient by name..." 
            className="w-full md:w-96 pl-14 h-16 bg-white rounded-[1.5rem] border-none shadow-2xl focus:ring-4 focus:ring-blue-100 transition-all font-bold uppercase text-[13px] tracking-tight" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-blue-50/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="border-none hover:bg-transparent">
              <TableCell className="text-white font-black py-8 pl-12 uppercase text-[11px] tracking-[0.2em]">Patient Details</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-[0.2em]">Status</TableCell>
              <TableCell className="text-white font-black text-right pr-12 uppercase text-[11px] tracking-[0.2em]">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.filter(v => v.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
              <TableRow key={v.id} className="hover:bg-blue-50/30 transition-all border-slate-50 group">
                <TableCell className="py-7 pl-12">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <User size={22} />
                    </div>
                    <div>
                      <div className="font-black uppercase text-[16px] tracking-tight text-slate-800">{v.patientName}</div>
                      <div className="text-[11px] text-blue-500 font-bold uppercase tracking-tighter flex items-center gap-2 mt-1">
                        <span className="opacity-40">REF:</span> {v.patientId?.slice(-8)} <span className="opacity-20">|</span> {v.phone}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${v.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {v.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-12">
                  <div className="flex items-center justify-end gap-3">
                    <Button 
                      variant="ghost" 
                      disabled={v.medsSent} 
                      className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white transition-all" 
                      onClick={() => handleOpenMeds(v)}
                    >
                      <Pill size={16} className="mr-2" /> {v.medsSent ? "Sent" : "Meds"}
                    </Button>

                    <Button 
                      variant="ghost" 
                      disabled={v.opticalSent} 
                      className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white transition-all" 
                      onClick={() => handleOpenOptical(v)}
                    >
                      <Glasses size={16} className="mr-2" /> {v.opticalSent ? "Sent" : "Optical"}
                    </Button>

                    {/* --- DELETE BUTTON --- */}
                    <Button 
                      variant="ghost" 
                      className="h-12 w-12 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all" 
                      onClick={() => handleDeleteVisit(v.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* --- PAGINATION --- */}
        <div className="flex items-center justify-between px-12 py-10 bg-slate-50/80 border-t border-blue-50">
          <div className="flex items-center gap-4">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Active Page</span>
              <Badge className="bg-blue-600 text-white font-black px-5 py-1.5 rounded-xl border-none shadow-lg shadow-blue-100">{page}</Badge>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="rounded-2xl font-black uppercase text-[10px] h-14 px-8 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              <ChevronLeft size={18} className="mr-2" /> Prev
            </Button>
            <Button 
              variant="outline" 
              className="rounded-2xl font-black uppercase text-[10px] h-14 px-8 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              onClick={handleNextPage}
              disabled={visits.length < pageSize}
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* --- MEDICAL DIALOG --- */}
      <Dialog open={medicalOpen} onOpenChange={setMedicalOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-blue-600 p-10 text-white">
            <h2 className="text-3xl font-black uppercase flex items-center gap-4"><Pill size={32} /> Medical Portal</h2>
            <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.3em] mt-2">Patient: {activeVisit?.patientName}</p>
          </div>
          
          <div className="p-12 space-y-8 max-h-[75vh] overflow-y-auto bg-white">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-blue-50 shadow-inner">
              <label className="text-[11px] font-black uppercase text-blue-600 ml-1 tracking-widest">Select Receptionist</label>
              <select className="w-full h-16 rounded-2xl bg-white border-none px-6 text-sm font-bold shadow-sm outline-none mt-3 appearance-none cursor-pointer" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                <option value="">Search personnel...</option>
                {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 ml-2 tracking-widest">
                  <ClipboardList size={18} className="text-blue-600" /> Symptoms
                </label>
                <Textarea 
                  placeholder="Record patient complaints..." 
                  className="min-h-[180px] rounded-[2.5rem] border-blue-50 bg-slate-50 focus:bg-white font-bold p-8 text-sm shadow-sm transition-all"
                  value={complain}
                  onChange={(e) => setComplain(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-2 ml-2 tracking-widest">
                  <Stethoscope size={18} className="text-blue-600" /> Diagnosis
                </label>
                <Textarea 
                  placeholder="Clinical assessment..." 
                  className="min-h-[180px] rounded-[2.5rem] border-blue-50 bg-slate-50 focus:bg-white font-bold p-8 text-sm shadow-sm transition-all"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center px-2">
                 <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Prescription Items</label>
                 <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[11px] px-4 py-1 rounded-lg">{prescribedItems.length} UNITS</Badge>
              </div>
              {prescribedItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 bg-slate-50 p-5 rounded-[2rem] items-center border border-slate-100">
                  <div className="col-span-5">
                    <select className="w-full h-14 rounded-2xl text-xs font-black px-5 bg-white border-none shadow-sm outline-none cursor-pointer" value={item.medicineId} onChange={(e) => {
                      const newItems = [...prescribedItems];
                      const med = inventory.find(m => m.id === e.target.value);
                      newItems[idx] = { ...newItems[idx], medicineId: e.target.value, medicineName: med?.medicineName || "" };
                      setPrescribedItems(newItems);
                    }}>
                      <option value="">Select Drug...</option>
                      {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.medicineName} ({inv.category})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" className="h-14 rounded-2xl text-center font-black border-none bg-white shadow-sm" value={item.quantity} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].quantity = e.target.value; setPrescribedItems(newItems); }} />
                  </div>
                  <div className="col-span-4">
                    <Input className="h-14 rounded-2xl text-xs font-black px-5 border-none bg-white shadow-sm" placeholder="Dosage (e.g. 1x2)" value={item.dosage} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].dosage = e.target.value; setPrescribedItems(newItems); }} />
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" className="h-14 w-14 rounded-2xl text-red-400 hover:text-red-600" onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}><Trash2 size={20}/></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed border-2 h-16 uppercase text-[11px] font-black rounded-[2rem] text-blue-600 hover:bg-blue-50 border-blue-200" onClick={() => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", quantity: 1, dosage: "" }])}>
                + Add Medication Row
              </Button>
            </div>

            <Button disabled={actionLoading} className="w-full h-24 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm shadow-2xl active:scale-[0.97] transition-all" onClick={handleSendMedical}>
              {actionLoading ? <Loader2 className="animate-spin" /> : "Authorize & Send to Pharmacy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- OPTICAL DIALOG --- */}
      <Dialog open={opticalOpen} onOpenChange={setOpticalOpen}>
        <DialogContent className="sm:max-w-[1100px] rounded-[4rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-blue-600 p-10 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black uppercase flex items-center gap-4"><Glasses size={36} /> Optical Prescription</h2>
              <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.3em] mt-2">Patient: {activeVisit?.patientName}</p>
            </div>
          </div>
          <div className="p-12 space-y-10 max-h-[85vh] overflow-y-auto bg-white">
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-blue-50 shadow-inner">
                <label className="text-[11px] font-black uppercase text-blue-600 ml-1 tracking-widest">Assign Personnel</label>
                <select className="w-full h-16 rounded-2xl bg-white border-none px-6 text-sm font-bold shadow-sm outline-none mt-3 appearance-none cursor-pointer" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                  <option value="">Select...</option>
                  {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-blue-50 shadow-inner text-center">
                <label className="text-[11px] font-black uppercase text-blue-600 tracking-widest">Interpupillary Distance (IPD)</label>
                <Input placeholder="64/62" className="h-16 rounded-2xl bg-white border-none text-center font-black text-blue-600 shadow-sm mt-3 text-2xl" value={ipd} onChange={(e) => setIpd(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {['RE', 'LE'].map((eye) => (
                <div key={eye} className="p-10 bg-blue-50/40 rounded-[3.5rem] border border-blue-100">
                  <h3 className="font-black text-blue-600 mb-10 text-[16px] uppercase flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-blue-600" /> 
                    {eye === 'RE' ? 'Right Eye (OD)' : 'Left Eye (OS)'}
                  </h3>
                  {['distance', 'near'].map((type) => (
                    <div key={type} className="mb-12 last:mb-0">
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em] mb-5 ml-2 italic">{type} Vision</p>
                      <div className="grid grid-cols-4 gap-4">
                        {['sph', 'cyl', 'axis', 'va'].map((f) => (
                          <div key={f} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 text-center">{f}</label>
                            <Input 
                              className="h-12 w-full text-center font-black text-blue-600 border-none bg-slate-50 rounded-xl text-[14px]" 
                              value={values[eye][type][f]} 
                              onChange={(e) => {
                                const newValues = { ...values };
                                newValues[eye][type][f] = e.target.value;
                                setValues(newValues);
                              }} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] ml-4">Lens Specifications</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.keys(options).map((opt) => (
                  <div 
                    key={opt} 
                    onClick={() => setOptions({...options, [opt]: !options[opt]})}
                    className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all cursor-pointer h-32 text-center ${options[opt] ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-blue-50'}`}
                  >
                    <Checkbox checked={options[opt]} className="hidden" />
                    <span className="text-[10px] font-black uppercase leading-tight">
                      {opt.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button disabled={actionLoading} className="w-full h-24 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-sm shadow-2xl active:scale-[0.96] transition-all" onClick={handleSendOptical}>
              {actionLoading ? <Loader2 className="animate-spin" /> : "Complete Optical Registration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}