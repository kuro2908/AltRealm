import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowUp, MessageSquare, Send, CornerDownRight, BookOpen, LogIn } from "lucide-react";
import { db } from "@/lib/utils";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <div className={`${cls} rounded-full bg-secondary flex items-center justify-center flex-shrink-0 font-bold text-foreground/60`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CommunityFeed() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  // Guest warning popup
  const [guestReadTarget, setGuestReadTarget] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [data, user] = await Promise.all([db.getFeed(), db.getUser()]);
      if (!mounted) return;
      setFeed(data || []);
      setCurrentUser(user);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const requireAuth = (action: () => void) => {
    if (!currentUser) { navigate("/auth"); return; }
    if (currentUser.banned) return; // silently block banned users
    action();
  };

  const handleReadClick = (e: React.MouseEvent, storyId: string) => {
    if (!currentUser) {
      e.preventDefault();
      setGuestReadTarget(storyId);
    }
  };

  const handleUpvote = async (storyId: string) => {
    if (!currentUser || currentUser.banned) return;
    const uid = currentUser.email || "anon";
    const updated = feed.map(s => {
      if (s.id !== storyId) return s;
      const by: string[] = s.upvotedBy || [];
      const has = by.includes(uid);
      return {
        ...s,
        upvotes: (s.upvotes || 0) + (has ? -1 : 1),
        upvotedBy: has ? by.filter(u => u !== uid) : [...by, uid],
      };
    });
    setFeed(updated);
    await db.saveFeed(updated);
  };

  const toggleComments = async (storyId: string) => {
    if (openComments === storyId) { setOpenComments(null); return; }
    setOpenComments(storyId);
    if (!commentsMap[storyId]) {
      const data = await db.getComments(storyId);
      setCommentsMap(prev => ({ ...prev, [storyId]: data || [] }));
    }
  };

  const saveComments = async (storyId: string, updated: any[]) => {
    setCommentsMap(prev => ({ ...prev, [storyId]: updated }));
    await db.saveComments(storyId, updated);
    const updatedFeed = feed.map(s =>
      s.id === storyId ? { ...s, comments: updated.length } : s
    );
    setFeed(updatedFeed);
    await db.saveFeed(updatedFeed);
  };

  const handleAddComment = async (storyId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = (inputs[storyId] || "").trim();
    if (!text) return;
    const comment = {
      id: `c_${Date.now()}`,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      text,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const updated = [...(commentsMap[storyId] || []), comment];
    setInputs(prev => ({ ...prev, [storyId]: "" }));
    await saveComments(storyId, updated);
  };

  const handleAddReply = async (storyId: string, commentId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = replyInput.trim();
    if (!text) return;
    const reply = {
      id: `r_${Date.now()}`,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = (commentsMap[storyId] || []).map(c =>
      c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
    );
    setReplyingTo(null);
    setReplyInput("");
    await saveComments(storyId, updated);
  };

  const openReply = (commentId: string) => {
    if (!currentUser) { navigate("/auth"); return; }
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyInput("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cộng đồng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Khám phá các câu chuyện phân nhánh từ khắp nơi.
          </p>
        </div>

        {/* Guest banner */}
        {!currentUser && !loading && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-muted-foreground">
            <LogIn className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
              Đăng nhập để upvote, bình luận và tạo truyện của riêng bạn.
            </span>
            <Link to="/auth" className="text-primary font-medium hover:underline flex-shrink-0">
              Đăng nhập
            </Link>
          </div>
        )}

        {!loading && feed.length === 0 && (
          <p className="text-sm text-muted-foreground/60 text-center py-16">
            Chưa có truyện nào được đăng. Hãy publish truyện của bạn từ trang Dashboard!
          </p>
        )}

        <div className="divide-y divide-border">
          {loading ? null : feed.map((story, i) => {
            const uid = currentUser?.email || "anon";
            const hasUpvoted = (story.upvotedBy || []).includes(uid);
            const commentCount = commentsMap[story.id]?.length ?? story.comments ?? 0;
            const isOpen = openComments === story.id;

            return (
              <motion.article
                key={story.id}
                className="py-8 first:pt-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-tighter text-primary">{story.author}</span>
                  {story.publishedAt && (
                    <span className="text-[10px] text-muted-foreground/50">· {timeAgo(story.publishedAt)}</span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-foreground mb-2">{story.title}</h2>

                {story.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{story.description}</p>
                )}

                {story.tags?.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {story.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Link
                    to={`/explore/${story.id}`}
                    onClick={e => handleReadClick(e, story.id)}
                    className="inline-flex items-center px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw"
                  >
                    Đọc truyện
                  </Link>

                  <button
                    onClick={() => requireAuth(() => handleUpvote(story.id))}
                    className={`flex items-center gap-1.5 text-sm transition-sw ${
                      hasUpvoted && currentUser
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={!currentUser ? "Đăng nhập để upvote" : undefined}
                  >
                    <ArrowUp className={`h-4 w-4 ${hasUpvoted && currentUser ? "fill-primary/20" : ""}`} />
                    {story.upvotes || 0}
                  </button>

                  <button
                    onClick={() => toggleComments(story.id)}
                    className={`flex items-center gap-1.5 text-sm transition-sw ${
                      isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {commentCount}
                  </button>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={transition}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 space-y-5">
                        {(commentsMap[story.id] || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground/50 py-2">Chưa có bình luận nào.</p>
                        ) : (
                          (commentsMap[story.id] || []).map((c: any) => (
                            <div key={c.id}>
                              <div className="flex gap-3">
                                <Avatar name={c.author} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-foreground/80">{c.author}</span>
                                    <span className="text-[10px] text-muted-foreground/40">{timeAgo(c.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-foreground/70 leading-relaxed">{c.text}</p>
                                  <button
                                    onClick={() => openReply(c.id)}
                                    className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-sw"
                                  >
                                    <CornerDownRight className="h-3 w-3" />
                                    {replyingTo === c.id ? "Hủy" : "Trả lời"}
                                  </button>
                                </div>
                              </div>

                              {((c.replies || []).length > 0 || replyingTo === c.id) && (
                                <div className="ml-10 mt-3 space-y-3 pl-3 border-l-2 border-border/30">
                                  {(c.replies || []).map((r: any) => (
                                    <div key={r.id} className="flex gap-2">
                                      <Avatar name={r.author} size="sm" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                          <span className="text-xs font-semibold text-foreground/80">{r.author}</span>
                                          <span className="text-[10px] text-muted-foreground/40">{timeAgo(r.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-foreground/70 leading-relaxed">{r.text}</p>
                                      </div>
                                    </div>
                                  ))}

                                  <AnimatePresence>
                                    {replyingTo === c.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={transition}
                                        className="flex gap-2"
                                      >
                                        <input
                                          autoFocus
                                          value={replyInput}
                                          onChange={e => setReplyInput(e.target.value)}
                                          onKeyDown={e => { if (e.key === "Enter") handleAddReply(story.id, c.id); }}
                                          placeholder={`Trả lời ${c.author}...`}
                                          className="flex-1 text-sm bg-secondary/50 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                                        />
                                        <button
                                          onClick={() => handleAddReply(story.id, c.id)}
                                          disabled={!replyInput.trim()}
                                          className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-sw"
                                        >
                                          <Send className="h-3.5 w-3.5" />
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {/* Comment input or login prompt */}
                        {currentUser && !currentUser.banned ? (
                          <div className="flex gap-2 pt-1 border-t border-border/30">
                            <input
                              value={inputs[story.id] || ""}
                              onChange={e => setInputs(prev => ({ ...prev, [story.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") handleAddComment(story.id); }}
                              placeholder="Viết bình luận..."
                              className="flex-1 text-sm bg-secondary/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                            />
                            <button
                              onClick={() => handleAddComment(story.id)}
                              disabled={!(inputs[story.id] || "").trim()}
                              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-sw"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-border/30">
                            <Link
                              to="/auth"
                              className="text-xs text-muted-foreground/60 hover:text-primary transition-sw"
                            >
                              Đăng nhập để bình luận →
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Guest read warning popup */}
      <AnimatePresence>
        {guestReadTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setGuestReadTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={transition}
              className="bg-card rounded-2xl p-7 max-w-sm w-full shadow-elevated"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <BookOpen className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Bạn chưa đăng nhập
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Lịch sử đọc và bản đồ khám phá truyện sẽ <span className="font-medium text-foreground/80">không được lưu lại</span>. Đăng nhập để theo dõi tiến trình của bạn.
                </p>
                <div className="flex gap-2 w-full">
                  <Link
                    to="/auth"
                    className="flex-1 text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-sw"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to={`/explore/${guestReadTarget}`}
                    className="flex-1 text-center px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-sw"
                    onClick={() => setGuestReadTarget(null)}
                  >
                    Tiếp tục đọc
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
