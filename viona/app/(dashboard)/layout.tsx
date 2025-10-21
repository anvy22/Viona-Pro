import { Separator } from "@/components/ui/separator";
import DesktopSidebar from "@/components/DesktopSidebar";
import React from "react";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { SignedIn, UserButton } from '@clerk/nextjs';
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { SearchBar } from "@/components/SearchBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SignedIn>
    <div className="flex h-screen">
      <DesktopSidebar/>
      <div className="flex flex-col flex-1 min-h-screen rounded">
        <header className="flex items-center justify-between px-6 py-4 h-[50px] w-full gap-4">
           <BreadcrumbHeader/>
           <SearchBar/>
           <NotificationDropdown/>
           <div className="flex items-center gap-4">
              <ModeToggle/>
              <SignedIn>
                 <UserButton/>
              </SignedIn>
           </div>
        </header>
        <Separator />
        <div className="overflow-auto">
          <div className="flex container py-4 text-accent-foreground">
           {children}
          </div>
        </div>
      </div>
    </div>
  </SignedIn>
  );
};

export default Layout;
