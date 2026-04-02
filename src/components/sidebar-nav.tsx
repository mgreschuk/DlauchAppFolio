"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-md px-4 text-sm transition-colors",
              "min-h-[44px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]",
              isActive
                ? "border-l-4 border-[#3b82f6] bg-transparent pl-3 font-semibold text-[#f8fafc]"
                : "border-l-4 border-transparent text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]",
            ].join(" ")}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
