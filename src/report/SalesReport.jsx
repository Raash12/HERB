import React, { useState, useEffect } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Search, Download, TrendingUp, Wallet, ShoppingCart, 
  Loader2, ChevronLeft, ChevronRight, Stethoscope, MapPin, Clock, Pill
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function SalesReport() {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchSalesReport();
  }, [startDate, endDate]);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const salesRef = collection(db, "sales");
      const q = query(salesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const allSales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateFormatted: doc.data().createdAt?.toDate() 
      })).filter(sale => {
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59);
        return sale.dateFormatted >= sDate && sale.dateFormatted <= eDate;
      });

      setSales(allSales);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
    setLoading(false);
  };

  const filteredSales = sales.filter(sale => 
    (sale.branchId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDoctorSales = filteredSales.filter(s => s.type === "doctor").reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
  const totalWalkInSales = filteredSales.filter(s => s.type !== "doctor").reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
  const grandTotal = totalDoctorSales + totalWalkInSales;

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const currentItems = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToPDF = () => {
    try {
        const doc = new jsPDF();
        doc.setFillColor(37, 99, 235); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("HORSEED MEDICAL ERP", 14, 20);
        doc.setFontSize(10);
        doc.text("OFFICIAL SALES PERFORMANCE REPORT", 14, 30);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Report Period: ${format(new Date(startDate), "PPP")} - ${format(new Date(endDate), "PPP")}`, 14, 50);
        doc.text(`Total Revenue: $${grandTotal.toFixed(2)}`, 14, 58);

        // Khaanadda PDF-ka oo lagu daray "Medicines"
        const tableColumn = ["Date", "Branch", "Customer", "Medicines Sold", "Category", "Amount"];
        const tableRows = filteredSales.map(sale => [
            format(sale.dateFormatted || new Date(), "dd/MM/yyyy"),
            sale.branchId || "Main",
            sale.patientName || "Cash Customer",
            sale.items ? sale.items.map(i => i.medicineName).join(", ") : "N/A",
            sale.type || "Direct",
            `$${(sale.finalTotal || 0).toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
            styles: { fontSize: 8 },
            columnStyles: { 3: { cellWidth: 50 }, 5: { halign: 'right' } }
        });

        doc.save(`Sales_Report_${startDate}.pdf`);
    } catch (err) {
        console.error(err);
        alert("PDF Generation Failed: " + err.message);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 pb-12">
      
      {/* 🚀 Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp size={28} />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">FINANCIAL <span className="text-blue-600">REPORTS</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analytics & Revenue Tracking</p>
           </div>
        </div>
        <Button onClick={exportToPDF} className="w-full lg:w-auto h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-100">
          <Download size={18} className="mr-2" /> Generate PDF Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Direct Sales" value={totalWalkInSales} icon={<ShoppingCart size={20}/>} />
        <StatCard label="Doctor Prescriptions" value={totalDoctorSales} icon={<Stethoscope size={20}/>} />
        <StatCard label="Total Net Revenue" value={grandTotal} icon={<Wallet size={20}/>} isDark />
      </div>

      <Card className="p-2 rounded-[2.5rem] bg-white dark:bg-slate-900 border-none shadow-xl border border-blue-50">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-[1.8rem] px-4 border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                <Calendar size={18} className="text-blue-600" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Timeline</span>
             </div>
             <div className="flex items-center gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none shadow-none font-bold text-xs w-36 focus-visible:ring-0" />
                <span className="text-slate-300 font-bold">TO</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none shadow-none font-bold text-xs w-36 focus-visible:ring-0" />
             </div>
          </div>

          <div className="relative flex-1">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <Input 
                placeholder="Search by Branch, Patient, or ID..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="w-full h-16 pl-14 pr-8 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-sm transition-all" 
             />
          </div>
        </div>
      </Card>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <TableRow className="border-none">
              <TableHead className="font-black text-[10px] uppercase p-8 text-slate-400 tracking-widest">Branch</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Customer</TableHead>
              {/* ✅ KHAANADDA CUSUB EE DAWOOYINKA */}
              <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Medicines Sold</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center text-slate-400 tracking-widest">Category</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-right pr-12 text-slate-400 tracking-widest">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-60 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></TableCell></TableRow>
            ) : currentItems.map((sale) => (
              <TableRow key={sale.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-blue-50/20 transition-all">
                <TableCell className="p-8">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={14}/></div>
                     <span className="font-black text-xs uppercase text-slate-700 dark:text-slate-300">{sale.branchId || "Main"}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{sale.patientName || "Walk-in"}</div>
                   <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{format(sale.dateFormatted || new Date(), "dd MMM, hh:mm a")}</span>
                   </div>
                </TableCell>
                
                {/* ✅ HALKAN AYAY MAGACYADA DAWOOYINKA KA SOO MUUQANAYAAN */}
                <TableCell className="max-w-[250px]">
                  <div className="flex flex-wrap gap-1">
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item, idx) => (
                        <span key={idx} className="flex items-center gap-1 bg-blue-50 dark:bg-slate-800 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-bold border border-blue-100">
                          <Pill size={8} /> {item.medicineName}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No items</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Badge className={`rounded-xl font-black text-[9px] uppercase px-4 py-1.5 border-none shadow-sm ${sale.type === 'doctor' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {sale.type || 'direct'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-12">
                   <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">${(sale.finalTotal || 0).toFixed(2)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between border-t dark:border-slate-800">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
           <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl h-12 w-12 border-none shadow-md bg-white dark:bg-slate-800"><ChevronLeft size={20}/></Button>
              <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl h-12 w-12 border-none shadow-md bg-white dark:bg-slate-800"><ChevronRight size={20}/></Button>
           </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, isDark = false }) {
  return (
    <Card className={`p-8 rounded-[2.5rem] border-none shadow-sm flex justify-between items-center transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      <div>
        <p className="text-[10px] font-black uppercase text-blue-400 mb-1">{label}</p>
        <h2 className="text-4xl font-black tracking-tighter">${value.toFixed(2)}</h2>
      </div>
      <div className={`p-5 rounded-[1.5rem] ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>{icon}</div>
    </Card>
  );
}