import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, query, onSnapshot, orderBy, limit, 
  startAfter, endBefore, limitToLast, getDocs
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Loader2, Search, MapPin, 
  Calendar, ChevronLeft, ChevronRight, Phone, Building2, Users
} from "lucide-react";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [allPatientsForStats, setAllPatientsForStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination States
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- FETCH DATA ---
  const fetchPatients = (q) => {
    setLoading(true);
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setFirstVisible(snap.docs[0]);
        setLastVisible(snap.docs[snap.docs.length - 1]);
        setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setPatients([]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"), limit(pageSize));
    const unsubscribe = fetchPatients(q);

    // Xisaabinta Stats-ka (Si la mid ah Medical component-kaaga)
    const unsubAll = onSnapshot(collection(db, "patients"), (snap) => {
      setAllPatientsForStats(snap.docs.map(d => d.data()));
      setTotalCount(snap.size);
    });

    return () => { unsubscribe(); unsubAll(); };
  }, []);

  // ✅ STATS LOGIC (Inspiried by your Medical.jsx)
  const branchStats = allPatientsForStats.reduce((acc, curr) => {
    const bName = curr.branch || curr.branchName || "Main HQ";
    acc[bName] = (acc[bName] || 0) + 1;
    return acc;
  }, {});

  // ✅ FILTER LOGIC
  const globalFilteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(term) || 
      p.phone?.includes(term) || 
      p.branch?.toLowerCase().includes(term)
    );
  });

  // --- PAGINATION HANDLERS ---
  const handleNext = () => {
    if (!lastVisible) return;
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(pageSize));
    setPage(p => p + 1);
    fetchPatients(q);
  };

  const handlePrev = () => {
    if (!firstVisible) return;
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"), endBefore(firstVisible), limitToLast(pageSize));
    setPage(p => Math.max(1, p - 1));
    fetchPatients(q);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/30 min-h-screen">
      
      {/* ✅ QAYBTA CARD-YADA: Indigo/Medical Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(branchStats).map(([name, count]) => (
          <div key={name} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{name}</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{count} <span className="text-xs font-bold text-slate-500 text-indigo-600">BUKAAN</span></h3>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner"><Building2 size={28} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Patients List</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage and search all patients</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search name, phone, branch..." 
            className="pl-12 rounded-full bg-slate-100 border-none h-12 text-sm font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE SECTION: Consistent with Medical style */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50">
        <div className="grid grid-cols-5 p-6 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
          <div className="pl-4">Registration Date</div>
          <div>Patient Details</div>
          <div className="text-center">Branch</div>
          <div className="text-center">Contact Info</div>
          <div className="text-right pr-4">Status</div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/></div>
          ) : globalFilteredPatients.length > 0 ? globalFilteredPatients.map((p) => (
            <div key={p.id} className="grid grid-cols-5 p-6 items-center hover:bg-indigo-50/20 transition-all group">
              <div className="pl-4 flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                <Calendar size={14} className="text-indigo-400" />
                {p.createdAt?.toDate() ? p.createdAt.toDate().toLocaleDateString('en-GB') : "N/A"}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  {p.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-slate-700 uppercase text-sm">{p.fullName}</div>
                  <div className="text-[9px] text-slate-400 font-black">AGE: {p.age || "N/A"}</div>
                </div>
              </div>

              <div className="text-center">
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-black px-4 py-1.5 rounded-xl text-[10px] uppercase">
                  <MapPin size={12} className="mr-1" /> {p.branch || "N/A"}
                </Badge>
              </div>

              <div className="text-center font-bold text-slate-600 text-xs">
                <div className="inline-flex items-center gap-1.5">
                  <Phone size={12} className="text-indigo-400" /> {p.phone}
                </div>
              </div>

              <div className="text-right pr-4">
                 <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase text-slate-400 border-slate-200">Active</Badge>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Patients Found</div>
          )}
        </div>

        {/* PAGINATION: Indigo Style */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page {page} <span className="mx-2 text-slate-200">|</span> Total {totalCount}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600" disabled={page === 1} onClick={handlePrev}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600" disabled={patients.length < pageSize} onClick={handleNext}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}