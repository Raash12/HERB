import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, limit, deleteDoc, getCountFromServer, getDocs, startAfter 
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Components
import MedicalPrescription from "./MedicalPrescription"; 
import OpticalPrescriptionPage from "./OpticalPrescriptionPage";
import HistorySheet from "./HistorySheet";

// Icons
import { 
  Loader2, Search, Pill, Trash2, Glasses, 
  User, History, Calendar, ChevronLeft, ChevronRight 
} from "lucide-react";

const PAGE_SIZE = 10; // Inta qof ee hal mar soo baxaaya

export default function DoctorAppointments() {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [visitCounts, setVisitCounts] = useState({});
  
  // Pagination States
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [opticalOpen, setOpticalOpen] = useState(false);
  
  const [activeVisit, setActiveVisit] = useState(null);
  const [existingMed, setExistingMed] = useState(null);
  const [existingOptical, setExistingOptical] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  // 1. Fetch Visit Counts (Optimization: Only fetch for visible patients)
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

  // 2. Main Fetch Function
  const fetchVisits = async (direction = "next") => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    let q;

    if (direction === "next" && lastDoc) {
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    } else if (direction === "prev" && firstDoc) {
      // Note: Firestore pagination works better forward. For simple "Prev", 
      // we usually re-query or use a state cache. Here we refresh current view.
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
      setPage(1); 
    } else {
      q = query(
        collection(db, "visits"),
        where("doctorId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
    }

    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisits(rawData);
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setIsLastPage(snap.docs.length < PAGE_SIZE);
      fetchVisitCounts(rawData);
    } else {
      setVisits([]);
      setIsLastPage(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleNext = () => {
    setPage(p => p + 1);
    fetchVisits("next");
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage(1); // Reset to first for simplicity in this logic
      fetchVisits("initial");
    }
  };

  // 3. Filter Logic (Local filter for the current page)
  const filteredVisits = visits.filter(v => 
    v.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (visit, type) => {
    setActionLoading({ id: visit.id, type });
    setActiveVisit(visit);
    try {
      if (type === 'history') {
        setSelectedPatientId(visit.patientId);
        setSelectedPatientName(visit.patientName);
        setHistoryOpen(true);
      } else if (type === 'meds') {
        setExistingMed(null);
        const q = query(collection(db, "medical_prescriptions"), where("visitId", "==", visit.id));
        const snap = await getDocs(q);
        if (!snap.empty) setExistingMed({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setMedicalOpen(true);
      } else if (type === 'optical') {
        setExistingOptical(null);
        const q = query(collection(db, "prescriptions"), where("visitId", "==", visit.id));
        const snap = await getDocs(q);
        if (!snap.empty) setExistingOptical({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setOpticalOpen(true);
      }
    } catch (error) { console.error(error); }
    setActionLoading({ id: null, type: null });
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="font-black text-5xl tracking-tighter uppercase text-blue-600">Appointments</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 bg-white px-4 py-1.5 rounded-full shadow-sm border border-blue-50 inline-block">
            Page {page} — {filteredVisits.length} Records
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input 
            placeholder="SEARCH IN THIS PAGE..." 
            className="w-full pl-12 h-14 bg-white rounded-2xl border-none shadow-lg font-black uppercase text-[11px] focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-sm border border-blue-50/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <Table>
            <TableHeader className="bg-blue-600">
              <TableRow className="hover:bg-transparent border-none">
                <TableCell className="text-white font-black py-8 pl-12 uppercase text-[11px] tracking-widest">Patient Details</TableCell>
                <TableCell className="text-white font-black text-center uppercase text-[11px] tracking-widest">Status</TableCell>
                <TableCell className="text-white font-black text-right pr-12 uppercase text-[11px] tracking-widest">Quick Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((v) => (
                <TableRow key={v.id} className="hover:bg-blue-50/20 transition-all border-slate-50">
                  <TableCell className="py-7 pl-12">
                    <div className="flex items-center gap-5">
                      <div className="bg-blue-100/50 p-4 rounded-2xl text-blue-600 shadow-inner"><User size={24} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-black uppercase text-[17px] tracking-tight text-slate-800">{v.patientName}</div>
                          <Badge className="bg-blue-600 text-white text-[9px] h-5 px-2 rounded-full">#{visitCounts[v.patientId] || 1}</Badge>
                        </div>
                        <div className="text-[11px] text-blue-500 font-bold mt-1 uppercase flex items-center gap-2">
                          <span>{v.phone}</span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1"><Calendar size={10}/> {v.createdAt?.toDate().toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${
                        v.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {v.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="ghost" className="h-12 w-12 rounded-2xl border border-slate-100" onClick={() => handleAction(v, 'history')}><History size={18} /></Button>
                      <Button variant="ghost" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white" onClick={() => handleAction(v, 'meds')}><Pill size={16} className="mr-2" /> Meds</Button>
                      <Button variant="ghost" className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] text-blue-600 border border-blue-50 hover:bg-blue-600 hover:text-white" onClick={() => handleAction(v, 'optical')}><Glasses size={16} className="mr-2" /> Optical</Button>
                      <Button variant="ghost" className="h-12 w-12 rounded-2xl text-red-300 hover:text-red-600" onClick={async () => { if(window.confirm("Are you sure?")) { await deleteDoc(doc(db, "visits", v.id)); fetchVisits(); } }}><Trash2 size={18} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* PAGINATION CONTROLS */}
        <div className="bg-white p-6 border-t border-slate-50 flex items-center justify-between">
          <Button 
            variant="outline" 
            disabled={page === 1 || loading} 
            onClick={handlePrev}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200"
          >
            <ChevronLeft size={16} className="mr-2"/> Previous
          </Button>
          
          <span className="font-black text-slate-400 text-[11px] uppercase tracking-widest">
            Page {page}
          </span>

          <Button 
            variant="outline" 
            disabled={isLastPage || loading} 
            onClick={handleNext}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200"
          >
            Next <ChevronRight size={16} className="ml-2"/>
          </Button>
        </div>
      </div>

      {/* DIALOGS - Keep original Dialog logic here */}
      <Dialog open={medicalOpen} onOpenChange={setMedicalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border-none rounded-[2rem] overflow-hidden shadow-2xl">
           <MedicalPrescription activeVisit={activeVisit} existingPrescription={existingMed} onClose={() => setMedicalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={opticalOpen} onOpenChange={setOpticalOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
           <OpticalPrescriptionPage activeVisit={activeVisit} existingPrescription={existingOptical} onClose={() => setOpticalOpen(false)} />
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