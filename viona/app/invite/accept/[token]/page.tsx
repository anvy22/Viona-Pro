// File: app/invite/accept/[token]/page.tsx
// Page to accept organization invite via token

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/app/inventory/actions";
import { useToast } from "@/components/ui/toast";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;

  useEffect(() => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid invitation token",
        variant: "destructive",
      });
      router.push("/organization");
      return;
    }

    acceptInvite(token)
      .then((orgId) => {
        toast({
          title: "Success",
          description: `Joined organization successfully!`,
        });
        router.push("/organization");
      })
      .catch((err: Error) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
        router.push("/organization");
      });
  }, [token, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-card rounded-xl shadow-sm p-6">Processing invitation...</div>
    </div>
  );
}