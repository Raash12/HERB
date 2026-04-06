import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection, addDoc, getDocs, doc, getDoc, query, where, 
  updateDoc, increment, deleteDoc
} from "firebase/firestore";

// UI Components
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Search, DollarSign, Trash2, Edit3, AlertTriangle, Tag } from "lucide-react";

export default function Medical() {
  const [userData, setUserData] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    medicineName: "", 
    quantity: "", 
    branchId: "", 
    price: "" // This is the Single Unit Price ($)
  });

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const uSnap = await getDoc(doc(db, "users", user.uid));
      if (uSnap.exists()) {
        const data = uSnap.data();
        setUserData(data);
        if (data.branch) setForm(f => ({ ...f, branchId: data.branch }));
        
        const bSnap = await getDocs(collection(db, "branches"));
        setAllBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetchData();
  }, []);

  // 2. Fetch Stock Logic
  const fetchStock = async () => {
    if (!userData) return;
    setLoading(true);
    const q = userData.role === "admin" 
      ? query(collection(db, "branch_medicines")) 
      : query(collection(db, "branch_medicines"), where("branchId", "==", userData.branch));
    
    const snap = await getDocs(q);
    setStock(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { if (userData) fetchStock(); }, [userData]);

  // 3. Handle Add/Update Stock
  const handleSubmit = async () => {
    if (!form.medicineName || !form.branchId || !form.price || !form.quantity) 
      return alert("Fadlan buuxi dhammaan xogta!");

    try {
      const name = form.medicineName.toLowerCase().trim();
      const qty = Number(form.quantity);
      const unitPriceInput = Number(form.price); 
      const totalValue = unitPriceInput * qty; // Total calculated for storage

      if (editId) {
        const docRef = doc(db, "branch_medicines", editId);
        await updateDoc(docRef, {
          medicineName: name,
          quantity: qty,
          price: totalValue, 
          branchId: form.branchId,
          updatedAt: new Date()
        });
        alert("Waa la cusboonaysiiyay! ✅");
      } else {
        const q = query(collection(db, "branch_medicines"), 
                  where("medicineName", "==", name), 
                  where("branchId", "==", form.branchId));
        const existSnap = await getDocs(q);

        if (!existSnap.empty) {
          const docRef = doc(db, "branch_medicines", existSnap.docs[0].id);
          await updateDoc(docRef, {
            quantity: increment(qty),
            price: increment(totalValue), 
            updatedAt: new Date()
          });
        } else {
          await addDoc(collection(db, "branch_medicines"), {
            medicineName: name,
            quantity: qty,
            price: totalValue,
            branchId: form.branchId,
            updatedAt: new Date(),
          });
        }
        alert("Stock cusub ayaa lagu daray! ✅");
      }
      
      setForm({ ...form, medicineName: "", quantity: "", price: "" });
      setEditId(null);
      fetchStock();
    } catch (err) { alert("Error saving data"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Ma hubtaa inaad tirtirto?")) {
      try {
        await deleteDoc(doc(db, "branch_medicines", id));
        fetchStock();
      } catch (err) { alert("Error deleting"); }
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    const unitPrice = item.quantity > 0 ? (item.price / item.quantity).toFixed(2) : 0;
    setForm({
      medicineName: item.medicineName,
      quantity: item.quantity,
      branchId: item.branchId,
      price: unitPrice
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredStock = stock.filter(i => i.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentItems = filteredStock.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && !userData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter flex items-center gap-2">
          <Activity size={28}/> Pharmacy Inventory
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="Search medicines..." className="pl-10 rounded-xl" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* FORM SECTION */}
      <Card className="rounded-[2rem] shadow-xl border-none overflow-hidden ring-1 ring-slate-100">
        <div className={`${editId ? 'bg-amber-500' : 'bg-blue-600'} px-8 py-3 text-white text-[10px] font-black uppercase tracking-widest`}>
            {editId ? 'Modify Medicine Info' : 'Inventory Entry'}
        </div>
        <CardContent className="p-8 grid md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Medicine Name</span>
            <Input value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11 uppercase font-bold" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Quantity (Units)</span>
            <Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Unit Price ($ for 1)</span>
            <Input type="number" value={form.price} placeholder="Price for 1" onChange={e => setForm({...form, price: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Branch</span>
            <select disabled={userData?.role !== "admin"} value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} className="w-full h-11 rounded-xl bg-slate-50 border-none px-3 text-sm font-bold uppercase">
              {allBranches.map(b => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
            </select>
          </div>
          <Button onClick={handleSubmit} className={`h-11 rounded-xl font-bold uppercase transition-all ${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {editId ? 'Save Edit' : 'Add to Stock'}
          </Button>
        </CardContent>
      </Card>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-none">
              <TableCell className="font-bold py-4 pl-8 uppercase text-[11px] text-slate-400">Medicine</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400">Unit Price</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400 text-center">Stock Level</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400 text-right pr-8">Total Inventory Value</TableCell>
              <TableCell className="font-bold text-right pr-8 uppercase text-[11px] text-slate-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              // MATH: Calculate price for 1 item based on total and quantity
              const unitPrice = item.quantity > 0 ? (item.price / item.quantity).toFixed(2) : "0.00";

              return (
                <TableRow key={item.id} className={`hover:bg-slate-50/50 border-slate-50 ${item.quantity <= 0 ? 'bg-red-50/30' : ''}`}>
                  <TableCell className="py-4 pl-8 font-black uppercase text-slate-700">
                    <div className="flex flex-col">
                      {item.medicineName}
                      <span className="text-[10px] text-blue-500 font-bold">{item.branchId}</span>
                    </div>
                  </TableCell>
                  
                  {/* NEW COLUMN: Unit Price */}
                  <TableCell>
                    <div className="flex items-center gap-1 font-bold text-slate-500">
                      <Tag size={12} className="text-blue-500" />
                      ${unitPrice}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge className={`rounded-lg px-3 py-1 font-black border-none ${
                      item.quantity <= 0 ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {item.quantity} UNITS
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-8 font-black text-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign size={14} className="text-emerald-500" />
                        {item.price.toFixed(2)}
                      </div>
                  </TableCell>

                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}