import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash } from "lucide-react"; // icons

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [dark, setDark] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [editingId, setEditingId] = useState(null);

  const toggleDark = (value) => {
    setDark(value);
    localStorage.setItem("darkMode", value);
    document.documentElement.classList.toggle("dark", value);
  };

  const fetchBranches = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "branches"));
      setBranches(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("darkMode") === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    fetchBranches();
  }, []);

  const handleSave = async () => {
    if (!name || !location) return;
    if (editingId) {
      const branchRef = doc(db, "branches", editingId);
      await updateDoc(branchRef, { name, location });
    } else {
      await addDoc(collection(db, "branches"), { name, location });
    }
    setOpen(false);
    setName(""); setLocation(""); setEditingId(null);
    fetchBranches();
  };

  const handleEdit = (branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setLocation(branch.location);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "branches", id));
    fetchBranches();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches</h1>
        <div className="flex items-center gap-4">
          <Switch checked={dark} onCheckedChange={toggleDark} />
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> Add Branch
          </Button>
        </div>
      </div>

      <Table className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map(branch => (
            <TableRow key={branch.id}>
              <TableCell>{branch.id}</TableCell>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.location}</TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(branch.id)}>
                  <Trash size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Branch Name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}