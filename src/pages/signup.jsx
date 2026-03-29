// src/pages/signup.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ React Router
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignUp() {
  const navigate = useNavigate(); // ✅ useNavigate instead of Next.js useRouter
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Dark mode from localStorage
    if (localStorage.getItem("darkMode") === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }

    // Fetch branches from Firestore
    const fetchBranches = async () => {
      const querySnapshot = await getDocs(collection(db, "branches"));
      setBranches(querySnapshot.docs.map(doc => doc.data().name));
    };
    fetchBranches();
  }, []);

  const toggleDark = (value) => {
    setDark(value);
    localStorage.setItem("darkMode", value);
    document.documentElement.classList.toggle("dark", value);
  };

  const handleSignup = async () => {
    setMessage("Creating account...");
    setIsError(false);
    try {
      if (!branch || !branches.includes(branch)) throw new Error("Branch not valid");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Add user to Firestore
      await setDoc(doc(db, "users", uid), {
        fullName,
        email,
        role,
        branch,
      });

      setMessage("Account created successfully!");
      setFullName("");
      setEmail("");
      setPassword("");
      setBranch("");
      setRole("doctor");

      // Redirect to login page or dashboard
      navigate("/"); // Change this path to your login route if needed
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Sign Up</h1>
          <Badge className="bg-green-500 text-white">UI Working</Badge>

          <Input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 rounded-md"
          >
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="reception">Reception</option>
          </select>

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full p-2 rounded-md"
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span>Dark</span>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>

          <Button className="w-full" onClick={handleSignup}>
            Sign Up
          </Button>

          {message && (
            <p className={`text-center ${isError ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}