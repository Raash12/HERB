import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useIsMobile } from "@/hooks/use-mobile"; // Kan waan isticmaalnay sxb

// Shadcn UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Search, Calendar, Phone, 
  MapPin, Users, ChevronLeft, ChevronRight 
} from "lucide-react";

export default function DoctorAppointments() {
  const isMobile = useIsMobile(); // Hook-gaagii responsive-ka
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // --- FIREBASE LOGIC (Directly here to avoid import errors) ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const patientList = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setPatients(patientList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPatients.slice(indexOfFirstRecord, indexOfLastRecord);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> My Patients
          </h2>
          <p className="text-sm text-muted-foreground font-medium">History of assigned records.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search by name..." 
              className="pl-10 h-11 border-blue-100 dark:border-slate-800 rounded-lg"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Badge className="bg-blue-600 text-white px-4 py-2 rounded-full shrink-0 shadow-md">
             {filteredPatients.length} Total
          </Badge>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden bg-card">
        {/* IsMobile logic to switch between Table and Cards */}
        {!isMobile ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-600 dark:bg-blue-700">
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[11px] tracking-widest">Patient</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[11px] tracking-widest text-center">Contact</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[11px] tracking-widest text-center">Address</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[11px] tracking-widest text-center">Visit Date</TableCell>
                  <TableCell className="text-white font-bold text-right pr-6 uppercase text-[11px] tracking-widest">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((p) => (
                  <TableRow key={p.id} className="hover:bg-accent/50 transition-colors border-b dark:border-slate-800">
                    <TableCell className="font-semibold py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-black">
                          {p.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{p.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {p.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <div className="flex items-center justify-center gap-2"><Phone size={14} className="text-blue-500" /> {p.phone}</div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <MapPin size={14} className="text-red-400" /> 
                        <span className="max-w-[150px] truncate">{p.address || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <div className="font-bold">{p.createdAt?.toDate().toLocaleDateString('en-GB')}</div>
                      <div className="text-[10px] text-muted-foreground">{p.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={p.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-border">
            {currentRecords.map((p) => (
              <div key={p.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">{p.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="flex flex-col">
                      <span className="font-bold">{p.fullName}</span>
                      <span className="text-xs text-muted-foreground">{p.createdAt?.toDate().toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                  <Badge className={p.status === "completed" ? "bg-green-500 text-white" : "bg-orange-500 text-white"}>{p.status}</Badge>
                </div>
                <div className="text-xs space-y-2 bg-muted/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500" /> {p.phone}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400" /> {p.address}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/20 gap-4 border-t border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase">
            Showing {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, filteredPatients.length)} of {filteredPatients.length}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft size={18} /> Prev
            </Button>
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold text-sm">
              {currentPage} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
              Next <ChevronRight size={18} />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}