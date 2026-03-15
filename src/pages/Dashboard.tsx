import { DashboardLayout } from "@/components/DashboardLayout";
import { StoryCard } from "@/components/StoryCard";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { db } from "@/lib/utils";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function Dashboard() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStories = async () => {
      let data = await db.getMyStories();
      if (!data) {
        data = [];
      }
      if (mounted) {
        setStories(data);
        setLoading(false);
      }
    };
    fetchStories();
    return () => { mounted = false; };
  }, []);

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
              <Link to={`/editor/${story.id}`}>
                <StoryCard {...story} />
              </Link>
            </motion.div>
          ))}

          {/* New Story Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: stories.length * 0.05 }}
          >
            <Link to="/editor/new">
              <div className="aspect-[3/4] rounded-lg border border-dashed border-muted flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/[0.02] transition-sw cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-sw">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-sw" />
                </div>
                <p className="text-xs text-muted-foreground text-center px-6 leading-relaxed">
                  Every epic begins with
                  <br />a single branch.
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
