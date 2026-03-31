import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { 
  collection, query, where, onSnapshot, 
  doc, writeBatch, increment, deleteDoc, getDoc 
} from "firebase/firestore";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Icons & Utils
import { Loader2, Printer, Search, Pill, Eye, PackageCheck, Trash2 } from "lucide-react";
import { handlePrintPrescription } from "@/utils/printPrescription";
import { handlePrintMedical } from "@/utils/printMedical";

export default function ReceptionPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  // --- 1. DATA FETCHING WITH NAME JOIN ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const qMed = query(collection(db, "medical_prescriptions"), where("sendTo", "==", currentUser.uid));
    const unsubMed = onSnapshot(qMed, (snap) => {
      const medData = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        category: 'medical',
        displayName: d.data().patientInfo?.name || d.data().patientInfo?.fullName || "Unnamed Medical"
      }));
      updateCombinedData(medData, 'medical');
    });

    const qOpt = query(collection(db, "prescriptions"), where("sendTo", "==", currentUser.uid));
    const unsubOpt = onSnapshot(qOpt, async (snap) => {
      const optData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        let name = "Unnamed Optical";

        if (data.patientId) {
          try {
            const patientDoc = await getDoc(doc(db, "patients", data.patientId));
            if (patientDoc.exists()) {
              name = patientDoc.data().fullName || patientDoc.data().name;
              data.patientInfo = patientDoc.data();
            }
          } catch (err) { console.error("Error fetching patient:", err); }
        }

        return { id: d.id, ...data, category: 'optical', displayName: name };
      }));
      updateCombinedData(optData, 'optical');
      setLoading(false);
    });

    const updateCombinedData = (newData, cat) => {
      setPrescriptions(prev => {
        const otherCatData = prev.filter(p => p.category !== cat);
        const combined = [...otherCatData, ...newData].sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        return combined;
      });
    };

    return () => { unsubMed(); unsubOpt(); };
  }, []);

  // --- 2. STOCK DECREASE LOGIC (RESTORING THIS) ---
  const handleConfirmDispense = async (order) => {
    if (!window.confirm("Ma hubtaa inaad bixisay daawadan? Stock-ga ayaa laga jaranayaa.")) return;
    
    const batch = writeBatch(db);
    try {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.medicineId) {
            const medRef = doc(db, "branch_medicines", item.medicineId);
            // Decrease stock by the prescribed quantity
            batch.update(medRef, { 
                stockQuantity: increment(-Number(item.quantity)) 
            });
          }
        });
      }

      // Update prescription status
      const presRef = doc(db, "medical_prescriptions", order.id);
      batch.update(presRef, { 
        status: "completed", 
        dispensedAt: new Date() 
      });

      await batch.commit();
      alert("Inventory updated and marked as Completed! ✅");
    } catch (e) {
      console.error("Dispense Error:", e);
      alert("Error: " + e.message);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Ma hubtaa inaad tirtirto: ${order.displayName}?`)) return;
    try {
      const coll = order.category === 'medical' ? "medical_prescriptions" : "prescriptions";
      await deleteDoc(doc(db, coll, order.id));
      alert("Waa la tirtiray!");
    } catch (e) { alert(e.message); }
  };

  const filteredData = prescriptions.filter((p) => 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Records...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border shadow-xl shadow-blue-100/20">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            placeholder="Search patient..." 
            className="w-full pl-12 h-12 border-none bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 ring-blue-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge className="px-6 py-2 bg-blue-50 text-blue-600 font-black rounded-xl border-blue-100">
          {filteredData.length} TOTAL RECORDS
        </Badge>
      </div>

      <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-white font-black py-6 pl-8 uppercase text-[10px] tracking-widest">Patient Info</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest">Category</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              <TableHead className="text-white text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((order) => (
              <TableRow key={order.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-50">
                <TableCell className="py-5 pl-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${order.category === 'medical' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {order.category === 'medical' ? <Pill size={20}/> : <Eye size={20}/>}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700 uppercase">{order.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">ID: {order.id.slice(-6)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase text-[9px] font-black">{order.category}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {/* Status only for Medical */}
                  {order.category === 'medical' ? (
                    <Badge className={`rounded-xl uppercase text-[9px] font-black px-4 py-1.5 ${order.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {order.status || 'Pending'}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase italic">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right pr-8 flex items-center justify-end gap-2 h-20">
                  {/* Action buttons */}
                  {order.category === 'medical' && order.status !== 'completed' && (
                    <Button 
                        onClick={() => handleConfirmDispense(order)}
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl font-black uppercase text-[9px]"
                    >
                      <PackageCheck size={14} className="mr-2" /> Confirm
                    </Button>
                  )}

                  <Button 
                    onClick={() => order.category === 'medical' ? handlePrintMedical(order) : handlePrintPrescription(order)}
                    size="sm" variant="outline" className="h-10 border-blue-200 text-blue-600 rounded-xl font-black uppercase text-[9px]"
                  >
                    <Printer size={14} className="mr-2" /> Print
                  </Button>
                  <Button onClick={() => handleDelete(order)} size="sm" variant="ghost" className="h-10 text-red-500 hover:bg-red-50 rounded-xl px-3">
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}