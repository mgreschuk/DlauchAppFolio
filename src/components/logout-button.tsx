"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[#ef4444] hover:bg-[#334155] hover:text-[#ef4444] focus-visible:ring-offset-2"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Log Out
    </Button>
  );
}
