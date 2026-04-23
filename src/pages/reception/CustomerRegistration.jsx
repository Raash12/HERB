import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, getDocs, query, where, addDoc, doc, getDoc, onSnapshot, orderBy, serverTimestamp, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { handleInvoicePrint } from "../../utils/printHandlers";

// UI Components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserPlus, MapPin, Search, Users, RefreshCcw, Printer, ChevronLeft, ChevronRight, CheckCircle2, Calendar, Pencil, Trash2 } from "lucide-react";

const SOMALIA_DISTRICTS = {
  Banaadir: [
    "Cabdiasiis","Boondheere","Dayniile","Dharkeenley","Hamar Jajab","Hamar Weyne",
    "Hodan","Howlwadaag","Huriwaa","Kaaraan","Kaxda","Shangaani","Shibis",
    "Waaberi","Wadajir","Wardhiigley","Warta Nabada","Yaaqshiid","Garasbaaley","Gubadley"
  ],

  Hirshabelle: [
    "Jowhar","Balcad","Mahaday","Adan Yabaal","Beledweyne","Buulo Burte","Jalalaqsi","Matabaan"
  ],

  Puntland: [
    "Garoowe","Bosaso","Qardho","Eyl","Dangorayo","Burtinle","Iskushuban","Bandarbeyla"
  ],

  Jubaland: [
    "Kismayo","Afmadow","Badhaadhe","Jamaame","Dhobley"
  ],

  Galmudug: [
    "Dhuusamareeb","Galkayo","Cadaado","Hobyo","Abudwak","Balanbale"
  ],

  "Koofur Galbeed": [
    "Baydhabo","Baraawe","Marka","Wanlaweyn","Qoryooley","Afgooye"
  ],

  Somaliland: [
    "Hargeisa","Berbera","Burao","Borama","Erigavo","Las Anod"
  ],

  "Waqoyi Bari": [
    "Laascaanood","Taleex","Xudun"
  ]
};const SOMALI_STATES = ["Banaadir", "Galmudug", "Puntland", "Jubaland", "Hirshabelle", "Koofur Galbeed", "Somaliland", "Waqoyi Bari"];

