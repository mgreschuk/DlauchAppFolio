"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ChevronUp, ChevronDown, Pencil, Plus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScopeFilters } from "@/components/scope-filters";
import { ScopeFormModal } from "@/components/scope-form-modal";

interface Scope {
  id: string;
  scopeName: string;
  category: string;
  vendor: string;
  vendorId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortColumn = "scopeName" | "category" | "vendor";
type SortDirection = "asc" | "desc";

async function fetchScopes(includeInactive: boolean): Promise<Scope[]> {
  const url = includeInactive ? "/api/scopes?includeInactive=true" : "/api/scopes";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch scopes");
  return res.json();
}

async function toggleScope(id: string): Promise<Scope> {
  const res = await fetch(`/api/scopes/${id}/toggle`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle scope");
  return res.json();
}

export function ScopeMatrixClient() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("scopeName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);

  const { data: scopes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["scopes", showInactive],
    queryFn: () => fetchScopes(showInactive),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleScope,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["scopes"] });
      toast.success(updated.isActive ? "Scope reactivated" : "Scope deactivated");
    },
    onError: () => {
      toast.error("Failed to update scope status");
    },
  });

  const uniqueCategories = useMemo(
    () => [...new Set(scopes.map((s) => s.category))].sort(),
    [scopes]
  );

  const uniqueVendors = useMemo(
    () => [...new Set(scopes.map((s) => s.vendor))].sort(),
    [scopes]
  );

  // Note: uniqueVendors is used for table filters only.
  // The add/edit modal fetches vendors directly from AppFolio.

  const filteredScopes = useMemo(() => {
    let result = scopes;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.scopeName.toLowerCase().includes(lower) ||
          s.category.toLowerCase().includes(lower) ||
          s.vendor.toLowerCase().includes(lower)
      );
    }

    if (categoryFilter && categoryFilter !== "__all__") {
      result = result.filter((s) => s.category === categoryFilter);
    }

    if (vendorFilter && vendorFilter !== "__all__") {
      result = result.filter((s) => s.vendor === vendorFilter);
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [scopes, searchTerm, categoryFilter, vendorFilter, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ChevronDown className="ml-1 inline size-3 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline size-3" />
    ) : (
      <ChevronDown className="ml-1 inline size-3" />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#94a3b8]">
        Loading scopes...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-[#94a3b8]">Failed to load scopes</p>
        <Button
          onClick={() => refetch()}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Toaster position="top-right" theme="dark" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <ScopeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={(val) => setCategoryFilter(val === "__all__" ? "" : val)}
          vendorFilter={vendorFilter}
          onVendorChange={(val) => setVendorFilter(val === "__all__" ? "" : val)}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
          categories={uniqueCategories}
          vendors={uniqueVendors}
        />

        <Button
          onClick={() => {
            setEditingScope(null);
            setModalOpen(true);
          }}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shrink-0"
        >
          <Plus className="size-4" />
          Add Scope
        </Button>
      </div>

      <div className="rounded-lg border border-[#334155] bg-[#1e293b] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0f172a] border-b border-[#334155] hover:bg-[#0f172a]">
              <TableHead
                className="py-2 px-3 text-xs uppercase tracking-wider font-medium text-[#94a3b8] cursor-pointer whitespace-nowrap"
                onClick={() => handleSort("scopeName")}
              >
                Scope Name
                <SortIcon column="scopeName" />
              </TableHead>
              <TableHead
                className="py-2 px-3 text-xs uppercase tracking-wider font-medium text-[#94a3b8] cursor-pointer whitespace-nowrap"
                onClick={() => handleSort("category")}
              >
                Category
                <SortIcon column="category" />
              </TableHead>
              <TableHead
                className="py-2 px-3 text-xs uppercase tracking-wider font-medium text-[#94a3b8] cursor-pointer whitespace-nowrap"
                onClick={() => handleSort("vendor")}
              >
                Vendor
                <SortIcon column="vendor" />
              </TableHead>
              <TableHead className="py-2 px-3 text-xs uppercase tracking-wider font-medium text-[#94a3b8] whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="py-2 px-3 text-xs uppercase tracking-wider font-medium text-[#94a3b8] whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScopes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-[#94a3b8] text-sm"
                >
                  No scopes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredScopes.map((scope) => (
                <TableRow
                  key={scope.id}
                  className={[
                    "border-b border-[#334155] hover:bg-[#334155]/50 transition-colors",
                    !scope.isActive ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <TableCell className="py-2 px-3 text-sm text-[#f8fafc]">
                    {scope.scopeName}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm text-[#f8fafc]">
                    {scope.category}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm text-[#f8fafc]">
                    {scope.vendor}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Switch
                      checked={scope.isActive}
                      onCheckedChange={() => toggleMutation.mutate(scope.id)}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingScope(scope);
                        setModalOpen(true);
                      }}
                      className="text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]"
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit scope</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ScopeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editScope={editingScope}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["scopes"] })}
        existingCategories={uniqueCategories}
      />
    </div>
  );
}
