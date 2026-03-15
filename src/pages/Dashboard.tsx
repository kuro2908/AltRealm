import { DashboardLayout } from "@/components/DashboardLayout";
import { StoryCard } from "@/components/StoryCard";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { db } from "@/lib/utils";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function Dashboard() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleNewStory = async () => {
    const existingStories = await db.getMyStories() || [];
    const storyNumber = existingStories.length + 1;
    const storyId = `story_${Date.now()}`;
    const storyName = `Truyện số ${storyNumber}`;
    const initialNode = {
      id: "1.0", label: "1.0",
      title: "Mở đầu",
      content: "", x: 400, y: 80, choices: []
    };
    await db.saveStoryNodes(storyId, [initialNode]);
    await db.saveMyStories([...existingStories, {
      id: storyId, title: storyName, lastEdited: "Just now",
      status: "draft", branches: 1, words: 0, endings: 1
    }]);
    navigate(`/editor/${storyId}`);
  };

  useEffect(() => {
    let mounted = true;
    const fetchStories = async () => {
      let data = await db.getMyStories();
      if (!data) data = [];
      if (mounted) { setStories(data); setLoading(false); }
    };
    fetchStories();
    return () => { mounted = false; };
  }, []);

  const handleDelete = async (storyId: string) => {
    const updated = stories.filter(s => s.id !== storyId);
    await db.saveMyStories(updated);
    setStories(updated);
  };

  const handlePublish = async (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    const newStatus = story.status === "published" ? "draft" : "published";
    const updated = stories.map(s =>
      s.id === storyId ? { ...s, status: newStatus } : s
    );
    await db.saveMyStories(updated);
    setStories(updated);

    const feed = await db.getFeed() || [];
    if (newStatus === "published") {
      if (!feed.find((f: any) => f.id === storyId)) {
        const [user, nodes] = await Promise.all([db.getUser(), db.getStoryNodes(storyId)]);
        const firstContent: string = nodes?.[0]?.content || "";
        const description = firstContent.length > 180
          ? firstContent.slice(0, 180).trimEnd() + "…"
          : firstContent;
        await db.saveFeed([...feed, {
          id: storyId,
          title: story.title,
          description,
          author: user?.displayName || user?.email || "Ẩn danh",
          tags: [],
          upvotes: 0,
          upvotedBy: [],
          comments: 0,
          publishedAt: new Date().toISOString(),
        }]);
      }
    } else {
      await db.saveFeed(feed.filter((f: any) => f.id !== storyId));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            My Stories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map the multiverse of your narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? null : stories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: i * 0.05 }}
            >
              <StoryCard
                {...story}
                onClick={() => navigate(`/editor/${story.id}`)}
                onDelete={() => handleDelete(story.id)}
                onPublish={() => handlePublish(story.id)}
              />
            </motion.div>
          ))}

          {/* New Story Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: stories.length * 0.05 }}
          >
            <div onClick={handleNewStory} className="aspect-[3/4] rounded-lg border border-dashed border-muted flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/[0.02] transition-sw cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-sw">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-sw" />
              </div>
              <p className="text-xs text-muted-foreground text-center px-6 leading-relaxed">
                Every epic begins with
                <br />a single branch.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
