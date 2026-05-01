import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboard/admin";
import DoctorDashboard from "./pages/dashboard/doctor";
import ReceptionDashboard from "./pages/dashboard/reception";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import MedicalPrescription from "./pages/doctor/MedicalPrescription"; 
import OpticalPrescriptionPage from "./pages/doctor/OpticalPrescriptionPage"; 
import DoctorPrescriptionView from "./pages/doctor/DoctorPrescriptionView";

// Import your SessionTimeout component
import SessionTimeout from "./SessionTimeout";

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* The timer will only activate if the user is NOT on the login page ("/")
          This prevents the app from trying to log out a user who hasn't logged in yet.
      */}
      {location.pathname !== "/" && <SessionTimeout />}

      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Dashboard */}
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        
        {/* Doctor & Reception Dashboards */}
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
        
        {/* Doctor Routes */}
        <Route path="/dashboard/doctor/appointments" element={<DoctorAppointments />} />
        
        {/* Prescription Routes */}
        <Route path="/doctor/prescription/:id" element={<OpticalPrescriptionPage />} />
        <Route path="/doctor/medical-prescription/:id" element={<MedicalPrescription />} />
        <Route path="/doctor/optical-prescription/:id" element={<OpticalPrescriptionPage />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptionView />} />
      </Routes>
    </>
  );
}