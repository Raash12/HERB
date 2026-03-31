import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, getDocs, doc, getDoc, query, where, updateDoc, increment } from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackagePlus, Store, Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Medical() {
  const [userData, setUserData] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({ medicineName: "", quantity: "", branchId: "" });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const uSnap = await getDoc(doc(db, "users", user.uid));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        setUserData(uData);
        const bSnap = await getDocs(collection(db, "branches"));
        setAllBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetchData();
  }, []);

  const fetchStock = async () => {
    if (!userData) return;
    setLoading(true);
    const q = userData.role === "admin" ? query(collection(db, "branch_medicines")) : query(collection(db, "branch_medicines"), where("branchId", "==", userData.branch));
    const snap = await getDocs(q);
    setStock(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { if (userData) fetchStock(); }, [userData]);

  const handleAdd = async () => {
    if (!form.medicineName || !form.quantity || !form.branchId) return alert("Buuxi meelaha banaan");
    try {
      // Look for existing item to update instead of duplicate
      const q = query(collection(db, "branch_medicines"), where("medicineName", "==", form.medicineName.toLowerCase().trim()), where("branchId", "==", form.branchId));
      const existSnap = await getDocs(q);

      if (!existSnap.empty) {
        const docRef = doc(db, "branch_medicines", existSnap.docs[0].id);
        await updateDoc(docRef, { quantity: increment(Number(form.quantity)), updatedAt: new Date() });
      } else {
        await addDoc(collection(db, "branch_medicines"), {
          medicineName: form.medicineName.toLowerCase().trim(),
          quantity: Number(form.quantity),
          branchId: form.branchId,
          updatedAt: new Date(),
        });
      }
      alert("Inventory Updated ✅");
      setForm({ ...form, medicineName: "", quantity: "" });
      fetchStock();
    } catch (err) { alert("Error"); }
  };

  const filteredStock = stock.filter(i => i.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentStock = filteredStock.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600 flex items-center gap-2">
            <Activity /> Medical Inventory
          </h2>
          <Input placeholder="Search..." className="w-72 h-11 rounded-2xl" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* INPUT FORM */}
        <Card className="rounded-[2.5rem] border-blue-100 shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-4 text-white text-[10px] font-black uppercase tracking-widest flex gap-2"><PackagePlus size={16}/> Add Stock</div>
          <CardContent className="p-8 grid md:grid-cols-4 gap-6 items-end">
             <Input placeholder="Name" value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} className="h-12 rounded-2xl bg-blue-50/30" />
             <Input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="h-12 rounded-2xl bg-blue-50/30" />
             <select className="h-12 rounded-2xl border px-4 bg-blue-50/30 font-bold text-sm" value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})}>
                <option value="">Select Branch</option>
                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
             </select>
             <Button onClick={handleAdd} className="h-12 bg-blue-600 rounded-2xl font-black uppercase text-xs">Update Stock</Button>
          </CardContent>
        </Card>

        {/* DATA TABLE */}
        <div className="bg-card rounded-[2.5rem] shadow-2xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableCell className="font-black py-6 pl-8 uppercase text-[11px] text-blue-600">Medicine Item</TableCell>
                <TableCell className="font-black uppercase text-[11px] text-blue-600 text-right pr-8">Current Stock</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentStock.map((item) => (
                <TableRow key={item.id} className="hover:bg-blue-50/50">
                  <TableCell className="py-5 pl-8 font-black uppercase text-sm text-slate-700">{item.medicineName}</TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge variant="outline" className="px-4 py-1 rounded-xl text-xs font-black border-2 bg-emerald-50 text-emerald-600 border-emerald-100">
                      {/* THIS IS THE FIX: (Total Added + Dispensed Difference) */}
                      {Number(item.quantity) + (item.stockQuantity || 0)} QTY
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}