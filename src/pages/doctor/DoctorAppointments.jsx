import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useIsMobile } from "@/hooks/use-mobile";

// Shadcn UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Search, Phone, MapPin, Users, 
  ChevronLeft, ChevronRight, Activity 
} from "lucide-react";

export default function DoctorAppointments() {
  const isMobile = useIsMobile();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

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

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="pl-10 h-11 border-blue-100 dark:border-slate-800 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Badge className="bg-blue-600 text-white px-4 py-2 rounded-full shrink-0 shadow-md text-xs font-bold">
             {filteredPatients.length} Total
          </Badge>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden bg-card">
        {!isMobile ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-600 dark:bg-blue-700">
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Patient Name</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Age</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Gender</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Contact</TableCell>
                  <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Department</TableCell>
                  <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((p) => (
                  <TableRow key={p.id} className="hover:bg-accent/50 transition-colors border-b dark:border-slate-800">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-black text-sm">
                          {p.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-tight">{p.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">#{p.id.substring(0, 6)}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* AGE COLUMN */}
                    <TableCell className="text-center font-bold text-sm text-gray-700 dark:text-gray-300">
                      {p.age} <span className="text-[10px] font-medium text-muted-foreground">yrs</span>
                    </TableCell>

                    {/* GENDER COLUMN */}
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-black uppercase border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400">
                        {p.gender}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Phone size={13} className="text-blue-500" /> {p.phone}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-bold text-[10px]">
                         {p.department || "General"}
                       </Badge>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Badge className={p.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 border-none text-[10px]" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 border-none text-[10px]"}>
                        {p.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* MOBILE VIEW */
          <div className="grid grid-cols-1 divide-y divide-border">
            {currentRecords.map((p) => (
              <div key={p.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">{p.fullName?.charAt(0).toUpperCase()}</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{p.fullName}</span>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{p.age} Yrs</span>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.gender}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={p.status === "completed" ? "bg-green-500 text-white text-[9px]" : "bg-orange-500 text-white text-[9px]"}>{p.status?.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 font-medium"><Phone size={12} className="text-blue-500" /> {p.phone}</div>
                  <div className="flex items-center gap-2 font-bold uppercase"><Activity size={12} className="text-indigo-500" /> {p.department}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/20 gap-4 border-t border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Showing {indexOfFirstRecord + 1} - {Math.min(indexOfLastRecord, filteredPatients.length)} of {filteredPatients.length}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft size={14} className="mr-1" /> PREV
            </Button>
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-black text-xs">
              {currentPage} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
              NEXT <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}