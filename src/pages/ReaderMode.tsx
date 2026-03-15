import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { db } from "@/lib/utils";

interface Segment {
  id: string;
  content: string;
  choices: { text: string; targetId: string }[];
}

const storySegments: Record<string, Segment> = {
  "1.0": {
    id: "1.0",
    content:
      "You stand at the entrance of an ancient library. Dust motes dance in shafts of golden light filtering through cracked stained glass windows. The air smells of old paper and forgotten secrets.\n\nTwo corridors stretch before you—one leading deeper into darkness, the other toward a faint, pulsing glow.",
    choices: [
      { text: "Enter the dark corridor", targetId: "1.1" },
      { text: "Follow the glowing light", targetId: "1.2" },
    ],
  },
  "1.1": {
    id: "1.1",
    content:
      "The corridor narrows with each step. Your footsteps echo against stone walls lined with shelves of leather-bound volumes that seem to breathe in the flickering torchlight.\n\nA whisper follows you—not threatening, but insistent. It speaks a language you almost understand, tugging at the edges of memory.\n\nThen you see it: a single book, glowing faintly on a pedestal at the corridor's end.",
    choices: [
      { text: "Open the glowing book", targetId: "1.3" },
      { text: "Turn back to the entrance", targetId: "1.0" },
    ],
  },
  "1.2": {
    id: "1.2",
    content:
      "The light intensifies as you enter a circular chamber carved from white stone. In its center, a crystalline orb floats above a marble pedestal, casting prismatic reflections that dance across the domed ceiling like captured auroras.\n\nThe orb pulses steadily, as if breathing. As you approach, you feel warmth radiating from it—not heat, but something deeper. Recognition.",
    choices: [
      { text: "Touch the orb", targetId: "1.4" },
      { text: "Examine the chamber walls", targetId: "1.0" },
    ],
  },
  "1.3": {
    id: "1.3",
    content:
      "The book falls open to a page that seems to read itself aloud—words rising from the parchment like smoke, curling through the air before dissolving.\n\nIt speaks of a prophecy: a traveler who would arrive at the library's darkest hour, someone who could reshape the very stories held within these walls.\n\nThe whispers around you grow louder, harmonious now. They are cheering.",
    choices: [{ text: "Start over", targetId: "1.0" }],
  },
  "1.4": {
    id: "1.4",
    content:
      "The moment your fingertips brush the crystal surface, visions flood your mind in an unstoppable cascade.\n\nYou see centuries compress: librarians in robes tending to infinite shelves, wars fought over forbidden knowledge, the library burning and rebuilding itself from its own ashes.\n\nAnd beneath it all—a hidden vault, sealed since the library's founding, waiting beneath the very floor on which you stand.\n\nThe orb dims. But now you know the way.",
    choices: [{ text: "Start over", targetId: "1.0" }],
  },
};

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function ReaderMode() {
  const { id } = useParams();
  const [currentId, setCurrentId] = useState("1.0");
  const [direction, setDirection] = useState(1);
  const [segments, setSegments] = useState<Record<string, Segment>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStory = async () => {
      let data = await db.getStoryNodes(id || "new");
      if (!data) {
        data = Object.values(storySegments);
        await db.saveStoryNodes(id || "new", data);
      }
      if (mounted) {
        const segmentMap: Record<string, Segment> = {};
        data.forEach((node: any) => {
          segmentMap[node.id] = node;
        });
        setSegments(segmentMap);
        setCurrentId(data[0]?.id || "1.0");
        setLoading(false);
      }
    };
    fetchStory();
    return () => { mounted = false; };
  }, [id]);

  const segment = segments[currentId];
  if (loading || !segment) return null;

  const navigate = (targetId: string) => {
    setDirection(1);
    setCurrentId(targetId);
  };

  return (
    <div className="min-h-screen bg-card">
      {/* Minimal header */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-card/80 backdrop-blur-sm z-10 flex items-center px-4" style={{ boxShadow: "0 1px 0 0 hsl(var(--border))" }}>
        <Link
          to="/dashboard"
          className="p-1.5 rounded-md hover:bg-secondary transition-sw text-muted-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left h-4 w-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
        </Link>
        <span className="text-sm text-muted-foreground ml-3">
          The Forgotten Archive
        </span>
      </div>

      <div className="max-w-[65ch] mx-auto pt-[15vh] pb-24 px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentId}
            custom={direction}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
          >
            {/* Content */}
            <div className="font-prose text-xl leading-[1.7] text-foreground/90 whitespace-pre-line mb-12">
              {segment.content}
            </div>

            {/* Choices */}
            {segment.choices.length > 0 && (
              <div className="space-y-3">
                {segment.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(choice.targetId)}
                    className="group w-full text-left px-5 py-4 rounded-lg bg-secondary/30 hover:bg-secondary text-foreground/80 hover:text-primary transition-sw text-base"
                  >
                    <span className="font-medium">{choice.text}</span>
                    <span className="ml-2 text-muted-foreground/50 text-sm group-hover:text-primary/50 transition-sw">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
