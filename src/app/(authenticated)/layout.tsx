import { requireAuth } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <Providers>
      <div className="flex h-screen">
        <Sidebar userEmail={session.user?.email} />
        <main className="flex-1 overflow-y-auto bg-[#0f172a] pt-8 px-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}
