import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; 
import { collection, getDocs, query, where, addDoc, doc, getDoc } from "firebase/firestore";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, MapPin, Stethoscope, Activity } from "lucide-react";

export default function CustomerRegistration() {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [myBranch, setMyBranch] = useState(""); 
  const [status, setStatus] = useState({ message: "", isError: false });

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    department: "", // New Field for Eye/Ear
    doctorId: "",
    doctorName: "",
  });

  useEffect(() => {
    const fetchContextData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const branchName = userSnap.data().branch;
          setMyBranch(branchName);

          const q = query(
            collection(db, "users"),
            where("role", "==", "doctor"),
            where("branch", "==", branchName)
          );

          const querySnapshot = await getDocs(q);
          const branchDoctors = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setDoctors(branchDoctors);
        }
      } catch (err) {
        console.error("Error fetching branch data:", err);
      }
    };

    fetchContextData();
  }, []);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) {
      setStatus({ message: "Please select a doctor from your branch", isError: true });
      return;
    }
    if (!formData.department) {
      setStatus({ message: "Please select a department (Eye or Ear)", isError: true });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "patients"), {
        ...formData,
        branch: myBranch, 
        status: "waiting", 
        createdAt: new Date(),
      });

      setStatus({ message: "Patient registered and sent to Dr. " + formData.doctorName, isError: false });
      setFormData({ fullName: "", phone: "", address: "", department: "", doctorId: "", doctorName: "" });
    } catch (err) {
      setStatus({ message: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-2xl border-none dark:bg-gray-900 overflow-hidden">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 dark:text-white">
              {/* Changed icon color to Blue */}
              <UserPlus className="text-blue-600" /> New Patient
            </h2>
            <p className="text-sm text-gray-500 mt-1">Registering for <b>{myBranch || "Loading..."}</b></p>
          </div>
          {/* Changed Badge color to Blue */}
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <MapPin size={14} className="mr-1" /> {myBranch || "Checking..."}
          </Badge>
        </div>

        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Patient Full Name</label>
            <Input 
              placeholder="Enter name" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Phone Number</label>
              <Input 
                placeholder="61xxxxxxx" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Address</label>
              <Input 
                placeholder="District/City" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </div>

          {/* New Dropdown for Eye and Ear */}
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1 text-blue-600 flex items-center gap-2">
              <Activity size={16} /> Department Selection
            </label>
            <select 
              className="w-full p-2.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
              required
            >
              <option value="">-- Select Eye or Ear --</option>
              <option value="Eye">Eye (Indhaha)</option>
              <option value="Ear">Ear (Dhagaha)</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-semibold ml-1 text-blue-600 flex items-center gap-2">
              <Stethoscope size={16} /> Available Doctors ({myBranch})
            </label>
            <select 
              className="w-full p-2.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.doctorId}
              onChange={e => {
                const docObj = doctors.find(d => d.id === e.target.value);
                setFormData({
                  ...formData,
                  doctorId: e.target.value,
                  doctorName: docObj ? docObj.fullName : ""
                });
              }}
              required
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>Dr. {doc.fullName}</option>
              ))}
            </select>
            {doctors.length === 0 && (
              <p className="text-[10px] text-red-500 mt-1 italic">No doctors assigned to this branch yet.</p>
            )}
          </div>

          {/* Button changed to Blue */}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-white font-bold transition-all shadow-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
          </Button>

          {status.message && (
            <p className={`text-center text-sm font-medium ${status.isError ? "text-red-500" : "text-blue-600"}`}>
              {status.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}