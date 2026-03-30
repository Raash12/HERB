import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";

// UI Components
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card"; // Waxaan ku daray CardFooter

// Icons & Utils
import { Loader2, Printer, Search, ChevronLeft, ChevronRight, User } from "lucide-react";
import { handlePrintPrescription } from "@/utils/printPrescription";

export default function ReceptionPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "prescriptions"),
      where("sendTo", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const prescData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const fullData = await Promise.all(
        prescData.map(async (presc) => {
          if (presc.patientId) {
            const pDoc = await getDoc(doc(db, "patients", presc.patientId));
            return { ...presc, patientInfo: pDoc.exists() ? pDoc.data() : {} };
          }
          return presc;
        })
      );
      setPrescriptions(fullData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredData = prescriptions.filter((p) =>
    p.patientInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientInfo?.phone?.includes(searchTerm)
  );

  // Pagination Logic (Sida Customer Registration)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastRecord = currentPage * itemsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={35} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Table</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search prescriptions..." 
            className="pl-12 h-11 border-blue-100 rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="bg-blue-600/5 px-4 py-2 rounded-lg border border-blue-100">
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{filteredData.length} Found</span>
        </div>
      </div>

      {/* Table Section */}
      <Card className="shadow-xl border-none overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-blue-600 dark:bg-blue-700">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Patient Info</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Right Eye (OD)</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Left Eye (OS)</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest">Doctor</TableHead>
                <TableHead className="text-white font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((order) => (
                <TableRow key={order.id} className="hover:bg-accent/50 transition-colors border-b dark:border-slate-800">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                        {order.patientInfo?.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">{order.patientInfo?.fullName || "No Name"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{order.patientInfo?.phone || "--------"}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* OD Values */}
                  <TableCell className="text-center">
                    <div className="inline-flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">S</span><span className="text-xs font-black text-blue-600">{order.values?.RE?.sph}</span></div>
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">C</span><span className="text-xs font-black text-blue-600">{order.values?.RE?.cyl}</span></div>
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">A</span><span className="text-xs font-black text-orange-600">{order.values?.RE?.axis}°</span></div>
                    </div>
                  </TableCell>

                  {/* OS Values */}
                  <TableCell className="text-center">
                    <div className="inline-flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">S</span><span className="text-xs font-black text-emerald-600">{order.values?.LE?.sph}</span></div>
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">C</span><span className="text-xs font-black text-emerald-600">{order.values?.LE?.cyl}</span></div>
                      <div className="flex flex-col px-1"><span className="text-[8px] font-black text-slate-400">A</span><span className="text-xs font-black text-orange-600">{order.values?.LE?.axis}°</span></div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase">Dr. {order.doctorName}</span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase italic">Optometrist</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <Button 
                      onClick={() => handlePrintPrescription(order)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-lg h-9 px-4"
                    >
                      <Printer size={14} className="mr-2" /> Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION (Exactly like Customer Registration) */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/20 gap-4 border-t">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Showing {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[10px] font-black uppercase" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} className="mr-1" /> PREV
            </Button>
            
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-black text-xs">
              {currentPage} / {totalPages || 1}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[10px] font-black uppercase" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages || totalPages === 0}
            >
              NEXT <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}