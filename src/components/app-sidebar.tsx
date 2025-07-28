"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Inbox, Calendar, Settings, Layers, Book, LogOut, User, BarChart3 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import React from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function AppSidebar({ user }: { user: { name?: string; email?: string; image?: string } | null }) {
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("")
    : user?.email?.[0]?.toUpperCase() || "U";
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();

  const handleNav = (url: string) => {
    router.push(url);
    if (isMobile) setOpen(false);
  };

  const platformItems = [
    { title: "Food Analysis", url: "/dashboard", icon: Home },
    { title: "History", url: "/history", icon: Inbox },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Settings", url: "/settings", icon: Settings },
  ];
  const resourceItems = [
    { title: "Models", url: "/dashboard", icon: Layers },
    { title: "Documentation", url: "/dashboard", icon: Book },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Acme Inc</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.url)}
                      className={isActive ? "bg-neutral-300 text-foreground" : ""}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.url)}
                      className={isActive ? "bg-muted text-foreground" : ""}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-sidebar-accent">
                <Avatar>
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email || "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-medium text-sm leading-tight">{user.name || user.email}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-medium">{user.name || user.email}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNav("/account")}> <User className="w-4 h-4 mr-2" /> Account </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNav("/settings")}> <Settings className="w-4 h-4 mr-2" /> Settings </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { signOut({ callbackUrl: "/login" }); if (isMobile) setOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
} 