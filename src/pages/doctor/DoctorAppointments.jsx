import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, limit, deleteDoc, getCountFromServer 
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Components
import MedicalPrescription from "./MedicalPrescription"; 
import OpticalPrescriptionPage from "./OpticalPrescriptionPage";
import HistorySheet from "./HistorySheet";

// Icons
import { Loader2, Search, Pill, Trash2, Glasses, User, History, Calendar } from "lucide-react";

export default function DoctorAppointments() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [visitCounts, setVisitCounts] = useState({});
  
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [opticalOpen, setOpticalOpen] = useState(false);
  
  const [activeVisit, setActiveVisit] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // Tirinta Booqashooyinka
  const fetchVisitCounts = async (uniqueList) => {
    const counts = { ...visitCounts };
    for (const patient of uniqueList) {
      if (patient.patientId && !counts[patient.patientId]) {
        const q = query(collection(db, "visits"), where("patientId", "==", patient.patientId));
        const snapshot = await getCountFromServer(q);
        counts[patient.patientId] = snapshot.data().count;
      }
    }
    setVisitCounts(counts);
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, "visits"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(100) 
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // LOGIC: Hal bukaan hal saf (No duplicates)
        const uniquePatients = [];
        const seenPatientIds = new Set();

        rawData.forEach(visit => {
          if (!seenPatientIds.has(visit.patientId)) {
            seenPatientIds.add(visit.patientId);
            uniquePatients.push(visit); 
          }
        });

        setVisits(uniquePatients);
        fetchVisitCounts(uniquePatients);
      } else {
        setVisits([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (visit, type) => {
    setActionLoading({ id: visit.id, type });
    setTimeout(() => {
      setActiveVisit(visit);
      if (type === 'history') {
        setSelectedPatientId(visit.patientId);
        setSelectedPatientName(visit.patientName);
        setHistoryOpen(true);
      } else if (type === 'meds') {
        setMedicalOpen(true);
      } else if (type === 'optical') {
        setOpticalOpen(true);
      }
      setActionLoading({ id: null, type: null });
    }, 400);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-black text-5xl tracking-tighter uppercase text-blue-600">Appointments</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 bg-white px-4 py-1.5 rounded-full shadow-sm border border-blue-50 inline-block">
            Unique Patient List
          </p>
        </div>
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
          <Input 
            placeholder="Search patient name..." 
            className="w-full md:w-96 pl-14 h-16 bg-white rounded-[1.5rem] border-none shadow-2xl font-bold uppercase text-[12px]" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-sm border border-blue-50/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="text-white font-black py-8 pl-12 uppercase text-[11px] tracking-widest">Patient Details</TableCell>
              <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Status</TableCell>
              <TableCell className="text-white font-black text-right pr-12 uppercase text-[11px] tracking-widest">Quick Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.filter(v => v.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
              <TableRow key={v.patientId} className="hover:bg-blue-50/20 transition-all border-slate-50">
                <TableCell className="py-7 pl-12">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-100/50 p-4 rounded-2xl text-blue-600 shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-black uppercase text-[17px] tracking-tight text-slate-800">{v.patientName}</div>
                        <Badge className="bg-blue-600 text-white text-[9px] h-5 px-2 rounded-full">
                           #{visitCounts[v.patientId] || 1}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-blue-500 font-bold mt-1 uppercase flex items-center gap-2">
                        <span>{v.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><Calendar size={10}/> {v.createdAt?.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* STATUS BADGE - Dib ayaa loo soo celiyey */}
                <TableCell className="text-center">
                   <Badge className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${
                      v.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      v.status === 'processing' ? 'bg-blue-50 text-blue-600' : 
                      'bg-orange-50 text-orange-600'
                    }`}>
                    {v.status || 'pending'}
                  </Badge>
                </TableCell>

                <TableCell className="text-right pr-12">
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" disabled={actionLoading.id === v.id} className="h-12 w-12 rounded-2xl text-slate-400 border border-slate-100 hover:bg-slate-100" onClick={() => handleAction(v, 'history')}>
                      {actionLoading.id === v.id && actionLoading.type === 'history' ? <Loader2 className="animate-spin" size={18} /> : <History size={18} />}
                    </Button>

                    <Button variant="ghost" disabled={actionLoading.id === v.id} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white" onClick={() => handleAction(v, 'meds')}>
                      {actionLoading.id === v.id && actionLoading.type === 'meds' ? <Loader2 className="animate-spin mr-2" size={16} /> : <Pill size={16} className="mr-2" />}
                      Meds
                    </Button>
                    
                    <Button variant="ghost" disabled={actionLoading.id === v.id} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white" onClick={() => handleAction(v, 'optical')}>
                      {actionLoading.id === v.id && actionLoading.type === 'optical' ? <Loader2 className="animate-spin mr-2" size={16} /> : <Glasses size={16} className="mr-2" />}
                      Optical
                    </Button>

                    <Button variant="ghost" className="h-12 w-12 rounded-2xl text-red-300 hover:text-red-600" onClick={async () => { if(window.confirm("Ma hubtaa?")) await deleteDoc(doc(db, "visits", v.id)) }}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={medicalOpen} onOpenChange={setMedicalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-[2rem] overflow-hidden shadow-2xl">
           <MedicalPrescription activeVisit={activeVisit} onClose={() => setMedicalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={opticalOpen} onOpenChange={setOpticalOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
           <OpticalPrescriptionPage activeVisit={activeVisit} onClose={() => setOpticalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] p-0 border-none rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="h-[90vh] flex flex-col">
            <HistorySheet patientId={selectedPatientId} patientName={selectedPatientName} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}