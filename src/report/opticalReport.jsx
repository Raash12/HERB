import React, { useEffect, useState } from "react";
import { db } from "../firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";

// ✅ 1. IMPORT-KA CUSUB
import { handlePrintPrescription } from "../utils/printPrescription";

export default function OpticalReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter
  const filteredData = reports.filter(item => 
    (item.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.phone || "").includes(searchTerm)
  );

  // Pagination logic
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-[1.5rem] border shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Users size={20} /></div>
          OPTICAL REPORTS
        </h1>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
        <CardContent className="p-6">
          <Input 
            placeholder="Search..." 
            className="mb-6 h-12 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-xs font-bold text-slate-400">
                      {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-black text-slate-800 uppercase">{report.fullName}</TableCell>
                    <TableCell>{report.phone}</TableCell>
                    <TableCell className="text-right">
                      {/* ✅ 2. ISTICMAALKA BADHANKA PRINT-KA */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-blue-100 text-blue-600 font-bold hover:bg-blue-600 hover:text-white"
                        onClick={() => handlePrintPrescription(report)}
                      >
                        <Printer size={14} className="mr-2" /> Print PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination halkan ayaa geli lahaa... */}
      </Card>
    </div>
  );
}