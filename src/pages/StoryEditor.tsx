import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { db } from "@/lib/utils";
import {
  ArrowLeft,
  Eye,
  Save,
  Plus,
  GripVertical,
  ChevronRight,
  X,
} from "lucide-react";

interface StoryNode {
  id: string;
  label: string;
  title: string;
  content: string;
  x: number;
  y: number;
  choices: { text: string; targetId: string }[];
}

interface Edge {
  from: string;
  to: string;
}

const initialNodes: StoryNode[] = [
  {
    id: "1.0",
    label: "1.0",
    title: "The Beginning",
    content: "Write the beginning of your epic tale here...",
    x: 400,
    y: 80,
    choices: [],
  }
];

const buildEdges = (nodes: StoryNode[]): Edge[] => {
  const edges: Edge[] = [];
  nodes.forEach((node) => {
    node.choices.forEach((c) => {
      edges.push({ from: node.id, to: c.targetId });
    });
  });
  return edges;
};

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function StoryEditor() {
  const { id } = useParams();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const edges = buildEdges(nodes);
  const selectedNode = nodes.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    let mounted = true;
    const fetchNodes = async () => {
      let data = await db.getStoryNodes(id || "new");
      if (!data) {
        data = initialNodes;
        await db.saveStoryNodes(id || "new", data);
      }
      if (mounted) {
        setNodes(data);
        setSelectedId(data[0]?.id || null);
        setLoading(false);
      }
    };
    fetchNodes();
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async () => {
    setSaveStatus("saving");
    const storyId = id || "new";
    await db.saveStoryNodes(storyId, nodes);

    let myStories = await db.getMyStories() || [];
    const rootTitle = nodes[0]?.title || "New Story";
    const words = nodes.reduce((acc, n) => acc + (n.content ? n.content.split(/\s+/).length : 0), 0);
    const endings = nodes.filter(n => n.choices.length === 0).length;

    const existingStoryIndex = myStories.findIndex((s: any) => s.id === storyId);
    if (existingStoryIndex === -1) {
      myStories.push({
        id: storyId,
        title: rootTitle,
        lastEdited: "Just now",
        status: "draft",
        branches: nodes.length,
        words,
        endings
      });
    } else {
      myStories[existingStoryIndex].title = rootTitle;
      myStories[existingStoryIndex].lastEdited = "Just now";
      myStories[existingStoryIndex].branches = nodes.length;
      myStories[existingStoryIndex].words = words;
      myStories[existingStoryIndex].endings = endings;
    }
    await db.saveMyStories(myStories);

    setTimeout(() => {
      setSaveStatus("saved");
    }, 600);
  };

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<StoryNode>) => {
      setSaveStatus("unsaved");
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
      );
    },
    []
  );

  // Canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: panOffset.x,
      oy: panOffset.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
    };
    const handleMouseUp = () => setIsPanning(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning]);

  const addNode = (parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const newId = `${parentId}.${parent.choices.length + 1}`;
    const newNode: StoryNode = {
      id: newId,
      label: newId,
      title: "New Segment",
      content: "",
      x: parent.x + (parent.choices.length % 2 === 0 ? -120 : 120),
      y: parent.y + 200,
      choices: [],
    };
    setNodes((prev) => [
      ...prev.map((n) =>
        n.id === parentId
          ? {
            ...n,
            choices: [
              ...n.choices,
              { text: "New choice...", targetId: newId },
            ],
          }
          : n
      ),
      newNode,
    ]);
    setSelectedId(newId);
    setSaveStatus("unsaved");
  };

  if (loading) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-card z-30 flex items-center justify-between px-4" style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-semibold text-foreground">
            The Forgotten Archive
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span
              className={`w-2 h-2 rounded-full ${saveStatus === "saved" ? "bg-primary"
                  : saveStatus === "saving" ? "bg-muted-foreground animate-pulse"
                    : "bg-destructive animate-pulse"
                }`}
            />
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              {saveStatus}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/reader/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-secondary transition-sw"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 mt-12 canvas-grid relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {edges.map((edge) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + 96;
            const y1 = from.y + 80;
            const x2 = to.x + 96;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            const isActive =
              selectedId === edge.from || selectedId === edge.to;
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                fill="none"
                strokeWidth={2}
                stroke={
                  isActive
                    ? "hsl(172, 66%, 40%)"
                    : "hsl(240, 5%, 80%)"
                }
                className="transition-sw"
              />
            );
          })}
        </svg>

        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              data-node
              className={`absolute w-48 p-4 rounded-lg bg-card cursor-pointer transition-sw select-none ${selectedId === node.id ? "shadow-node-hover ring-2 ring-primary/20" : "shadow-node hover:shadow-node-hover"
                }`}
              style={{ left: node.x, top: node.y }}
              onClick={() => setSelectedId(node.id)}
            >
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1.5 tabular-nums">
                {node.label}
              </div>
              <div className="text-sm font-medium text-foreground line-clamp-2">
                {node.title}
              </div>
              {node.choices.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ChevronRight className="h-3 w-3" />
                  {node.choices.length} choice{node.choices.length > 1 ? "s" : ""}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode(node.id);
                }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card shadow-node flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground transition-sw"
                style={{ opacity: selectedId === node.id ? 1 : undefined }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={transition}
            className="w-[400px] h-[calc(100vh-48px)] mt-12 bg-card overflow-y-auto flex-shrink-0"
            style={{ boxShadow: "-1px 0 0 0 hsl(var(--border))" }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground tabular-nums">
                  Segment {selectedNode.label}
                </span>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-1 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <input
                value={selectedNode.title}
                onChange={(e) =>
                  updateNode(selectedNode.id, { title: e.target.value })
                }
                className="w-full text-lg font-semibold text-foreground bg-transparent border-none outline-none mb-4 placeholder:text-muted-foreground/40"
                placeholder="Segment title..."
              />

              {/* Content */}
              <div className="mb-6">
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
                  Content
                </label>
                <textarea
                  value={selectedNode.content}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { content: e.target.value })
                  }
                  className="w-full min-h-[200px] text-base leading-relaxed text-foreground bg-transparent border-none outline-none resize-none font-prose placeholder:text-muted-foreground/40"
                  placeholder="Write your story segment..."
                />
              </div>

              {/* Choices */}
              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
                  Choices
                </label>
                <div className="space-y-2">
                  {selectedNode.choices.map((choice, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      <input
                        value={choice.text}
                        onChange={(e) => {
                          const newChoices = [...selectedNode.choices];
                          newChoices[i] = {
                            ...newChoices[i],
                            text: e.target.value,
                          };
                          updateNode(selectedNode.id, {
                            choices: newChoices,
                          });
                        }}
                        className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40"
                        placeholder="Choice text..."
                      />
                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums bg-secondary rounded px-1.5 py-0.5">
                        → {choice.targetId}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => addNode(selectedNode.id)}
                    className="flex items-center gap-2 w-full rounded-lg border border-dashed border-muted p-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-sw"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add choice
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
