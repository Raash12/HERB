import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { 
  doc, writeBatch, increment, deleteDoc, getDoc, 
  serverTimestamp 
} from "firebase/firestore";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Icons
import { Printer, PackageCheck, Trash2, User, ReceiptText, Eye, X, ShoppingBag, Pill, AlertTriangle, CheckCircle2 } from "lucide-react";

// Utils
import { handlePrintPrescription } from "@/utils/printPrescription";
import { handlePrintMedical } from "@/utils/printMedical";
import { handlePrintMedicalInvoice } from "@/utils/printMedicalInvoice";

export default function ReceptionPrescriptions({ data }) {
  const [patientNames, setPatientNames] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [discounts, setDiscounts] = useState({}); 
  const [liveStock, setLiveStock] = useState({});

  // 1. Fetch Patient Names
  useEffect(() => {
    const fetchPatientNames = async () => {
      const namesMap = {};
      for (const order of data) {
        if (order.patientId && !patientNames[order.patientId]) {
          const pDoc = await getDoc(doc(db, "patients", order.patientId));
          if (pDoc.exists()) namesMap[order.patientId] = pDoc.data().fullName;
        }
      }
      setPatientNames(prev => ({ ...prev, ...namesMap }));
    };
    if (data?.length > 0) fetchPatientNames();
  }, [data]);

  // 2. Fetch Live Prices & Stock
  const fetchLiveInfo = async (items) => {
    const infoMap = {};
    for (const item of items) {
      if (item.medicineId) {
        const medDoc = await getDoc(doc(db, "branch_medicines", item.medicineId));
        if (medDoc.exists()) {
          const medData = medDoc.data();
          infoMap[item.medicineId] = {
            unitPrice: medData.quantity > 0 ? (medData.unitPrice || (medData.price / medData.quantity)) : 0,
            currentQty: Number(medData.quantity || 0)
          };
        }
      }
    }
    setLiveStock(prev => ({ ...prev, ...infoMap }));
  };

  const toggleView = (order) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(null);
    } else {
      setSelectedOrderId(order.id);
      if (order.category === 'medical' && order.items) {
        fetchLiveInfo(order.items);
      }
    }
  };

  // Logic-ga lagu xaqiijinayo dalabka Optical-ka
  const handleConfirmOptical = async (order) => {
    if (!window.confirm("Ma hubtaa inaad xaqiijiso dalabkan Optical-ka ah?")) return;
    
    try {
      const batch = writeBatch(db);
      const docRef = doc(db, "prescriptions", order.id);
      
      batch.update(docRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        paid: true // Waad ku dari kartaa haddii lacagta la rabo in la xaqiijiyo
      });

      await batch.commit();
      alert("Dalabka Optical-ka waa la xaqiijiyey! ✅");
    } catch (e) {
      alert("Cillad: " + e.message);
    }
  };

  const handlePrintPOS = (order, customDiscount = null) => {
    const discountAmount = customDiscount !== null 
      ? Number(customDiscount) 
      : Number(discounts[order.id] || order.discount || 0);

    let calculatedOriginalTotal = 0;

    const itemsWithPrices = (order.items || []).map(item => {
      const info = liveStock[item.medicineId] || {};
      const currentUnitPrice = info.unitPrice || item.price || item.unitPrice || 0;
      const qty = Number(item.quantity || 0);
      const itemTotal = currentUnitPrice * qty;
      calculatedOriginalTotal += itemTotal;

      return { 
        ...item, 
        unitPrice: Number(currentUnitPrice),
        quantity: Number(qty),
        subtotal: itemTotal
      };
    });

    handlePrintMedicalInvoice({ 
      ...order, 
      patientNameReport: patientNames[order.patientId] || order.patientName || "Unknown Patient", 
      items: itemsWithPrices,
      discount: discountAmount,
      totalAmount: calculatedOriginalTotal - discountAmount,
      originalTotal: calculatedOriginalTotal
    });
  };

  const handleConfirmDispense = async (order) => {
    const isMedical = order.category === 'medical';
    
    if (isMedical) {
      for (const item of order.items) {
        const stockInfo = liveStock[item.medicineId];
        if (!stockInfo || stockInfo.currentQty < item.quantity) {
          return alert(`MA DHACAYSO: Dawada "${item.medicineName}" stock-geedu waa ${stockInfo?.currentQty || 0}. Ma bixin kartid!`);
        }
      }
    }

    if (!window.confirm("Ma hubtaa inaad xaqiijiso bixinta dalabkan?")) return;
    
    const batch = writeBatch(db);
    const coll = isMedical ? "medical_prescriptions" : "prescriptions";
    const totalDiscountAmount = Number(discounts[order.id] || 0);
    
    let totalOriginalPrice = 0; 
    let mappedItems = [];

    try {
      if (isMedical && order.items) {
        for (const item of order.items) {
          const info = liveStock[item.medicineId] || {};
          const unitPrice = info.unitPrice || item.price || item.unitPrice || 0;
          const qty = Number(item.quantity || 0);
          const itemOriginalTotal = unitPrice * qty;
          totalOriginalPrice += itemOriginalTotal;

          if (item.medicineId) {
            const medRef = doc(db, "branch_medicines", item.medicineId);
            batch.update(medRef, { 
              quantity: increment(-qty)
            });
          }

          mappedItems.push({
            ...item,
            price: unitPrice,
            unitPrice: unitPrice,
            quantity: qty,
            subtotal: itemOriginalTotal
          });
        }
      }

      const finalPaid = totalOriginalPrice - totalDiscountAmount;

      batch.update(doc(db, coll, order.id), { 
        status: isMedical ? "paid" : "completed", 
        paid: true, 
        discount: totalDiscountAmount,
        finalPaidAmount: finalPaid, 
        dispensedAt: serverTimestamp(),
        items: mappedItems 
      });

      await batch.commit();
      handlePrintPOS({...order, items: mappedItems}, totalDiscountAmount);
      alert(`Si guul leh ayaa loo xaqiijiyey! ✅`);
      setSelectedOrderId(null);
    } catch (e) { alert("Cillad: " + e.message); }
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
          fullName: patientData.fullName || order.patientName || "N/A",
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
    <div className="space-y-4 font-['Segoe_UI']">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-blue-600">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white font-black py-5 pl-8 uppercase text-[10px] tracking-widest">Patient / Info</TableHead>
              <TableHead className="text-white font-black text-center uppercase text-[10px] tracking-widest">Category</TableHead>
              <TableHead className="text-white font-black text-center uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-white text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => {
              const isMedical = order.category === 'medical';
              const isPaid = order.status === 'paid' || order.status === 'completed';
              const isExpanded = selectedOrderId === order.id;

              return (
                <React.Fragment key={order.id}>
                  <TableRow className={`transition-colors border-b border-slate-50 ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-blue-50/50'}`}>
                    <TableCell className="py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-2xl text-blue-600"><User size={18} /></div>
                        <div>
                          <div className="text-sm font-black text-slate-700 uppercase">
                            {patientNames[order.patientId] || order.patientName || "Loading..."}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400">ID: {order.id.slice(-8).toUpperCase()}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="uppercase text-[9px] font-black border-blue-200 text-blue-600 rounded-lg">
                        {order.category || 'Optical'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`rounded-xl uppercase text-[9px] font-black px-3 py-1 ${isPaid ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                        {isPaid ? 'COMPLETED' : (order.status || 'PENDING')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        {/* Shuruudda cusub ee Optical-ka */}
                        {!isMedical && !isPaid && (
                          <Button 
                            onClick={() => handleConfirmOptical(order)} 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 font-black text-[9px] uppercase shadow-sm"
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Confirm
                          </Button>
                        )}

                        {isMedical && (
                          <>
                            <Button 
                              onClick={() => toggleView(order)} 
                              size="sm" 
                              className={`h-8 font-black text-[9px] uppercase ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'border-indigo-100 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                              {isExpanded ? <X size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                              View
                            </Button>
                            <Button onClick={() => handlePrintPOS(order)} size="sm" className="bg-blue-500 text-white h-8 font-black text-[9px] uppercase hover:bg-blue-600">
                              <ReceiptText size={14} className="mr-1" /> POS
                            </Button>
                          </>
                        )}
                        
                        <Button onClick={() => handleEnhancedPrint(order)} size="sm" variant="outline" className="h-8 border-slate-200 text-slate-600 font-black text-[9px] uppercase">
                          <Printer size={14} className="mr-1" /> Print
                        </Button>
                        <Button onClick={() => handleDelete(order)} size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-600 px-2 rounded-lg">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && isMedical && (
                    <TableRow className="bg-blue-50/20">
                      <TableCell colSpan={4} className="p-8 border-none animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50 overflow-hidden">
                          <div className="p-8">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                              <h4 className="text-[11px] font-black text-indigo-600 uppercase flex items-center gap-2 tracking-widest">
                                <ShoppingBag size={16}/> Invoice Details & Items
                              </h4>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(null)} className="text-red-500 hover:bg-red-50 h-8 w-8 rounded-full p-0"><X size={18}/></Button>
                            </div>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                              {(order.items || []).map((item, idx) => {
                                const info = liveStock[item.medicineId] || {};
                                const price = info.unitPrice || item.price || item.unitPrice || 0;
                                const stockAvailable = info.currentQty || 0;
                                const isOutOfStock = stockAvailable < item.quantity;

                                return (
                                  <div key={idx} className={`flex justify-between items-center p-4 rounded-3xl border transition-all ${isOutOfStock ? 'bg-red-50 border-red-200' : 'bg-slate-50/50 border-slate-100'}`}>
                                    <div className="flex items-center gap-4">
                                      <div className={`p-2.5 rounded-2xl shadow-sm border ${isOutOfStock ? 'bg-white text-red-500' : 'bg-white text-indigo-500'}`}>
                                        <Pill size={16}/>
                                      </div>
                                      <div>
                                        <span className={`text-[11px] font-black uppercase leading-tight ${isOutOfStock ? 'text-red-700' : 'text-slate-700'}`}>{item.medicineName}</span>
                                        <div className={`text-[9px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                                          Stock: {stockAvailable} PCS
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[9px] font-bold text-slate-400 uppercase">{item.quantity} x ${price.toFixed(2)}</div>
                                      <div className="text-sm font-black text-indigo-600">${(item.quantity * price).toFixed(2)}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {(() => {
                              let subtotal = 0;
                              let hasStockError = false;
                              (order.items || []).forEach(it => {
                                const info = liveStock[it.medicineId] || {};
                                subtotal += (info.unitPrice || it.price || it.unitPrice || 0) * (it.quantity || 0);
                                if ((info.currentQty || 0) < (it.quantity || 0)) hasStockError = true;
                              });
                              
                              const discountValue = Number(discounts[order.id] || order.discount || 0);
                              const netTotal = subtotal - discountValue;

                              return (
                                <div className={`p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 text-white shadow-xl transition-colors ${hasStockError ? 'bg-red-500' : 'bg-indigo-600'}`}>
                                  <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                                    <div className="text-center lg:text-left">
                                      <p className="text-[10px] font-black uppercase opacity-60 tracking-wider mb-1">Subtotal</p>
                                      <p className="text-xl font-black opacity-90">${subtotal.toFixed(2)}</p>
                                    </div>
                                    <div className="border-l border-white/20 pl-8 text-center lg:text-left">
                                      <p className="text-[10px] font-black uppercase text-red-100 tracking-wider mb-1">Discount</p>
                                      <p className="text-xl font-black">-${discountValue.toFixed(2)}</p>
                                    </div>
                                    <div className="border-l border-white/20 pl-8 text-center lg:text-left">
                                      <p className="text-[10px] font-black uppercase text-yellow-300 tracking-wider mb-1">Net Total</p>
                                      <p className="text-4xl font-black tracking-tighter">${netTotal.toFixed(2)}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 w-full lg:w-auto pt-6 lg:pt-0">
                                    <div className="flex-1 lg:w-32 text-center lg:text-left">
                                      <p className="text-[10px] font-black uppercase mb-1.5 opacity-60 tracking-wider">Discount ($)</p>
                                      <Input 
                                        type="number" 
                                        className="h-12 bg-white/10 border-none text-white font-black rounded-2xl text-center placeholder:text-white/30"
                                        placeholder="0.00"
                                        value={discounts[order.id] || ""}
                                        onChange={(e) => setDiscounts({...discounts, [order.id]: e.target.value})}
                                      />
                                    </div>
                                    {!isPaid && (
                                      <Button 
                                        disabled={hasStockError}
                                        onClick={() => handleConfirmDispense(order)} 
                                        className={`${hasStockError ? 'bg-red-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'} text-white h-14 px-10 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all shadow-lg`}
                                      >
                                        {hasStockError ? (
                                          <><AlertTriangle size={20} className="mr-2" /> Stock is 0</>
                                        ) : (
                                          <><PackageCheck size={20} className="mr-2" /> Confirm & Pay</>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}