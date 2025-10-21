// File: app/organization/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchBar } from "@/components/SearchBar";
import { OrganizationSelector } from "./components/OrganizationSelector";
import { useToast } from "@/hooks/use-toast";
import { useOrgStore } from "@/hooks/useOrgStore";
import {
  createOrganization,
  inviteEmployee,
  getUserOrganizations,
  updateOrganization,
  deleteOrganization,
} from "./actions";

// Types
interface Organization {
  id: string;
  name: string;
  role: string;
}

interface EditDialog {
  id: string;
  name: string;
}

export default function OrganizationPage() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  // Use global store - organizations are loaded globally via AppInitializer
  const { 
    user: appUser,
    orgs: organizations, 
    setOrgs: setOrganizations, 
    selectedOrgId, 
    setSelectedOrgId 
  } = useOrgStore();

  // UI State
  const [activeTab, setActiveTab] = useState("organizations");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [editDialog, setEditDialog] = useState<EditDialog | null>(null);
  const [editName, setEditName] = useState("");
  
  // DELETE DIALOG STATES
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [deleteOrgName, setDeleteOrgName] = useState<string>("");
  const [isForceDelete, setIsForceDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const ROLES = ["admin", "manager", "employee", "viewer"];

  // Set active tab based on organizations availability
  useEffect(() => {
    if (organizations.length === 0) {
      setActiveTab("create");
    }
  }, [organizations.length]);

  // Refresh organizations helper
  const refreshOrganizations = useCallback(async (): Promise<Organization[]> => {
    try {
      const orgs = await getUserOrganizations();
      setOrganizations(orgs);
      return orgs;
    } catch (err: any) {
      console.error('Failed to refresh organizations:', err);
      throw new Error(err.message || "Failed to refresh organizations");
    }
  }, [setOrganizations]);

  // Organization selection handler
  const selectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrgId(orgId);
  }, [setSelectedOrgId]);

  // FIXED: Create organization handler
  const handleCreateOrganization = useCallback(async () => {
    if (!orgName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('Creating organization:', orgName.trim());
      const newOrgId = await createOrganization(orgName.trim());
      
      toast({
        title: "Success",
        description: "Organization created successfully",
      });

      // Reset form
      setOrgName("");
      
      // Refresh organizations and auto-select the new one
      const updatedOrgs = await refreshOrganizations();
      selectOrganization(newOrgId);

      // Switch to organizations tab
      if (updatedOrgs.length > 0) {
        setActiveTab("organizations");
      }
    } catch (err: any) {
      console.error('Create organization error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [orgName, isSubmitting, refreshOrganizations, selectOrganization, toast]);

  const handleSendInvite = useCallback(async () => {
    if (!selectedOrgId || !inviteEmail.trim() || !inviteRole || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await inviteEmployee(selectedOrgId, inviteEmail.trim(), inviteRole);
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      // Reset form
      setInviteEmail("");
      setInviteRole("viewer");

      console.log("Invite link:", `/invite/accept?token=${token}`);
    } catch (err: any) {
      console.error('Invite error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOrgId, inviteEmail, inviteRole, isSubmitting, toast]);

  const handleUpdateOrganization = useCallback(async () => {
    if (!editDialog || !editName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateOrganization(editDialog.id, editName.trim());
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });

      setEditDialog(null);
      setEditName("");
      await refreshOrganizations();
    } catch (err: any) {
      console.error('Update organization error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editDialog, editName, isSubmitting, refreshOrganizations, toast]);

  // FIXED: Delete organization handler with better error handling
  const handleDeleteOrganization = useCallback(async () => {
    if (!deleteOrgId || isSubmitting) return;

    setIsSubmitting(true);
    setDeleteError(null);
    
    try {
      console.log(`Attempting to delete organization ${deleteOrgId}, force: ${isForceDelete}`);
      await deleteOrganization(deleteOrgId, isForceDelete);
      
      toast({
        title: "Success",
        description: isForceDelete 
          ? "Organization and all its data have been permanently deleted"
          : "Organization deleted successfully",
      });

      // Refresh organizations and handle selection
      const updatedOrgs = await refreshOrganizations();

      // If deleted org was selected, select another or clear selection
      if (selectedOrgId === deleteOrgId) {
        const newSelection = updatedOrgs.length > 0 ? updatedOrgs[0].id : null;
        selectOrganization(newSelection);
      }

      // Reset delete dialog state
      closeDeleteDialog();
      
    } catch (err: any) {
      console.error('Delete organization error:', err);
      
      const errorMessage = err.message || "Failed to delete organization";
      
      // Check if it's a force delete error
      if (errorMessage.toLowerCase().includes('cannot delete') || 
          errorMessage.toLowerCase().includes('has existing') ||
          errorMessage.toLowerCase().includes('foreign key')) {
        setDeleteError(`${errorMessage}. Check the "Force delete all data" option to permanently delete everything.`);
      } else {
        setDeleteError(errorMessage);
        // Close dialog for other types of errors
        if (!errorMessage.toLowerCase().includes('force delete')) {
          closeDeleteDialog();
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteOrgId, isForceDelete, isSubmitting, selectedOrgId, refreshOrganizations, selectOrganization, toast]);

  // Dialog handlers
  const openEditDialog = useCallback((org: Organization) => {
    setEditDialog({ id: org.id, name: org.name });
    setEditName(org.name);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialog(null);
    setEditName("");
  }, []);

  const openDeleteDialog = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    setDeleteOrgId(orgId);
    setDeleteOrgName(org?.name || "");
    setIsForceDelete(false);
    setDeleteError(null);
  }, [organizations]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteOrgId(null);
    setDeleteOrgName("");
    setIsForceDelete(false);
    setDeleteError(null);
  }, []);

  return (
    <SignedIn>
      <div className="flex h-screen">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 h-[50px] w-full gap-4 flex-shrink-0">
            <BreadcrumbHeader />
            <div className="flex-1 max-w-xs">
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrgId}
                onOrganizationSelect={selectOrganization}
                disabled={isSubmitting}
              />
            </div>
            <SearchBar />
            <NotificationDropdown />
            <div className="gap-4 flex items-center">
              <ModeToggle />
              <UserButton />
            </div>
          </header>
          <Separator />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 md:p-8 pt-6">
              <div className="bg-card rounded-xl shadow-sm p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="organizations">My Organizations</TabsTrigger>
                    <TabsTrigger value="create">Create Organization</TabsTrigger>
                    <TabsTrigger value="invite">Invite Employee</TabsTrigger>
                  </TabsList>

                  {/* Organizations Tab */}
                  <TabsContent value="organizations" className="space-y-4 mt-4">
                    {organizations.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No organizations yet.</p>
                        <Button onClick={() => setActiveTab("create")}>
                          Create Your First Organization
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {organizations.map((org) => (
                          <Card key={org.id}>
                            <CardHeader>
                              <CardTitle>{org.name}</CardTitle>
                              <CardDescription>Role: {org.role}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                              <Button
                                variant={selectedOrgId === org.id ? "default" : "outline"}
                                onClick={() => selectOrganization(org.id)}
                                className="flex-1"
                                disabled={isSubmitting}
                              >
                                {selectedOrgId === org.id ? "Selected" : "Select"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => openEditDialog(org)}
                                disabled={isSubmitting}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => openDeleteDialog(org.id)}
                                disabled={isSubmitting}
                              >
                                Delete
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Create Tab */}
                  <TabsContent value="create" className="space-y-4 mt-4">
                    <Input
                      placeholder="Organization Name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && orgName.trim()) {
                          handleCreateOrganization();
                        }
                      }}
                    />
                    <Button
                      onClick={handleCreateOrganization}
                      className="w-full sm:w-auto"
                      disabled={!orgName.trim() || isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Create Organization"}
                    </Button>
                  </TabsContent>

                  {/* Invite Tab */}
                  <TabsContent value="invite" className="space-y-4 mt-4">
                    {!selectedOrgId ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          Please select an organization first to invite employees.
                        </p>
                        <Button onClick={() => setActiveTab("organizations")} variant="outline">
                          Go to Organizations
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Employee Email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <Select
                          value={inviteRole}
                          onValueChange={setInviteRole}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleSendInvite}
                          className="w-full sm:w-auto"
                          disabled={!inviteEmail.trim() || !inviteRole || isSubmitting}
                        >
                          {isSubmitting ? "Sending..." : "Send Invite"}
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Organization Dialog */}
        <Dialog open={!!editDialog} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>Update the organization name.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editName.trim()) {
                      handleUpdateOrganization();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleUpdateOrganization} disabled={!editName.trim() || isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Organization Dialog */}
        <Dialog open={!!deleteOrgId} onOpenChange={closeDeleteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Organization
              </DialogTitle>
              <DialogDescription>
                You are about to delete "{deleteOrgName}". This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Show error if there's existing data */}
              {deleteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {deleteError}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Force delete checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="force-delete"
                  checked={isForceDelete}
                  onCheckedChange={(checked: boolean) => setIsForceDelete(checked)}
                  disabled={isSubmitting}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="force-delete" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Force delete all data
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Delete organization and permanently remove all associated products, orders, warehouses, and members
                  </p>
                </div>
              </div>
              
              {/* Warning when force delete is enabled */}
              {isForceDelete && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">⚠️ PERMANENT DATA LOSS WARNING</p>
                    <p className="text-sm">
                      This will permanently delete ALL data including:
                    </p>
                    <ul className="text-sm list-disc ml-4 space-y-1">
                      <li>All products and inventory</li>
                      <li>All orders and order history</li>
                      <li>All warehouses and locations</li>
                      <li>All team members and invitations</li>
                      <li>The organization itself</li>
                    </ul>
                    <p className="text-sm font-medium">This action CANNOT be undone!</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={closeDeleteDialog} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteOrganization} 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Deleting..." 
                  : isForceDelete 
                    ? "Force Delete Organization" 
                    : "Delete Organization"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SignedIn>
  );
}