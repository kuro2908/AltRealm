import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/utils";
import { Shield, Users, BookOpen, Ban, Eye, EyeOff, Trash2 } from "lucide-react";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"users" | "stories">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = await db.getUser();
      if (!user?.isAdmin) { navigate("/dashboard"); return; }
      const [u, s] = await Promise.all([db.getAllUsers(), db.getAllFeed()]);
      setUsers(u);
      setStories(s);
      setLoading(false);
    };
    load();
  }, []);

  const handleBanUser = async (userId: string, banned: boolean) => {
    await db.banUser(userId, banned);
    setUsers(prev => prev.map(u => u.uid === userId ? { ...u, banned } : u));
  };

  const handleHideStory = async (storyId: string, hidden: boolean) => {
    await db.hideFeedStory(storyId, hidden);
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, hidden } : s));
  };

  const handleDeleteStory = async (storyId: string) => {
    await db.deleteFeedStory(storyId);
    setStories(prev => prev.filter(s => s.id !== storyId));
    setDeleteConfirm(null);
  };

  if (loading) return null;

  const tabs = [
    { id: "users", label: "Người dùng", icon: Users, count: users.length },
    { id: "stories", label: "Truyện cộng đồng", icon: BookOpen, count: stories.length },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Quản trị</h1>
            <p className="text-sm text-muted-foreground">Quản lý người dùng và nội dung cộng đồng.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-secondary/50 rounded-lg w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-sw ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-secondary text-muted-foreground" : "bg-secondary/50 text-muted-foreground/60"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="rounded-xl border border-border overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-secondary/10 transition-sw">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground/60 flex-shrink-0">
                          {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {user.displayName || "—"}
                        </span>
                        {user.isAdmin && (
                          <span className="text-[9px] font-mono uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3.5">
                      {user.banned ? (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          Bị cấm
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleBanUser(user.uid, !user.banned)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-sw ${
                            user.banned
                              ? "bg-secondary text-foreground hover:bg-secondary/70"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {user.banned ? "Bỏ cấm" : "Cấm"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground/50">
                      Không có người dùng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Stories tab */}
        {tab === "stories" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="rounded-xl border border-border overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Truyện</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tác giả</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stories.map(story => (
                  <tr key={story.id} className={`hover:bg-secondary/10 transition-sw ${story.hidden ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-foreground">{story.title}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{story.author}</td>
                    <td className="px-5 py-3.5">
                      {story.hidden ? (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          Đã ẩn
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Công khai
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleHideStory(story.id, !story.hidden)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 text-foreground transition-sw"
                        >
                          {story.hidden
                            ? <><Eye className="h-3.5 w-3.5" /> Hiện</>
                            : <><EyeOff className="h-3.5 w-3.5" /> Ẩn</>
                          }
                        </button>
                        {deleteConfirm === story.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Chắc chắn?</span>
                            <button
                              onClick={() => handleDeleteStory(story.id)}
                              className="text-xs px-2 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-sw"
                            >
                              Xóa
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-2 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/70 transition-sw"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(story.id)}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-sw"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {stories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground/50">
                      Chưa có truyện nào được đăng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
