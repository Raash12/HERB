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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Icons
import { Loader2, Search, Eye, Pill, ArrowLeft, User, Send, Smartphone, MapPin, Activity } from "lucide-react";

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const recordsPerPage = 8;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Data Logic
  const filtered = patients.filter(p =>
    (p.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentData = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const openPrescription = async (patient) => {
    setSelectedPatient(patient);
    if (patient.status !== "completed") {
      await updateDoc(doc(db, "patients", patient.id), { status: "processing" });
    }
    const q = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", patient.branch));
    const res = await getDocs(q);
    setReceptions(res.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSave = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: selectedPatient.id,
        branch: selectedPatient.branch,
        doctorId: auth.currentUser.uid,
        doctorName: selectedPatient.doctorName || "Doctor",
        sendTo: selectedReception,
        values, options, createdAt: new Date(),
      });
      await updateDoc(doc(db, "patients", selectedPatient.id), { status: "completed", sendTo: selectedReception });
      alert("Prescription-ka waa la diray ✅");
      setSelectedPatient(null);
      setValues({ RE: { sph: "", cyl: "", axis: "" }, LE: { sph: "", cyl: "" , axis: "" } });
    } catch (err) { alert("Error!"); }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  // =========================
  // VIEW 2: COMPACT OVERVIEW (BLUE THEME)
  // =========================
  if (selectedPatient) {
    return (
      <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col p-4 md:p-6 animate-in fade-in duration-300">
        <div className="max-w-6xl mx-auto w-full flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="font-bold text-blue-600 dark:text-blue-400">
              <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </Button>
            <Badge className="bg-blue-600 text-white border-none px-4 py-1 uppercase text-[10px] font-black tracking-widest">
              Consultation Mode
            </Badge>
          </div>

          <Card className="flex-1 flex flex-col rounded-[2.5rem] border shadow-2xl bg-card overflow-hidden border-blue-100 dark:border-blue-900/30">
            {/* HEADER - CHANGED TO BLUE */}
            <div className="bg-blue-600 dark:bg-blue-700 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><User size={24} /></div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{selectedPatient.fullName}</h2>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest italic">Patient Details Overview</p>
                </div>
              </div>
              <div className="hidden md:flex gap-6 text-sm">
                 <div className="text-right border-l border-white/20 pl-6"><p className="text-[10px] opacity-70 uppercase font-black">Age</p><p className="font-bold">{selectedPatient.age} Yrs</p></div>
                 <div className="text-right border-l border-white/20 pl-6"><p className="text-[10px] opacity-70 uppercase font-black">Gender</p><p className="font-bold">{selectedPatient.gender}</p></div>
              </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* INFO & RECEPTION */}
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/20">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"><Smartphone className="text-blue-600" size={16}/>{selectedPatient.phone}</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"><MapPin className="text-blue-600" size={16}/>{selectedPatient.address}</div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-blue-600/70 dark:text-blue-400/70 ml-1">Assign to Reception</label>
                    <select className="w-full h-12 border-2 border-blue-50 dark:border-blue-900/30 rounded-xl px-4 text-sm font-bold bg-background focus:ring-2 ring-blue-600 outline-none transition-all cursor-pointer" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
                      <option value="">Select Personnel</option>
                      {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                    </select>
                 </div>
              </div>

              {/* MEASUREMENTS */}
              <div className="grid md:grid-cols-2 gap-6">
                {["RE", "LE"].map((eye) => (
                  <div key={eye} className="p-6 bg-card border border-blue-100 dark:border-blue-900/30 shadow-sm rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-blue-50 dark:border-blue-900/30 pb-3">
                       <Activity size={18} className="text-blue-600" />
                       <h3 className="font-black uppercase text-[12px] tracking-widest text-blue-600 dark:text-blue-400">{eye === "RE" ? "Right Eye (OD)" : "Left Eye (OS)"}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["sph", "cyl", "axis"].map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">{field}</label>
                          <Input className="h-11 bg-slate-50 dark:bg-blue-950/20 border-blue-50 dark:border-blue-900/50 font-bold text-center text-blue-600 dark:text-blue-300 rounded-xl" placeholder="0.00" value={values[eye][field]} onChange={(e) => setValues({...values, [eye]: {...values[eye], [field]: e.target.value}})} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* OPTIONS GRID */}
              <div className="space-y-3 pb-4">
                <label className="text-[10px] font-black uppercase text-blue-600/70 ml-1 tracking-widest">Prescription Specifications</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.keys(options).map((key) => (
                    <label key={key} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${options[key] ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-background border-blue-50 dark:border-blue-900/30 text-muted-foreground hover:border-blue-300'}`}>
                      <Checkbox className={options[key] ? "border-white" : "border-blue-200"} checked={options[key]} onCheckedChange={() => setOptions({ ...options, [key]: !options[key] })} />
                      <span className="text-[10px] font-black uppercase truncate">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-6 bg-blue-50/30 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900/30 flex justify-end">
              <Button onClick={handleSave} disabled={actionLoading} className="w-full md:w-72 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 dark:shadow-none">
                {actionLoading ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2" /> Send to Optical</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================
  // VIEW 1: PATIENT LIST
  // =========================
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
           <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600">Appointments</h2>
           <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Doctor Portal / Live Queue</p>
        </div>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
           <Input placeholder="Search patients..." className="w-72 pl-10 h-12 bg-card border-blue-100 dark:border-blue-900/30 rounded-2xl focus:ring-blue-600 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-2xl shadow-blue-100 dark:shadow-none border border-blue-50 dark:border-blue-900/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600 dark:bg-blue-700">
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="text-white font-black py-6 pl-8 uppercase text-[11px] tracking-widest">Patient Identification</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Live Status</TableCell>
              <TableCell className="text-white font-black text-right pr-8 uppercase text-[11px] tracking-widest">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map(p => (
              <TableRow key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition border-b border-blue-50 dark:border-blue-900/20">
                <TableCell className="py-5 pl-8">
                   <div className="font-black uppercase text-sm text-slate-800 dark:text-slate-200">{p.fullName}</div>
                   <div className="text-[10px] text-blue-600/60 dark:text-blue-400 font-bold uppercase tracking-tighter">{p.phone}</div>
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="outline" className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                     p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                     p.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                   }`}>
                     {p.status || 'pending'}
                   </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl font-black uppercase text-[10px] text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-900/50" 
                      onClick={() => openPrescription(p)}
                    >
                      <Eye size={14} className="mr-2" /> View Patient
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl font-black uppercase text-[10px] text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 dark:border-emerald-900/50" 
                      onClick={() => navigate(`/doctor/medical-prescription/${p.id}`)}
                    >
                      <Pill size={14} className="mr-2" /> Meds
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}