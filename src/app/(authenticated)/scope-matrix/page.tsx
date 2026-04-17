import { ScopeMatrixClient } from "@/components/scope-table";

export default function ScopeMatrixPage() {
  return (
    <div>
      <h1 className="text-[20px] font-semibold leading-[1.3] text-[#f8fafc]">
        Scope Matrix
      </h1>
      <div className="mt-6">
        <ScopeMatrixClient />
      </div>
    </div>
  );
}
