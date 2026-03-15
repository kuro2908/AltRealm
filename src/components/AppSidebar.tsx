import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Users, Settings, Plus, ChevronLeft, LayoutGrid, LogOut } from "lucide-react";
import { db } from "@/lib/utils";

const navItems = [
  { label: "My Stories", icon: BookOpen, path: "/dashboard" },
  { label: "Community Feed", icon: Users, path: "/community" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    db.getUser().then(u => setUser(u));
  }, []);

  const handleLogout = async () => {
    await db.logout();
    navigate("/auth");
  };

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-card transition-sw ${collapsed ? "w-16" : "w-60"
        }`}
      style={{ boxShadow: "1px 0 0 0 hsl(var(--border))" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground tracking-tight">
              StoryWeaver
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-sw ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* New Story */}
      <div className="px-3 mt-2">
        <Link
          to="/editor/new"
          className={`flex items-center gap-2 rounded-lg bg-primary text-primary-foreground transition-sw hover:opacity-90 ${collapsed ? "justify-center p-2.5" : "px-3 py-2"
            }`}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="text-sm font-medium">New Story</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-6 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg transition-sw ${collapsed ? "justify-center p-2.5" : "px-3 py-2"
                } ${active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mb-4">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full rounded-lg transition-sw text-muted-foreground hover:bg-secondary hover:text-foreground ${collapsed ? "justify-center p-2.5" : "px-3 py-2"
            }`}
          title={user?.email || "Logout"}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm truncate">{user?.email || "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}
