import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, doc, getDoc, query, where, 
  addDoc, updateDoc, deleteDoc, serverTimestamp, 
  onSnapshot, getDocs 
} from "firebase/firestore";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Search, Trash2, Edit3, Plus, Package, 
  ChevronLeft, ChevronRight, Loader2, Building2 
} from "lucide-react";

export default function Medical() {
  const [userData, setUserData] = useState(null);
  const [stock, setStock] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 8;

  const [form, setForm] = useState({ 
    medicineName: "", 
    quantity: "", 
    unitPrice: "", 
    branchId: "" 
  });

  // 1. INITIAL LOAD: User and Branches
  useEffect(() => {
    const fetchInitialData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const uSnap = await getDoc(doc(db, "users", user.uid));
      if (uSnap.exists()) {
        const data = uSnap.data();
        setUserData(data);
        setForm(prev => ({ ...prev, branchId: data.branch || "" }));
      }

      const bSnap = await getDocs(collection(db, "branches"));
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchInitialData();
  }, []);

  // 2. REAL-TIME DATA LISTENER (onSnapshot)
  // Habkan ayaa ah kan xogta keenaya isla marka bogga la furo (No more manual fetch)
  useEffect(() => {
    if (!userData) return;

    let q = collection(db, "branch_medicines");
    if (userData.role !== "admin") {
      q = query(q, where("branchId", "==", userData.branch));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = allData.sort((a, b) => 
        (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
      );
      setStock(sorted);
    });

    return () => unsubscribe(); 
  }, [userData]);

  // 3. STATS CALCULATION
  const branchStats = useMemo(() => {
    return stock.reduce((acc, curr) => {
      const bName = curr.branchId || "Unknown";
      acc[bName] = (acc[bName] || 0) + 1;
      return acc;
    }, {});
  }, [stock]);

  // 4. FILTER & PAGINATION
  const filteredStock = stock.filter(item => 
    item.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.branchId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage) || 1;
  const currentItems = filteredStock.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 5. SUBMIT HANDLER
  const handleSubmit = async () => {
    if (!form.medicineName || !form.quantity || !form.unitPrice || !form.branchId) {
      return alert("Fadlan buuxi meelaha banaan!");
    }

    const selectedBranch = branches.find(b => b.id === form.branchId);
    const branchToSave = selectedBranch ? (selectedBranch.branchName || selectedBranch.name) : form.branchId;

    setIsSubmitting(true);
    try {
      const payload = {
        medicineName: form.medicineName.toUpperCase(),
        quantity: parseFloat(form.quantity),
        unitPrice: parseFloat(form.unitPrice),
        branchId: branchToSave, 
        updatedAt: serverTimestamp()
      };
      
      if (editId) {
        await updateDoc(doc(db, "branch_medicines", editId), payload);
      } else {
        await addDoc(collection(db, "branch_medicines"), payload);
      }
      
      setIsDialogOpen(false);
      setEditId(null);
      setForm({ medicineName: "", quantity: "", unitPrice: "", branchId: userData?.branch || "" });
    } catch (e) { alert(e.message); }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/30 min-h-screen">
      
      {/* BRANCH STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(branchStats).map(([name, count]) => (
          <div key={name} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{name}</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{count} <span className="text-xs font-bold text-slate-500">DAWO</span></h3>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & ACTIONS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner"><Package size={28} /></div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Inventory</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Stock Management</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search..." 
              className="pl-12 rounded-full bg-slate-100 border-none h-12"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditId(null); setForm({ medicineName: "", quantity: "", unitPrice: "", branchId: userData?.branch || "" }); }} className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-8 h-12 font-black uppercase text-[11px] shadow-lg">
                <Plus className="mr-2" size={20} /> Add New Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-10 max-w-md border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="font-black uppercase text-xl text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={20}/></div>
                      Medicine Entry
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Select Branch</label>
                        <select 
                          className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                          value={form.branchId}
                          onChange={(e) => setForm({...form, branchId: e.target.value})}
                        >
                          <option value="">Dooro Branch-ga</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                          ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Medicine Name</label>
                        <Input placeholder="E.G. AMOXICILLIN" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold uppercase" value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Quantity</label>
                            <Input type="number" placeholder="0" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Unit Price ($)</label>
                            <Input type="number" placeholder="0.00" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button disabled={isSubmitting} onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 font-black uppercase">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Medicine"}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MAIN TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-50">
        <div className="grid grid-cols-6 p-6 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
          <div className="pl-4">Medicine</div>
          <div className="text-center">Branch</div>
          <div className="text-center">Stock</div>
          <div className="text-center">Unit Price</div>
          <div className="text-center text-indigo-600">Total Value</div>
          <div className="text-right pr-4">Actions</div>
        </div>

        <div className="divide-y divide-slate-50">
          {currentItems.length > 0 ? currentItems.map((item) => {
            const qty = parseFloat(item.quantity) || 0;
            const uPrice = parseFloat(item.unitPrice) || 0;
            const totalStockValue = qty * uPrice;

            return (
              <div key={item.id} className="grid grid-cols-6 p-6 items-center hover:bg-indigo-50/10 transition-all group">
                <div className="pl-4 font-black text-slate-700 uppercase text-sm">{item.medicineName}</div>
                <div className="text-center font-bold text-slate-500 uppercase text-[10px]">{item.branchId}</div>
                <div className="text-center">
                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-black px-4 py-1.5 rounded-xl text-[10px]">{qty} PCS</Badge>
                </div>
                <div className="text-center font-bold text-slate-500 text-sm">${uPrice.toFixed(2)}</div>
                <div className="text-center font-black text-indigo-900 text-lg">${totalStockValue.toFixed(2)}</div>
                <div className="flex justify-end gap-2 pr-4">
                  <Button variant="ghost" size="icon" onClick={() => { setEditId(item.id); setForm(item); setIsDialogOpen(true); }} className="text-indigo-500 h-10 w-10 hover:bg-indigo-50 rounded-xl"><Edit3 size={18} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if(confirm("Ma tirtirtaa?")) deleteDoc(doc(db, "branch_medicines", item.id)); }} className="text-red-400 h-10 w-10 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></Button>
                </div>
              </div>
            );
          }) : (
            <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Medicines Found</div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} / {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft size={16} /></Button>
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}