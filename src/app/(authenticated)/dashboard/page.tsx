import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppFolioStatusCard } from "@/components/appfolio-status-card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-[20px] font-semibold leading-[1.3] text-[#f8fafc]">
        Dashboard
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AppFolio Connection status card */}
        <AppFolioStatusCard />

        {/* Unit Turn nav card */}
        <Link href="/unit-turn" className="group block focus-visible:outline-none">
          <Card className="rounded-lg border border-[#334155] bg-[#1e293b] p-4 text-sm ring-0 transition-colors group-hover:border-[#64748b] group-focus-visible:ring-2 group-focus-visible:ring-[#3b82f6] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#0f172a]">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-[14px] font-semibold leading-[1.4] text-[#f8fafc]">
                Unit Turn
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-[14px] leading-[1.5] text-[#f8fafc]">
                Create and manage unit turn work orders.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
