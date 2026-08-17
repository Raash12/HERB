import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, getDocs, 
  addDoc, updateDoc, doc, getDoc, serverTimestamp 
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Loader2, Trash2, ClipboardList, Stethoscope, MessageSquare } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function MedicalPrescription({ activeVisit, onClose, existingPrescription = null }) {
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState(existingPrescription?.sendTo || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [complain, setComplain] = useState(existingPrescription?.complain || "");
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || "");
  const [remarks, setRemarks] = useState(existingPrescription?.remarks || "");
  const [inventory, setInventory] = useState([]);
  const [prescribedItems, setPrescribedItems] = useState(
    existingPrescription?.items || [{ medicineId: "", medicineName: "", quantity: 1, dosage: "" }]
  );

  const isEdit = !!existingPrescription;

  useEffect(() => {
    if (!activeVisit) return;

    let unsubscribeInventory = () => {};

    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser;
        let doctorBranchSet = new Set();

        const addBranchString = (val) => {
          if (!val) return;
          String(val)
            .split(",")
            .forEach(b => {
              const cleaned = b.trim().toLowerCase();
              if (cleaned) doctorBranchSet.add(cleaned);
            });
        };

        // 1. Fetch Doctor's profile
        if (currentUser) {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (docSnap.exists()) {
            const d = docSnap.data();
            addBranchString(d.branch);
            addBranchString(d.branchId);
            if (Array.isArray(d.branches)) {
              d.branches.forEach(b => addBranchString(b));
            }
          }

          // 2. Fetch all unique branches from Doctor's Visits
          const visitsQ = query(collection(db, "visits"), where("doctorId", "==", currentUser.uid));
          const visitsSnap = await getDocs(visitsQ);
          visitsSnap.docs.forEach(vDoc => {
            const v = vDoc.data();
            addBranchString(v.branch);
            addBranchString(v.branchId);
          });
        }

        // Active Visit branch
        addBranchString(activeVisit.branch);
        addBranchString(activeVisit.branchId);

        const doctorBranches = Array.from(doctorBranchSet);

        // 3. Fetch all reception users
        const recQ = query(collection(db, "users"), where("role", "==", "reception"));
        const recSnap = await getDocs(recQ);
        const allReceptions = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Filter receptions matching ANY of the doctor's branches
        const filteredReceptions = allReceptions.filter(r => {
          if (doctorBranches.length === 0) return true;

          let rBranches = new Set();
          const addRBranch = (val) => {
            if (!val) return;
            String(val).split(",").forEach(b => {
              const cleaned = b.trim().toLowerCase();
              if (cleaned) rBranches.add(cleaned);
            });
          };

          addRBranch(r.branch);
          addRBranch(r.branchId);
          if (Array.isArray(r.branches)) {
            r.branches.forEach(b => addRBranch(b));
          }

          const rBranchArray = Array.from(rBranches);
          return rBranchArray.some(b => doctorBranches.includes(b));
        });

        setReceptions(filteredReceptions);

        // 5. Dynamic Logic: AL NACIIM & HORSEED BAKAARO wadaagaa daawada, laamaha kale waa separate
        const targetBranchId = activeVisit.branchId ? String(activeVisit.branchId).trim() : null;
        const targetBranchName = activeVisit.branch ? String(activeVisit.branch).trim() : null;

        // Group-ka laamaha isku daawada ah (Pair)
        const sharedPair = ["HORSEED BAKAARO", "horseed bakaaro", "AL NACIIM", "al naciim", "AL-NACIIM", "al-naciim"];

        let possibleBranches = [];

        // Hubi haddii laanta bukaanku ka yimid ay ka tirsan tahay pair-kan
        const isSharedBranch = sharedPair.some(
          b => b.toLowerCase() === (targetBranchName?.toLowerCase() || targetBranchId?.toLowerCase())
        );

        if (isSharedBranch) {
          // Haddii uu ka yimid Al Naciim ama Horseed Bakaaro, soo saar daawada labadoodaba
          possibleBranches = Array.from(
            new Set([targetBranchId, targetBranchName, ...sharedPair].filter(Boolean))
          );
        } else {
          // Haddii uu ka yimid laan kale (e.g. Branch C), daawaheeda gaarka ah oo kaliya soo saar
          possibleBranches = Array.from(
            new Set([targetBranchId, targetBranchName].filter(Boolean))
          );
        }

        if (possibleBranches.length > 0) {
          const invQ = query(
            collection(db, "branch_medicines"), 
            where("branchId", "in", possibleBranches.slice(0, 10))
          );

          unsubscribeInventory = onSnapshot(invQ, (snap) => {
            const itemsMap = new Map();
            snap.docs.forEach(d => {
              itemsMap.set(d.id, { id: d.id, ...d.data() });
            });
            setInventory(Array.from(itemsMap.values()));
            setFetching(false);
          }, (err) => {
            console.error("🔥 Inventory fetch error:", err);
            setFetching(false);
          });
        } else {
          setFetching(false);
        }

      } catch (err) {
        console.error("🔥 Fetch error:", err);
        setFetching(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeInventory();
    };
  }, [activeVisit]);

  const handleSend = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    if (prescribedItems.some(i => !i.medicineId)) return alert("Fadlan dooro dawada!");

    const extractedBranchId = activeVisit.branchId || activeVisit.branch || "N/A";

    setLoading(true);
    try {
      const payload = {
        patientId: activeVisit.patientId,
        visitId: activeVisit.id,
        patientName: activeVisit.patientName,
        doctorId: auth.currentUser?.uid || "unknown_doctor",
        doctorName: activeVisit.doctorName || "Doctor",
        branchId: String(extractedBranchId),
        doctorBranchId: String(extractedBranchId),
        branch: extractedBranchId,
        sendTo: selectedReception,
        complain,
        diagnosis,
        remarks,
        items: prescribedItems.map(item => ({
          ...item,
          quantity: parseInt(item.quantity, 10) || 1
        })),
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
      console.error("🔥 Error saving prescription:", err);
      alert("Cillad ayaa dhacday marka prescription-ka la kaydinayay!");
    } finally {
      setLoading(false);
    }
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
            <DialogDescription className="text-[9px] text-blue-100 font-bold uppercase">
              {activeVisit?.patientName} ({activeVisit?.branch})
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Send To Reception</label>
          <select 
            className="w-full h-8 bg-transparent border-none text-[11px] font-bold outline-none cursor-pointer" 
            value={selectedReception} 
            onChange={(e) => setSelectedReception(e.target.value)}
          >
            <option value="">Select Receptionist...</option>
            {receptions.map(r => {
              const branchName = r.branch || r.branchId || (Array.isArray(r.branches) ? r.branches.join(", ") : "");
              return (
                <option key={r.id} value={r.id}>
                  {r.fullName || r.name || r.email} {branchName ? `(${branchName})` : ''}
                </option>
              );
            })}
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
                  {inventory.map(inv => {
                    const branchLabel = inv.branch || inv.branchName || inv.branchId || "HORSEED BAKAARO";
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.medicineName} ({inv.quantity}) - {branchLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-span-2">
                <Input 
                  type="number" 
                  min="1"
                  className="h-8 rounded-lg text-center font-bold text-[10px] border-slate-200" 
                  placeholder="Qty" 
                  value={item.quantity} 
                  onChange={(e) => { 
                    const newItems = [...prescribedItems]; 
                    newItems[idx].quantity = e.target.value; 
                    setPrescribedItems(newItems); 
                  }} 
                />
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