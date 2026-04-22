import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, FileText, ChevronLeft, ChevronRight, Loader2, User, Building2, DollarSign } from "lucide-react";
import { handlePrintMedical } from "../utils/printMedical";

export default function MedicalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientNames, setPatientNames] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    // 1. Soo aqri xogta. Waxaan ka saarnay orderBy si looga ixtiraamo index-la'aanta Firebase-ka
    // Waxaan dhexda kaga shaandhayn doonaa status-ka "paid" iyo "completed"
    const q = query(collection(db, "medical_prescriptions"));

    const unsubscribe = onSnapshot(q, async (snap) => {
      const reportsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 2. Filter-garee kaliya kuwa lacagta laga bixiyay
      const paidReports = reportsData.filter(item => {
        const s = (item.status || "").toLowerCase();
        return s === "paid" || s === "completed" || item.paid === true;
      });

      // 3. Soo aqri magacyada bukaanka (Optimization)
      const namesMap = { ...patientNames };
      for (const report of paidReports) {
        const pId = report.patientId;
        if (pId && !namesMap[pId]) {
          try {
            const pDoc = await getDoc(doc(db, "patients", pId));
            if (pDoc.exists()) {
              namesMap[pId] = pDoc.data().fullName;
            } else {
              namesMap[pId] = report.patientName || report.patientInfo?.name || "Unknown Patient";
            }
          } catch (err) {
            namesMap[pId] = "Error Loading";
          }
        }
      }

      // 4. Manual Sort (Maadaama aan Firestore OrderBy ka saarnay si xogtu u soo dhakhsato)
      const sortedReports = paidReports.sort((a, b) => {
        const timeA = a.dispensedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.dispensedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setPatientNames(namesMap);
      setReports(sortedReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic: Search-ka
  const filteredData = reports.filter(item => {
    const pName = (patientNames[item.patientId] || item.patientName || "").toLowerCase();
    const dName = (item.doctorName || "").toLowerCase();
    const bName = (item.branch || item.branchName || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return pName.includes(search) || dName.includes(search) || bName.includes(search);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
              <FileText size={24} />
            </div>
            MEDICAL SALES REPORT
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-12">
            History of completed sales and patient records
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-4 py-1 font-black text-emerald-600 bg-emerald-50 border-emerald-100">
          Total Records: {filteredData.length}
        </Badge>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
        <CardContent className="p-8">
          {/* Search Box */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search patient, doctor or branch..." 
              className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 font-medium focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">Date</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Patient Name</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Branch</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-emerald-600">Paid Amount</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((report) => (
                    <TableRow key={report.id} className="hover:bg-emerald-50/30 transition-all border-b border-slate-50">
                      <TableCell className="py-5 pl-8">
                        <div className="text-[11px] font-bold text-slate-400 font-mono">
                          {report.dispensedAt?.toDate ? report.dispensedAt.toDate().toLocaleDateString('en-GB') : 
                           report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString('en-GB') : 'Today'}
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
                          <div className="flex items-center gap-1 text-emerald-700 font-black text-sm">
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
                          className="rounded-xl border border-slate-200 text-slate-600 font-black uppercase text-[10px] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
                          onClick={() => handlePrintMedical({ ...report, patientName: patientNames[report.patientId] || report.patientName })}
                        >
                          <Printer size={14} className="mr-2" /> PDF Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold italic">
                      No matching paid reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-8 bg-slate-50/50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="rounded-xl h-9 w-9 p-0 border-slate-200"
              >
                <ChevronLeft size={18}/>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="rounded-xl h-9 w-9 p-0 border-slate-200"
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