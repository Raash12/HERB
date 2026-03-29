import { useNavigate } from "react-router-dom"; // ✅ React Router hook
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


export default function DoctorDashboard() {
  const navigate = useNavigate(); // useNavigate replaces useRouter

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // redirect to login page
  };

  return (
    <Card className="p-6">
      <CardContent>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <Badge className="bg-blue-500 text-white">Welcome Admin</Badge>
        <Button className="mt-4" onClick={handleLogout}>
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}