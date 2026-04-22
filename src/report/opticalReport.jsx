import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Loader2, Eye, User, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

// ✅ IMPORT-KA PRINT-KA
import { handlePrintPrescription } from "../utils/printPrescription";

export default function OpticalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Waxaan ka dhigay 10 si table-ka u ekaado mid nidaamsan

  useEffect(() => {
    const q = query(collection(db, "prescriptions"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setReports(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic (Search by name, phone, or branch)
  const filteredData = reports.filter(item => {
    const name = (item.patientInfo?.fullName || item.patientName || item.displayName || "").toLowerCase();
    const phone = (item.patientInfo?.phone || item.phone || "");
    const branch = (item.branch || item.branchName || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm) || branch.includes(searchTerm.toLowerCase());
  });

  // ✅ PAGINATION LOGIC
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Eye size={24} />
            </div>
            OPTICAL REPORTS
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-12">
            Patient Vision History & Sales
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-4 py-1 font-black text-blue-600 bg-blue-50 border-blue-100">
          Total Records: {filteredData.length}
        </Badge>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
        <CardContent className="p-8">
          
          {/* Search Box */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search name, phone or branch..." 
              className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">Date</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Patient Details</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Branch</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Vision (R/L)</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Doctor</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((report) => {
                    const pName = report.patientInfo?.fullName || report.patientName || report.displayName || "Unknown Patient";
                    const pPhone = report.patientInfo?.phone || report.phone || "N/A";
                    const doctor = report.doctorName || "Specialist";
                    const branchName = report.branch || report.branchName || "Main Center";

                    return (
                      <TableRow key={report.id} className="hover:bg-blue-50/30 transition-all border-b border-slate-50">
                        <TableCell className="py-5 pl-8">
                          <div className="text-[11px] font-bold text-slate-400 font-mono">
                            {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="font-black text-slate-800 uppercase text-sm leading-tight">
                                {pName}
                              </div>
                              <div className="text-[10px] font-bold text-blue-500 mt-0.5">
                                {pPhone}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin size={12} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{branchName}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-center gap-2">
                             <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-100">
                               R: {report.values?.RE?.sph || '0.00'} / {report.values?.RE?.cyl || '0.00'}
                             </div>
                             <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black border border-purple-100">
                               L: {report.values?.LE?.sph || '0.00'} / {report.values?.LE?.cyl || '0.00'}
                             </div>
                          </div>
                        </TableCell>

                        <TableCell>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight italic">
                              Dr. {doctor}
                            </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className={`text-[9px] font-black uppercase px-3 py-1 rounded-md ${report.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                            {report.status || 'Pending'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl border border-slate-200 text-slate-600 font-black uppercase text-[10px] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                            onClick={() => handlePrintPrescription(report)}
                          >
                            <Printer size={14} className="mr-2" /> PDF Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <Eye size={40} className="opacity-20" />
                        <p className="italic font-bold">No optical records match your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ PAGINATION CONTROLS */}
          <div className="flex items-center justify-between mt-8 px-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page <span className="text-blue-600">{currentPage}</span> of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}