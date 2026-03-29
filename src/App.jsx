// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/index";
import Signup from "./pages/signup";

// Dashboard pages
import AdminDashboard from "./pages/dashboard/admin";
import DoctorDashboard from "./pages/dashboard/doctor";
import ReceptionDashboard from "./pages/dashboard/reception";

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboards */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
    </Routes>
  );
}