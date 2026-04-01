import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, FileText, ChevronLeft, ChevronRight, Loader2, User } from "lucide-react";
import { handlePrintMedical } from "../utils/printMedical";

export default function MedicalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientNames, setPatientNames] = useState({}); // Halkan waxaa lagu kaydinayaa magacyada la soo helay
  const itemsPerPage = 10;

  useEffect(() => {
    // 1. Soo aqri dhamaan warbixinada completed-ka ah
    const q = query(
      collection(db, "medical_prescriptions"), 
      where("status", "==", "completed"),
      orderBy("dispensedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const reportsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 2. Soo aqri magacyada bukaanka ee ka maqan 'patientNames' state
      const namesMap = { ...patientNames };
      
      for (const report of reportsData) {
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
            console.error("Error fetching patient name:", err);
            namesMap[pId] = "Error Loading";
          }
        }
      }

      setPatientNames(namesMap);
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic: Hadda wuxuu baarayaa magaca rasmiga ah ee laga soo saaray collection-ka Patients
  const filteredData = reports.filter(item => {
    const pName = patientNames[item.patientId] || "";
    const dName = item.doctorName || "";
    return pName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           dName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> MEDICAL REPORTS
          </h1>
          <p className="text-sm text-slate-500 font-medium">Xogta bukaannada laga soo qaatay collection-ka Patients.</p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <Input 
              placeholder="Search by patient or doctor name..." 
              className="pl-10 h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold py-4">Date</TableHead>
                  <TableHead className="font-bold">Patient Name</TableHead>
                  <TableHead className="font-bold">Doctor</TableHead>
                  <TableHead className="text-right font-bold pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((report) => (
                    <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-xs font-bold text-slate-500">
                        {report.dispensedAt?.toDate ? report.dispensedAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            <User size={14} />
                          </div>
                          <span className="font-black text-slate-800 uppercase text-sm">
                            {patientNames[report.patientId] || "Loading..."}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 italic">Dr. {report.doctorName}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl border-blue-100 text-blue-600 font-bold hover:bg-blue-600 hover:text-white"
                          onClick={() => handlePrintMedical({ ...report, patientName: patientNames[report.patientId] })}
                        >
                          <Printer size={14} className="mr-1" /> Print Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-bold italic">No medical reports found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg"><ChevronLeft size={18}/></Button>
              <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg"><ChevronRight size={18}/></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}