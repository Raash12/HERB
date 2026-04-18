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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { 
  Loader2, Search, Pill, Trash2, Glasses, ClipboardList, 
  Stethoscope, User
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

  // --- FETCH VISITS ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "visits"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setFirstDoc(snap.docs[0]);
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setVisits([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- FIX: REAL-TIME INVENTORY LISTENER ---
  useEffect(() => {
    let unsubscribeMeds = () => {};

    if (medicalOpen && activeVisit?.branch) {
      const invQ = query(
        collection(db, "branch_medicines"), 
        where("branchId", "==", activeVisit.branch)
      );
      
      unsubscribeMeds = onSnapshot(invQ, (snap) => {
        const medsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInventory(medsData);
      }, (error) => {
        console.error("Inventory Error:", error);
      });
    }

    return () => unsubscribeMeds();
  }, [medicalOpen, activeVisit]);

  // --- MEDICAL MODAL HELPERS ---
  const handleOpenMeds = async (visit) => {
    setActiveVisit(visit);
    setComplain("");
    setDiagnosis("");
    setPrescribedItems([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);
    setSelectedReception("");
    
    // Fetch Receptions (Static fetch is okay here)
    const recQ = query(
        collection(db, "users"), 
        where("role", "==", "reception"), 
        where("branch", "==", visit.branch)
    );
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

      setMedicalOpen(false);
      alert("Sent ✅");
    } catch (err) { alert("Error!"); }
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

      setOpticalOpen(false);
      alert("Sent ✅");
    } catch (err) { alert("Error!"); }
    setActionLoading(false);
  };

  if (loading && page === 1) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-black text-5xl tracking-tighter uppercase text-blue-600">Appointments</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 bg-white px-4 py-1.5 rounded-full shadow-sm inline-block border border-blue-50">
            HORSEED WATCH & Optical System
          </p>
        </div>
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
          <Input 
            placeholder="Search patient..." 
            className="w-full md:w-96 pl-14 h-16 bg-white rounded-[1.5rem] border-none shadow-2xl font-bold uppercase text-[13px]" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-sm border border-blue-50/50 overflow-hidden">
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
              <TableRow key={v.id} className="hover:bg-blue-50/30 transition-all border-slate-50">
                <TableCell className="py-7 pl-12">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-sm"><User size={22} /></div>
                    <div>
                      <div className="font-black uppercase text-[16px] tracking-tight text-slate-800">{v.patientName}</div>
                      <div className="text-[11px] text-blue-500 font-bold uppercase tracking-tighter mt-1">{v.phone}</div>
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
                    <Button variant="ghost" disabled={v.medsSent} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleOpenMeds(v)}>
                      <Pill size={16} className="mr-2" /> {v.medsSent ? "Sent" : "Meds"}
                    </Button>
                    <Button variant="ghost" disabled={v.opticalSent} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleOpenOptical(v)}>
                      <Glasses size={16} className="mr-2" /> {v.opticalSent ? "Sent" : "Optical"}
                    </Button>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl text-red-400" onClick={async () => { if(window.confirm("Sure?")) await deleteDoc(doc(db, "visits", v.id)) }}><Trash2 size={18} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- MEDICAL DIALOG --- */}
      <Dialog open={medicalOpen} onOpenChange={setMedicalOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-3">
                <Pill size={24} /> Medical Portal
            </DialogTitle>
            <DialogDescription className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                Prescribing for: {activeVisit?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
            <div className="bg-slate-50 p-4 rounded-xl border border-blue-50">
              <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Receptionist</label>
              <select className="w-full h-10 rounded-lg bg-white border border-slate-200 px-4 text-xs font-bold mt-2 outline-none" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                <option value="">Select...</option>
                {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><ClipboardList size={14} /> Symptoms</label>
                <Textarea className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 p-4 text-xs font-bold" value={complain} onChange={(e) => setComplain(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Stethoscope size={14} /> Diagnosis</label>
                <Textarea className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 p-4 text-xs font-bold" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Prescription ({activeVisit?.branch} Stock)</label>
              {prescribedItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center">
                  <div className="col-span-6">
                    <select className="w-full h-9 rounded-lg text-[11px] font-bold px-3 bg-white border border-slate-200 outline-none" value={item.medicineId} onChange={(e) => {
                      const newItems = [...prescribedItems];
                      const med = inventory.find(m => m.id === e.target.value);
                      newItems[idx] = { ...newItems[idx], medicineId: e.target.value, medicineName: med?.medicineName || "" };
                      setPrescribedItems(newItems);
                    }}>
                      <option value="">Select Drug...</option>
                      {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.medicineName} ({inv.quantity} left)</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" className="h-9 rounded-lg text-center font-bold text-xs border-slate-200" placeholder="Qty" value={item.quantity} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].quantity = e.target.value; setPrescribedItems(newItems); }} />
                  </div>
                  <div className="col-span-3">
                    <Input className="h-9 rounded-lg text-[11px] font-bold px-3 border-slate-200" placeholder="Dosage" value={item.dosage} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].dosage = e.target.value; setPrescribedItems(newItems); }} />
                  </div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" className="h-8 w-8 p-0 text-red-400" onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}><Trash2 size={14}/></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed h-10 text-[10px] font-black rounded-xl text-blue-600" onClick={() => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", quantity: 1, dosage: "" }])}>+ Add Row</Button>
            </div>
            
            <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg" onClick={handleSendMedical}>
              {actionLoading ? <Loader2 className="animate-spin" /> : "Authorize & Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- OPTICAL DIALOG --- */}
      <Dialog open={opticalOpen} onOpenChange={setOpticalOpen}>
        <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-3">
                <Glasses size={28} /> Optical Presc.
            </DialogTitle>
            <DialogDescription className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                Patient: {activeVisit?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-blue-50">
                <label className="text-[10px] font-black uppercase text-blue-600">Personnel</label>
                <select className="w-full h-10 rounded-lg bg-white border border-slate-200 px-4 text-xs font-bold mt-2 outline-none" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                  <option value="">Select...</option>
                  {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-blue-50 text-center">
                <label className="text-[10px] font-black uppercase text-blue-600">IPD</label>
                <Input className="h-10 rounded-lg text-center font-black text-blue-600 mt-2 text-lg border-slate-200" value={ipd} onChange={(e) => setIpd(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {['RE', 'LE'].map((eye) => (
                <div key={eye} className="p-6 bg-blue-50/40 rounded-2xl border border-blue-100">
                  <h3 className="font-black text-blue-600 mb-4 text-xs uppercase">{eye === 'RE' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</h3>
                  {['distance', 'near'].map((type) => (
                    <div key={type} className="mb-4 last:mb-0">
                      <p className="text-[9px] font-black uppercase text-blue-400 mb-2 italic">{type}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {['sph', 'cyl', 'axis', 'va'].map((f) => (
                          <div key={f} className="text-center">
                            <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">{f}</label>
                            <Input className="h-8 w-full text-center font-bold text-blue-600 border-slate-200 rounded-lg text-xs" value={values[eye][type][f]} onChange={(e) => { const newValues = { ...values }; newValues[eye][type][f] = e.target.value; setValues(newValues); }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Object.keys(options).map((opt) => (
                <div key={opt} onClick={() => setOptions({...options, [opt]: !options[opt]})} className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer h-12 text-center transition-all ${options[opt] ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
                  <span className="text-[9px] font-black uppercase leading-tight">{opt}</span>
                </div>
              ))}
            </div>
            <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 text-white rounded-xl font-black uppercase text-xs" onClick={handleSendOptical}>Complete & Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}