import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "@/lib/utils";

const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

export default function CommunityFeed() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFeed = async () => {
      let data = await db.getFeed();
      if (!data) {
        data = [];
      }
      if (mounted) {
        setFeed(data);
        setLoading(false);
      }
    };
    fetchFeed();
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Community
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore branching narratives from writers around the world.
          </p>
        </div>

        <div className="divide-y divide-border">
          {loading ? null : feed.map((story, i) => (
            <motion.article
              key={story.id}
              className="py-8 first:pt-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-tighter text-primary">
                  {story.author}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {story.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {story.description}
              </p>
              <div className="flex items-center gap-3 mb-4">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to={`/reader/${story.id}`}
                  className="inline-flex items-center px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-sw"
                >
                  Read Story
                </Link>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-sw">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up h-3.5 w-3.5"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                  {story.upvotes}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-sw">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square h-3.5 w-3.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {story.comments}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
