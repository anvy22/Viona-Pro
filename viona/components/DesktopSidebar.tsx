"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Package,
  Layers2Icon,
  ShieldCheckIcon,
  CoinsIcon,
  MenuIcon,
  ChevronLeft,
  ChevronRight,
  Logs, 
  Blocks,
  LayoutDashboard,
  GitBranch,
  Building2
} from "lucide-react";
import { Logo } from "./Logo";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const routes = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Logs },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/workflows", label: "Workflows", icon: Layers2Icon },
  { href: "/automations", label: "Automations", icon: GitBranch },
  { href: "/integrations", label: "Integrations", icon: Blocks },
  { href: "/credentials", label: "Credentials", icon: ShieldCheckIcon },
  { href: "/billing", label: "Billing", icon: CoinsIcon },
  { href: "/organization", label: "Organization", icon: Building2 }
];

// Global state to persist across re-renders and route changes
let globalCollapsedState = false;
let hasLoadedFromStorage = false;

const DesktopSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(globalCollapsedState);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  const pathname = usePathname();

  // Load from localStorage only once on first mount
  useEffect(() => {
    setIsMounted(true);
    
    if (!hasLoadedFromStorage) {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        const savedState = JSON.parse(saved);
        globalCollapsedState = savedState;
        setIsCollapsed(savedState);
      }
      hasLoadedFromStorage = true;
    }
  }, []);

  // Memoized active route calculation to prevent unnecessary recalculations
  const activeRoute = useMemo(() => {
    return routes.find((route) => {
      if (route.href === "/") {
        return pathname === "/";
      }
      return pathname === route.href || pathname.startsWith(route.href + "/");
    }) || routes[0];
  }, [pathname]);

  // Stable toggle function that updates both local and global state
  const toggleCollapse = useCallback(() => {
    const newState = !globalCollapsedState;
    globalCollapsedState = newState;
    setIsCollapsed(newState);
    
    if (isMounted) {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    }
  }, [isMounted]);

  // Don't render with transitions until mounted to prevent hydration flicker
  if (!isMounted) {
    return (
      <div className="hidden relative md:block min-w-[240px] max-w-[240px] h-screen overflow-hidden w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate">
        <div className="flex items-center justify-between gap-2 border-b-[1px] border-separate p-4">
          <Logo />
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft size={20} />
          </Button>
        </div>
        <div className="flex flex-col p-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`${buttonVariants({ variant: "sidebarItem" })} justify-start`}
            >
              <route.icon size={20} className="shrink-0" />
              <span className="ml-2">{route.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="hidden relative md:block h-screen overflow-hidden bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate transition-all duration-300 ease-in-out"
        style={{
          width: isCollapsed ? '65px' : '240px',
          minWidth: isCollapsed ? '65px' : '240px',
          maxWidth: isCollapsed ? '65px' : '240px',
        }}
      >
        {/* Top section with logo + collapse button */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } gap-2 border-b-[1px] border-separate p-4`}
        >
          <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <Logo />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="shrink-0 flex-none"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        {/* Sidebar links */}
        <div className="flex flex-col p-2">
          {routes.map((route) => {
            const isActive = activeRoute.href === route.href;
            
            const linkElement = (
              <Link
                key={route.href}
                href={route.href}
                className={`${buttonVariants({
                  variant: isActive ? "sidebarActiveItem" : "sidebarItem",
                })} ${isCollapsed ? "justify-center px-2" : "justify-start"} transition-colors duration-150 flex items-center`}
              >
                <route.icon size={20} className="shrink-0 flex-none" />
                <span 
                  className={`ml-2 transition-opacity duration-200 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}
                >
                  {route.label}
                </span>
              </Link>
            );

            // Wrap with tooltip only when collapsed
            if (isCollapsed) {
              return (
                <Tooltip key={route.href}>
                  <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{route.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkElement;
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export function MobileSidebar() {
  const [isOpen, setOpen] = useState(false);
  const pathname = usePathname();

  const activeRoute = useMemo(() => {
    return routes.find((route) => {
      if (route.href === "/") {
        return pathname === "/";
      }
      return pathname === route.href || pathname.startsWith(route.href + "/");
    }) || routes[0];
  }, [pathname]);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant={"ghost"} size={"icon"}>
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent
          className="w-[280px] sm:w-[320px] space-y-4"
          side={"left"}
        >
          <Logo />
          <div className="flex flex-col gap-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={buttonVariants({
                  variant:
                    activeRoute.href === route.href
                      ? "sidebarActiveItem"
                      : "sidebarItem",
                })}
                onClick={() => setOpen(false)}
              >
                <route.icon size={20} />
                {route.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default DesktopSidebar;