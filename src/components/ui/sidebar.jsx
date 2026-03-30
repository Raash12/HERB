import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const { open, setOpen } = useSidebar();

  return (
    <aside
      className={cn(
        "relative bg-gray-900 text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-20"
      )}
    >
      {/* Button-ka Collapse-ka (Xir/Fur) */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-10 bg-indigo-600 text-white rounded-full p-1 shadow-lg border-2 border-gray-900 hover:bg-indigo-500 transition-all"
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {children}
    </aside>
  );
}

export function SidebarContent({ children }) {
  return <div className="flex-1 p-3 space-y-4 overflow-y-auto overflow-x-hidden">{children}</div>;
}

export function SidebarFooter({ children }) {
  const { open } = useSidebar();
  return (
    <div className={cn("p-4 border-t border-gray-800 transition-all", !open && "flex justify-center")}>
      {children}
    </div>
  );
}

export function SidebarMenu({ children }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ isActive, children, ...props }) {
  const { open } = useSidebar();

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
        open ? "justify-start" : "justify-center px-0",
        isActive
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
      {...props}
    >
      {/* Halkan waxaan ku kala saaraynaa Icon-ka iyo Qoraalka */}
      <div className={cn("flex items-center gap-3", !open && "gap-0")}>
        {/* Carruurta (Children) waxay ka kooban yihiin Icon iyo Text */}
        {React.Children.map(children, (child) => {
          // Haddii uu yahay qoraal (string) oo sidebar-ku xiran yahay, qari
          if (typeof child === "string" && !open) return null;
          // Haddii uu yahay qoraal ku dhex jira span, qari
          if (React.isValidElement(child) && child.type === "span" && !open) return null;
          
          // Haddii kale soo saar (Icon-ka mar walba waa soo baxayaa)
          return child;
        })}
      </div>
    </button>
  );
}