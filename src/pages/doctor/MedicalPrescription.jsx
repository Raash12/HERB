import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, addDoc, collection, updateDoc, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Activity, Loader2, ArrowLeft, Printer, User, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PrescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });

  const [patient, setPatient] = useState(null);
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [values, setValues] = useState({
    RE: { sph: "", cyl: "", axis: "" },
    LE: { sph: "", cyl: "", axis: "" },
  });

  const [options, setOptions] = useState({
    distance: false, near: false, bifocal: false, progressive: false, 
    singleVision: false, photoBrown: false, photoGrey: false, white: false,
    sunglasses: false, blueCut: false, highIndex: false, plasticCr39: false,
    crookesB1: false, crookesB2: false, halfEye: false, contactLenses: false, kaPto: false
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "patients", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setPatient(data);
          const q = query(collection(db, "users"), where("role", "==", "reception"), where("branch", "==", data.branch));
          const res = await getDocs(q);
          setReceptions(res.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!selectedReception) return alert("Select reception");
    setLoading(true);
    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: patient.id,
        patientInfo: { name: patient.fullName, phone: patient.phone, age: patient.age },
        branch: patient.branch,
        doctorName: patient.doctorName || "Specialist",
        sendTo: selectedReception,
        values, options, type: "optical", createdAt: new Date(),
      });
      await updateDoc(doc(db, "patients", patient.id), { status: "completed" });
      alert("Sent to reception ✅");
      navigate(-1);
    } catch (err) { alert("Error saving"); }
    setLoading(false);
  };

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => navigate(-1)} className="font-bold text-blue-600"><ArrowLeft size={18} className="mr-2" /> Back</Button>
        <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700 font-bold"><Printer size={18} className="mr-2"/> Print Optical Card</Button>
      </div>

      <div ref={contentRef} className="bg-white p-6 rounded-[2.5rem]">
        {/* PATIENT INFO HEADER */}
        <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
          <div className="flex items-center gap-4 border-r border-slate-200">
            <div className="bg-blue-600 p-4 rounded-2xl text-white"><User size={25} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
              <h2 className="font-black text-lg text-blue-900">{patient?.fullName}</h2>
            </div>
          </div>
          <div className="border-r border-slate-200 px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Details</p>
            <div className="flex gap-4 font-bold text-sm">
              <span className="flex items-center gap-1 text-slate-600"><Activity size={14}/> {patient?.age} Yrs</span>
              <span className="flex items-center gap-1 text-slate-600"><Phone size={14}/> {patient?.phone}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">District</p>
            <p className="font-bold text-sm text-slate-700 italic">{patient?.address || "N/A"}</p>
          </div>
        </div>

        {/* EYES MEASUREMENTS */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {["RE", "LE"].map((eye) => (
            <div key={eye} className="border-2 border-blue-50 rounded-[2rem] p-8 space-y-6 bg-white shadow-sm transition-all hover:shadow-md">
              <h3 className="font-black text-center text-blue-600 border-b pb-3 uppercase tracking-widest">{eye === "RE" ? "Right Eye (OD)" : "Left Eye (OS)"}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center"><label className="text-[10px] font-black text-slate-400 uppercase">SPH</label><Input value={values[eye].sph} onChange={(e) => setValues({...values, [eye]: {...values[eye], sph: e.target.value}})} className="h-14 rounded-2xl text-center font-black text-lg" /></div>
                <div className="space-y-1 text-center"><label className="text-[10px] font-black text-slate-400 uppercase">CYL</label><Input value={values[eye].cyl} onChange={(e) => setValues({...values, [eye]: {...values[eye], cyl: e.target.value}})} className="h-14 rounded-2xl text-center font-black text-lg" /></div>
                <div className="space-y-1 text-center"><label className="text-[10px] font-black text-slate-400 uppercase">AXIS</label><Input value={values[eye].axis} onChange={(e) => setValues({...values, [eye]: {...values[eye], axis: e.target.value}})} className="h-14 rounded-2xl text-center font-black text-lg" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* OPTIONS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 no-print">
          {Object.keys(options).map((key) => (
            <label key={key} className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${options[key] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-200'}`}>
              <Checkbox checked={options[key]} onCheckedChange={() => setOptions({ ...options, [key]: !options[key] })} />
              <span className="text-[10px] font-black uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>

        {/* RECEPTION SELECT & SAVE */}
        <div className="space-y-6 no-print">
           <div className="max-w-xs space-y-2">
             <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Send To Reception</label>
             <select className="w-full h-12 border-2 border-blue-50 rounded-xl px-4 font-bold bg-white" value={selectedReception} onChange={(e) => setSelectedReception(e.target.value)}>
               <option value="">Select Receptionist</option>
               {receptions.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
             </select>
           </div>
           <Button onClick={handleSave} disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-[1.5rem] shadow-xl">
             {loading ? <Loader2 className="animate-spin" /> : "Complete & Send"}
           </Button>
        </div>
      </div>
    </div>
  );
}