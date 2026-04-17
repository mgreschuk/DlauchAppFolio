"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScopeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  vendorFilter: string;
  onVendorChange: (value: string) => void;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  categories: string[];
  vendors: string[];
}

export function ScopeFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  vendorFilter,
  onVendorChange,
  showInactive,
  onShowInactiveChange,
  categories,
  vendors,
}: ScopeFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="text"
        placeholder="Search scopes..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-56 bg-[#1e293b] border-[#334155] text-[#f8fafc] placeholder:text-[#64748b]"
      />

      <Select
        value={categoryFilter || null}
        onValueChange={(value) => onCategoryChange(value ?? "")}
      >
        <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-[#f8fafc] data-placeholder:text-[#64748b]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent className="bg-[#1e293b] border-[#334155]">
          <SelectItem value="__all__" className="text-[#f8fafc] focus:bg-[#334155]">
            All categories
          </SelectItem>
          {categories.map((cat) => (
            <SelectItem
              key={cat}
              value={cat}
              className="text-[#f8fafc] focus:bg-[#334155]"
            >
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={vendorFilter || null}
        onValueChange={(value) => onVendorChange(value ?? "")}
      >
        <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-[#f8fafc] data-placeholder:text-[#64748b]">
          <SelectValue placeholder="All vendors" />
        </SelectTrigger>
        <SelectContent className="bg-[#1e293b] border-[#334155]">
          <SelectItem value="__all__" className="text-[#f8fafc] focus:bg-[#334155]">
            All vendors
          </SelectItem>
          {vendors.map((vendor) => (
            <SelectItem
              key={vendor}
              value={vendor}
              className="text-[#f8fafc] focus:bg-[#334155]"
            >
              {vendor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Switch
          checked={showInactive}
          onCheckedChange={onShowInactiveChange}
          id="show-inactive"
        />
        <Label
          htmlFor="show-inactive"
          className="text-sm text-[#94a3b8] cursor-pointer select-none"
        >
          Show inactive
        </Label>
      </div>
    </div>
  );
}
