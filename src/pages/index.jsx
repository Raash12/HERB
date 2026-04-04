import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { findUserByEmailOrName } from "../utils/auth";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // Email or Full Name
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleLogin = async () => {
    setMessage("Logging in...");
    setIsError(false);
    try {
      // Find user in Firestore by email or fullName
      const userData = await findUserByEmailOrName(identifier);
      if (!userData) throw new Error("User not found");

      // Check if user is active
      if (userData.active === false) {
        throw new Error("This account is inactive. Contact admin.");
      }

      // Firebase Auth login
      await signInWithEmailAndPassword(auth, userData.email, password);

      setMessage(`Login successful! Role: ${userData.role}`);
      setIsError(false);

      // Navigate to dashboard
      navigate(`/dashboard/${userData.role}`);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
        <CardContent className="space-y-6 p-6">

          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Horsed Logo"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Horsed Management System
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Please login to continue
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <Input
              placeholder="Email or Full Name"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="bg-white"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Login Button */}
          <Button
            className="w-full mt-2 text-base font-semibold"
            onClick={handleLogin}
          >
            Login
          </Button>

          {/* Message */}
          {message && (
            <p
              className={`text-center text-sm mt-2 ${
                isError ? "text-red-500" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}