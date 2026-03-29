// src/pages/index.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { findUserByEmailOrName } from "../utils/auth"; // must query Firestore for user by email or fullName
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // email OR full name
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [dark, setDark] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Load dark mode from localStorage
  useEffect(() => {
    if (localStorage.getItem("darkMode") === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = (value) => {
    setDark(value);
    localStorage.setItem("darkMode", value);
    document.documentElement.classList.toggle("dark", value);
  };

  const handleLogin = async () => {
    if (!accepted) {
      setMessage("You must accept the terms!");
      setIsError(true);
      return;
    }

    setMessage("Logging in...");
    setIsError(false);
    try {
      // Find user in Firestore by email or fullName
      const userData = await findUserByEmailOrName(identifier);
      if (!userData) throw new Error("User not found");

      // Sign in with Firebase Auth using email
      await signInWithEmailAndPassword(auth, userData.email, password);

      setMessage(`Login successful! Role: ${userData.role}`);
      setIsError(false);

      // Navigate to the user's dashboard
      navigate(`/dashboard/${userData.role}`);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6 transition-colors">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Login
          </h1>
          <Badge className="bg-blue-500 text-white">UI Working</Badge>

          {/* Inputs */}
          <Input
            placeholder="Email or Full Name"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="bg-white dark:bg-gray-700 dark:text-white"
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white dark:bg-gray-700 dark:text-white"
          />

          {/* Terms + Dark Mode */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
              <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
              <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                Accept
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-gray-300">Dark</span>
              <Switch checked={dark} onCheckedChange={toggleDark} />
            </div>
          </div>

          {/* Login Button */}
          <Button className="w-full mt-2" onClick={handleLogin}>
            Login
          </Button>

          {/* Message */}
          {message && (
            <p className={`text-center mt-2 ${isError ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}