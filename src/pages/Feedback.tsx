import { DashboardLayout } from "@/components/DashboardLayout";
import { db } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownRight, LogIn, MessageSquare, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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

export default function Feedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [editingReply, setEditingReply] = useState<{ commentId: string; replyId: string } | null>(null);
  const [editReplyInput, setEditReplyInput] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [data, user] = await Promise.all([db.getFeedback(), db.getUser()]);
      if (!mounted) return;
      setComments(data || []);
      setCurrentUser(user);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const requireAuth = (action: () => void) => {
    if (!currentUser) { navigate("/auth"); return; }
    if (currentUser.banned) return;
    action();
  };

  const saveFeedback = async (updated: any[]) => {
    setComments(updated);
    await db.saveFeedback(updated);
  };

  const handleAddComment = async () => {
    if (!currentUser || currentUser.banned) return;
    const text = input.trim();
    if (!text) return;
    const comment = {
      id: `f_${Date.now()}`,
      authorId: currentUser.uid,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      text,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setInput("");
    await saveFeedback([...comments, comment]);
  };

  const handleAddReply = async (commentId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = replyInput.trim();
    if (!text) return;
    const reply = {
      id: `fr_${Date.now()}`,
      authorId: currentUser.uid,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = comments.map(c =>
      c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c,
    );
    setReplyingTo(null);
    setReplyInput("");
    await saveFeedback(updated);
  };

  const openReply = (commentId: string) => {
    if (!currentUser) { navigate("/auth"); return; }
    if (currentUser.banned) return;
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyInput("");
  };

  const canPost = currentUser && !currentUser.banned;
  const canEdit = (item: any) => Boolean(currentUser && !currentUser.banned && item?.authorId && item.authorId === currentUser.uid);
  const canDelete = (item: any) => Boolean(currentUser && !currentUser.banned && (currentUser.isAdmin || (item?.authorId && item.authorId === currentUser.uid)));

  const startEditComment = (comment: any) => {
    if (!canEdit(comment)) return;
    setEditingCommentId(comment.id);
    setEditInput(comment.text || "");
    setEditingReply(null);
    setEditReplyInput("");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditInput("");
  };

  const saveEditedComment = async (commentId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = editInput.trim();
    if (!text) return;
    const updated = comments.map(c => c.id === commentId ? { ...c, text } : c);
    setEditingCommentId(null);
    setEditInput("");
    await saveFeedback(updated);
  };

  const deleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!canDelete(comment)) return;
    const updated = comments.filter(c => c.id !== commentId);
    setEditingCommentId(null);
    setEditingReply(null);
    setEditInput("");
    setEditReplyInput("");
    await saveFeedback(updated);
  };

  const startEditReply = (commentId: string, reply: any) => {
    if (!canEdit(reply)) return;
    setEditingReply({ commentId, replyId: reply.id });
    setEditReplyInput(reply.text || "");
    setEditingCommentId(null);
    setEditInput("");
  };

  const cancelEditReply = () => {
    setEditingReply(null);
    setEditReplyInput("");
  };

  const saveEditedReply = async (commentId: string, replyId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = editReplyInput.trim();
    if (!text) return;
    const updated = comments.map(c => {
      if (c.id !== commentId) return c;
      const replies = (c.replies || []).map((r: any) => r.id === replyId ? { ...r, text } : r);
      return { ...c, replies };
    });
    setEditingReply(null);
    setEditReplyInput("");
    await saveFeedback(updated);
  };

  const deleteReply = async (commentId: string, replyId: string) => {
    const comment = comments.find(c => c.id === commentId);
    const reply = (comment?.replies || []).find((r: any) => r.id === replyId);
    if (!canDelete(reply)) return;
    const updated = comments.map(c => {
      if (c.id !== commentId) return c;
      return { ...c, replies: (c.replies || []).filter((r: any) => r.id !== replyId) };
    });
    setEditingReply(null);
    setEditReplyInput("");
    await saveFeedback(updated);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-2">Trang góp ý</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ ý tưởng, lỗi gặp phải, hoặc đề xuất cải tiến để AltRealm tốt hơn.
          </p>
        </div>

        {!currentUser && !loading && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-muted-foreground">
            <LogIn className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
              Đăng nhập để gửi góp ý và trả lời thảo luận.
            </span>
            <Link to="/auth" className="text-primary font-medium hover:underline flex-shrink-0">
              Đăng nhập
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/40 p-4 mb-6">
          <div className="flex gap-3">
            <Avatar name={currentUser?.displayName || currentUser?.email || "Ẩn danh"} />
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Viết góp ý của bạn..."
                className="w-full min-h-[90px] text-sm bg-secondary/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                disabled={!canPost}
              />
              <div className="mt-2 flex items-center justify-between">
                {canPost ? (
                  <span className="text-[11px] text-muted-foreground/60">Gửi góp ý để mọi người cùng thảo luận.</span>
                ) : (
                  <Link to="/auth" className="text-xs text-muted-foreground/60 hover:text-primary transition-sw">
                    Đăng nhập để gửi góp ý →
                  </Link>
                )}
                <button
                  onClick={() => requireAuth(handleAddComment)}
                  disabled={!canPost || !input.trim()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-sw"
                >
                  <Send className="h-4 w-4" />
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? null : (
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-12">
                Chưa có góp ý nào. Hãy bắt đầu cuộc thảo luận đầu tiên.
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/60 bg-card/30 p-5">
                  <div className="flex gap-3">
                    <Avatar name={c.author} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground/80">{c.author}</span>
                          <span className="text-[10px] text-muted-foreground/40">{timeAgo(c.createdAt)}</span>
                        </div>
                        {(canEdit(c) || canDelete(c)) && (
                          <div className="flex items-center gap-2">
                            {canEdit(c) && (
                              <button
                                onClick={() => startEditComment(c)}
                                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground transition-sw"
                              >
                                <Pencil className="h-3 w-3" />
                                Sửa
                              </button>
                            )}
                            {canDelete(c) && (
                              <button
                                onClick={() => deleteComment(c.id)}
                                className="inline-flex items-center gap-1 text-[10px] text-destructive/80 hover:text-destructive transition-sw"
                              >
                                <Trash2 className="h-3 w-3" />
                                Xóa
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-1">
                          <textarea
                            value={editInput}
                            onChange={e => setEditInput(e.target.value)}
                            className="w-full min-h-[70px] text-sm bg-secondary/50 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => saveEditedComment(c.id)}
                              disabled={!editInput.trim()}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-sw"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/70 transition-sw"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground/70 leading-relaxed">{c.text}</p>
                          <button
                            onClick={() => openReply(c.id)}
                            className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-sw"
                          >
                            <CornerDownRight className="h-3 w-3" />
                            {replyingTo === c.id ? "Hủy" : "Trả lời"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {((c.replies || []).length > 0 || replyingTo === c.id) && (
                    <div className="ml-10 mt-3 space-y-3 pl-3 border-l-2 border-border/30">
                      {(c.replies || []).map((r: any) => (
                        <div key={r.id} className="flex gap-2">
                          <Avatar name={r.author} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-foreground/80">{r.author}</span>
                                <span className="text-[10px] text-muted-foreground/40">{timeAgo(r.createdAt)}</span>
                              </div>
                              {(canEdit(r) || canDelete(r)) && (
                                <div className="flex items-center gap-2">
                                  {canEdit(r) && (
                                    <button
                                      onClick={() => startEditReply(c.id, r)}
                                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground transition-sw"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Sửa
                                    </button>
                                  )}
                                  {canDelete(r) && (
                                    <button
                                      onClick={() => deleteReply(c.id, r.id)}
                                      className="inline-flex items-center gap-1 text-[10px] text-destructive/80 hover:text-destructive transition-sw"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {editingReply?.commentId === c.id && editingReply.replyId === r.id ? (
                              <div className="mt-1">
                                <input
                                  value={editReplyInput}
                                  onChange={e => setEditReplyInput(e.target.value)}
                                  className="w-full text-sm bg-secondary/50 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    onClick={() => saveEditedReply(c.id, r.id)}
                                    disabled={!editReplyInput.trim()}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-sw"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    onClick={cancelEditReply}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/70 transition-sw"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/70 leading-relaxed">{r.text}</p>
                            )}
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
                              onKeyDown={e => { if (e.key === "Enter") handleAddReply(c.id); }}
                              placeholder={`Trả lời ${c.author}...`}
                              className="flex-1 text-sm bg-secondary/50 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/40 transition-sw"
                            />
                            <button
                              onClick={() => handleAddReply(c.id)}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
