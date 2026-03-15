import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { db } from "@/lib/utils";

interface StoryNode {
  id: string;
  title: string;
  content: string;
  isEnding?: boolean;
  x: number;
  y: number;
  choices: { text: string; targetId: string }[];
}

const NODE_W = 164;
const NODE_H = 76;

export default function StoryExplore() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [segMap, setSegMap] = useState<Record<string, StoryNode>>({});
  const [allNodes, setAllNodes] = useState<StoryNode[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [chosenAt, setChosenAt] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [data, stories, exploreState] = await Promise.all([
        db.getStoryNodes(id || ""),
        db.getMyStories(),
        db.getExploreState(id || ""),
      ]);
      if (!mounted) return;
      if (data && data.length > 0) {
        const map: Record<string, StoryNode> = {};
        data.forEach((n: any) => { map[n.id] = n; });
        setSegMap(map);
        setAllNodes(data);
        const story = stories?.find((s: any) => s.id === id);
        if (story) setStoryTitle(story.title);

        if (exploreState) {
          setRevealed(new Set(exploreState.revealed ?? [data[0].id]));
          setChosenAt(exploreState.chosenAt ?? {});
        } else {
          setRevealed(new Set([data[0].id]));
        }

        // Center first node in viewport
        const first = data[0];
        setPan({
          x: window.innerWidth / 2 - NODE_W / 2 - (first.x ?? 400),
          y: (window.innerHeight - 48) / 3 - (first.y ?? 80),
        });
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setPan({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  };
  const onMouseUp = () => { dragRef.current.active = false; };

  if (loading) return null;

  const revealedNodes = allNodes.filter(n => revealed.has(n.id));

  const edges: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
  revealedNodes.forEach(node => {
    node.choices.forEach((choice, ci) => {
      if (!revealed.has(choice.targetId)) return;
      const target = segMap[choice.targetId];
      if (!target) return;
      edges.push({
        x1: node.x + NODE_W / 2,
        y1: node.y + NODE_H,
        x2: target.x + NODE_W / 2,
        y2: target.y,
        active: (chosenAt[node.id] || []).includes(ci),
      });
    });
  });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 h-12 bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 z-10"
        style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}
      >
        <Link
          to="/community"
          className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-foreground truncate">{storyTitle}</span>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <Compass className="h-3.5 w-3.5 text-muted-foreground/45" />
          <span className="text-xs text-muted-foreground/55">
            {revealed.size} / {allNodes.length} phân đoạn
          </span>
        </div>
      </div>

      {/* Full-screen canvas */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ background: "hsl(var(--canvas-bg, var(--background)))" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--canvas-dot, var(--border))) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: `${((pan.x % 24) + 24) % 24}px ${((pan.y % 24) + 24) % 24}px`,
          }}
        />

        {/* Canvas content */}
        <div className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {/* SVG edges */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, overflow: "visible", width: 1, height: 1, pointerEvents: "none" }}
          >
            {edges.map((e, i) => {
              const my = (e.y1 + e.y2) / 2;
              return (
                <path
                  key={i}
                  d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
                  fill="none"
                  stroke={e.active ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={e.active ? 2 : 1.5}
                  opacity={e.active ? 0.7 : 0.4}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {revealedNodes.map(node => {
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
                data-node="true"
                onClick={() => {
                  if (!dragRef.current.moved) {
                    navigate(`/reader/${id}?from=${node.id}`);
                  }
                }}
                className="absolute rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-lg cursor-pointer transition-sw group"
                style={{ left: node.x, top: node.y, width: NODE_W }}
              >
                <div className="px-4 pt-3 pb-2">
                  <div className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/30 mb-1 group-hover:text-primary/50 transition-sw">
                    {node.id}
                  </div>
                  <div className="text-sm font-semibold leading-snug line-clamp-2 text-foreground/65 group-hover:text-foreground transition-sw">
                    {node.title || "—"}
                  </div>
                  {node.isEnding && (
                    <div className="mt-1.5 text-[8px] font-mono uppercase tracking-widest text-primary/50">
                      Kết thúc
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom hint */}
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground/30 pointer-events-none whitespace-nowrap">
          Kéo để di chuyển · Nhấp vào phân đoạn để đọc
        </p>
      </div>
    </div>
  );
}
