import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Calendar, User, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { handlePrintMedical } from "../utils/printMedical";

export default function MedicalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "medical_prescriptions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredData = reports.filter(item => 
    item.patientInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> MEDICAL PRESCRIPTION REPORTS
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage and track all medical prescriptions sent to pharmacy.</p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                placeholder="Search by patient or doctor name..." 
                className="pl-10 h-12 rounded-xl border-slate-100 bg-slate-50 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Date</TableHead>
                  <TableHead className="font-bold text-slate-700">Patient Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Doctor</TableHead>
                  <TableHead className="font-bold text-slate-700">Medicines</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-600 text-xs">
                      {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                          {report.patientInfo?.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{report.patientInfo?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-600">Dr. {report.doctorName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {report.items?.slice(0, 2).map((item, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500 italic">
                            {item.medicineName}
                          </span>
                        ))}
                        {report.items?.length > 2 && <span className="text-[10px] font-bold text-blue-500">+{report.items.length - 2} more</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white font-bold"
                        onClick={() => handlePrintMedical(report)}
                      >
                        <Printer size={14} className="mr-1" /> Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="rounded-xl hover:bg-slate-100"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button 
                variant="ghost" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="rounded-xl hover:bg-slate-100"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}