import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";
import { ShoppingCart, Loader2, Trash2, CheckCircle, Search, Tag, ShoppingBag, Pill, ChevronLeft, ChevronRight, User, Stethoscope } from "lucide-react";

export default function QuickSale() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stock, setStock] = useState([]);
  const [userData, setUserData] = useState(null);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [saleType, setSaleType] = useState("walk-in"); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          setUserData(uData);
          const q = query(collection(db, "branch_medicines"), where("branchId", "==", uData.branch));
          const sSnap = await getDocs(q);
          setStock(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const addToCart = (med) => {
    if (med.quantity <= 0) return toast.error("Stock-ga waa madhan yahay!");
    if (!cart.find(i => i.id === med.id)) {
      setCart([...cart, { ...med, sellQty: 1, dosage: "1x1", totalItemPrice: med.unitPrice }]);
    }
    setIsCartOpen(true);
  };

  const updateCartItem = (id, field, val) => {
    setCart(cart.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: val };
        if (field === "sellQty") updated.totalItemPrice = (parseFloat(val) || 0) * i.unitPrice;
        return updated;
      }
      return i;
    }));
  };

  const subTotal = cart.reduce((acc, i) => acc + i.totalItemPrice, 0);
  const finalTotal = subTotal - (parseFloat(discount) || 0);

  const handleConfirmPay = async () => {
    if (!cart.length) return;
    setIsSubmitting(true);
    const tId = toast.loading("Processing...");
    try {
      for (const i of cart) {
        await updateDoc(doc(db, "branch_medicines", i.id), {
          quantity: i.quantity - parseFloat(i.sellQty),
          updatedAt: serverTimestamp()
        });
      }
      await addDoc(collection(db, "sales"), {
        items: cart, 
        subTotal, 
        discount: parseFloat(discount) || 0, 
        finalTotal,
        type: saleType, 
        branchId: userData.branch, 
        sellerId: auth.currentUser.uid, 
        createdAt: serverTimestamp()
      });
      toast.success("Sale completed!", { id: tId });
      setCart([]); setIsCartOpen(false);
      setDiscount(0);
      setSaleType("walk-in");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) { toast.error(e.message, { id: tId }); }
    setIsSubmitting(false);
  };

  const filtered = stock.filter(i => i.medicineName.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="h-screen flex items-center justify-center bg-blue-50/20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-[1300px] mx-auto space-y-6 bg-blue-50/20 min-h-screen">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch text-blue-600">
        <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm flex justify-between items-center border border-blue-100">
          <div>
            <h1 className="text-2xl font-black text-blue-900 uppercase">Horseed <span className="text-blue-600">POS</span></h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{userData?.branchName || "Branch Panel"}</p>
          </div>
          <Button onClick={() => setIsCartOpen(true)} className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-14 px-8 relative shadow-lg shadow-blue-100 transition-all active:scale-95">
            <ShoppingBag size={20} className="mr-2" />
            <span className="font-black uppercase text-xs text-white">Cart ({cart.length})</span>
          </Button>
        </div>
        <div className="bg-blue-600 p-6 rounded-[2rem] shadow-lg shadow-blue-200 flex items-center gap-5 text-white">
            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Pill size={28} />
            </div>
            <div>
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-wider mb-1">Total Medicines</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-black">{stock.length}</h2>
                    <span className="text-[10px] font-bold text-blue-100/80 uppercase italic text-white">Available</span>
                </div>
            </div>
        </div>
      </div>

      {/* Stock Table */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-blue-50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
            <Input 
              placeholder="Search medicine..." 
              className="pl-11 h-12 rounded-2xl bg-blue-50/30 border-none focus-visible:ring-2 focus-visible:ring-blue-600/20 font-medium text-blue-900" 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-blue-50/50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase p-6 text-blue-600">Medicine</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase text-blue-600">Unit Price</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase text-blue-600">Stock</TableHead>
              <TableHead className="text-right pr-12 font-black text-[10px] uppercase text-blue-600">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map(item => (
              <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors border-b border-blue-50">
                <TableCell className="p-6 font-black text-xs uppercase text-blue-800">{item.medicineName}</TableCell>
                <TableCell className="text-center font-black text-blue-900">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge className={`${item.quantity < 10 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'} border-none font-black text-[10px]`}>
                    {item.quantity} PCS
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button onClick={() => addToCart(item)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase px-8 h-10 rounded-xl transition-all active:scale-95 shadow-md">Add</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-6 bg-white border-t border-blue-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-xl h-10 w-10 border-blue-100 text-blue-600"><ChevronLeft size={18} /></Button>
                <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-xl h-10 w-10 border-blue-100 text-blue-600"><ChevronRight size={18} /></Button>
            </div>
        </div>
      </Card>

      {/* YAREEYAY POPUP (Dialog) */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col">
          <div className="bg-blue-600 p-6 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart size={18} />
              </div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">Checkout</DialogTitle>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="px-6 pt-5">
              <label className="text-[9px] font-black text-blue-400 uppercase block mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setSaleType("walk-in")} className={`rounded-xl h-10 font-black uppercase text-[9px] gap-2 transition-all ${saleType === 'walk-in' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-400'}`}>
                  <User size={12} /> Walk-in
                </Button>
                <Button onClick={() => setSaleType("doctor")} className={`rounded-xl h-10 font-black uppercase text-[9px] gap-2 transition-all ${saleType === 'doctor' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-400'}`}>
                  <Stethoscope size={12} /> Doctor
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-blue-50/30 p-4 rounded-[1.2rem] border border-blue-50 relative group">
                  <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={10}/></button>
                  <div className="flex justify-between mb-3 items-start font-black text-[10px] uppercase text-blue-800">
                    <span className="max-w-[70%]">{item.medicineName}</span>
                    <span className="text-blue-600 text-xs">${item.totalItemPrice.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded-xl border border-blue-50 text-blue-800">
                      <label className="text-[8px] font-black text-blue-300 uppercase block">Qty</label>
                      <input type="number" value={item.sellQty} onChange={(e) => updateCartItem(item.id, "sellQty", e.target.value)} className="w-full bg-transparent font-black text-xs outline-none" />
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-blue-50 text-blue-800">
                      <label className="text-[8px] font-black text-blue-300 uppercase block">Dosage</label>
                      <input value={item.dosage} onChange={(e) => updateCartItem(item.id, "dosage", e.target.value)} className="w-full bg-transparent font-black text-[9px] uppercase outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-blue-50 space-y-4 shrink-0">
            <div className="flex gap-3">
              <div className="flex-1 bg-blue-50/50 p-3 rounded-xl flex justify-between items-center border border-blue-50 font-black text-blue-800">
                <span className="text-[9px] uppercase text-blue-400">Subtotal</span>
                <span className="text-xs">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex-1 bg-blue-50 p-3 rounded-xl flex items-center gap-2 border border-blue-200">
                <Tag size={12} className="text-blue-500" />
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Disc" className="w-full bg-transparent font-black text-xs text-blue-600 outline-none" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-blue-400 uppercase">Payable</p>
                <h1 className="text-3xl font-black text-blue-900 tracking-tighter">${finalTotal.toFixed(2)}</h1>
              </div>
              <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"><CheckCircle size={20} /></div>
            </div>
            <Button disabled={isSubmitting || !cart.length} onClick={handleConfirmPay} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] shadow-lg shadow-blue-100">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Confirm Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}