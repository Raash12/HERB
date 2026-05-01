import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Download, TrendingUp, Wallet, ShoppingCart, Loader2, ChevronLeft, ChevronRight, Stethoscope, MapPin, Clock, Pill, Filter } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function SalesReport() {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Waa la yareeyay si screen-ka u qaado

  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), dateFormatted: doc.data().createdAt?.toDate() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSalesReport(); }, [fetchSalesReport]);

  const branches = useMemo(() => ["all", ...new Set(sales.map(s => s.branchId || "Main"))], [sales]);

  const filteredSales = sales.filter(s => {
    const matchesSearch = (s.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === "all" || (s.branchId || "Main") === selectedBranch;
    const matchesDate = (!startDate || !endDate) ? true : (s.dateFormatted >= new Date(startDate) && s.dateFormatted <= new Date(endDate).setHours(23,59,59));
    return matchesSearch && matchesBranch && matchesDate;
  });

  const totals = {
    doctor: filteredSales.filter(s => s.type === "doctor").reduce((a, c) => a + (c.finalTotal || 0), 0),
    walkin: filteredSales.filter(s => s.type !== "doctor").reduce((a, c) => a + (c.finalTotal || 0), 0)
  };

  const currentItems = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Mini Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <TrendingUp size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">Sales <span className="text-blue-600">Report</span></h1>
        </div>
        <Button onClick={() => {}} className="h-10 px-6 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">
          <Download size={14} className="mr-2" /> Export
        </Button>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Direct" value={totals.walkin} icon={<ShoppingCart size={16}/>} />
        <StatCard label="Doctor" value={totals.doctor} icon={<Stethoscope size={16}/>} />
        <StatCard label="Total Revenue" value={totals.walkin + totals.doctor} icon={<Wallet size={16}/>} isDark />
      </div>

      {/* Tight Filters */}
      <Card className="p-2 rounded-2xl border-none shadow-lg bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border">
            <Calendar size={14} className="text-blue-600" />
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 w-28 bg-transparent border-none text-[11px] font-bold" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 w-28 bg-transparent border-none text-[11px] font-bold" />
          </div>
          
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-12 w-40 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-black uppercase">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => <SelectItem key={b} value={b} className="text-[10px] font-bold uppercase">{b}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-12 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs" />
          </div>
        </div>
      </Card>

      {/* Slim Table */}
      <Card className="rounded-2xl border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800">
            <TableRow>
              <TableHead className="text-[9px] font-black uppercase p-4">Branch</TableHead>
              <TableHead className="text-[9px] font-black uppercase">Patient</TableHead>
              <TableHead className="text-[9px] font-black uppercase">Items</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-center">Type</TableHead>
              <TableHead className="text-[9px] font-black uppercase text-right pr-6">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin inline text-blue-600"/></TableCell></TableRow> : 
              currentItems.map(s => (
              <TableRow key={s.id} className="hover:bg-slate-50/50 text-[11px]">
                <TableCell className="p-4"><Badge variant="outline" className="text-[9px] font-bold uppercase border-blue-100 text-blue-600">{s.branchId || "Main"}</Badge></TableCell>
                <TableCell>
                  <div className="font-black text-slate-800 dark:text-white uppercase leading-none">{s.patientName || "Client"}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{s.dateFormatted && format(s.dateFormatted, "dd/MM/yy")}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.items?.slice(0, 2).map((i, idx) => <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-medium">{i.medicineName}</span>)}
                    {s.items?.length > 2 && <span className="text-[9px] text-blue-500">+{s.items.length - 2}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${s.type === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{s.type || 'direct'}</span>
                </TableCell>
                <TableCell className="text-right pr-6 font-black text-sm text-blue-600">${(s.finalTotal || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Simple Pagination */}
        <div className="p-3 bg-slate-50/30 flex items-center justify-between border-t">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {Math.ceil(filteredSales.length/itemsPerPage)}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="h-8 w-8 rounded-lg p-0"><ChevronLeft size={14}/></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredSales.length/itemsPerPage)} className="h-8 w-8 rounded-lg p-0"><ChevronRight size={14}/></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, isDark = false }) {
  return (
    <div className={`p-4 rounded-2xl flex justify-between items-center border shadow-sm ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      <div>
        <p className={`text-[9px] font-black uppercase mb-0.5 ${isDark ? 'text-blue-400' : 'text-slate-400'}`}>{label}</p>
        <h2 className="text-xl font-black tracking-tight">${value.toFixed(2)}</h2>
      </div>
      <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-50 text-blue-600'}`}>{icon}</div>
    </div>
  );
}