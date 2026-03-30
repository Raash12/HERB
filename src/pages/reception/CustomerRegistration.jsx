import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, getDocs, query, where, addDoc, doc, getDoc, onSnapshot, orderBy } from "firebase/firestore";

// UI Components (Shadcn)
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, UserPlus, MapPin, Stethoscope, 
  Activity, Phone, ChevronLeft, ChevronRight, Search, Users 
} from "lucide-react";

const BANAADIR_DISTRICTS = [
  "Cabdiasiis", "Boondheere", "Dayniile", "Dharkeenley", "Hamar Jajab", 
  "Hamar Weyne", "Hodan", "Howlwadaag", "Huriwaa", "Kaaraan", "Kaxda", 
  "Shangaani", "Shibis", "Waaberi", "Wadajir", "Wardhiigley", "Warta Nabada", 
  "Yaaqshiid", "Garasbaaley", "Gubadley"
];

export default function CustomerRegistration() {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [myBranch, setMyBranch] = useState(""); 
  const [open, setOpen] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [formData, setFormData] = useState({
    fullName: "", phone: "", address: "", age: "", gender: "", 
    department: "", doctorId: "", doctorName: "",
  });

  // Fetch Branch & Doctors
  useEffect(() => {
    const fetchContext = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        const branchName = userSnap.data().branch;
        setMyBranch(branchName);
        const qDoc = query(collection(db, "users"), where("role", "==", "doctor"), where("branch", "==", branchName));
        const docSnap = await getDocs(qDoc);
        setDoctors(docSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetchContext();
  }, []);

  // Real-time Patient List
  useEffect(() => {
    if (!myBranch) return;
    const q = query(collection(db, "patients"), where("branch", "==", myBranch), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [myBranch]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "patients"), {
        ...formData,
        branch: myBranch, 
        status: "pending", 
        createdAt: new Date(),
      });
      setOpen(false);
      setFormData({ fullName: "", phone: "", address: "", age: "", gender: "", department: "", doctorId: "", doctorName: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Pagination Logic (Exactly like Doctor's)
  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPatients.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> Patient Registry
          </h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Branch: {myBranch || "..."}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search patients..." 
              className="pl-10 h-11 border-blue-100 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-black rounded-lg shadow-lg">
                <UserPlus size={18} className="mr-2" /> REGISTER NEW
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-slate-950 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-blue-600 uppercase tracking-tighter">New Patient Registration</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1">Patient Full Name</label>
                  <Input placeholder="Enter name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1">Age</label>
                  <Input type="number" placeholder="Years" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1">Gender</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1">Phone</label>
                  <Input placeholder="61XXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1">District (Banaadir)</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required>
                    <option value="">Select District</option>
                    {BANAADIR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1 text-blue-600">Department</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                    <option value="">Select</option>
                    <option value="Eye">Eye (Indhaha)</option>
                    <option value="Ear">Ear (Dhagaha)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase ml-1 text-blue-600">Assign Doctor</label>
                  <select className="w-full p-2.5 rounded-md border text-sm dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.doctorId} onChange={e => {
                    const docObj = doctors.find(d => d.id === e.target.value);
                    setFormData({...formData, doctorId: e.target.value, doctorName: docObj ? docObj.fullName : ""});
                  }} required>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}
                  </select>
                </div>
                <Button type="submit" className="col-span-2 bg-blue-600 hover:bg-blue-700 h-12 font-black uppercase mt-2 shadow-lg shadow-blue-600/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "COMPLETE REGISTRATION"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABLE SECTION */}
      <Card className="shadow-xl border-none overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-blue-600 dark:bg-blue-700">
              <TableRow className="hover:bg-transparent border-none">
                <TableCell className="text-white font-bold py-5 pl-6 uppercase text-[10px] tracking-widest">Patient Name</TableCell>
                <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Age</TableCell>
                <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Gender</TableCell>
                <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">District</TableCell>
                <TableCell className="text-white font-bold uppercase text-[10px] tracking-widest text-center">Assigned Doctor</TableCell>
                <TableCell className="text-white font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((p) => (
                <TableRow key={p.id} className="hover:bg-accent/50 transition-colors border-b dark:border-slate-800">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">{p.fullName?.charAt(0).toUpperCase()}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">{p.fullName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-sm">{p.age}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] font-black uppercase border-blue-200 text-blue-600">{p.gender}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                      <MapPin size={12} className="text-red-500" /> {p.address}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold">Dr. {p.doctorName}</span>
                        <span className="text-[9px] uppercase font-black text-indigo-500">{p.department}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge className={p.status === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                      {p.status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION (Exactly like Doctor's) */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/20 gap-4 border-t">
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