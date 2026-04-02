import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

interface SidebarProps {
  userEmail: string | null | undefined;
}

export function Sidebar({ userEmail }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col bg-[#1e293b]">
      {/* Top: product name */}
      <div className="px-6 pt-6">
        <span className="text-[20px] font-semibold leading-[1.3] text-[#f8fafc]">
          Turnkey
        </span>
      </div>

      {/* Middle: nav */}
      <div className="mt-8 flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      {/* Bottom: divider + user email + logout */}
      <div className="mt-8 flex flex-col gap-3 px-4 pb-6">
        <Separator className="bg-[#334155]" />
        {userEmail && (
          <p className="truncate px-4 text-[14px] leading-[1.5] text-[#94a3b8]">
            {userEmail}
          </p>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}
