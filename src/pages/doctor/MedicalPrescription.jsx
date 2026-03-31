import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { doc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, User, ArrowLeft, Plus, Trash2, Send, Loader2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MedicalPrescription() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // ADDED 'quantity' field here
  const [prescribedItems, setPrescribedItems] = useState([
    { medicineId: "", medicineName: "", dosage: "", quantity: 1, notes: "" }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "patients", id));
        if (snap.exists()) {
          const pData = { id: snap.id, ...snap.data() };
          setPatient(pData);

          const medQuery = query(collection(db, "branch_medicines"), where("branchId", "==", pData.branch));
          const medSnap = await getDocs(medQuery);
          setMedicines(medSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const recQuery = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", pData.branch));
          const recSnap = await getDocs(recQuery);
          setReceptions(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const addRow = () => setPrescribedItems([...prescribedItems, { medicineId: "", medicineName: "", dosage: "", quantity: 1, notes: "" }]);
  
  const removeRow = (index) => {
    if (prescribedItems.length > 1) {
      setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index, field, value) => {
    const updated = [...prescribedItems];
    if (field === "medicineId") {
      const selected = medicines.find(m => m.id === value);
      updated[index].medicineName = selected?.medicineName || "";
    }
    // Convert quantity to number
    updated[index][field] = field === "quantity" ? (parseInt(value) || 0) : value;
    setPrescribedItems(updated);
  };

  const handleSend = async () => {
    if (!selectedReception) return alert("Fadlan dooro Personnel-ka");
    setActionLoading(true);
    try {
      await addDoc(collection(db, "medical_prescriptions"), {
        patientId: patient.id,
        patientInfo: {
          name: patient.fullName,
          age: patient.age,
          phone: patient.phone,
          address: patient.address
        },
        doctorId: auth.currentUser.uid,
        doctorName: patient.doctorName || "Doctor",
        items: prescribedItems.filter(i => i.medicineId !== ""),
        sendTo: selectedReception,
        createdAt: new Date(),
        branch: patient.branch,
        type: "medical",
        status: "pending" // <--- Inventory logic: Mark as pending so Pharmacy can confirm later
      });
      alert("Prescription-ka waa loo diray Reception-ka ✅");
      navigate(-1);
    } catch (e) { 
      alert("Error sending prescription"); 
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="font-bold text-blue-600">
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <Badge className="bg-blue-600 text-white border-none px-4 py-1 uppercase text-[10px] font-black tracking-widest">
            Prescription Mode
          </Badge>
        </div>

        {/* PATIENT HEADER */}
        <div className="flex items-center justify-between bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{patient?.fullName}</h2>
              <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mt-1 italic">
                {patient?.age} Yrs • {patient?.phone}
              </p>
            </div>
          </div>
          <Pill size={40} className="opacity-30" />
        </div>

        <Card className="rounded-[2.5rem] border-blue-100 shadow-2xl overflow-hidden bg-card">
          <div className="p-6 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-widest">Medication</span>
            </div>
            <Button size="sm" onClick={addRow} className="bg-blue-600 rounded-xl font-black text-[10px] uppercase px-4">
              <Plus size={14} className="mr-1"/> Add Row
            </Button>
          </div>

          <CardContent className="p-6 space-y-4">
            {prescribedItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-end p-5 bg-slate-50/50 rounded-[1.5rem] border border-blue-50">
                {/* MEDICINE SELECT */}
                <div className="flex-[2] min-w-[200px] space-y-1">
                  <label className="text-[9px] font-black text-blue-600/70 uppercase ml-1">Medicine Name</label>
                  <select 
                    className="w-full h-12 border border-blue-100 rounded-xl px-4 text-sm font-bold bg-white outline-none focus:ring-2 ring-blue-600"
                    value={item.medicineId}
                    onChange={(e) => updateRow(idx, "medicineId", e.target.value)}
                  >
                    <option value="">Select</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>{m.medicineName} (Stock: {m.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                {/* NEW QUANTITY FIELD - This is what the Pharmacy will subtract */}
                <div className="w-full md:w-24 space-y-1">
                  <label className="text-[9px] font-black text-blue-600/70 uppercase ml-1">Qty</label>
                  <Input 
                    type="number"
                    className="h-12 rounded-xl border-blue-100 font-black text-center text-blue-600" 
                    value={item.quantity} 
                    onChange={(e) => updateRow(idx, "quantity", e.target.value)} 
                  />
                </div>

                {/* DOSAGE */}
                <div className="w-full md:w-32 space-y-1">
                  <label className="text-[9px] font-black text-blue-600/70 uppercase ml-1">Dosage</label>
                  <Input 
                    placeholder="1x2" 
                    className="h-12 rounded-xl border-blue-100 font-bold" 
                    value={item.dosage} 
                    onChange={(e) => updateRow(idx, "dosage", e.target.value)} 
                  />
                </div>

                {/* NOTES */}
                <div className="flex-1 min-w-[150px] space-y-1">
                  <label className="text-[9px] font-black text-blue-600/70 uppercase ml-1">Instructions</label>
                  <Input 
                    placeholder="Notes..." 
                    className="h-12 rounded-xl border-blue-100 font-bold" 
                    value={item.notes} 
                    onChange={(e) => updateRow(idx, "notes", e.target.value)} 
                  />
                </div>

                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-12 w-12" onClick={() => removeRow(idx)}>
                  <Trash2 size={20}/>
                </Button>
              </div>
            ))}

            <div className="pt-8 mt-6 border-t border-blue-100">
              <div className="max-w-md space-y-2">
                <label className="text-[10px] font-black text-blue-600/70 uppercase block ml-1">Send to Personnel</label>
                <select 
                  className="w-full h-12 border-2 border-blue-50 rounded-xl px-4 text-sm font-bold bg-white"
                  value={selectedReception}
                  onChange={(e) => setSelectedReception(e.target.value)}
                >
                  <option value="">Select Receptionist</option>
                  {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>
              </div>

              <Button 
                onClick={handleSend} 
                disabled={actionLoading}
                className="w-full mt-8 h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-[1.5rem] shadow-xl shadow-blue-200"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : <><Send className="mr-2" size={20}/> Send to Reception</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}