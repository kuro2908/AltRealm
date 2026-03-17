import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUp, MessageSquare, Send, LogIn } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/utils";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };
type SortMode = "newest" | "upvotes";
type PostType = "discussion" | "feedback" | "review";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

const typeLabel: Record<PostType, string> = {
  discussion: "Thảo luận",
  feedback: "Feedback",
  review: "Review",
};

export default function DiscussionBoard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ type: PostType; title: string; content: string }>({
    type: "discussion",
    title: "",
    content: "",
  });

  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await db.getDiscussions();
      if (!mounted) return;
      setPosts(data || []);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrentUser(null);
        return;
      }
      db.getUser().then((userData) => setCurrentUser(userData));
    });
    return unsub;
  }, []);

  const requireAuth = (action: () => void) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    if (currentUser.banned) return;
    action();
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const aVotes = a.upvotes || 0;
    const bVotes = b.upvotes || 0;

    if (sortMode === "upvotes") {
      return bVotes - aVotes || bTime - aTime;
    }
    return bTime - aTime || bVotes - aVotes;
  });

  const handleCreatePost = async () => {
    if (!currentUser || currentUser.banned) return;
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content || submitting) return;

    const post = {
      id: `discussion_${Date.now()}`,
      type: form.type,
      title,
      content,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      createdAt: new Date().toISOString(),
      upvotes: 0,
      upvotedBy: [],
      comments: 0,
    };

    setSubmitting(true);
    setPosts(prev => [post, ...prev]);
    setForm({ type: "discussion", title: "", content: "" });
    try {
      await db.saveDiscussion(post);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!currentUser || currentUser.banned) return;
    const uid = currentUser.email || "anon";
    let changedPost: any = null;
    const updated = posts.map((post) => {
      if (post.id !== postId) return post;
      const by: string[] = post.upvotedBy || [];
      const has = by.includes(uid);
      changedPost = {
        ...post,
        upvotes: (post.upvotes || 0) + (has ? -1 : 1),
        upvotedBy: has ? by.filter((u) => u !== uid) : [...by, uid],
      };
      return changedPost;
    });
    setPosts(updated);
    if (changedPost) await db.saveDiscussion(changedPost);
  };

  const toggleComments = async (postId: string) => {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (!commentsMap[postId]) {
      const data = await db.getDiscussionComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: data || [] }));
    }
  };

  const saveComments = async (postId: string, comments: any[]) => {
    setCommentsMap(prev => ({ ...prev, [postId]: comments }));
    await db.saveDiscussionComments(postId, comments);

    let changedPost: any = null;
    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      changedPost = { ...post, comments: comments.length };
      return changedPost;
    });
    setPosts(updatedPosts);
    if (changedPost) await db.saveDiscussion(changedPost);
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser || currentUser.banned) return;
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    const newComment = {
      id: `dc_${Date.now()}`,
      author: currentUser.displayName || currentUser.email || "Ẩn danh",
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [...(commentsMap[postId] || []), newComment];
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    await saveComments(postId, updated);
  };

  const focusCreateForm = () => {
    const titleInput = document.getElementById("discussion-title-input") as HTMLInputElement | null;
    if (!titleInput) return;
    titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
    titleInput.focus();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Thảo luận</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nơi mọi người để lại review, feedback và các chủ đề thảo luận.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Sort</span>
            <button
              onClick={() => setSortMode("newest")}
              className={`px-3 py-1.5 rounded-full text-xs transition-sw ${
                sortMode === "newest"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Mới nhất
            </button>
            <button
              onClick={() => setSortMode("upvotes")}
              className={`px-3 py-1.5 rounded-full text-xs transition-sw ${
                sortMode === "upvotes"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Nhiều upvote
            </button>
          </div>
        </div>

        {!currentUser && !loading && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-muted-foreground">
            <LogIn className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">Đăng nhập để tạo bài, comment và upvote.</span>
            <Link to="/auth" className="text-primary font-medium hover:underline flex-shrink-0">
              Đăng nhập
            </Link>
          </div>
        )}

        <div className="mb-4 flex justify-end">
          {currentUser && !currentUser.banned ? (
            <button
              onClick={focusCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw"
            >
              <Send className="h-3.5 w-3.5" />
              Tạo bài mới
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-sw"
            >
              <LogIn className="h-3.5 w-3.5" />
              Đăng nhập để tạo bài
            </Link>
          )}
        </div>

        {currentUser && !currentUser.banned && (
          <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(["discussion", "feedback", "review"] as PostType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm(prev => ({ ...prev, type }))}
                  className={`px-3 py-1.5 rounded-full text-xs transition-sw ${
                    form.type === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {typeLabel[type]}
                </button>
              ))}
            </div>

            <input
              id="discussion-title-input"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/25 mb-2"
              placeholder="Tiêu đề bài viết..."
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full min-h-[110px] rounded-lg bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/25 resize-y"
              placeholder="Nội dung review / feedback / thảo luận..."
            />

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => requireAuth(handleCreatePost)}
                disabled={submitting || !form.title.trim() || !form.content.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-sw"
              >
                <Send className="h-3.5 w-3.5" />
                Đăng bài
              </button>
            </div>
          </section>
        )}

        {!loading && sortedPosts.length === 0 && (
          <p className="text-sm text-muted-foreground/60 text-center py-16">
            Chưa có bài thảo luận nào. Hãy tạo bài đầu tiên.
          </p>
        )}

        <div className="divide-y divide-border">
          {loading ? null : sortedPosts.map((post, index) => {
            const uid = currentUser?.email || "anon";
            const hasUpvoted = (post.upvotedBy || []).includes(uid);
            const commentCount = commentsMap[post.id]?.length ?? post.comments ?? 0;
            const isOpen = openComments === post.id;

            return (
              <motion.article
                key={post.id}
                className="py-6 first:pt-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: index * 0.03 }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {typeLabel[(post.type as PostType) || "discussion"]}
                  </span>
                  <span className="text-xs font-semibold text-foreground/80">{post.author}</span>
                  {post.createdAt && (
                    <span className="text-[10px] text-muted-foreground/60">· {timeAgo(post.createdAt)}</span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-foreground mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={() => requireAuth(() => handleUpvote(post.id))}
                    className={`flex items-center gap-1.5 text-sm transition-sw ${
                      hasUpvoted && currentUser
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={!currentUser ? "Đăng nhập để upvote" : undefined}
                  >
                    <ArrowUp className={`h-4 w-4 ${hasUpvoted && currentUser ? "fill-primary/20" : ""}`} />
                    {post.upvotes || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-sw ${
                      isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {commentCount}
                  </button>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={transition}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        {(commentsMap[post.id] || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground/60">Chưa có comment nào.</p>
                        ) : (
                          (commentsMap[post.id] || []).map((comment: any) => (
                            <div key={comment.id} className="rounded-lg bg-secondary/40 p-3">
                              <div className="mb-1 flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-foreground/80">{comment.author}</span>
                                <span className="text-[10px] text-muted-foreground/50">{timeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-foreground/75">{comment.text}</p>
                            </div>
                          ))
                        )}

                        {currentUser && !currentUser.banned ? (
                          <div className="flex gap-2 pt-1">
                            <input
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                              className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/25"
                              placeholder="Viết comment..."
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!(commentInputs[post.id] || "").trim()}
                              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-sw"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <Link to="/auth" className="text-xs text-muted-foreground/60 hover:text-primary">
                            Đăng nhập để comment →
                          </Link>
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
    </DashboardLayout>
  );
}
