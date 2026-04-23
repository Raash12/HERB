import React, { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../firebase";

// Icons
import { KeyRound, Loader2 } from "lucide-react";

// UI Components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SecuritySettings({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", repeat: "" });

  const handleUpdatePassword = async () => {
    const { current, new: newPass, repeat } = passwords;
    if (!current || !newPass || !repeat) return alert("Fadlan buuxi meelaha banaan!");
    if (newPass !== repeat) return alert("Password-ka cusub iyo ku celisku ma is laha!");
    
    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      
      // Re-authenticate user
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPass);
      
      alert("Password-ka si guul leh ayaa loo beddelay!");
      setPasswords({ current: "", new: "", repeat: "" });
      
      if (onSuccess) onSuccess(); // Ku celi dashboard-ka haddii loo baahdo
    } catch (err) { 
      alert("Cillad: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom-4 mt-10">
      <div className="text-center">
        <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <KeyRound className="text-blue-600" size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Security Settings</h2>
        <p className="text-slate-400 text-sm uppercase font-bold text-[10px] tracking-widest">Update your credentials</p>
      </div>

      <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Current Password</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
            value={passwords.current} 
            onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase ml-1 text-slate-400">New Password</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
            value={passwords.new} 
            onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase ml-1 text-slate-400">Repeat New Password</label>
          <Input 
            type="password" 
            placeholder="••••••••" 
            className="h-12 rounded-xl dark:bg-slate-800 dark:border-none" 
            value={passwords.repeat} 
            onChange={(e) => setPasswords({...passwords, repeat: e.target.value})} 
          />
        </div>

        <Button 
          onClick={handleUpdatePassword} 
          disabled={loading} 
          className="w-full bg-blue-600 h-12 rounded-xl font-bold uppercase tracking-widest mt-4 shadow-lg shadow-blue-200 dark:shadow-none"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
        </Button>
      </Card>
    </div>
  );
}