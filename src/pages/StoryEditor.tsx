import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useBlocker } from "react-router-dom";
import { db } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Eye, Save, Plus, X, Trash2, CircleDot, Maximize2, Minimize2 } from "lucide-react";

interface StoryNode {
  id: string;
  label: string;
  title: string;
  content: string;
  x: number;
  y: number;
  choices: { text: string; targetId: string }[];
  isEnding?: boolean;
}

interface Edge { from: string; to: string; }
interface Wire { fromId: string; x1: number; y1: number; x2: number; y2: number; }

const NODE_W = 192;
const NODE_H = 105;

const buildEdges = (nodes: StoryNode[]): Edge[] =>
  nodes.flatMap(n => n.choices.map(c => ({ from: n.id, to: c.targetId })));

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

const initialNodes: StoryNode[] = [{
  id: "1.0", label: "1.0", title: "Mở đầu",
  content: "", x: 400, y: 80, choices: [],
}];

export default function StoryEditor() {
  const { id } = useParams();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [wire, setWire] = useState<Wire | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(nodes);
  const panOffsetRef = useRef(panOffset);
  const pendingSelectRef = useRef<string | null>(null);
  const suppressCanvasClickRef = useRef(false);
  // Refs for auto-save (avoid stale closures in setInterval)
  const saveStatusRef = useRef(saveStatus);
  const handleSaveRef = useRef<() => void>(() => {});

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);
  useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);

  // Select pending node after nodes state updates
  useEffect(() => {
    if (pendingSelectRef.current) {
      setSelectedId(pendingSelectRef.current);
      pendingSelectRef.current = null;
    }
  }, [nodes]);

  // Close expanded editor when selection changes or panel closes
  useEffect(() => {
    if (!selectedId) setIsExpanded(false);
  }, [selectedId]);

  // Interaction ref — avoids stale closures in native event listeners
  const ix = useRef<{
    type: "idle" | "panning" | "dragging" | "connecting";
    nodeId: string;
    startMx: number; startMy: number;
    startNx: number; startNy: number;
    panOx: number; panOy: number;
    moved: boolean;
  }>({ type: "idle", nodeId: "", startMx: 0, startMy: 0, startNx: 0, startNy: 0, panOx: 0, panOy: 0, moved: false });

  const edges = buildEdges(nodes);
  const selectedNode = nodes.find(n => n.id === selectedId) || null;

  // Auto-detect start nodes: no other node's choice points to this node
  const incomingIds = new Set(nodes.flatMap(n => n.choices.map(c => c.targetId)));
  const autoStartIds = new Set(nodes.filter(n => !incomingIds.has(n.id)).map(n => n.id));

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      let data = await db.getStoryNodes(id || "new");
      if (!data) {
        data = initialNodes;
        await db.saveStoryNodes(id || "new", data);
      }
      const myStories = await db.getMyStories() || [];
      const story = myStories.find((s: any) => s.id === (id || "new"));
      if (mounted) {
        setNodes(data);
        setStoryTitle(story?.title || "Truyện mới");
        setSelectedId(data[0]?.id || null);
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [id]);

  const handleSave = async () => {
    setSaveStatus("saving");
    const storyId = id || "new";
    await db.saveStoryNodes(storyId, nodes);
    let myStories = await db.getMyStories() || [];
    const words = nodes.reduce((a, n) => a + (n.content ? n.content.split(/\s+/).length : 0), 0);
    const endings = nodes.filter(n => n.isEnding || n.choices.length === 0).length;
    const idx = myStories.findIndex((s: any) => s.id === storyId);
    const entry = { id: storyId, title: storyTitle, lastEdited: "Vừa xong", status: "draft", branches: nodes.length, words, endings };
    if (idx === -1) myStories.push(entry);
    else Object.assign(myStories[idx], entry);
    await db.saveMyStories(myStories);
    setTimeout(() => setSaveStatus("saved"), 600);
  };

  // Keep handleSaveRef current so the interval always calls the latest version
  useEffect(() => { handleSaveRef.current = handleSave; });

  // Auto-save every 30s when there are unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (saveStatusRef.current === "unsaved") handleSaveRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<StoryNode>) => {
    setSaveStatus("unsaved");
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  }, []);

  // FIX: use functional setNodes so rapid calls never produce duplicate IDs
  const addNewChild = useCallback((parentId: string) => {
    setSaveStatus("unsaved");
    setNodes(prev => {
      const parent = prev.find(n => n.id === parentId);
      if (!parent) return prev;
      const newId = `${parentId}.${parent.choices.length + 1}`;
      const newNode: StoryNode = {
        id: newId, label: newId, title: "Phân đoạn mới", content: "",
        x: parent.x + (parent.choices.length % 2 === 0 ? -150 : 150),
        y: parent.y + 210, choices: [],
      };
      return [
        ...prev.map(n => n.id === parentId
          ? { ...n, choices: [...n.choices, { text: "Nhập lựa chọn của bạn", targetId: newId }] }
          : n
        ),
        newNode,
      ];
    });
  }, []);

  // Keep a ref so the native event handler always calls the latest version
  const addNewChildRef = useRef(addNewChild);
  useEffect(() => { addNewChildRef.current = addNewChild; }, [addNewChild]);

  // Single global event handler — all state reads go through refs to avoid stale closures
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const i = ix.current;
      if (i.type === "dragging") {
        const dx = e.clientX - i.startMx;
        const dy = e.clientY - i.startMy;
        if (!i.moved && Math.hypot(dx, dy) > 3) i.moved = true;
        if (i.moved) {
          setNodes(prev => prev.map(n =>
            n.id === i.nodeId ? { ...n, x: i.startNx + dx, y: i.startNy + dy } : n
          ));
        }
      } else if (i.type === "connecting" && canvasRef.current) {
        const dx = e.clientX - i.startMx;
        const dy = e.clientY - i.startMy;
        // Only show wire after dragging > 5px
        if (!i.moved && Math.hypot(dx, dy) > 5) {
          i.moved = true;
          const fromNode = nodesRef.current.find(n => n.id === i.nodeId);
          if (fromNode) {
            const rect = canvasRef.current.getBoundingClientRect();
            const cx = e.clientX - rect.left - panOffsetRef.current.x;
            const cy = e.clientY - rect.top - panOffsetRef.current.y;
            setWire({ fromId: i.nodeId, x1: fromNode.x + NODE_W / 2, y1: fromNode.y + NODE_H, x2: cx, y2: cy });
          }
        }
        if (i.moved) {
          const rect = canvasRef.current.getBoundingClientRect();
          const cx = e.clientX - rect.left - panOffsetRef.current.x;
          const cy = e.clientY - rect.top - panOffsetRef.current.y;
          setWire(prev => prev ? { ...prev, x2: cx, y2: cy } : null);
          const hovered = nodesRef.current.find(n =>
            n.id !== i.nodeId &&
            cx >= n.x && cx <= n.x + NODE_W &&
            cy >= n.y && cy <= n.y + NODE_H
          );
          setHoveredNodeId(hovered?.id || null);
        }
      } else if (i.type === "panning") {
        if (!i.moved && Math.hypot(e.clientX - i.startMx, e.clientY - i.startMy) > 3) i.moved = true;
        setPanOffset({ x: i.panOx + (e.clientX - i.startMx), y: i.panOy + (e.clientY - i.startMy) });
      }
    };

    const onUp = (e: MouseEvent) => {
      const i = ix.current;
      // If any drag happened, suppress the canvas click that fires after mouseup
      if (i.moved) suppressCanvasClickRef.current = true;

      if (i.type === "dragging") {
        if (!i.moved) setSelectedId(i.nodeId);
        else setSaveStatus("unsaved");
        setDraggingNodeId(null);
      } else if (i.type === "connecting") {
        if (!i.moved) {
          // Click (no drag) → create new child
          addNewChildRef.current(i.nodeId);
        } else if (canvasRef.current) {
          // Drag → connect to target node if found
          const rect = canvasRef.current.getBoundingClientRect();
          const cx = e.clientX - rect.left - panOffsetRef.current.x;
          const cy = e.clientY - rect.top - panOffsetRef.current.y;
          const target = nodesRef.current.find(n =>
            n.id !== i.nodeId &&
            cx >= n.x && cx <= n.x + NODE_W &&
            cy >= n.y && cy <= n.y + NODE_H
          );
          if (target) {
            setNodes(prev => prev.map(n =>
              n.id === i.nodeId
                ? { ...n, choices: [...n.choices, { text: "Nhập lựa chọn của bạn", targetId: target.id }] }
                : n
            ));
            setSaveStatus("unsaved");
          }
        }
        setWire(null);
        setHoveredNodeId(null);
      } else if (i.type === "panning" && !i.moved) {
        // Plain click on empty canvas → deselect (handled here, not in onClick)
        const target = e.target as HTMLElement;
        if (!target.closest("[data-node]")) setSelectedId(null);
      }
      ix.current = { type: "idle", nodeId: "", startMx: 0, startMy: 0, startNx: 0, startNy: 0, panOx: 0, panOy: 0, moved: false };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, node: StoryNode) => {
    if ((e.target as HTMLElement).closest("[data-port]")) return;
    e.stopPropagation();
    setDraggingNodeId(node.id);
    ix.current = { type: "dragging", nodeId: node.id, startMx: e.clientX, startMy: e.clientY, startNx: node.x, startNy: node.y, panOx: 0, panOy: 0, moved: false };
  };

  const handlePortMouseDown = (e: React.MouseEvent, node: StoryNode) => {
    e.stopPropagation();
    ix.current = { type: "connecting", nodeId: node.id, startMx: e.clientX, startMy: e.clientY, startNx: 0, startNy: 0, panOx: 0, panOy: 0, moved: false };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    ix.current = { type: "panning", nodeId: "", startMx: e.clientX, startMy: e.clientY, startNx: 0, startNy: 0, panOx: panOffset.x, panOy: panOffset.y, moved: false };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Suppress click that fires after any drag interaction
    if (suppressCanvasClickRef.current) {
      suppressCanvasClickRef.current = false;
      return;
    }
    // Deselect is handled in onUp (panning + !moved), nothing needed here
    if ((e.target as HTMLElement).closest("[data-node]")) return;
  };

  const deleteChoice = (nodeId: string, choiceIndex: number) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, choices: n.choices.filter((_, i) => i !== choiceIndex) } : n
    ));
    setSaveStatus("unsaved");
  };

  const blocker = useBlocker(saveStatus === "unsaved");

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved") e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveStatus]);

  if (loading) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-card z-30 flex items-center justify-between px-4" style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={storyTitle}
            onChange={(e) => { setStoryTitle(e.target.value); setSaveStatus("unsaved"); }}
            className="text-sm font-semibold text-foreground bg-transparent border-none outline-none hover:bg-secondary focus:bg-secondary rounded px-1.5 py-0.5 transition-sw min-w-0 max-w-[240px]"
            placeholder="Tên truyện..."
          />
          <div className="flex items-center gap-1.5 ml-2">
            <span className={`w-2 h-2 rounded-full ${saveStatus === "saved" ? "bg-primary" : saveStatus === "saving" ? "bg-muted-foreground animate-pulse" : "bg-destructive animate-pulse"}`} />
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              {saveStatus === "saved" ? "Đã lưu" : saveStatus === "saving" ? "Đang lưu" : "Chưa lưu"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/reader/${id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-secondary transition-sw">
            <Eye className="h-3.5 w-3.5" /> Xem trước
          </Link>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saveStatus === "saving" ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 mt-12 canvas-grid relative overflow-hidden select-none"
        style={{ cursor: wire ? "crosshair" : draggingNodeId ? "grabbing" : "grab" }}
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
      >
        {/* FIX: overflow="visible" so bezier curves aren't clipped by the SVG boundary */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
          overflow="visible"
        >
          {edges.map((edge) => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W / 2;
            const y1 = from.y + NODE_H;
            const x2 = to.x + NODE_W / 2;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            const isActive = selectedId === edge.from || selectedId === edge.to;
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`}
                fill="none"
                strokeWidth={isActive ? 2.5 : 1.5}
                stroke={isActive ? "hsl(172, 66%, 40%)" : "hsl(240, 5%, 80%)"}
              />
            );
          })}
          {wire && (() => {
            const midY = (wire.y1 + wire.y2) / 2;
            return (
              <path
                d={`M${wire.x1},${wire.y1} C${wire.x1},${midY} ${wire.x2},${midY} ${wire.x2},${wire.y2}`}
                fill="none"
                strokeWidth={2}
                stroke="hsl(172, 66%, 40%)"
                strokeDasharray="6 3"
              />
            );
          })()}
        </svg>

        <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          {nodes.map((node) => {
            const isStart = autoStartIds.has(node.id);
            const isEnding = node.isEnding || node.choices.length === 0;
            const isSelected = selectedId === node.id;
            const isHoveredTarget = hoveredNodeId === node.id;
            const portVisible = isSelected || isHoveredTarget;
            return (
              <div
                key={node.id}
                data-node
                className={`absolute rounded-lg bg-card transition-colors select-none group ${
                  isSelected ? "shadow-node-hover ring-2 ring-primary/20"
                  : isHoveredTarget ? "shadow-node-hover ring-2 ring-primary/50"
                  : "shadow-node hover:shadow-node-hover"
                }`}
                style={{ left: node.x, top: node.y, width: NODE_W, cursor: draggingNodeId === node.id ? "grabbing" : "grab" }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
              >
                {(isStart || isEnding) && (
                  <div className="absolute -top-2.5 left-2 flex gap-1 z-10">
                    {isStart && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                        Bắt đầu
                      </span>
                    )}
                    {isEnding && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500 text-white">
                        Kết thúc
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 pt-5">
                  <div className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1.5 tabular-nums">
                    {node.label}
                  </div>
                  <div className="text-sm font-medium text-foreground line-clamp-2">
                    {node.title}
                  </div>
                  {node.choices.length > 0 && (
                    <div className="mt-2 text-[10px] text-muted-foreground pointer-events-none">
                      {node.choices.length} lựa chọn
                    </div>
                  )}
                </div>

                {/* Port: click = add child, drag = connect wire
                    FIX: pointer-events-none when invisible to prevent accidental clicks */}
                <div
                  data-port
                  className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card shadow-node flex items-center justify-center transition-sw cursor-crosshair z-10 hover:bg-primary hover:text-primary-foreground ${
                    portVisible
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  }`}
                  onMouseDown={(e) => handlePortMouseDown(e, node)}
                  title="Click: thêm nhánh mới · Kéo: nối tới ô khác"
                >
                  <Plus className="h-3 w-3" />
                </div>
              </div>
            );
          })}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground tabular-nums">
                    Phân đoạn {selectedNode.label}
                  </span>
                  {autoStartIds.has(selectedNode.id) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide">Bắt đầu</span>
                  )}
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 rounded-md hover:bg-secondary transition-sw text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => updateNode(selectedNode.id, { isEnding: !selectedNode.isEnding })}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-sw mb-5 ${
                  selectedNode.isEnding
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-500"
                    : "border-muted text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                }`}
              >
                <CircleDot className="h-3 w-3" />
                {selectedNode.isEnding ? "Đã đánh dấu kết thúc" : "Đánh dấu là kết thúc"}
              </button>

              <input
                value={selectedNode.title}
                onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                className="w-full text-lg font-semibold text-foreground bg-transparent border-none outline-none mb-5 placeholder:text-muted-foreground/40"
                placeholder="Tiêu đề phân đoạn..."
              />

              {/* Incoming choices — which choices from parent nodes lead here */}
              {(() => {
                const incoming = nodes.flatMap(n =>
                  n.choices
                    .map((c, i) => ({ fromNode: n, choiceIndex: i, choice: c }))
                    .filter(({ choice }) => choice.targetId === selectedNode.id)
                );
                if (incoming.length === 0) return null;
                return (
                  <div className="mb-6">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3 block">Đến từ</label>
                    <div className="space-y-2">
                      {incoming.map(({ fromNode, choiceIndex, choice }) => (
                        <div key={`${fromNode.id}-${choiceIndex}`} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                          <span
                            className="text-[10px] font-mono text-muted-foreground bg-secondary rounded px-1.5 py-0.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-sw whitespace-nowrap flex-shrink-0"
                            onClick={() => setSelectedId(fromNode.id)}
                            title="Nhấn để chọn phân đoạn gốc"
                          >
                            {fromNode.label}
                          </span>
                          <input
                            value={choice.text}
                            onChange={(e) => {
                              const newChoices = [...fromNode.choices];
                              newChoices[choiceIndex] = { ...newChoices[choiceIndex], text: e.target.value };
                              updateNode(fromNode.id, { choices: newChoices });
                            }}
                            className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40"
                            placeholder="Nhập lựa chọn của bạn"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Nội dung</label>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="p-1 rounded hover:bg-secondary transition-sw text-muted-foreground hover:text-foreground"
                    title="Mở rộng toàn màn hình"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={selectedNode.content}
                  onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                  className="w-full min-h-[200px] text-base leading-relaxed text-foreground bg-transparent border-none outline-none resize-none font-prose placeholder:text-muted-foreground/40"
                  placeholder="Viết nội dung phân đoạn..."
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3 block">Lựa chọn</label>
                <div className="space-y-2">
                  {selectedNode.choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                      <input
                        value={choice.text}
                        onChange={(e) => {
                          const newChoices = [...selectedNode.choices];
                          newChoices[i] = { ...newChoices[i], text: e.target.value };
                          updateNode(selectedNode.id, { choices: newChoices });
                        }}
                        className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40"
                        placeholder="Nhập lựa chọn của bạn"
                      />
                      <span
                        className="text-[10px] text-muted-foreground bg-secondary rounded px-1.5 py-0.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-sw whitespace-nowrap max-w-[100px] truncate"
                        onClick={() => setSelectedId(choice.targetId)}
                        title={`→ ${nodes.find(n => n.id === choice.targetId)?.title || choice.targetId}`}
                      >
                        → {nodes.find(n => n.id === choice.targetId)?.title || choice.targetId}
                      </span>
                      <button
                        onClick={() => deleteChoice(selectedNode.id, i)}
                        className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-sw flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addNewChild(selectedNode.id)}
                    className="flex items-center gap-2 w-full rounded-lg border border-dashed border-muted p-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-sw"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm nhánh mới
                  </button>
                  <p className="text-[11px] text-muted-foreground/50 text-center pt-1">
                    Kéo nút "+" dưới ô để nối tới ô có sẵn
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen content editor */}
      {isExpanded && selectedNode && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col" style={{ top: 48 }}>
          {/* Expanded toolbar */}
          <div className="flex items-center justify-between px-8 h-12 flex-shrink-0" style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground tabular-nums">
                {selectedNode.label}
              </span>
              <span className="text-sm font-semibold text-foreground">{selectedNode.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground/60">
                {selectedNode.content ? selectedNode.content.trim().split(/\s+/).filter(Boolean).length : 0} từ
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground hover:text-foreground"
                title="Thu nhỏ"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Writing area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-2xl mx-auto px-8 py-10 h-full">
              <textarea
                value={selectedNode.content}
                onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                className="w-full h-full min-h-[calc(100vh-180px)] text-lg leading-[1.9] text-foreground bg-transparent border-none outline-none resize-none font-prose placeholder:text-muted-foreground/30"
                placeholder="Viết nội dung phân đoạn..."
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có thay đổi chưa lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Nếu bạn rời khỏi trang này, các thay đổi sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Ở lại</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Rời đi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
