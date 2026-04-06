import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, getDocs, serverTimestamp 
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { Loader2, Search, Pill, Trash2, Glasses, ClipboardList, Stethoscope } from "lucide-react";

export default function DoctorAppointments() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(collection(db, "visits"), where("doctorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LOGIC: OPEN MEDICAL MODAL ---
  const handleOpenMeds = async (visit) => {
    setComplain("");
    setDiagnosis("");
    const invQ = query(collection(db, "branch_medicines"), where("branchId", "==", visit.branch));
    const invSnap = await getDocs(invQ);
    setInventory(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", visit.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPrescribedItems([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);
    setSelectedReception("");
  };

  // --- LOGIC: SEND MEDICAL PRESCRIPTION ---
  const handleSendMedical = async (visit) => {
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
        complain,
        diagnosis,
        items: prescribedItems,
        status: "pending",
        category: "medical",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "visits", visit.id), { 
        medsSent: true,
        status: visit.opticalSent ? "completed" : "processing" 
      });

      alert("Dawada iyo Warbixinta waa la diray ✅");
    } catch (err) { alert("Error saving medical data!"); }
    setActionLoading(false);
  };

  // --- LOGIC: OPEN OPTICAL MODAL ---
  const handleOpenOptical = async (visit) => {
    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", visit.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setSelectedReception("");
    setIpd("");
    setValues({
      RE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
      LE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
    });
  };

  // --- LOGIC: SEND OPTICAL PRESCRIPTION ---
  const handleSendOptical = async (visit) => {
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
        ipd,
        status: "pending",
        category: "optical",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "visits", visit.id), { opticalSent: true, status: visit.medsSent ? "completed" : "processing" });
      alert("Optical Prescription sent ✅");
    } catch (err) { alert("Error saving optical data!"); }
    setActionLoading(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen font-sans">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
        <div>
          <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600">Appointments</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">HORSED WATCH & Optical System</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <Input placeholder="Search patients..." className="w-72 pl-10 h-12 bg-card rounded-2xl border-blue-100" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-2xl border border-blue-50 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="border-none hover:bg-transparent">
              <TableCell className="text-white font-black py-6 pl-8 uppercase text-[11px] tracking-widest">Patient Identification</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Live Status</TableCell>
              <TableCell className="text-white font-black text-right pr-8 uppercase text-[11px] tracking-widest">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.filter(v => v.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
              <TableRow key={v.id} className="hover:bg-blue-50/50 transition">
                <TableCell className="py-5 pl-8">
                  <div className="font-black uppercase text-sm">{v.patientName}</div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{v.phone}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase ${v.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                    {v.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8 space-x-2">
                  
                  {/* --- MEDICAL MODAL --- */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={v.medsSent} className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white" onClick={() => handleOpenMeds(v)}>
                        <Pill size={14} className="mr-2" /> {v.medsSent ? "Meds Sent" : "Medical"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[750px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2"><Pill /> Medical Prescription</h2>
                        <p className="text-xs font-bold opacity-80">{v.patientName}</p>
                      </div>
                      
                      <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto bg-white">
                        
                        {/* 1. RECEPTION SELECTION (Maryan Aweys) */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-blue-100">
                          <label className="text-[10px] font-black uppercase text-blue-600 ml-1 tracking-widest">Assign to Reception</label>
                          <select className="w-full h-11 rounded-xl bg-white border-none px-4 text-sm font-bold shadow-sm outline-none mt-1" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                            <option value="">Select Personnel...</option>
                            {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                          </select>
                        </div>

                        {/* 2. COMPLAIN & DIAGNOSIS BOXES (Hurey) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 ml-1">
                              <ClipboardList size={14} className="text-blue-600" /> Complain
                            </label>
                            <Textarea 
                              placeholder="Enter patient complaints..." 
                              className="min-h-[120px] rounded-2xl border-blue-50 bg-slate-50/50 focus:bg-white font-medium shadow-sm transition-all"
                              value={complain}
                              onChange={(e) => setComplain(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 ml-1">
                              <Stethoscope size={14} className="text-blue-600" /> Diagnosis
                            </label>
                            <Textarea 
                              placeholder="Enter diagnosis details..." 
                              className="min-h-[120px] rounded-2xl border-blue-50 bg-slate-50/50 focus:bg-white font-medium shadow-sm transition-all"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* 3. MEDICINE LIST (Select Medicine) */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-blue-600 uppercase ml-1 tracking-widest">Select Medicine</label>
                          {prescribedItems.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl items-end border border-slate-100">
                              <div className="col-span-5">
                                <select className="w-full h-10 rounded-lg text-xs font-bold px-2 bg-white border-none shadow-sm outline-none" value={item.medicineId} onChange={(e) => {
                                  const newItems = [...prescribedItems];
                                  const med = inventory.find(m => m.id === e.target.value);
                                  newItems[idx] = { ...newItems[idx], medicineId: e.target.value, medicineName: med?.medicineName || "" };
                                  setPrescribedItems(newItems);
                                }}>
                                  <option value="">Select Medicine...</option>
                                  {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.medicineName}</option>)}
                                </select>
                              </div>
                              <div className="col-span-2"><Input type="number" placeholder="Qty" className="h-10 text-center font-bold border-none bg-white shadow-sm" value={item.quantity} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].quantity = e.target.value; setPrescribedItems(newItems); }} /></div>
                              <div className="col-span-4"><Input className="h-10 text-xs font-bold border-none bg-white shadow-sm" placeholder="Dosage" value={item.dosage} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].dosage = e.target.value; setPrescribedItems(newItems); }} /></div>
                              <div className="col-span-1"><Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}><Trash2 size={16}/></Button></div>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full border-dashed border-2 h-11 uppercase text-[10px] font-black rounded-xl text-blue-600 hover:bg-blue-50" onClick={() => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", quantity: 1, dosage: "" }])}>
                            + Add Medicine
                          </Button>
                        </div>

                        <Button disabled={actionLoading} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-[0.98] transition-all" onClick={() => handleSendMedical(v)}>
                          {actionLoading ? <Loader2 className="animate-spin" /> : "Dispatch Medical Prescription"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* --- OPTICAL MODAL --- */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={v.opticalSent} className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white" onClick={() => handleOpenOptical(v)}>
                        <Glasses size={14} className="mr-2" /> {v.opticalSent ? "Optical Sent" : "Optical"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[950px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2"><Glasses /> Optical Prescription</h2>
                        <p className="text-xs font-bold opacity-80">{v.patientName}</p>
                      </div>
                      <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto bg-white">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-blue-100">
                            <label className="text-[10px] font-black uppercase text-blue-600 ml-1">Assign to Receptionist</label>
                            <select className="w-full h-11 rounded-xl bg-white border-none px-4 text-sm font-bold shadow-sm outline-none" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                              <option value="">Select Personnel...</option>
                              {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                            </select>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-blue-100">
                            <label className="text-[10px] font-black uppercase text-blue-600 ml-1">IPD (Measurement)</label>
                            <Input placeholder="e.g. 69" className="h-11 rounded-xl bg-white border-none text-center font-black text-blue-600 shadow-sm" value={ipd} onChange={(e) => setIpd(e.target.value)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {['RE', 'LE'].map((eye) => (
                            <div key={eye} className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                              <h3 className="font-black text-blue-600 mb-6 text-xs uppercase flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> 
                                {eye === 'RE' ? 'Right Eye (RE)' : 'Left Eye (LE)'}
                              </h3>
                              {['distance', 'near'].map((type) => (
                                <div key={type} className="mb-6 last:mb-0">
                                  <p className="text-[9px] font-black uppercase text-blue-400 mb-3 ml-1 tracking-widest">{type} vision</p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {['sph', 'cyl', 'axis', 'va'].map((f) => (
                                      <div key={f} className="bg-white p-2 rounded-xl shadow-sm border border-blue-50">
                                        <label className="text-[8px] font-black uppercase text-slate-400 block mb-1 text-center">{f}</label>
                                        <Input 
                                          className="h-8 w-full text-center font-black text-blue-600 border-none bg-slate-50 rounded-lg text-[11px]" 
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

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Lens Options</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.keys(options).map((opt) => (
                              <div key={opt} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                <Checkbox 
                                  id={`${v.id}-${opt}`} checked={options[opt]} 
                                  onCheckedChange={(val) => setOptions({...options, [opt]: !!val})} 
                                />
                                <label htmlFor={`${v.id}-${opt}`} className="text-[9px] font-bold uppercase text-slate-600 cursor-pointer leading-none">
                                  {opt.replace(/([A-Z])/g, ' $1')}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-[0.98]" onClick={() => handleSendOptical(v)}>
                          {actionLoading ? <Loader2 className="animate-spin" /> : "Send Optical Prescription"}
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