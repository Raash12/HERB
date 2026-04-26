import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, getDocs, 
  addDoc, updateDoc, doc, serverTimestamp 
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Loader2, Trash2, ClipboardList, Stethoscope, MessageSquare } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MedicalPrescription({ activeVisit, onClose, existingPrescription = null }) {
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState(existingPrescription?.sendTo || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [complain, setComplain] = useState(existingPrescription?.complain || "");
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || "");
  const [remarks, setRemarks] = useState(existingPrescription?.remarks || ""); // Remarks state added
  const [inventory, setInventory] = useState([]);
  const [prescribedItems, setPrescribedItems] = useState(
    existingPrescription?.items || [{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]
  );

  const isEdit = !!existingPrescription;

  useEffect(() => {
    if (!activeVisit) return;

    const fetchData = async () => {
      try {
        const recQ = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", activeVisit.branch));
        const recSnap = await getDocs(recQ);
        setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const invQ = query(collection(db, "branch_medicines"), where("branchId", "==", activeVisit.branch));
        const unsubscribe = onSnapshot(invQ, (snap) => {
          setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setFetching(false);
        });

        return () => unsubscribe();
      } catch (err) {
        setFetching(false);
      }
    };

    fetchData();
  }, [activeVisit]);

  const handleSend = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    if (prescribedItems.some(i => !i.medicineId)) return alert("Fadlan dooro dawada!");

    setLoading(true);
    try {
      const payload = {
        patientId: activeVisit.patientId,
        visitId: activeVisit.id,
        patientName: activeVisit.patientName,
        doctorId: auth.currentUser.uid,
        doctorName: activeVisit.doctorName || "Doctor",
        branch: activeVisit.branch,
        sendTo: selectedReception,
        complain,
        diagnosis,
        remarks, // Remarks added to payload
        items: prescribedItems,
        status: "pending",
        category: "medical",
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, "medical_prescriptions", existingPrescription.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "medical_prescriptions"), payload);
        await updateDoc(doc(db, "visits", activeVisit.id), { medsSent: true, status: "processing" });
      }

      onClose();
    } catch (err) {
      alert("Cillad ayaa dhacday!");
    }
    setLoading(false);
  };

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={30} /></div>;

  return (
    <div className="flex flex-col bg-white overflow-hidden rounded-[2rem]">
      <DialogHeader className="bg-blue-600 p-4 text-white">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-white/20 p-2 rounded-xl"><Pill size={20} /></div>
          <div>
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
                {isEdit ? "Update Medical Prescription" : "Medical Portal"}
            </DialogTitle>
            <p className="text-[9px] text-blue-100 font-bold uppercase">{activeVisit?.patientName}</p>
          </div>
        </div>
      </DialogHeader>

      <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Send To Reception</label>
          <select 
            className="w-full h-8 bg-transparent border-none text-[11px] font-bold outline-none" 
            value={selectedReception} 
            onChange={(e) => setSelectedReception(e.target.value)}
          >
            <option value="">Select...</option>
            {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1"><ClipboardList size={10}/> Symptoms</label>
            <Textarea className="min-h-[70px] rounded-xl text-[11px] font-bold bg-slate-50 border-none" value={complain} onChange={(e) => setComplain(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1"><Stethoscope size={10}/> Diagnosis</label>
            <Textarea className="min-h-[70px] rounded-xl text-[11px] font-bold bg-slate-50 border-none" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
        </div>

        {/* Remarks Section Added */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1"><MessageSquare size={10}/> Remarks / Notes</label>
          <Textarea 
            className="min-h-[50px] rounded-xl text-[11px] font-bold bg-slate-50 border-none" 
            placeholder="Add any extra notes here..."
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Prescribed Medicines</label>
          {prescribedItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100 items-center">
              <div className="col-span-6">
                <select 
                  className="w-full h-8 rounded-lg text-[10px] font-bold px-2 bg-white border border-slate-200 outline-none" 
                  value={item.medicineId} 
                  onChange={(e) => {
                    const newItems = [...prescribedItems];
                    const med = inventory.find(m => m.id === e.target.value);
                    newItems[idx] = { ...newItems[idx], medicineId: e.target.value, medicineName: med?.medicineName || "" };
                    setPrescribedItems(newItems);
                  }}
                >
                  <option value="">Select Drug...</option>
                  {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.medicineName} ({inv.quantity})</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Input type="number" className="h-8 rounded-lg text-center font-bold text-[10px] border-slate-200" placeholder="Qty" value={item.quantity} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].quantity = e.target.value; setPrescribedItems(newItems); }} />
              </div>
              <div className="col-span-3">
                <Input className="h-8 rounded-lg text-[10px] font-bold px-2 border-slate-200" placeholder="Dosage" value={item.dosage} onChange={(e) => { const newItems = [...prescribedItems]; newItems[idx].dosage = e.target.value; setPrescribedItems(newItems); }} />
              </div>
              <div className="col-span-1 text-right">
                <button className="text-red-400 hover:text-red-600" onClick={() => setPrescribedItems(prescribedItems.filter((_, i) => i !== idx))}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full border-dashed h-8 text-[9px] font-black rounded-lg text-blue-600" onClick={() => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", quantity: 1, dosage: "" }])}>+ Add Medicine</Button>
        </div>

        <Button 
          disabled={loading} 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[11px] shadow-lg transition-all" 
          onClick={handleSend}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (isEdit ? "Update & Send" : "Authorize & Send")}
        </Button>
      </div>
    </div>
  );
}