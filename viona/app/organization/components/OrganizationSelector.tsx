// File: app/organization/components/OrganizationSelector.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrgId: string | null;
  onOrganizationSelect: (orgId: string) => void;
  disabled?: boolean;
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onOrganizationSelect,
  disabled = false,
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the currently selected organization
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  // Handle selection change
  const handleValueChange = (value: string) => {
    if (value && value !== selectedOrgId) {
      onOrganizationSelect(value);
    }
    setIsOpen(false);
  };

  // If no organizations available
  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md min-w-0">
  <Building2 className="h-4 w-4 flex-shrink-0" />
  <span className="truncate">No organizations </span>
</div>
    );
  }

  return (
    <Select
      value={selectedOrgId || ""}
      onValueChange={handleValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue 
            placeholder="Select organization"
            className="truncate"
          >
            {selectedOrg ? (
              <span className="truncate">{selectedOrg.name}</span>
            ) : (
              "Select organization"
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">
                Role: {org.role}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}