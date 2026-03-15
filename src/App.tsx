import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import StoryEditor from "./pages/StoryEditor";
import ReaderMode from "./pages/ReaderMode";
import StoryExplore from "./pages/StoryExplore";
import CommunityFeed from "./pages/CommunityFeed";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { db } from "./lib/utils";
import { applyTheme } from "./lib/themes";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/auth" replace /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/editor/:id", element: <StoryEditor /> },
  { path: "/reader/:id", element: <ReaderMode /> },
  { path: "/explore/:id", element: <StoryExplore /> },
  { path: "/community", element: <CommunityFeed /> },
  { path: "/settings", element: <Settings /> },
  { path: "*", element: <NotFound /> },
]);

const App = () => {
  // Restore saved theme on every app load
  useEffect(() => {
    db.getUser().then((user) => {
      if (user?.bgTheme) applyTheme(user.bgTheme);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