export default function CustomerRegistration() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [myBranch, setMyBranch] = useState(""); 
  const [open, setOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [formData, setFormData] = useState({
    fullName: "", phone: "", address: "", state: "", age: "", gender: "", 
    department: "", doctorId: "", doctorName: "", amount: ""
  });

  // 1. Fetch User Branch & Doctors
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

  // 2. REAL-TIME LISTENER
  useEffect(() => {
    if (!myBranch) return;
    const q = query(collection(db, "patients"), where("branch", "==", myBranch), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const patientList = snapshot.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
      setPatients(patientList);
    });
    return () => unsubscribe();
  }, [myBranch]);

  const showSuccessNotification = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const resetForm = () => {
    setFormData({ fullName: "", phone: "", address: "", state: "", age: "", gender: "", department: "", doctorId: "", doctorName: "", amount: "" });
  };

  const handleRegisterNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pRef = await addDoc(collection(db, "patients"), {
        fullName: formData.fullName, phone: formData.phone, address: formData.address, state: formData.state,
        age: formData.age, gender: formData.gender, branch: myBranch, visitCount: 1, 
        createdAt: serverTimestamp(), lastAmount: formData.amount, lastDept: formData.department, doctorName: formData.doctorName
      });
      const vData = {
        patientId: pRef.id, patientName: formData.fullName, visitNumber: 1, age: formData.age, gender: formData.gender,
        doctorId: formData.doctorId, doctorName: formData.doctorName, department: formData.department,
        amount: formData.amount, branch: myBranch, status: "pending", createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "visits"), vData);
      handleInvoicePrint({ ...formData, id: pRef.id }, vData); 
      setOpen(false); resetForm(); showSuccessNotification();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleResend = async (e) => {
    
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "patients", selectedPatient.id), {
        visitCount: increment(1), lastAmount: formData.amount, lastDept: formData.department, doctorName: formData.doctorName 
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
      setResendOpen(false); resetForm(); showSuccessNotification();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // 3. EDIT PATIENT (Eye and Ear lagu daray)
  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "patients", selectedPatient.id), {
        fullName: formData.fullName, phone: formData.phone, address: formData.address,
        state: formData.state, age: formData.age, gender: formData.gender,
        lastDept: formData.department // Kani wuxuu muhiim u yahay Invoice-ka dambe
      });
      setEditOpen(false); resetForm(); showSuccessNotification();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // 4. DELETE PATIENT
  const handleDelete = async (id) => {
    if (window.confirm("Ma hubtaa inaad tirtirto bukaankan? Xogtiisa oo dhan ayaa bixi doonta.")) {
      try {
        await deleteDoc(doc(db, "patients", id));
        showSuccessNotification();
      } catch (err) { console.error(err); }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone?.includes(searchTerm)
  );
  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage) || 1;
  const currentRecords = filteredPatients.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto relative">
      {success && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-300">
           <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-green-400">
              <CheckCircle2 size={20} />
              <span className="font-black uppercase tracking-widest text-sm">Action Successful!</span>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800">
            <Users className="text-blue-600" size={28} /> MASTER REGISTRY
          </h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Branch: {myBranch || "..."}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search patient..." className="pl-10 h-11 bg-background" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <Button onClick={() => { resetForm(); setOpen(true); }} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-black w-full sm:w-auto">
            <UserPlus size={18} className="mr-2" /> NEW PATIENT
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card className="shadow-xl border-none overflow-hidden bg-card rounded-xl">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow>
              <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Patient Info</TableCell>
              <TableCell className="text-white font-bold text-center uppercase text-[10px]">Registered</TableCell>
              <TableCell className="text-white font-bold text-center uppercase text-[10px]">Visits</TableCell>
              <TableCell className="text-white font-bold text-center uppercase text-[10px]">Location</TableCell>
              <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px]">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((p) => (
              <TableRow key={p.id} className="hover:bg-accent/50 border-b text-xs font-medium">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">{p.fullName?.charAt(0)}</div>
                    <div><div className="text-sm font-bold">{p.fullName}</div><div className="text-[10px] text-muted-foreground">{p.phone}</div></div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Calendar size={12} className="text-blue-500" />
                    <span className="text-[10px]">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px] font-black">{p.visitCount || 1} Visits</Badge>
                </TableCell>
                <TableCell className="text-center font-semibold text-xs text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1"><MapPin size={10} className="text-red-500" /> {p.address}</div>
                        <Badge className="text-[9px] h-4 bg-slate-100 text-slate-600">{p.state}</Badge>
                    </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-blue-600 text-blue-600" onClick={() => { setSelectedPatient(p); setFormData({...p, department: p.lastDept || ""}); setEditOpen(true); }}><Pencil size={14}/></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-red-600 text-red-600" onClick={() => handleDelete(p.id)}><Trash2 size={14}/></Button>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-green-600 text-green-600 text-[10px] font-bold" onClick={() => handleInvoicePrint(p, { amount: p.lastAmount || 0, department: p.lastDept || 'General', doctorName: p.doctorName || 'MD' })}><Printer size={14} className="mr-1"/> INVOICE</Button>
                    <Button size="sm" className="bg-indigo-600 h-8 px-2 text-[10px] font-bold" onClick={() => { 
  setSelectedPatient(p);
 setFormData(prev => ({
  ...prev,
  department: "",
  amount: "",
  doctorId: "",
  doctorName: ""
}));
  setResendOpen(true);
}}><RefreshCcw size={14} className="mr-1"/> RESEND</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Showing {currentRecords.length} records</p>
          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></Button>
             <span className="text-[11px] font-black">{currentPage} / {totalPages}</span>
             <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </Card>

      {/* NEW PATIENT DIALOG */}
   {/* NEW PATIENT DIALOG */}
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-2xl font-black text-blue-600 uppercase">
        New Patient
      </DialogTitle>
    </DialogHeader>

    <form onSubmit={handleRegisterNew} className="grid grid-cols-2 gap-4">
      
      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase">Full Name</label>
        <Input
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Age</label>
        <Input
          type="number"
          value={formData.age}
          onChange={e => setFormData({ ...formData, age: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Gender</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.gender}
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
          required
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Phone</label>
        <Input
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">State</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.state}
          onChange={e =>
            setFormData({
              ...formData,
              state: e.target.value,
              address: "" // reset district
            })
          }
          required
        >
          <option value="">Select State</option>
          {SOMALI_STATES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase">District</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.address}
          onChange={e =>
            setFormData({ ...formData, address: e.target.value })
          }
          required
        >
          <option value="">Select District</option>
          {SOMALIA_DISTRICTS[formData.state]?.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 grid grid-cols-3 gap-3 border-t pt-4">
        <div>
          <label className="text-[10px] font-black uppercase">Dept</label>
          <select
            className="w-full p-2 border rounded-md text-sm"
            value={formData.department}
            onChange={e =>
              setFormData({ ...formData, department: e.target.value })
            }
            required
          >
            <option value="">Select</option>
            <option value="Eye">Eye</option>
            <option value="Ear">Ear</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase">Doctor</label>
          <select
            className="w-full p-2 border rounded-md text-sm"
            value={formData.doctorId}
            onChange={e => {
              const d = doctors.find(x => x.id === e.target.value);
              setFormData({
                ...formData,
                doctorId: e.target.value,
                doctorName: d?.fullName || ""
              });
            }}
            required
          >
            <option value="">Select</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-red-600">
            Amount ($)
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={e =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="col-span-2 bg-blue-600 h-12 font-black uppercase"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : "REGISTER & PRINT"}
      </Button>
    </form>
  </DialogContent>
</Dialog>


{/* RESEND / RETURNING VISIT DIALOG */}
<Dialog open={resendOpen} onOpenChange={setResendOpen}>
  <DialogContent className="max-w-md rounded-2xl">

    <DialogHeader>
      <DialogTitle className="text-xl font-black text-indigo-600 uppercase">
        Returning Visit
      </DialogTitle>
    </DialogHeader>

    {selectedPatient && (
      <form onSubmit={handleResend} className="space-y-4">

        {/* PATIENT INFO */}
        <div className="bg-slate-100 p-4 rounded-xl">
          <p className="font-bold">{selectedPatient.fullName}</p>
          <Badge className="mt-2 bg-indigo-600 text-white">
            Visit #{(selectedPatient.visitCount || 1) + 1}
          </Badge>
        </div>

        {/* DEPARTMENT + AMOUNT */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase">Dept</label>
            <select
              className="w-full p-2 border rounded-md text-sm"
              value={formData.department}
              onChange={e =>
                setFormData({ ...formData, department: e.target.value })
              }
              required
            >
              <option value="">Select</option>
              <option value="Eye">Eye</option>
              <option value="Ear">Ear</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-red-600">
              Amount ($)
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={e =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* DOCTOR */}
        <div>
          <label className="text-[10px] font-black uppercase">
            Assign Doctor
          </label>
          <select
            className="w-full p-2 border rounded-md text-sm"
            value={formData.doctorId}
            onChange={e => {
              const d = doctors.find(x => x.id === e.target.value);
              setFormData({
                ...formData,
                doctorId: e.target.value,
                doctorName: d?.fullName || ""
              });
            }}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* BUTTON */}
        <Button
          type="submit"
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black uppercase"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : "Complete & Print"}
        </Button>

      </form>
    )}

  </DialogContent>
</Dialog>


{/* EDIT DIALOG */}
<Dialog open={editOpen} onOpenChange={setEditOpen}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-black text-blue-600 uppercase">
        Edit Patient
      </DialogTitle>
    </DialogHeader>

    <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4">

      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase">Full Name</label>
        <Input
          value={formData.fullName}
          onChange={e =>
            setFormData({ ...formData, fullName: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Age</label>
        <Input
          type="number"
          value={formData.age}
          onChange={e =>
            setFormData({ ...formData, age: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Gender</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.gender}
          onChange={e =>
            setFormData({ ...formData, gender: e.target.value })
          }
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">Phone</label>
        <Input
          value={formData.phone}
          onChange={e =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase">State</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.state}
          onChange={e =>
            setFormData({
              ...formData,
              state: e.target.value,
              address: ""
            })
          }
        >
          <option value="">Select State</option>
          {SOMALI_STATES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase">District</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.address}
          onChange={e =>
            setFormData({ ...formData, address: e.target.value })
          }
        >
          <option value="">Select District</option>
          {SOMALIA_DISTRICTS[formData.state]?.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="col-span-2">
        <label className="text-[10px] font-black uppercase">Department</label>
        <select
          className="w-full p-2 border rounded-md text-sm"
          value={formData.department}
          onChange={e =>
            setFormData({ ...formData, department: e.target.value })
          }
        >
          <option value="">Select</option>
          <option value="Eye">Eye</option>
          <option value="Ear">Ear</option>
        </select>
      </div>

      <Button
        type="submit"
        className="col-span-2 bg-blue-600 h-12 font-black uppercase"
      >
        {loading ? <Loader2 className="animate-spin" /> : "UPDATE PATIENT"}
      </Button>
    </form>
  </DialogContent>
</Dialog>
    </div>
  );
}