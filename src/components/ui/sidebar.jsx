import * as React from "react";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext();

export function useSidebar() {
  return React.useContext(SidebarContext);
}

export function SidebarProvider({ children }) {
  const [open, setOpen] = React.useState(true);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex w-full min-h-screen bg-gray-100 dark:bg-gray-950">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children }) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl transition-all duration-300">
      {children}
    </aside>
  );
}

export function SidebarContent({ children }) {
  return <div className="flex-1 p-4 space-y-4 overflow-y-auto">{children}</div>;
}

export function SidebarFooter({ children }) {
  return <div className="p-4 border-t border-gray-800">{children}</div>;
}

export function SidebarMenu({ children }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ isActive, children, ...props }) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
      {...props}
    >
      {children}
    </button>
  );
}