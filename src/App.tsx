import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocationProvider } from "@/contexts/LocationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import Finds from "./pages/Finds";
import MapPage from "./pages/MapPage";
import Forum from "./pages/Forum";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import MarketDetail from "./pages/MarketDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LocationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page - no layout wrapper */}
            <Route path="/" element={<Landing />} />
            
            {/* App pages - with layout */}
            <Route path="/explore" element={<AppLayout><Explore /></AppLayout>} />
            <Route path="/finds" element={<AppLayout><Finds /></AppLayout>} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/forum" element={<AppLayout><Forum /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/u/:userId" element={<AppLayout><UserProfile /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/market/:marketId" element={<AppLayout><MarketDetail /></AppLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
