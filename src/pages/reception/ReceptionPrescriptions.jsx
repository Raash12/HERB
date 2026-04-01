import React from "react";
import { db } from "../../firebase"; 
import { doc, writeBatch, increment, deleteDoc, getDoc } from "firebase/firestore"; // ✅ lagu daray getDoc

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icons & Utils
import { Printer, PackageCheck, Trash2 } from "lucide-react";
import { handlePrintPrescription } from "@/utils/printPrescription";
import { handlePrintMedical } from "@/utils/printMedical";

export default function ReceptionPrescriptions({ data }) {

  // ✅ FUNCTION-KA CUSUB EE PRINT-KA DHAMAYSTIRAN
  const handleEnhancedPrint = async (order) => {
    try {
      let patientData = {};
      
      // 1. Haddii uu leeyahay patientId, kasoo aqri xogta collection-ka Patients
      if (order.patientId) {
        const patientDoc = await getDoc(doc(db, "patients", order.patientId));
        if (patientDoc.exists()) {
          patientData = patientDoc.data();
        }
      }

      // 2. Isku dar xogta order-ka iyo xogta rasmiga ah ee bukaanka
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

      // 3. U dir function-ka print-ka ee ku habboon
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
  
  const handleConfirmDispense = async (order) => {
    if (!window.confirm("Ma hubtaa inaad bixisay daawadan? Stock-ga ayaa laga jaranayaa.")) return;
    const batch = writeBatch(db);
    try {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.medicineId) {
            const medRef = doc(db, "branch_medicines", item.medicineId);
            batch.update(medRef, { stockQuantity: increment(-Number(item.quantity)) });
          }
        });
      }
      const presRef = doc(db, "medical_prescriptions", order.id);
      batch.update(presRef, { status: "completed", dispensedAt: new Date() });
      await batch.commit();
      alert("Inventory updated! ✅");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Ma hubtaa inaad tirtirto?`)) return;
    try {
      const coll = order.category === 'medical' ? "medical_prescriptions" : "prescriptions";
      await deleteDoc(doc(db, coll, order.id));
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader className="bg-blue-600 dark:bg-blue-700">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-white font-black py-5 pl-8 uppercase text-[10px] tracking-widest">Patient Name</TableHead>
            <TableHead className="text-white font-black uppercase text-[10px] tracking-widest">Category</TableHead>
            <TableHead className="text-white font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
            <TableHead className="text-white text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((order) => (
              <TableRow key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                <TableCell className="py-4 pl-8 text-sm font-black text-slate-700 dark:text-slate-300 uppercase">
                  {order.displayName || order.patientName || "No Name"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase text-[9px] font-black border-blue-200 text-blue-600 dark:text-blue-400">
                    {order.category || 'Optical'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`rounded-lg uppercase text-[9px] font-black px-3 py-1 ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {order.status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-2">
                    {order.category === 'medical' && order.status !== 'completed' && (
                      <Button onClick={() => handleConfirmDispense(order)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg font-black uppercase text-[9px]">
                        <PackageCheck size={14} className="mr-1" /> Confirm
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleEnhancedPrint(order)} // ✅ Isticmaal function-ka cusub
                      size="sm" variant="outline" className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-black uppercase text-[9px]"
                    >
                      <Printer size={14} className="mr-1" /> Print
                    </Button>
                    <Button onClick={() => handleDelete(order)} size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-700 px-2">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-bold">No prescriptions found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}