import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "./lib/firebase";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import StoryEditor from "./pages/StoryEditor";
import ReaderMode from "./pages/ReaderMode";
import StoryExplore from "./pages/StoryExplore";
import CommunityFeed from "./pages/CommunityFeed";
import Settings from "./pages/Settings";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import { db } from "./lib/utils";
import { applyTheme } from "./lib/themes";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!auth.currentUser) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/community" replace /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/community", element: <CommunityFeed /> },               // public
  { path: "/reader/:id", element: <ReaderMode /> },                  // public
  { path: "/explore/:id", element: <StoryExplore /> },               // public
  { path: "/dashboard", element: <PrivateRoute><Dashboard /></PrivateRoute> },
  { path: "/editor/:id", element: <PrivateRoute><StoryEditor /></PrivateRoute> },
  { path: "/settings", element: <PrivateRoute><Settings /></PrivateRoute> },
  { path: "/admin", element: <PrivateRoute><AdminPage /></PrivateRoute> },
  { path: "*", element: <NotFound /> },
]);

const App = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        db.getUser().then((userData) => {
          if (userData?.bgTheme) applyTheme(userData.bgTheme);
        });
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
