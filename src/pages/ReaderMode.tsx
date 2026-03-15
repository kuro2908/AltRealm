import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, Map } from "lucide-react";
import { db } from "@/lib/utils";

interface StoryNode {
  id: string;
  title: string;
  content: string;
  isEnding?: boolean;
  choices: { text: string; targetId: string }[];
}

const transition = { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const };

export default function ReaderMode() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromNode = searchParams.get("from");

  const [segments, setSegments] = useState<Record<string, StoryNode>>({});
  const [storyTitle, setStoryTitle] = useState("");
  const [history, setHistory] = useState<{ nodeId: string; chosenIndex: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      const [data, stories] = await Promise.all([
        db.getStoryNodes(id || ""),
        db.getMyStories(),
      ]);
      if (!mounted) return;
      if (data && data.length > 0) {
        const map: Record<string, StoryNode> = {};
        data.forEach((node: any) => { map[node.id] = node; });
        setSegments(map);
        const startId = (fromNode && map[fromNode]) ? fromNode : data[0].id;
        setHistory([{ nodeId: startId, chosenIndex: null }]);
        const story = stories?.find((s: any) => s.id === id);
        if (story) setStoryTitle(story.title);
      }
      setLoading(false);
    };
    fetch();
    return () => { mounted = false; };
  }, [id, fromNode]);

  // Scroll to bottom only when a new segment is appended
  useEffect(() => {
    if (history.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevLengthRef.current = history.length;
  }, [history.length]);

  // Sync revealed nodes & choices back to explore state
  const syncExplore = async (nodeId: string, choiceIdx: number, targetId: string) => {
    if (!id) return;
    const state = await db.getExploreState(id) ?? { revealed: [], chosenAt: {} };
    const revealed: string[] = state.revealed ?? [];
    const chosenAt: Record<string, number[]> = state.chosenAt ?? {};
    if (!revealed.includes(nodeId)) revealed.push(nodeId);
    if (!revealed.includes(targetId)) revealed.push(targetId);
    const existing: number[] = chosenAt[nodeId] ?? [];
    if (!existing.includes(choiceIdx)) chosenAt[nodeId] = [...existing, choiceIdx];
    await db.saveExploreState(id, { revealed, chosenAt });
  };

  const handleChoice = (histIdx: number, choiceIdx: number, targetId: string) => {
    const nodeId = history[histIdx]?.nodeId;
    if (nodeId) syncExplore(nodeId, choiceIdx, targetId);

    setHistory(prev => {
      if (
        prev[histIdx]?.chosenIndex === choiceIdx &&
        prev[histIdx + 1]?.nodeId === targetId
      ) return prev;
      const trunk = prev.slice(0, histIdx + 1).map((h, i) =>
        i === histIdx ? { ...h, chosenIndex: choiceIdx } : h
      );
      return [...trunk, { nodeId: targetId, chosenIndex: null }];
    });
  };

  const handleRestart = () => {
    const firstId = Object.keys(segments)[0];
    if (firstId) setHistory([{ nodeId: firstId, chosenIndex: null }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return null;

  const lastItem = history[history.length - 1];
  const lastNode = lastItem ? segments[lastItem.nodeId] : null;
  const isEnded = lastNode && (lastNode.isEnding || lastNode.choices.length === 0);

  const backTo = fromNode ? `/explore/${id}` : "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 h-12 bg-card/80 backdrop-blur-sm z-10 flex items-center px-4 gap-3"
        style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}
      >
        <Link
          to={backTo}
          className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm text-muted-foreground truncate flex-1">{storyTitle}</span>
        {fromNode && (
          <Link
            to={`/explore/${id}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-sw flex-shrink-0"
          >
            <Map className="h-3.5 w-3.5" />
            Bản đồ
          </Link>
        )}
      </div>

      <div className="max-w-[65ch] mx-auto pt-[15vh] pb-40 px-6">
        {history.map((item, histIdx) => {
          const node = segments[item.nodeId];
          if (!node) return null;
          const isLast = histIdx === history.length - 1;

          return (
            <div key={`${item.nodeId}-${histIdx}`}>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
              >
                {node.title && (
                  <p className="text-xs font-mono text-muted-foreground/40 tracking-widest uppercase mb-5">
                    {node.title}
                  </p>
                )}

                <div className="font-prose text-xl leading-[1.8] text-foreground/85 whitespace-pre-line mb-10">
                  {node.content || (
                    <span className="italic text-muted-foreground/40">Chưa có nội dung.</span>
                  )}
                </div>

                {node.choices.length > 0 && (
                  <div className="space-y-2.5 mb-4">
                    {node.choices.map((choice, ci) => {
                      const isChosen = item.chosenIndex === ci;

                      if (isLast) {
                        return (
                          <button
                            key={ci}
                            onClick={() => handleChoice(histIdx, ci, choice.targetId)}
                            className="group w-full text-left px-5 py-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03] text-foreground/75 hover:text-foreground transition-sw text-base"
                          >
                            <span className="font-medium">{choice.text}</span>
                            <span className="ml-2 text-muted-foreground/40 text-sm group-hover:text-primary/60 transition-sw">
                              →
                            </span>
                          </button>
                        );
                      }

                      // Past segment — show all choices, chosen one highlighted
                      return (
                        <button
                          key={ci}
                          onClick={() => handleChoice(histIdx, ci, choice.targetId)}
                          className={`group w-full text-left px-5 py-3.5 rounded-xl border transition-sw text-sm flex items-center gap-3 ${
                            isChosen
                              ? "border-primary/25 bg-primary/[0.04] text-foreground/70"
                              : "border-border/30 bg-card/50 text-muted-foreground/45 hover:border-border/60 hover:text-muted-foreground hover:bg-card"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-sw ${
                              isChosen
                                ? "border-primary/60 bg-primary/15"
                                : "border-border/50 group-hover:border-border"
                            }`}
                          >
                            {isChosen && <Check className="h-2.5 w-2.5 text-primary/80" strokeWidth={3} />}
                          </span>
                          <span className="font-medium flex-1">{choice.text}</span>
                          {!isChosen && (
                            <span className="text-muted-foreground/25 text-xs group-hover:text-muted-foreground/50 transition-sw">
                              chọn lại
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {!isLast && (
                <div className="flex items-center gap-4 my-14">
                  <div className="flex-1 h-px bg-border/40" />
                  <div className="flex gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}

              {isLast && <div ref={bottomRef} />}
            </div>
          );
        })}

        <AnimatePresence>
          {isEnded && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ...transition, delay: 0.2 }}
              className="mt-16 text-center"
            >
              <div className="inline-flex flex-col items-center gap-4 px-8 py-8 rounded-2xl border border-border/40 bg-card">
                <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-foreground/70">Kết thúc</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Bạn đã đến cuối hành trình này.
                  </p>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleRestart}
                    className="px-4 py-2 rounded-full bg-secondary text-foreground/70 text-sm hover:bg-secondary/80 transition-sw"
                  >
                    Đọc lại từ đầu
                  </button>
                  {fromNode && (
                    <Link
                      to={`/explore/${id}`}
                      className="px-4 py-2 rounded-full bg-secondary text-foreground/70 text-sm hover:bg-secondary/80 transition-sw flex items-center gap-1.5"
                    >
                      <Map className="h-3.5 w-3.5" /> Xem bản đồ
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
