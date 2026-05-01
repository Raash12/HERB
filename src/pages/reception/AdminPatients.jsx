import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, query, onSnapshot, orderBy
} from "firebase/firestore";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import { 
  Loader2, Search, MapPin, 
  Calendar, ChevronLeft, ChevronRight, Phone, Building2, Users, Filter, Activity
} from "lucide-react";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ 1. STATS LOGIC (Xogta Card-yada)
  const stats = patients.reduce((acc, curr) => {
    const bName = (curr.branch || curr.branchName || "Other").trim().toUpperCase();
    acc[bName] = (acc[bName] || 0) + 1;
    return acc;
  }, {});

  // ✅ 2. FILTER LOGIC
  const filteredData = patients.filter(p => {
    const branchName = (p.branch || p.branchName || "Other").toString().trim().toLowerCase();
    const searchTarget = (p.fullName + (p.phone || "")).toLowerCase();
    const matchesBranch = selectedBranch === "all" || branchName === selectedBranch.toLowerCase().trim();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // ✅ 3. PAGINATION LOGIC
  const totalFiltered = filteredData.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const startIndex = (page - 1) * pageSize;
  const currentData = filteredData.slice(startIndex, startIndex + pageSize);

  const branches = [...new Set(patients.map(p => (p.branch || p.branchName || "Other").trim()))];

  return (
    <div className="p-6 space-y-6 bg-slate-50/30 min-h-screen">
      
      {/* ✅ QAYBTA CARD-YADA (Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(stats).map(([name, count]) => (
          <div key={name} className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="absolute -right-4 -top-4 text-indigo-50/50 group-hover:text-indigo-100/50 transition-colors">
              <Activity size={100} />
            </div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Users size={28} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{name}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-800">{count}</h3>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Patients</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 gap-4">
        <div className="flex items-center gap-4 mr-auto">
          <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner"><Building2 size={28} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Directory</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Showing {totalFiltered} Results</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="w-full md:w-64">
            <Select onValueChange={(v) => { setSelectedBranch(v); setPage(1); }} defaultValue="all">
              <SelectTrigger className="h-12 rounded-full bg-slate-50 border-none font-bold text-[10px] uppercase tracking-widest text-slate-500 px-6">
                <Filter size={14} className="mr-2 text-indigo-500" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase">All Locations</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b} value={b} className="font-bold text-[10px] uppercase">{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by name..." 
              className="pl-12 rounded-full bg-slate-100 border-none h-12 text-sm font-medium"
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50">
        <div className="grid grid-cols-5 p-6 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
          <div className="pl-4">Reg. Date</div>
          <div>Patient Name</div>
          <div className="text-center">Branch</div>
          <div className="text-center">Contact</div>
          <div className="text-right pr-4">Status</div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40}/></div>
          ) : currentData.length > 0 ? currentData.map((p) => (
            <div key={p.id} className="grid grid-cols-5 p-6 items-center hover:bg-indigo-50/20 transition-all group">
              <div className="pl-4 flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                <Calendar size={14} className="text-indigo-400" />
                {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-GB') : "N/A"}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm uppercase">
                  {p.fullName?.charAt(0)}
                </div>
                <div className="font-black text-slate-700 uppercase text-xs truncate">{p.fullName}</div>
              </div>

              <div className="text-center">
                <Badge className="bg-slate-100 text-slate-600 border-none font-black px-3 py-1 rounded-lg text-[9px] uppercase">
                  <MapPin size={10} className="mr-1 text-indigo-500" /> {p.branch || "Other"}
                </Badge>
              </div>

              <div className="text-center font-bold text-slate-500 text-xs">
                {p.phone || "No Phone"}
              </div>

              <div className="text-right pr-4">
                 <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase text-emerald-500 border-emerald-100 bg-emerald-50">Active</Badge>
              </div>
            </div>
          )) : (
            <div className="p-24 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              No matching records found
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Page {page} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" size="sm" className="rounded-xl h-10 px-4 border-slate-200 font-bold text-[10px] uppercase" 
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="outline" size="sm" className="rounded-xl h-10 px-4 border-slate-200 font-bold text-[10px] uppercase" 
              disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}