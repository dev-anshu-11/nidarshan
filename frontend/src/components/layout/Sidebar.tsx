import { Link, useLocation } from "wouter";
import { UploadCloud, Shield, Users, Clock, FileText, Settings } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/upload", icon: UploadCloud, label: "Upload" },
    { href: "/dashboard", icon: Shield, label: "Investigation" },
    { href: "/entities", icon: Users, label: "Entities" },
    { href: "/timeline", icon: Clock, label: "Timeline" },
    { href: "/report", icon: FileText, label: "Report" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 hover:w-56 bg-[#0f1018] border-r border-[#1c1e2e] flex flex-col justify-between transition-all duration-300 z-50 overflow-hidden group">
      <div className="flex flex-col py-4 gap-2">
        {navItems.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a className={`flex items-center w-full px-4 py-3 gap-4 whitespace-nowrap outline-none ${active ? 'border-l-2 border-[#7c3aed] bg-[#1a103a]' : 'border-l-2 border-transparent hover:bg-[#141622]'}`}>
                <item.icon size={20} className={active ? 'text-[#7c3aed]' : 'text-[#8891aa]'} />
                <span className={`font-display text-[11px] font-medium tracking-wide ${active ? 'text-[#f1f3ff]' : 'text-[#8891aa]'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
      <div className="flex flex-col py-4 border-t border-[#1c1e2e]">
        <Link href="/settings">
          <a className="flex items-center w-full px-4 py-3 gap-4 whitespace-nowrap outline-none border-l-2 border-transparent hover:bg-[#141622]">
            <Settings size={20} className="text-[#8891aa]" />
            <span className="font-display text-[11px] font-medium tracking-wide text-[#8891aa] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Settings
            </span>
          </a>
        </Link>
      </div>
    </aside>
  );
}
