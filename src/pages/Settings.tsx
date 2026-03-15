import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/utils";
import { THEMES, applyTheme } from "@/lib/themes";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [activeTheme, setActiveTheme] = useState("default");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.getUser().then((u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.displayName || "");
        setEmail(u.email || "");
        setActiveTheme(u.bgTheme || "default");
      }
    });
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
  };

  const handleSave = async () => {
    const updated = { ...user, displayName, email, bgTheme: activeTheme };
    await db.saveUser(updated);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cài đặt</h1>
          <p className="text-sm text-muted-foreground mt-1">Tùy chỉnh hồ sơ và giao diện.</p>
        </div>

        <div className="space-y-8">
          {/* Profile section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Hồ sơ</h2>
            <div className="rounded-lg bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tên hiển thị</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-sw"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-sw"
                />
              </div>
            </div>
          </section>

          {/* Theme section */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Màu nền</h2>
            <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="grid grid-cols-4 gap-3">
                {THEMES.map((theme) => (
                  <motion.button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    whileTap={{ scale: 0.95 }}
                    transition={transition}
                    className={`relative flex flex-col items-center gap-2 rounded-xl p-3 border-2 transition-sw ${
                      activeTheme === theme.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-12 h-12 rounded-lg shadow-sm ring-1 ring-black/10 flex items-center justify-center"
                      style={{ backgroundColor: theme.preview }}
                    >
                      {activeTheme === theme.id && (
                        <div className="w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium text-center leading-tight">
                      {theme.name}
                    </span>
                    {theme.dark && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] bg-foreground/10 text-foreground/60 px-1 rounded">
                        tối
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
                Thay đổi sẽ áp dụng ngay lập tức và được lưu cùng hồ sơ.
              </p>
            </div>
          </section>

          {/* Save button */}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-primary flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Đã lưu
              </motion.span>
            )}
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
