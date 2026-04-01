// src/pages/dashboard/doctor/DoctorAppointments.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, getDocs 
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
import { Loader2, Search, Eye, Pill, User, Send, Smartphone, MapPin, Activity, Plus, Trash2, Calendar, Glasses } from "lucide-react";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
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

    const q = query(collection(db, "patients"), where("doctorId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenMeds = async (patient) => {
    const invQ = query(collection(db, "branch_medicines"), where("branchId", "==", patient.branch));
    const invSnap = await getDocs(invQ);
    setInventory(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", patient.branch));
    const recSnap = await getDocs(recQ);
    setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    setPrescribedItems([{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]);
    setSelectedReception("");
  };

  const handleSendMedicalPrescription = async (patient) => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "medical_prescriptions"), {
        patientId: patient.id,
        patientName: patient.fullName,
        doctorId: auth.currentUser.uid,
        doctorName: patient.doctorName || "Doctor",
        branch: patient.branch,
        sendTo: selectedReception,
        items: prescribedItems,
        status: "pending",
        category: "medical",
        createdAt: new Date(),
      });
      await updateDoc(doc(db, "patients", patient.id), { status: "completed" });
      alert("Dawada waa la diray ✅");
    } catch (err) { alert("Cillad ayaa dhacday!"); }
    setActionLoading(false);
  };

  const handleSendOpticalPrescription = async (patient) => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: patient.id,
        patientName: patient.fullName,
        doctorId: auth.currentUser.uid,
        doctorName: patient.doctorName || "Doctor",
        branch: patient.branch,
        sendTo: selectedReception,
        values,
        options,
        status: "pending",
        category: "optical",
        createdAt: new Date(),
      });
      await updateDoc(doc(db, "patients", patient.id), { status: "completed" });
      alert("Prescription-ka Optical-ka waa la diray ✅");
    } catch (err) { alert("Cillad ayaa dhacday!"); }
    setActionLoading(false);
  };

  const filtered = patients.filter(p => (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const currentData = filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (loading) return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
           <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600">Appointments</h2>
           <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Doctor Portal / Live Queue</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
           <Input placeholder="Search patients..." className="w-72 pl-10 h-12 bg-card rounded-2xl border-blue-100 dark:border-blue-900/30 focus:ring-blue-600 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-2xl shadow-blue-100 dark:shadow-none border border-blue-50 dark:border-blue-900/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="text-white font-black py-6 pl-8 uppercase text-[11px] tracking-widest">Patient Identification</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Live Status</TableCell>
              <TableCell className="text-white font-black text-right pr-8 uppercase text-[11px] tracking-widest">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map(p => (
              <TableRow key={p.id} className="hover:bg-blue-50/50 transition border-b border-blue-50">
                <TableCell className="py-5 pl-8">
                   <div className="font-black uppercase text-sm text-slate-800">{p.fullName}</div>
                   <div className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{p.phone}</div>
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="outline" className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                     {p.status || 'pending'}
                   </Badge>
                </TableCell>
                <TableCell className="text-right pr-8 space-x-2">
                  
                  {/* --- OPTICAL PRESCRIPTION MODAL --- */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleOpenMeds(p)}>
                        <Glasses size={14} className="mr-2" /> Optical
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Glasses /> Optical Prescription</h2>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest mt-1">{p.fullName}</p>
                      </div>
                      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-card">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-blue-600 ml-1 tracking-widest">Assign to Reception</label>
                          <select className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold focus:ring-2 ring-blue-500" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                            <option value="">Select Personnel</option>
                            {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                          </select>
                        </div>

                        {/* RE / LE Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {['RE', 'LE'].map((eye) => (
                            <div key={eye} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <h3 className="font-black text-blue-600 mb-3 text-xs tracking-widest uppercase">{eye === 'RE' ? 'Right Eye (RE)' : 'Left Eye (LE)'}</h3>
                              <div className="space-y-3">
                                {['sph', 'cyl', 'axis'].map((field) => (
                                  <div key={field} className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase text-slate-400 w-12">{field}</label>
                                    <Input className="h-9 w-28 text-center font-bold rounded-lg border-none bg-white shadow-sm" value={values[eye][field]} onChange={(e) => setValues({...values, [eye]: {...values[eye], [field]: e.target.value}})} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Lens Options */}
                        <div className="grid grid-cols-3 gap-3">
                          {Object.keys(options).map((opt) => (
                            <div key={opt} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <Checkbox id={opt} checked={options[opt]} onCheckedChange={(checked) => setOptions({...options, [opt]: checked})} />
                              <label htmlFor={opt} className="text-[9px] font-black uppercase text-slate-600 cursor-pointer leading-none">{opt.replace(/([A-Z])/g, ' $1')}</label>
                            </div>
                          ))}
                        </div>

                        <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100" onClick={() => handleSendOpticalPrescription(p)}>
                          {actionLoading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> Send Prescription</>}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* --- MEDICAL PRESCRIPTION MODAL --- */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-xl font-black uppercase text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleOpenMeds(p)}>
                        <Pill size={14} className="mr-2" /> Meds
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="bg-blue-600 p-6 text-white">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2"><Pill /> Meds Prescription</h2>
                        <p className="text-xs opacity-80 uppercase font-bold tracking-widest mt-1">{p.fullName}</p>
                      </div>
                      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-card">
                        <select className="w-full h-12 rounded-xl bg-slate-50 px-4 text-sm font-bold border-none" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                          <option value="">Assign to Reception</option>
                          {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                        </select>
                        {prescribedItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl items-end">
                            <div className="col-span-5">
                              <select className="w-full h-10 rounded-lg text-xs font-bold px-2 bg-white border-none" value={item.medicineId} onChange={(e) => {
                                const newItems = [...prescribedItems];
                                const med = inventory.find(m => m.id === e.target.value);
                                newItems[idx] = { ...newItems[idx], medicineId: e.target.value, medicineName: med?.medicineName || "" };
                                setPrescribedItems(newItems);
                              }}>
                                <option value="">Select Med...</option>
                                {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.medicineName}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2"><Input type="number" className="h-10 text-center font-bold border-none bg-white" value={item.quantity} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].quantity = e.target.value; setPrescribedItems(newItems); }} /></div>
                            <div className="col-span-4"><Input className="h-10 text-xs font-bold border-none bg-white" placeholder="Dosage" value={item.dosage} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].dosage = e.target.value; setPrescribedItems(newItems); }} /></div>
                            <div className="col-span-1"><Button variant="ghost" size="sm" className="text-red-400" onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}><Trash2 size={16}/></Button></div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full border-dashed border-2 h-11 uppercase text-[10px] font-black rounded-xl" onClick={() => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", quantity: 1, dosage: "" }])}>+ Add Medicine</Button>
                        <Button disabled={actionLoading} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs" onClick={() => handleSendMedicalPrescription(p)}>Dispatch Meds</Button>
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