import { Routes, Route } from "react-router-dom";
import Login from "./pages/index";
import AdminDashboard from "./pages/dashboard/admin";
import DoctorDashboard from "./pages/dashboard/doctor";
import ReceptionDashboard from "./pages/dashboard/reception";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import MedicalPrescription from "./pages/doctor/MedicalPrescription"; 
import OpticalPrescriptionPage from "./pages/doctor/OpticalPrescriptionPage"; // Magaca saxda ah waa kan
import DoctorPrescriptionView from "./pages/doctor/DoctorPrescriptionView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      
      {/* Doctor & Reception Dashboards */}
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
      
      {/* Doctor Routes */}
      <Route path="/dashboard/doctor/appointments" element={<DoctorAppointments />} />
      
      {/* Halkan hoose ayaan ka beddelay PrescriptionPage una beddelay OpticalPrescriptionPage 
          si uu ula mid noqdo import-ka sare 
      */}
      <Route path="/doctor/prescription/:id" element={<OpticalPrescriptionPage />} />
      <Route path="/doctor/medical-prescription/:id" element={<MedicalPrescription />} />
      <Route path="/doctor/optical-prescription/:id" element={<OpticalPrescriptionPage />} />
      <Route path="/doctor/prescriptions" element={<DoctorPrescriptionView />} />

    </Routes>
  );
}