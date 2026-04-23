import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { doc, addDoc, collection, updateDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Glasses } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function OpticalPrescriptionPage({ activeVisit, onClose }) {
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [ipd, setIpd] = useState("");
  const [values, setValues] = useState({
    RE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
    LE: { distance: { sph: "", cyl: "", axis: "", va: "" }, near: { sph: "", cyl: "", axis: "", va: "" } },
  });

  const [options, setOptions] = useState({
    distance: false, near: false, bifocal: false, progressive: false, 
    singleVision: false, photoBrown: false, photoGrey: false, white: false,
    sunglasses: false, blueCut: false, highIndex: false, plasticCr39: false,
  });

  useEffect(() => {
    const fetchReceptions = async () => {
      if (!activeVisit) return;
      try {
        const q = query(
          collection(db, "users"), 
          where("role", "==", "reception"), 
          where("branch", "==", activeVisit.branch)
        );
        const res = await getDocs(q);
        setReceptions(res.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { 
        console.error("Error:", err); 
      }
      setFetching(false);
    };
    fetchReceptions();
  }, [activeVisit]);

  const handleSave = async () => {
    if (!selectedReception) return alert("Fadlan dooro Reception-ka!");
    setLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: activeVisit.patientId,
        visitId: activeVisit.id,
        patientName: activeVisit.patientName,
        doctorId: auth.currentUser?.uid,
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
        status: "processing" 
      });

      onClose(); // Xidh modal-ka marka la dhammaystiro
    } catch (err) { 
      alert("Cillad ayaa dhacday markii la kaydinayay!"); 
    }
    setLoading(false);
  };

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={30} /></div>;

  return (
    <div className="flex flex-col bg-white overflow-hidden rounded-[2rem]">
      {/* Header kooban oo la mid ah kii Medical-ka */}
      <DialogHeader className="bg-blue-600 p-4 text-white">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-white/20 p-2 rounded-xl"><Glasses size={20} /></div>
          <div>
            <DialogTitle className="text-sm font-black uppercase tracking-tight">Optical Portal</DialogTitle>
            <p className="text-[9px] text-blue-100 font-bold uppercase">{activeVisit?.patientName}</p>
          </div>
        </div>
      </DialogHeader>

      <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Reception iyo IPD Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Reception</label>
            <select 
              className="w-full h-8 bg-transparent border-none text-[11px] font-bold outline-none" 
              value={selectedReception} 
              onChange={(e) => setSelectedReception(e.target.value)}
            >
              <option value="">Select...</option>
              {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">IPD</label>
            <input 
              className="w-full bg-transparent text-center font-black text-blue-600 text-sm outline-none placeholder:text-slate-300" 
              placeholder="--" 
              value={ipd} 
              onChange={(e) => setIpd(e.target.value)} 
            />
          </div>
        </div>

        {/* Eyes Section (RE & LE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['RE', 'LE'].map((eye) => (
            <div key={eye} className="p-3 bg-blue-50/30 rounded-xl border border-blue-100">
              <h3 className="font-black text-blue-600 mb-2 text-[10px] uppercase text-center border-b border-blue-100 pb-1">
                {eye === 'RE' ? 'Right (OD)' : 'Left (OS)'}
              </h3>
              {['distance', 'near'].map((type) => (
                <div key={type} className="mb-2 last:mb-0">
                  <p className="text-[8px] font-bold text-blue-400 mb-1 italic">{type}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {['sph', 'cyl', 'axis', 'va'].map((f) => (
                      <div key={f} className="text-center">
                        <Input 
                          className="h-7 p-0 text-center font-bold text-blue-700 border-slate-200 rounded-md text-[10px]" 
                          placeholder={f.toUpperCase()}
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

        {/* Glass Options (Buttons) */}
        <div className="grid grid-cols-3 gap-1.5">
          {Object.keys(options).map((opt) => (
            <button 
              key={opt} 
              onClick={() => setOptions({...options, [opt]: !options[opt]})} 
              className={`py-2 px-1 rounded-lg border text-[8px] font-black uppercase transition-all ${
                options[opt] 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'
              }`}
            >
              {opt.replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        {/* Authorize Button */}
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded-xl shadow-lg transition-all mt-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Authorize & Send"}
        </Button>
      </div>
    </div>
  );
}