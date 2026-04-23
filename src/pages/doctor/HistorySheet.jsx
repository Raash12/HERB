import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pill, Glasses, User, Activity } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HistorySheet({ patientId, patientName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) return;
      setLoading(true);
      try {
        const medQ = query(collection(db, "medical_prescriptions"), where("patientId", "==", patientId));
        const optQ = query(collection(db, "prescriptions"), where("patientId", "==", patientId));
        const [medSnap, optSnap] = await Promise.all([getDocs(medQ), getDocs(optQ)]);
        
        const combined = [
          ...medSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'MEDICAL' })),
          ...optSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'OPTICAL' }))
        ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        setHistory(combined);
      } catch (err) { console.error("Error fetching history:", err); }
      setLoading(false);
    };
    fetchHistory();
  }, [patientId]);

  const getSelectedOptions = (optionsMap) => {
    if (!optionsMap) return [];
    return Object.entries(optionsMap)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim());
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white h-full">
      <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Patient Records...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      
      <div className="p-8 bg-slate-900 shrink-0 relative">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">{patientName || "Patient"}</h3>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">ID: {patientId} • {history.length} Visits</p>
            </div>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-black tracking-tighter">HORSEED BANAADIR</Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full">
          <div className="p-8 pb-20">
            {history.length === 0 ? (
              <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-[2rem] opacity-30">
                <p className="font-black uppercase text-xs">No Records Found</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {history.map((item, idx) => (
                  <AccordionItem key={item.id || idx} value={`item-${idx}`} className="border-none bg-white rounded-[1.5rem] shadow-sm overflow-hidden border border-slate-100">
                    <AccordionTrigger className="hover:no-underline p-5">
                      <div className="flex items-center gap-6 text-left w-full">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'MEDICAL' ? 'bg-blue-50 text-blue-600' : 'bg-slate-900 text-white'}`}>
                          {item.type === 'MEDICAL' ? <Activity size={20} /> : <Glasses size={20} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{item.type} • {item.createdAt?.toDate().toLocaleDateString('en-GB')}</p>
                          <h4 className="font-black text-slate-800 uppercase text-lg leading-none">
                            {item.type === 'MEDICAL' ? (item.diagnosis || "Medical Case") : (item.category || "Optical Rx")}
                          </h4>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6 pt-2">
                       {item.type === 'MEDICAL' ? (
                         <div className="space-y-4">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Patient Complaint</p>
                             <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                               {item.complain && item.complain !== "" ? `"${item.complain}"` : "General Examination"}
                             </p>
                           </div>
                           
                           <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medications</p>
                             {item.items?.map((med, i) => (
                               <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                 <div>
                                   <p className="text-xs font-black text-slate-800 uppercase">{med.medicineName}</p>
                                   <p className="text-[10px] font-bold text-blue-500 uppercase">Dosage: {med.dosage}</p>
                                 </div>
                                 <Badge className="bg-slate-100 text-slate-600 border-none font-bold">QTY: {med.quantity}</Badge>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <div className="bg-slate-900 rounded-2xl p-5 text-white">
                               <div className="grid grid-cols-2 gap-8">
                                 {['RE', 'LE'].map(eye => (
                                   <div key={eye} className="space-y-3">
                                     <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                       <span className="text-[10px] text-blue-400 font-black uppercase">{eye} EYE</span>
                                       <div className="flex gap-4 text-[8px] font-black text-white/40 uppercase">
                                         <span className="w-8 text-center">SPH</span>
                                         <span className="w-8 text-center">CYL</span>
                                         <span className="w-8 text-center">VA</span>
                                       </div>
                                     </div>
                                     
                                     {/* Distance Row */}
                                     <div className="flex justify-between items-center">
                                       <span className="text-[8px] font-black text-white/30 uppercase">Dist</span>
                                       <div className="flex gap-4">
                                         <span className="w-8 text-center text-[11px] font-black uppercase">{item.values?.[eye]?.distance?.sph || '—'}</span>
                                         <span className="w-8 text-center text-[11px] font-black uppercase">{item.values?.[eye]?.distance?.cyl || '—'}</span>
                                         <span className="w-8 text-center text-[11px] font-black text-blue-400">{item.values?.[eye]?.distance?.va || '—'}</span>
                                       </div>
                                     </div>

                                     {/* Near Row */}
                                     <div className="flex justify-between items-center">
                                       <span className="text-[8px] font-black text-white/30 uppercase">Near</span>
                                       <div className="flex gap-4">
                                         <span className="w-8 text-center text-[11px] font-black text-emerald-400 uppercase">{item.values?.[eye]?.near?.sph || '—'}</span>
                                         <span className="w-8 text-center text-[11px] font-black text-emerald-400 uppercase">{item.values?.[eye]?.near?.cyl || '—'}</span>
                                         <span className="w-8 text-center text-[11px] font-black text-blue-400">{item.values?.[eye]?.near?.va || '—'}</span>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>

                            {getSelectedOptions(item.options).length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {getSelectedOptions(item.options).map((opt, i) => (
                                  <Badge key={i} className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] px-3 py-1 font-black uppercase tracking-wider">
                                    {opt}
                                  </Badge>
                                ))}
                              </div>
                            )}
                         </div>
                       )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}