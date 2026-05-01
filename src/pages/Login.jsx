import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { findUserByEmailOrName } from "../utils/auth";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock, User, Sparkles, ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setIsError(true);
      setMessage("Fadlan buuxi meelaha banaan");
      return;
    }
    setLoading(true);
    setIsError(false);
    try {
      const userData = await findUserByEmailOrName(identifier);
      if (!userData) throw new Error("User-ka lama helin");
      if (userData.active === false) throw new Error("Account-ka waa xiran yahay");

      await signInWithEmailAndPassword(auth, userData.email, password);
      navigate(`/dashboard/${userData.role}`);
    } catch (err) {
      await signOut(auth);
      setMessage(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px]" // Size-ka halkan ayaan ku yareeyay sxb
      >
        <Card className="shadow-2xl rounded-[2.5rem] border-none bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-8 space-y-6">
            
            {/* LOGO SECTION */}
            <div className="text-center space-y-3">
              <div className="flex justify-center relative">
                <div className="relative">
                  <img
                    src="/logo.png" 
                    alt="Logo"
                    className="w-24 h-24 object-contain"
                    onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/5968/5968204.png"}
                  />
                  <motion.div 
                    animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-1 -right-1 bg-blue-600 p-2 rounded-xl shadow-lg border-[3px] border-white dark:border-slate-900 text-white"
                  >
                    <ShieldCheck size={14} />
                  </motion.div>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                  HORSEED <span className="text-blue-600">ERB</span>
                </h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Management System
                </p>
              </div>
            </div>

            {/* INPUTS */}
            <div className="space-y-3">
              <div className="group relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <Input
                  placeholder="EMAIL AMA MAGACA"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none font-medium text-[13px] placeholder:text-[9px] placeholder:font-black focus-visible:ring-2 focus-visible:ring-blue-600 shadow-inner"
                />
              </div>

              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <Input
                  placeholder="PASSWORD"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none font-medium text-[13px] placeholder:text-[9px] placeholder:font-black focus-visible:ring-2 focus-visible:ring-blue-600 shadow-inner"
                />
              </div>
            </div>

            {/* BUTTON */}
            <Button
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              onClick={handleLogin}
            >
              {loading ? "HUBINTA..." : "Login"}
            </Button>

            {/* MESSAGE */}
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center font-black text-[9px] uppercase p-3 rounded-xl ${
                  isError ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                }`}
              >
                {message}
              </motion.p>
            )}

            <p className="text-[8px] text-center font-bold text-slate-400 uppercase opacity-50">
              &copy; {new Date().getFullYear()} Horsed Medical Center
            </p>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}