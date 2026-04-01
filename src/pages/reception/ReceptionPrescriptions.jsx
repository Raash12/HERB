// src/components/dashboard/reception/ReceptionPrescriptions.jsx
import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { doc, writeBatch, increment, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icons & Utils
import { Printer, PackageCheck, Trash2, User } from "lucide-react";
import { handlePrintPrescription } from "@/utils/printPrescription";
import { handlePrintMedical } from "@/utils/printMedical";

export default function ReceptionPrescriptions({ data }) {
  const [patientNames, setPatientNames] = useState({});

  // ✅ SOO AQRI MAGACYADA BUKAANNADA (PATIENTS COLLECTION)
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
        console.error("Error fetching patient names:", err);
      }
    };

    if (data.length > 0) fetchPatientNames();
  }, [data]);

  const handleEnhancedPrint = async (order) => {
    try {
      let patientData = {};
      if (order.patientId) {
        const patientDoc = await getDoc(doc(db, "patients", order.patientId));
        if (patientDoc.exists()) {
          patientData = patientDoc.data();
        }
      }

      const completeOrder = {
        ...order,
        patientInfo: {
          fullName: patientData.fullName || order.displayName || order.patientName || "N/A",
          age: patientData.age || order.patientInfo?.age || "N/A",
          phone: patientData.phone || order.patientInfo?.phone || "N/A",
          address: patientData.address || "N/A",
          gender: patientData.gender || "N/A"
        }
      };

      if (order.category === 'medical') {
        handlePrintMedical(completeOrder);
      } else {
        handlePrintPrescription(completeOrder);
      }
    } catch (e) {
      console.error("Print error:", e);
      alert("Error loading patient data for print.");
    }
  };
  
  // ✅ LOGIC-GA CONFIRM: Hadda wuxuu u gudbinayaa Magaca saxda ah MedicalReport
  const handleConfirmDispense = async (order) => {
    const msg = order.category === 'medical' 
      ? "Ma hubtaa inaad bixisay? Stock-ga iyo Qiimaha ayaa laga jaranayaa."
      : "Ma hubtaa inaad ibisay okiyal?";

    if (!window.confirm(msg)) return;
    
    const batch = writeBatch(db);
    
    try {
      // 1. HEL MAGACA SAXDA AH SI REPORT-KU U HELO
      const pName = patientNames[order.patientId] || order.displayName || order.patientName || "Unnamed Patient";

      // 2. Kaliya jar Stock haddii ay tahay Medical oo ay items jiraan
      if (order.category === 'medical' && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.medicineId) {
            const medRef = doc(db, "branch_medicines", item.medicineId);
            const medSnap = await getDoc(medRef);

            if (medSnap.exists()) {
              const currentMed = medSnap.data();
              const qtyToReduce = Number(item.quantity || 0);
              
              const unitPrice = Number(currentMed.price || 0) / Number(currentMed.quantity || 1);
              const totalToReduce = unitPrice * qtyToReduce;

              batch.update(medRef, { 
                quantity: increment(-qtyToReduce),
                price: increment(-totalToReduce)
              });
            }
          }
        }
      }

      // 3. Dooro collection-ka saxda ah si loo bedelo Status-ka
      const collectionName = order.category === 'medical' ? "medical_prescriptions" : "prescriptions";
      const presRef = doc(db, collectionName, order.id);
      
      batch.update(presRef, { 
        status: "completed", 
        dispensedAt: serverTimestamp(),
        // ✅ KEYDKA MAGACA: Halkan ayaa Report-ku ka akhrisanayaa magaca rasmiga ah
        patientNameReport: pName 
      });

      await batch.commit();
      alert("Success! Status updated to Completed. ✅");
    } catch (e) { 
      console.error("Confirm error:", e);
      alert("Error: " + e.message); 
    }
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
    <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
      <Table>
        <TableHeader className="bg-blue-600">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-white font-black py-5 pl-8 uppercase text-[10px] tracking-widest">Patient Identification</TableHead>
            <TableHead className="text-white font-black uppercase text-[10px] tracking-widest">Category</TableHead>
            <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
            <TableHead className="text-white text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((order) => (
              <TableRow key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">
                        {patientNames[order.patientId] || order.displayName || order.patientName || "Loading..."}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-tighter">
                        ID: {order.patientId?.slice(-6)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase text-[9px] font-black border-blue-200 text-blue-600 dark:text-blue-400">
                    {order.category || 'Optical'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`rounded-lg uppercase text-[9px] font-black px-3 py-1 ${order.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {order.status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-2">
                    {order.status !== 'completed' && (
                      <button 
                        onClick={() => handleConfirmDispense(order)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 h-8 rounded-lg font-black uppercase text-[9px] flex items-center gap-1 transition-all shadow-sm shadow-emerald-100"
                      >
                        <PackageCheck size={14} /> Confirm
                      </button>
                    )}
                    <Button 
                      onClick={() => handleEnhancedPrint(order)}
                      size="sm" variant="outline" className="h-8 border-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg font-black uppercase text-[9px]"
                    >
                      <Printer size={14} className="mr-1" /> Print
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
              <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-bold italic">No prescriptions found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}