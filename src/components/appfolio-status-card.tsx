"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusResponse {
  connected: boolean;
  error?: string;
  checkedAt: string;
}

export function AppFolioStatusCard() {
  const { data, isLoading, isError } = useQuery<StatusResponse>({
    queryKey: ["appfolio-status"],
    queryFn: () => fetch("/api/appfolio/status").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  return (
    <Card className="rounded-lg border border-[#334155] bg-[#1e293b] p-4 text-sm ring-0">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-[14px] font-semibold leading-[1.4] text-[#f8fafc]">
          AppFolio Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && !data && (
          <p className="text-[14px] leading-[1.5] text-[#94a3b8]">
            Checking AppFolio connection...
          </p>
        )}
        {isError && (
          <div className="space-y-1">
            <Badge className="bg-red-500 text-white border-0">
              Connection failed
            </Badge>
            <p className="text-[14px] leading-[1.5] text-[#94a3b8]">
              Unable to reach AppFolio API. Check credentials in environment config.
            </p>
          </div>
        )}
        {data && data.connected && (
          <Badge className="bg-[#3b82f6] text-white border-0">
            Connected to sandbox
          </Badge>
        )}
        {data && !data.connected && (
          <div className="space-y-1">
            <Badge className="bg-red-500 text-white border-0">
              Connection failed
            </Badge>
            <p className="text-[14px] leading-[1.5] text-[#94a3b8]">
              Unable to reach AppFolio API. Check credentials in environment config.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
