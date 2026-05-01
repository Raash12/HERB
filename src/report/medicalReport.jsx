import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer, FileText, ChevronLeft, ChevronRight, Loader2, User, Building2, DollarSign, Filter } from "lucide-react";
import { handlePrintMedical } from "../utils/printMedical";

export default function MedicalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientNames, setPatientNames] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "medical_prescriptions"));

    const unsubscribe = onSnapshot(q, async (snap) => {
      try {
        const reportsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const paidReports = reportsData.filter(item => {
          const s = (item.status || "").toLowerCase();
          return s === "paid" || s === "completed" || item.paid === true;
        });

        const namesMap = { ...patientNames };
        const uniquePatientIds = [...new Set(paidReports.map(r => r.patientId))].filter(id => id && !namesMap[id]);

        await Promise.all(uniquePatientIds.map(async (pId) => {
          try {
            const pDoc = await getDoc(doc(db, "patients", pId));
            if (pDoc.exists()) {
              namesMap[pId] = pDoc.data().fullName;
            } else {
              namesMap[pId] = "Unknown Patient";
            }
          } catch (err) {
            namesMap[pId] = "Error Loading";
          }
        }));

        const sortedReports = paidReports.sort((a, b) => {
          const timeA = a.dispensedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.dispensedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setPatientNames(namesMap);
        setReports(sortedReports);
      } catch (error) {
        console.error("Firebase Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic: Search + Branch
  const branches = ["all", ...new Set(reports.map(r => r.branch || r.branchName || "Main Branch"))];

  const filteredData = reports.filter(item => {
    const pName = (patientNames[item.patientId] || item.patientName || "").toLowerCase();
    const dName = (item.doctorName || "").toLowerCase();
    const bName = (item.branch || item.branchName || "Main Branch").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = pName.includes(search) || dName.includes(search) || bName.includes(search);
    const matchesBranch = selectedBranch === "all" || (item.branch || item.branchName || "Main Branch") === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
          Loading Reports...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <FileText size={24} />
            </div>
            MEDICAL SALES REPORT
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-12">
            History of completed sales and branch records
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-4 py-1 font-black text-blue-600 bg-blue-50 border-blue-100">
          Total Records: {filteredData.length}
        </Badge>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
        <CardContent className="p-8">
          
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search patient, doctor or branch..." 
                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="w-full md:w-64">
              <Select value={selectedBranch} onValueChange={(val) => { setSelectedBranch(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-slate-600 focus:ring-2 focus:ring-blue-500">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-blue-600" />
                    <SelectValue placeholder="Filter Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {branches.map((b) => (
                    <SelectItem key={b} value={b} className="font-bold uppercase text-[10px]">
                      {b === "all" ? "All Branches" : b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent text-nowrap">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8 text-slate-500">Date</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Patient Name</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Branch</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-blue-600">Paid Amount</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8 text-slate-500">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((report) => (
                    <TableRow key={report.id} className="hover:bg-blue-50/30 transition-all border-b border-slate-50">
                      <TableCell className="py-5 pl-8">
                        <div className="text-[11px] font-bold text-slate-400 font-mono">
                          {report.dispensedAt?.toDate ? report.dispensedAt.toDate().toLocaleDateString('en-GB') : 
                           report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                            <User size={16} />
                          </div>
                          <div className="font-black text-slate-800 uppercase text-sm leading-tight">
                            {patientNames[report.patientId] || report.patientName || "Processing..."}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building2 size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-tight">
                            {report.branch || report.branchName || "Main Branch"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-blue-700 font-black text-sm">
                            <DollarSign size={14} />
                            {(report.finalPaidAmount || report.totalAmount || report.grandTotal || 0).toFixed(2)}
                          </div>
                          {report.discount > 0 && (
                            <span className="text-[9px] font-bold text-red-400">
                              Discount: -${Number(report.discount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl border border-slate-200 text-slate-600 font-black uppercase text-[10px] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                          onClick={() => handlePrintMedical({ ...report, patientName: patientNames[report.patientId] || report.patientName })}
                        >
                          <Printer size={14} className="mr-2" /> PDF Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold italic uppercase text-[10px] tracking-widest">
                      No matching records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" size="sm" disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 bg-white hover:bg-blue-50 text-slate-600 transition-colors"
              >
                <ChevronLeft size={18}/>
              </Button>
              <Button 
                variant="outline" size="sm" disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="rounded-xl h-10 w-10 p-0 border-slate-200 bg-white hover:bg-blue-50 text-slate-600 transition-colors"
              >
                <ChevronRight size={18}/>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}