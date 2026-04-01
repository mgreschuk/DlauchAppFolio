"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Try again.");
      } else if (result?.ok) {
        router.push("/dashboard");
      } else {
        setError("Something went wrong. Refresh the page and try again.");
      }
    } catch {
      setError("Something went wrong. Refresh the page and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <Card
        className="w-full max-w-[400px] border border-[#334155] rounded-[8px]"
        style={{
          backgroundColor: "#1e293b",
          padding: "48px 32px",
        }}
      >
        <CardContent className="p-0">
          <div className="mb-8">
            <h1
              className="text-[28px] font-semibold leading-[1.2] text-[#f8fafc] mb-1"
              style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}
            >
              Turnkey
            </h1>
            <p className="text-[14px] text-[#94a3b8] leading-[1.5]">
              Powered by Revel 1
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-[14px] font-semibold text-[#f8fafc] leading-[1.4]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className={`
                  bg-[#1e293b] border text-[#f8fafc] text-[14px] leading-[1.5]
                  placeholder:text-[#94a3b8]
                  focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]
                  hover:border-slate-500
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${error ? "border-red-500" : "border-[#334155]"}
                `}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-[14px] font-semibold text-[#f8fafc] leading-[1.4]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className={`
                  bg-[#1e293b] border text-[#f8fafc] text-[14px] leading-[1.5]
                  placeholder:text-[#94a3b8]
                  focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]
                  hover:border-slate-500
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${error ? "border-red-500" : "border-[#334155]"}
                `}
              />
              {error && (
                <p className="text-[14px] text-red-400 leading-[1.5]" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                w-full mt-2 text-[14px] font-semibold leading-[1.4] text-white
                bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8]
                focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]
                disabled:opacity-40 disabled:cursor-not-allowed
                min-w-[120px]
              "
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
