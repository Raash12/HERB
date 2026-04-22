import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, onSnapshot, query, where, orderBy, doc, getDoc 
} from "firebase/firestore";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Search, CheckCircle2, Clock, Calendar, User, Loader2, 
  ChevronLeft, ChevronRight, LayoutDashboard 
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DoctorRevenueDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({ 
    dailyPaid: { count: 0, total: 0 },
    weeklyPaid: { count: 0, total: 0 },
    monthlyPaid: { count: 0, total: 0 },
    pending: { count: 0, total: 0 }
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ✅ Waxaan u xiriirineynaa doctorId, si uu dhakhtarku u arko lacagta u soo gashay kaliya
    const q = query(
      collection(db, "medical_prescriptions"),
      where("doctorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      
      const dataPromises = snapshot.docs.map(async (prescriptionDoc) => {
        const pData = prescriptionDoc.data();
        
        // ✅ LOGIC CUSUB: Grand Total-ka rasmiga ah ka soo aqri field-ka "totalPaid" ama "finalPaidAmount"
        // Midkaas ayaa ah kan Reception-ka uu xaqiijiyay (Confirm & Pay)
        const officialGrandTotal = Number(pData.finalPaidAmount || pData.totalPaid || pData.totalAmount || 0);

        const enrichedItems = (pData.items || []).map((item) => {
          // Qiimaha halkan ka muuqda waa kaliya bandhig (Display)
          return { 
            ...item, 
            displayPrice: item.price || 0 
          };
        });

        // Hubi haddii status-ku yahay Paid ama Completed
        const statusLower = (pData.status || "").toLowerCase();
        const isPaid = statusLower === "paid" || statusLower === "completed" || pData.paid === true;

        return {
          id: prescriptionDoc.id,
          ...pData,
          calculatedTotal: officialGrandTotal, // Lacagta rasmiga ah
          items: enrichedItems,
          isPaid: isPaid
        };
      });

      const resolvedData = await Promise.all(dataPromises);

      // Manual sorting maadaama laga yaabo in index-ka uu maqan yahay
      const sortedData = resolvedData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setPrescriptions(sortedData);
      
      // --- REVENUE STATS ---
      const now = new Date();
      const startOfDay = new Date(now.setHours(0,0,0,0)).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      
      const daily = sortedData.filter(p => p.isPaid && (p.createdAt?.seconds * 1000) >= startOfDay);
      const monthly = sortedData.filter(p => p.isPaid && (p.createdAt?.seconds * 1000) >= startOfMonth);
      const pending = sortedData.filter(p => !p.isPaid);

      setStats({
        dailyPaid: { count: daily.length, total: daily.reduce((s, p) => s + p.calculatedTotal, 0) },
        weeklyPaid: { count: 0, total: 0 },
        monthlyPaid: { count: monthly.length, total: monthly.reduce((s, p) => s + p.calculatedTotal, 0) },
        pending: { count: pending.length, total: pending.reduce((s, p) => s + p.calculatedTotal, 0) }
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = prescriptions.filter(p => 
    (p.patientName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-[#020817] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-800 dark:text-white leading-none">
            Revenue <span className="text-blue-600">Analytics</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">HORSEED BAKAARO • LIVE TRACKING</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search Patient..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-lg font-bold uppercase"
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Daily Paid" count={stats.dailyPaid.count} value={stats.dailyPaid.total} icon={<CheckCircle2 size={20} />} color="emerald" loading={loading} />
        <StatsCard title="Monthly Paid" count={stats.monthlyPaid.count} value={stats.monthlyPaid.total} icon={<LayoutDashboard size={20} />} color="purple" loading={loading} />
        <StatsCard title="Pending" count={stats.pending.count} value={stats.pending.total} icon={<Clock size={20} />} color="amber" loading={loading} />
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none text-slate-400">
              <TableHead className="py-6 pl-8 text-[11px] font-black uppercase tracking-widest">Patient Details</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest">Items</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-widest text-right pr-8">Grand Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
            ) : currentData.map((presc) => (
              <TableRow key={presc.id} className="border-slate-100 hover:bg-blue-50/10 transition-all">
                <TableCell className="pl-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-600"><User size={20} /></div>
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-tight">{presc.patientName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{presc.createdAt?.seconds ? new Date(presc.createdAt.seconds * 1000).toLocaleDateString() : 'Today'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {presc.isPaid ? (
                    <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 py-1 font-black text-[10px] uppercase tracking-tighter italic">Paid</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-600 border-none px-3 py-1 font-black text-[10px] uppercase tracking-tighter italic">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {presc.items.map((med, idx) => (
                      <div key={idx} className="flex flex-col px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase">{med.medicineName}</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-tighter">Qty: {med.quantity}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <span className="text-2xl font-black text-blue-600 tracking-tighter italic">
                    ${Number(presc.calculatedTotal).toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages || 1}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" size="sm" className="rounded-xl font-bold"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" size="sm" className="rounded-xl font-bold"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatsCard({ title, count, value, icon, color, loading }) {
  const colorStyles = {
    emerald: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50"
  };

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white group overflow-hidden">
      <CardContent className="p-6 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
           <div className={`p-3 rounded-2xl ${colorStyles[color]}`}>{icon}</div>
           <Badge className={`${colorStyles[color]} border-none font-black text-[9px] uppercase`}>{count} Patients</Badge>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <h2 className={`text-3xl font-black tracking-tighter mt-1 ${colorStyles[color].split(' ')[0]}`}>
            ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
      </CardContent>
    </Card>
  );
}