import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
const UPDATE_LOG_STORAGE_KEY = "altrealm:update-log:hidden-version";
const UPDATE_LOG = {
  // Change version whenever you publish a new update log message.
  version: "2026-03-17-responsive-phone-ui",
  message: "Sửa giao diện responsive điện thoại",
};

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
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [hideUpdateLogForThisVersion, setHideUpdateLogForThisVersion] = useState(false);

  useEffect(() => {
    try {
      const hiddenVersion = localStorage.getItem(UPDATE_LOG_STORAGE_KEY);
      setIsUpdateLogOpen(hiddenVersion !== UPDATE_LOG.version);
    } catch {
      setIsUpdateLogOpen(true);
    }
  }, []);

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

  const closeUpdateLog = () => {
    if (hideUpdateLogForThisVersion) {
      try {
        localStorage.setItem(UPDATE_LOG_STORAGE_KEY, UPDATE_LOG.version);
      } catch {
        // Ignore localStorage failures and keep default behavior.
      }
    }
    setIsUpdateLogOpen(false);
  };

  const handleUpdateLogOpenChange = (open: boolean) => {
    if (open) {
      setIsUpdateLogOpen(true);
      return;
    }
    closeUpdateLog();
  };

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
        <Dialog open={isUpdateLogOpen} onOpenChange={handleUpdateLogOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thông báo cập nhật</DialogTitle>
              <DialogDescription>{UPDATE_LOG.message}</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-2">
              <Checkbox
                id="hide-update-log"
                checked={hideUpdateLogForThisVersion}
                onCheckedChange={(checked) => setHideUpdateLogForThisVersion(checked === true)}
              />
              <label
                htmlFor="hide-update-log"
                className="text-sm leading-5 text-muted-foreground cursor-pointer select-none"
              >
                Không hiển thị lại cho bản cập nhật này
              </label>
            </div>
            <DialogFooter>
              <Button type="button" onClick={closeUpdateLog}>
                Đã hiểu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
