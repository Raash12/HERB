import { useState } from "react";
import { auth } from "../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    // 1. Validation
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    try {
      // 2. Re-authenticate user (Amniga dartiis Firebase waxay u baahan tahay login dhow ah)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 3. Update password
      await updatePassword(user, newPassword);

      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setIsError(true);
      setMessage(err.message.includes("wrong-password") 
        ? "Current password is incorrect." 
        : "Error: Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="bg-blue-600 text-white rounded-t-2xl">
          <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
            <Lock size={20} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Current Password</label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">New Password</label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg mt-2"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "UPDATE PASSWORD"}
            </Button>

            {message && (
              <div className={`p-3 rounded-xl text-center text-[11px] font-black uppercase tracking-wider border ${
                isError ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
              }`}>
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}