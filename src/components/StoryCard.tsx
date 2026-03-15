import { motion } from "framer-motion";
import { MoreHorizontal, Edit3, Share2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface StoryCardProps {
  id: string;
  title: string;
  lastEdited: string;
  status: "draft" | "published";
  branches: number;
  words: number;
  endings: number;
}

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export function StoryCard({
  id,
  title,
  lastEdited,
  status,
  branches,
  words,
  endings,
}: StoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      className="relative aspect-[3/4] rounded-lg bg-card p-5 flex flex-col shadow-card cursor-pointer group"
      whileHover={{ y: -4 }}
      transition={transition}
      style={{
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-[10px] font-mono tracking-widest uppercase ${
            status === "published" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {status}
        </span>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-md hover:bg-secondary transition-sw text-muted-foreground opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg bg-card shadow-elevated py-1">
              <Link
                to={`/editor/${id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-sw"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Link>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-sw w-full text-left">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-sw w-full text-left">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cover placeholder */}
      <div className="flex-1 rounded-md bg-secondary/50 mb-4 flex items-center justify-center">
        <div className="text-4xl text-muted-foreground/30 font-prose font-semibold">
          {title.charAt(0)}
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Edited {lastEdited}
        </p>
        <div className="flex items-center gap-3 text-[10px] font-mono tracking-wider uppercase text-muted-foreground tabular-nums">
          <span>{branches} Branches</span>
          <span>·</span>
          <span>{words.toLocaleString()} Words</span>
          <span>·</span>
          <span>{endings} Endings</span>
        </div>
      </div>
    </motion.div>
  );
}
