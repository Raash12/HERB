import { Routes, Route } from "react-router-dom";
import Login from "./pages/index";
import AdminDashboard from "./pages/dashboard/admin";
import DoctorDashboard from "./pages/dashboard/doctor";
import ReceptionDashboard from "./pages/dashboard/reception";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import PrescriptionPage from "./pages/doctor/PrescriptionPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard - Kan ayaa maamulaya Add Branch iyo Signup hadda */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
      <Route path="/dashboard/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/doctor/prescription/:id" element={<PrescriptionPage />} />
    </Routes>
  );
}