import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { 
  doc, writeBatch, increment, deleteDoc, getDoc, 
  serverTimestamp, collection, query, where, getDocs 
} from "firebase/firestore";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icons & Utils
import { Printer, PackageCheck, Trash2, User, ReceiptText } from "lucide-react";
import { handlePrintPrescription } from "@/utils/printPrescription";
import { handlePrintMedical } from "@/utils/printMedical";
import { handlePrintMedicalInvoice } from "@/utils/printMedicalInvoice";

export default function ReceptionPrescriptions({ data }) {
  const [patientNames, setPatientNames] = useState({});

  // 1. Fetch patient names for display
  useEffect(() => {
    const fetchPatientNames = async () => {
      const namesMap = {};
      try {
        for (const order of data) {
          if (order.patientId && !patientNames[order.patientId]) {
            const pDoc = await getDoc(doc(db, "patients", order.patientId));
            if (pDoc.exists()) {
              namesMap[order.patientId] = pDoc.data().fullName;
            }
          }
        }
        setPatientNames(prev => ({ ...prev, ...namesMap }));
      } catch (err) {
        console.error("Error fetching names:", err);
      }
    };
    if (data.length > 0) fetchPatientNames();
  }, [data]);

  // 2. Confirm Logic with stock adjustment and Status "paid" fix
  const handleConfirmDispense = async (order) => {
    const isMedical = order.category === 'medical';
    const msg = isMedical 
      ? "Ma hubtaa inaad bixisay? Stock-ga iyo Qiimaha ayaa laga jaranayaa."
      : "Ma hubtaa inaad bixisay?";

    if (!window.confirm(msg)) return;
    
    const batch = writeBatch(db);
    
    try {
      const pName = patientNames[order.patientId] || order.displayName || order.patientName || "Unnamed Patient";

      if (isMedical && order.items) {
        for (const item of order.items) {
          if (item.medicineId) {
            const medRef = doc(db, "branch_medicines", item.medicineId);
            const medSnap = await getDoc(medRef);

            if (medSnap.exists()) {
              const currentMed = medSnap.data();
              const qtyToSubtract = Number(item.quantity || 0);
              const currentQty = Number(currentMed.quantity || 0);
              const currentTotalValue = Number(currentMed.price || 0);

              if (qtyToSubtract > currentQty) {
                alert(`Stock-ga kuma filna: ${item.medicineName}\nStock-gaaga: ${currentQty}`);
                return;
              }
              
              const unitPrice = currentTotalValue / (currentQty || 1);
              const totalValueToSubtract = unitPrice * qtyToSubtract;

              batch.update(medRef, { 
                quantity: increment(-qtyToSubtract),
                price: increment(-totalValueToSubtract) 
              });
            }
          }
        }
      }

      const collectionName = isMedical ? "medical_prescriptions" : "prescriptions";
      const presRef = doc(db, collectionName, order.id);
      
      // ✅ UPDATED: If medical, status becomes "paid". Otherwise "completed".
      batch.update(presRef, { 
        status: isMedical ? "paid" : "completed", 
        paid: true, 
        dispensedAt: serverTimestamp(),
        patientNameReport: pName 
      });

      await batch.commit();
      alert("Si guul leh ayaa loo diwaangeliyey! ✅");
    } catch (e) { 
      alert("Cillad: " + e.message); 
    }
  };

  const handlePrintPOS = (order) => {
    const pName = patientNames[order.patientId] || order.displayName || order.patientName || "Unnamed Patient";
    handlePrintMedicalInvoice({
      ...order,
      patientNameReport: pName,
      items: order.items || [] 
    });
  };

  const handleEnhancedPrint = async (order) => {
    try {
      let patientData = {};
      if (order.patientId) {
        const patientDoc = await getDoc(doc(db, "patients", order.patientId));
        if (patientDoc.exists()) patientData = patientDoc.data();
      }
      const completeOrder = {
        ...order,
        patientInfo: {
          fullName: patientData.fullName || order.displayName || order.patientName || "N/A",
          age: patientData.age || "N/A",
          gender: patientData.gender || "N/A"
        }
      };
      order.category === 'medical' ? handlePrintMedical(completeOrder) : handlePrintPrescription(completeOrder);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Ma hubtaa inaad tirtirto?`)) return;
    try {
      const coll = order.category === 'medical' ? "medical_prescriptions" : "prescriptions";
      await deleteDoc(doc(db, coll, order.id));
      alert("Deleted! 🗑️");
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-white font-black py-5 pl-8 uppercase text-[10px] tracking-widest">Patient Identification</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center">Category</TableHead>
              <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              <TableHead className="text-white text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((order) => (
                <TableRow key={order.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-50">
                  <TableCell className="py-4 pl-8">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><User size={14} /></div>
                      <div>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">
                          {patientNames[order.patientId] || order.displayName || order.patientName || "Loading..."}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold font-mono uppercase">
                          ID: {order.patientId?.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="uppercase text-[9px] font-black border-blue-200 text-blue-600">
                      {order.category || 'Optical'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      className={`rounded-lg uppercase text-[9px] font-black px-3 py-1 ${
                        (order.status === 'paid' || order.status === 'completed') ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                      }`}
                    >
                      {/* UI Logic: If status is 'paid', or if it's medical and 'completed', show PAID */}
                      {order.status === 'paid' || (order.category === 'medical' && order.status === 'completed')
                        ? 'PAID' 
                        : (order.status || 'Pending')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                      {order.category === 'medical' && (
                        <Button 
                          onClick={() => handlePrintPOS(order)}
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 rounded-lg font-black uppercase text-[9px] flex items-center gap-1"
                        >
                          <ReceiptText size={14} /> Print POS
                        </Button>
                      )}
                      {(order.status !== 'completed' && order.status !== 'paid') && (
                        <button 
                          onClick={() => handleConfirmDispense(order)} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-8 rounded-lg font-black uppercase text-[9px] flex items-center gap-1 shadow-sm"
                        >
                          <PackageCheck size={14} /> Confirm
                        </button>
                      )}
                      <Button 
                        onClick={() => handleEnhancedPrint(order)}
                        size="sm" variant="outline" className="h-8 border-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg font-black uppercase text-[9px]"
                      >
                        <Printer size={14} /> Print
                      </Button>
                      <Button onClick={() => handleDelete(order)} size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-700 hover:bg-red-50 px-2 rounded-lg">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-bold italic">
                  Ma jiraan wax xog ah oo la soo bandhigo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}