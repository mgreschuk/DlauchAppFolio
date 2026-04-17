"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

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

interface CachedVendor {
  id: string;
  appfolioId: string;
  name: string;
  syncedAt: string;
}

interface ScopeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editScope: Scope | null;
  onSuccess: () => void;
  existingCategories: string[];
}

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}

function Combobox({ value, onChange, options, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => setOpen(isOpen)}
    >
      <PopoverTrigger
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
      >
        <span className={value ? "text-[#f8fafc]" : "text-[#64748b]"}>
          {value || placeholder}
        </span>
        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50 text-[#94a3b8]" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-[#1e293b] border-[#334155]" style={{ minWidth: "var(--radix-popover-trigger-width, 240px)" }}>
        <Command className="bg-[#1e293b]">
          <CommandInput
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              onChange(val);
            }}
            placeholder={placeholder}
            className="bg-[#0f172a] text-[#f8fafc]"
          />
          <CommandList>
            <CommandEmpty className="text-[#94a3b8] p-2 text-center text-xs">
              Not found — create in AppFolio, then Sync Vendors
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onChange(opt);
                    setInputValue(opt);
                    setOpen(false);
                  }}
                  className="text-[#f8fafc] data-selected:bg-[#334155] data-selected:text-[#f8fafc] cursor-pointer"
                >
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

async function fetchCachedVendors(): Promise<CachedVendor[]> {
  const res = await fetch("/api/vendors");
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export function ScopeFormModal({
  open,
  onOpenChange,
  editScope,
  onSuccess,
  existingCategories,
}: ScopeFormModalProps) {
  const [scopeName, setScopeName] = useState("");
  const [category, setCategory] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchCachedVendors,
  });

  const vendorNames = vendors.map((v) => v.name);

  useEffect(() => {
    if (editScope) {
      setScopeName(editScope.scopeName);
      setCategory(editScope.category);
      setVendorName(editScope.vendor);
    } else {
      setScopeName("");
      setCategory("");
      setVendorName("");
    }
  }, [editScope, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!scopeName.trim() || !category.trim() || !vendorName.trim()) {
      toast.error("All fields are required");
      return;
    }

    const matchedVendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.trim().toLowerCase()
    );

    if (!matchedVendor) {
      toast.error("Vendor not found — create it in AppFolio first, then click Sync Vendors");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editScope ? `/api/scopes/${editScope.id}` : "/api/scopes";
      const method = editScope ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeName,
          category,
          vendor: vendorName.trim(),
          vendorId: matchedVendor?.appfolioId ?? null,
        }),
      });

      if (res.status === 409) {
        toast.error("A scope with this name already exists");
        return;
      }

      if (!res.ok) {
        toast.error("Failed to save scope");
        return;
      }

      toast.success(editScope ? "Scope updated" : "Scope added");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save scope");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEdit = editScope !== null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
      <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#f8fafc]">
            {isEdit ? "Edit Scope" : "Add Scope"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scope-name" className="text-[#f8fafc]">
              Scope Name
            </Label>
            <Input
              id="scope-name"
              value={scopeName}
              onChange={(e) => setScopeName(e.target.value)}
              placeholder="e.g. Paint - Interior"
              required
              className="bg-[#0f172a] border-[#334155] text-[#f8fafc] placeholder:text-[#64748b]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[#f8fafc]">Category</Label>
            <Combobox
              value={category}
              onChange={setCategory}
              options={existingCategories}
              placeholder="e.g. Painting"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[#f8fafc]">Vendor</Label>
            {vendorsLoading ? (
              <div className="px-3 py-2 text-sm text-[#94a3b8] border border-[#334155] rounded-lg bg-[#0f172a]">
                Loading vendors...
              </div>
            ) : (
              <Combobox
                value={vendorName}
                onChange={setVendorName}
                options={vendorNames}
                placeholder="Select or type a vendor name"
              />
            )}
          </div>

          <DialogFooter className="border-t border-[#334155] bg-transparent -mx-4 -mb-4 px-4 pb-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-[#334155] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || vendorsLoading}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Scope"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
