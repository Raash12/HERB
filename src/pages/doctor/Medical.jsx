import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

// UI Components
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import { Loader2, PackagePlus, Store, Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Medical() {
  const [userData, setUserData] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    medicineName: "",
    quantity: "",
    branchId: "",
  });

  // 1. GET CURRENT USER PROFILE
  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserData(snap.data());
      }
    };
    fetchUser();
  }, []);

  // 2. GET ALL BRANCHES
  useEffect(() => {
    const fetchBranches = async () => {
      const snap = await getDocs(collection(db, "branches"));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAllBranches(data);
    };
    fetchBranches();
  }, []);

  // 3. FILTER BRANCHES FOR DROPDOWN
  useEffect(() => {
    if (!userData || allBranches.length === 0) return;

    let result = allBranches;
    if (userData.role !== "admin") {
      result = allBranches.filter((b) => b.id === userData.branch);
      setForm((prev) => ({ ...prev, branchId: userData.branch }));
    }
    setFilteredBranches(result);
  }, [userData, allBranches]);

  // 4. FETCH STOCK
  const fetchStock = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      let q;
      if (userData.role === "admin") {
        q = query(collection(db, "branch_medicines"));
      } else {
        q = query(
          collection(db, "branch_medicines"),
          where("branchId", "==", userData.branch)
        );
      }

      const snap = await getDocs(q);
      setStock(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching stock:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userData) fetchStock();
  }, [userData]);

  // =========================
  // SEARCH & PAGINATION LOGIC
  // =========================
  const filteredStock = stock.filter((item) =>
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStock = filteredStock.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 5. ADD MEDICINE LOGIC
  const handleAdd = async () => {
    if (!form.medicineName || !form.quantity || !form.branchId) {
      alert("Fadlan buuxi meelaha banaan");
      return;
    }

    try {
      await addDoc(collection(db, "branch_medicines"), {
        medicineName: form.medicineName,
        quantity: Number(form.quantity),
        branchId: form.branchId,
        updatedAt: new Date(),
      });

      alert("Daawada waa la daray ✅");
      setForm({
        medicineName: "",
        quantity: "",
        branchId: userData?.role === "admin" ? "" : userData.branch,
      });
      fetchStock();
    } catch (err) {
      alert("Error adding medicine");
    }
  };

  if (loading && !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-black text-3xl tracking-tighter uppercase text-blue-600 flex items-center gap-2">
              <Activity className="text-blue-500" /> Medical Inventory
            </h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
              {userData?.role === "admin" ? "All Branches Control" : `Branch: ${userData?.branch || 'Loading...'}`}
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search medicine..." 
              className="pl-10 h-11 rounded-2xl border-blue-100 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* INPUT FORM CARD */}
        <Card className="rounded-[2.5rem] border-blue-100 dark:border-blue-900/30 shadow-2xl shadow-blue-100/20 dark:shadow-none overflow-hidden">
          <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
             <PackagePlus size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">Add New Stock Entry</span>
          </div>
          <CardContent className="p-8 grid md:grid-cols-4 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-500">Medicine Name</label>
              <Input
                placeholder="Ex: Paracetamol"
                value={form.medicineName}
                onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                className="h-12 rounded-2xl border-blue-100 bg-blue-50/30 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-500">Quantity</label>
              <Input
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="h-12 rounded-2xl border-blue-100 bg-blue-50/30 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-slate-500">Target Branch</label>
              <select
                className="w-full h-12 border border-blue-100 dark:border-blue-900/30 rounded-2xl px-4 text-sm font-bold bg-blue-50/30 dark:bg-background focus:ring-2 ring-blue-600 outline-none disabled:opacity-60"
                value={form.branchId}
                disabled={userData?.role !== "admin"}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                <option value="">Select Branch</option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.id}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleAdd}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200"
            >
              Update Stock
            </Button>
          </CardContent>
        </Card>

        {/* DATA TABLE */}
        <div className="bg-card rounded-[2.5rem] shadow-2xl shadow-blue-100/20 border border-blue-50 dark:border-blue-900/30 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-blue-950/20">
              <TableRow className="hover:bg-transparent border-none">
                <TableCell className="font-black py-6 pl-8 uppercase text-[11px] tracking-widest text-blue-600">Medicine Item</TableCell>
                <TableCell className="font-black uppercase text-[11px] tracking-widest text-blue-600">Location / Branch</TableCell>
                <TableCell className="font-black text-right pr-8 uppercase text-[11px] tracking-widest text-blue-600">Available Stock</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentStock.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center py-20 text-muted-foreground font-bold italic">No inventory found.</TableCell>
                </TableRow>
              ) : (
                currentStock.map((item) => {
                  const branch = allBranches.find((b) => b.id === item.branchId);
                  return (
                    <TableRow key={item.id} className="hover:bg-blue-50/50 transition">
                      <TableCell className="py-5 pl-8 font-black uppercase text-sm text-slate-700 dark:text-slate-200">
                        {item.medicineName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Store size={14} className="text-blue-400" />
                          {branch?.name || item.branchId || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="outline" className={`px-4 py-1 rounded-xl text-xs font-black border-2 ${item.quantity < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {item.quantity} QTY
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* PAGINATION CONTROLS */}
          <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStock.length)} of {filteredStock.length} items
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl border-blue-100"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center px-4 text-xs font-bold text-blue-600 bg-white rounded-xl border border-blue-100">
                {currentPage} / {totalPages || 1}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-xl border-blue-100"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}