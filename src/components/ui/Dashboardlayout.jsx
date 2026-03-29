// src/components/ui/DashboardLayout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../firebase";
import { auth } from "../../firebase";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "./sidebar";
import { Button } from "./button"; // ShadCN button
import { Switch } from "./switch"; // dark mode switch

export default function DashboardLayout({ user, children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const menuItems = {
    admin: [
      { name: "Users", path: "/dashboard/admin/users", icon: null },
      { name: "Branches", path: "/dashboard/admin/branches", icon: null },
      { name: "Settings", path: "/dashboard/admin/settings", icon: null },
    ],
    reception: [
      { name: "Appointments", path: "/dashboard/reception/appointments", icon: null },
      { name: "Patients", path: "/dashboard/reception/patients", icon: null },
      { name: "Billing", path: "/dashboard/reception/billing", icon: null },
    ],
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <h2 className="text-lg font-bold text-sidebar-foreground">
              {user.role.toUpperCase()}
            </h2>
          </SidebarHeader>

          <SidebarMenu>
            {menuItems[user.role]?.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton onClick={() => navigate(item.path)}>
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.role} Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={localStorage.getItem("darkMode") === "true"}
              onCheckedChange={(val) => {
                localStorage.setItem("darkMode", val);
                document.documentElement.classList.toggle("dark", val);
              }}
            />
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}