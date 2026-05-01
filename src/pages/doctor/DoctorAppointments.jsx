import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, getDoc, getDocs 
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
  Loader2, Search, Pill, Glasses, 
  User, History, Calendar, Clock, ChevronLeft, ChevronRight, Phone
} from "lucide-react";

// Component: Fetch Phone
const PatientInfoRow = ({ patientId, onPhoneFetch }) => {
  const [phone, setPhone] = useState("...");
  useEffect(() => {
    const fetchPhone = async () => {
      if (!patientId) return;
      const pSnap = await getDoc(doc(db, "patients", patientId));
      if (pSnap.exists()) {
        const pData = pSnap.data().phone || "No Phone";
        setPhone(pData);
        if (onPhoneFetch) onPhoneFetch(patientId, pData);
      }
    };
    fetchPhone();
  }, [patientId]);
  return <span>{phone}</span>;
};

// Component: Auto Status Checker (Check if Medical or Optical exists)
const StatusBadge = ({ visitId, initialStatus }) => {
  const [status, setStatus] = useState(initialStatus || "waiting");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPrescriptions = async () => {
      try {
        const [medSnap, optSnap] = await Promise.all([
          getDocs(query(collection(db, "medical_prescriptions"), where("visitId", "==", visitId))),
          getDocs(query(collection(db, "prescriptions"), where("visitId", "==", visitId)))
        ]);

        if (!medSnap.empty || !optSnap.empty) {
          setStatus("completed");
        } else {
          setStatus(initialStatus || "waiting");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    };
    checkPrescriptions();
  }, [visitId, initialStatus]);

  if (checking) return <div className="h-4 w-12 bg-slate-100 animate-pulse rounded-full mx-auto" />;

  return (
    <Badge className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-none ${
        status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
      }`}>
      {status}
    </Badge>
  );
};

const VisitCounter = ({ patientId }) => {
  const [countNumber, setCountNumber] = useState(0);
  useEffect(() => {
    const fetchCount = async () => {
      if (!patientId) return;
      const q = query(collection(db, "visits"), where("patientId", "==", patientId));
      const snapshot = await getDocs(q);
      setCountNumber(snapshot.size);
    };
    fetchCount();
  }, [patientId]);
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-black px-3 py-1 rounded-lg">
      {countNumber} {countNumber === 1 ? 'Visit' : 'Visits'}
    </Badge>
  );
};

const PAGE_SIZE = 10;

export default function DoctorAppointments() {
  const [visits, setVisits] = useState([]);
  const [patientPhones, setPatientPhones] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const [historyOpen, setHistoryOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [opticalOpen, setOpticalOpen] = useState(false);
  
  const [activeVisit, setActiveVisit] = useState(null);
  const [existingMed, setExistingMed] = useState(null);
  const [existingOptical, setExistingOptical] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "visits"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisits(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePhoneFetch = (id, phone) => {
    setPatientPhones(prev => ({ ...prev, [id]: phone }));
  };

  const filteredVisits = visits.filter(v => {
    const nameMatch = v.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = patientPhones[v.patientId]?.includes(searchTerm);
    return nameMatch || phoneMatch;
  });

  const totalPages = Math.ceil(filteredVisits.length / PAGE_SIZE) || 1;
  const currentVisits = filteredVisits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = async (visit, type) => {
    setActiveVisit(visit);
    try {
      if (type === 'history') {
        setSelectedPatientId(visit.patientId);
        setSelectedPatientName(visit.patientName);
        setHistoryOpen(true);
      } else if (type === 'meds') {
        const q = query(collection(db, "medical_prescriptions"), where("visitId", "==", visit.id));
        const snap = await getDocs(q);
        setExistingMed(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
        setMedicalOpen(true);
      } else if (type === 'optical') {
        const q = query(collection(db, "prescriptions"), where("visitId", "==", visit.id));
        const snap = await getDocs(q);
        setExistingOptical(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
        setOpticalOpen(true);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="font-black text-5xl tracking-tighter uppercase text-blue-600 italic">Doctor Queue</h2>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-100/50 px-4 py-2 rounded-full mt-2 inline-block">
            {filteredVisits.length} Records Found
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input 
            placeholder="SEARCH BY NAME OR PHONE..." 
            className="w-full pl-14 h-16 bg-white rounded-2xl border-none shadow-xl font-black uppercase text-[11px] focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300" 
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-blue-50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
        ) : (
          <Table>
            <TableHeader className="bg-blue-600"> 
              <TableRow className="hover:bg-transparent border-none">
                <TableCell className="text-white font-black py-8 pl-10 uppercase text-[10px] tracking-widest">Patient Details</TableCell>
                <TableCell className="text-white font-black text-center uppercase text-[10px] tracking-widest">Visit No.</TableCell>
                <TableCell className="text-white font-black text-center uppercase text-[10px] tracking-widest">Time</TableCell>
                <TableCell className="text-white font-black text-center uppercase text-[10px] tracking-widest">Status</TableCell>
                <TableCell className="text-white font-black text-right pr-10 uppercase text-[10px] tracking-widest">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentVisits.map((v) => (
                <TableRow key={v.id} className="hover:bg-blue-50/20 transition-all border-slate-50">
                  <TableCell className="py-7 pl-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="font-black uppercase text-lg text-slate-800 leading-none">{v.patientName}</div>
                        <div className="mt-1 flex items-center gap-2 text-blue-500 font-bold text-[11px] uppercase tracking-wide">
                          <Phone size={12}/> 
                          <PatientInfoRow patientId={v.patientId} onPhoneFetch={handlePhoneFetch} />
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <VisitCounter patientId={v.patientId} />
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-slate-700 text-sm flex items-center gap-1.5">
                        <Clock size={13} className="text-blue-500"/>
                        {v.createdAt?.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        {v.createdAt?.toDate().toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {/* Halkan ayaan ku daray auto-checker-ka status-ka */}
                    <StatusBadge visitId={v.id} initialStatus={v.status} />
                  </TableCell>

                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="h-12 w-12 rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white transition-all" onClick={() => handleAction(v, 'history')}>
                        <History size={18} />
                      </Button>
                      <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all border border-blue-100" onClick={() => handleAction(v, 'meds')}>
                        <Pill size={14} className="mr-2" /> Medical
                      </Button>
                      <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all border border-blue-100" onClick={() => handleAction(v, 'optical')}>
                        <Glasses size={16} className="mr-2" /> Optical
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="bg-slate-50/50 p-6 flex items-center justify-between border-t border-slate-100">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl h-10 px-4 font-black uppercase text-[9px] tracking-widest shadow-sm">
            <ChevronLeft size={16} className="mr-1"/> Back
          </Button>
          <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl h-10 px-4 font-black uppercase text-[9px] tracking-widest shadow-sm">
            Next <ChevronRight size={16} className="ml-1"/>
          </Button>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={medicalOpen} onOpenChange={setMedicalOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 border-none rounded-[2rem] overflow-hidden">
           <MedicalPrescription activeVisit={activeVisit} existingPrescription={existingMed} onClose={() => setMedicalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={opticalOpen} onOpenChange={setOpticalOpen}>
        <DialogContent className="sm:max-w-[950px] p-0 border-none rounded-[2rem] overflow-hidden">
           <OpticalPrescriptionPage activeVisit={activeVisit} existingPrescription={existingOptical} onClose={() => setOpticalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-[1100px] w-[95vw] p-0 border-none rounded-[2.5rem] overflow-hidden">
          <div className="h-[85vh] flex flex-col">
            <HistorySheet patientId={selectedPatientId} patientName={selectedPatientName} />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}