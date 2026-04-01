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
import { Loader2, Activity, Search, DollarSign, Trash2, Edit3 } from "lucide-react";

export default function Medical() {
  const [userData, setUserData] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit State
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({ 
    medicineName: "", 
    quantity: "", 
    branchId: "", 
    price: "" 
  });

  // 1. Load User Profile & Branches
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

  // 2. Fetch Inventory
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

  // 3. Add or Update Stock Logic
  const handleSubmit = async () => {
    if (!form.medicineName || !form.branchId || !form.price) 
      return alert("Fadlan buuxi dhammaan xogta!");

    try {
      const name = form.medicineName.toLowerCase().trim();

      if (editId) {
        // UPDATE EXISTING RECORD
        const docRef = doc(db, "branch_medicines", editId);
        await updateDoc(docRef, {
          medicineName: name,
          quantity: Number(form.quantity),
          price: Number(form.price),
          branchId: form.branchId,
          updatedAt: new Date()
        });
        alert("Waa la beddelay! ✅");
      } else {
        // ADD NEW OR INCREMENT
        const q = query(collection(db, "branch_medicines"), 
                  where("medicineName", "==", name), 
                  where("branchId", "==", form.branchId));
        const existSnap = await getDocs(q);

        if (!existSnap.empty) {
          const docRef = doc(db, "branch_medicines", existSnap.docs[0].id);
          await updateDoc(docRef, {
            quantity: increment(Number(form.quantity)),
            price: Number(form.price),
            updatedAt: new Date()
          });
        } else {
          await addDoc(collection(db, "branch_medicines"), {
            medicineName: name,
            quantity: Number(form.quantity),
            price: Number(form.price),
            branchId: form.branchId,
            updatedAt: new Date(),
          });
        }
        alert("Stock Updated ✅");
      }
      
      setForm({ ...form, medicineName: "", quantity: "", price: "" });
      setEditId(null);
      fetchStock();
    } catch (err) { alert("Error saving data"); }
  };

  // 4. Delete Logic
  const handleDelete = async (id) => {
    if (window.confirm("Ma hubtaa inaad tirtirto daawadan?")) {
      try {
        await deleteDoc(doc(db, "branch_medicines", id));
        alert("Waa la tirtiray! 🗑️");
        fetchStock();
      } catch (err) { alert("Error deleting item"); }
    }
  };

  // 5. Edit Preparation
  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      medicineName: item.medicineName,
      quantity: item.quantity,
      branchId: item.branchId,
      price: item.price
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
          <Activity size={28}/> Pharmacy Stock
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="Search items..." className="pl-10 rounded-xl" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* FORM CARD */}
      <Card className="rounded-[2rem] shadow-xl border-none overflow-hidden ring-1 ring-slate-100">
        <div className={`${editId ? 'bg-amber-500' : 'bg-blue-600'} px-8 py-3 flex justify-between items-center`}>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">
              {editId ? 'Editing Medicine' : 'Update Inventory'}
            </span>
            {editId && (
              <button onClick={() => {setEditId(null); setForm({...form, medicineName: "", quantity: ""});}} className="text-white text-[10px] font-bold underline">Cancel Edit</button>
            )}
        </div>
        <CardContent className="p-8 grid md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Medicine Name</span>
            <Input value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Quantity</span>
            <Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Price</span>
            <Input type="number" value={form.price} placeholder="$ 0.00" onChange={e => setForm({...form, price: e.target.value})} className="rounded-xl bg-slate-50 border-none h-11" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Branch</span>
            <select 
              disabled={userData?.role !== "admin"} 
              value={form.branchId} 
              onChange={e => setForm({...form, branchId: e.target.value})}
              className="w-full h-11 rounded-xl bg-slate-50 border-none px-3 text-sm font-bold"
            >
              <option value="">Select Branch</option>
              {allBranches.map(b => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
            </select>
          </div>
          <Button onClick={handleSubmit} className={`h-11 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {editId ? 'Save Changes' : 'Update Stock'}
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-none">
              <TableCell className="font-bold py-4 pl-8 uppercase text-[11px] text-slate-400">Medicine</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400">Branch</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400">Price</TableCell>
              <TableCell className="font-bold uppercase text-[11px] text-slate-400">Stock</TableCell>
              <TableCell className="font-bold text-right pr-8 uppercase text-[11px] text-slate-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="py-4 pl-8 font-black uppercase text-slate-700">{item.medicineName}</TableCell>
                <TableCell className="text-xs font-bold text-blue-500 uppercase">{item.branchId}</TableCell>
                <TableCell className="font-bold text-slate-600 tracking-tight">
                   <div className="flex items-center gap-1"><DollarSign size={14} className="text-emerald-500" />{item.price || "0.00"}</div>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-xl px-4 py-1 font-black ${item.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {item.quantity} UNITS
                  </Badge>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}