import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "./utils/supabaseClient";

export default function App() {
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // ✅ track error or success

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = (value) => {
    setDark(value);
    localStorage.setItem("darkMode", value);
    if (value) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleLogin = async () => {
    setMessage("Logging in...");
    setIsError(false);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsError(true); // error = red
    } else {
      setMessage("Login successful! User ID: " + data.user.id);
      setIsError(false); // success = green
      console.log("User:", data.user);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl bg-white dark:bg-gray-800 transition">
          <CardContent className="p-6 space-y-4">

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              ShadCN + Supabase Login
            </h1>

            <div className="flex justify-center">
              <Badge className="bg-blue-500 text-white">UI Working</Badge>
            </div>

            {/* Inputs */}
            <Input
              placeholder="Enter email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-gray-700 dark:text-white"
            />
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white dark:bg-gray-700 dark:text-white"
            />

            {/* Switch + Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" />
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
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>

            {/* Message */}
            {message && (
              <p
                className={`text-center mt-2 ${
                  isError ? "text-red-500" : "text-green-500"
                }`}
              >
                {message}
              </p>
            )}

          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}