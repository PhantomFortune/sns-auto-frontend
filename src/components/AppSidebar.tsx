import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Film,
  Send,
  Calendar,
  MonitorPlay,
  FolderOpen,
  Settings,
  HelpCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "ダッシュボード", url: "/", icon: LayoutDashboard },
  { title: "ライブモニター", url: "/live-monitor", icon: Radio },
  { title: "データ分析", url: "/analytics", icon: BarChart3 },
  { title: "コンテンツスタジオ", url: "/content-studio", icon: Film },
  { title: "投稿サポート", url: "/post-support", icon: Send },
  { title: "スケジューラー", url: "/scheduler", icon: Calendar },
  { title: "OBSコントロール", url: "/obs-control", icon: MonitorPlay },
  { title: "ファイル管理", url: "/file-management", icon: FolderOpen },
];

const systemItems = [
  { title: "設定", url: "/settings", icon: Settings },
  { title: "ヘルプ", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Radio className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-sidebar-foreground leading-tight">
                SNS運営支援
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            メインメニュー
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = item.url === "/" 
                  ? currentPath === "/"
                  : currentPath.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : ""}`} />
                        {open && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            システム
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemItems.map((item) => {
                const isActive = currentPath.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : ""}`} />
                        {open && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}