import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LiveMonitor from "./pages/LiveMonitor";
import Analytics from "./pages/Analytics";
import ContentStudio from "./pages/ContentStudio";
import PostSupport from "./pages/PostSupport";
import Scheduler from "./pages/Scheduler";
import OBSControl from "./pages/OBSControl";
import FileManagement from "./pages/FileManagement";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/live-monitor" element={<Layout><LiveMonitor /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/content-studio" element={<Layout><ContentStudio /></Layout>} />
          <Route path="/post-support" element={<Layout><PostSupport /></Layout>} />
          <Route path="/scheduler" element={<Layout><Scheduler /></Layout>} />
          <Route path="/obs-control" element={<Layout><OBSControl /></Layout>} />
          <Route path="/file-management" element={<Layout><FileManagement /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/help" element={<Layout><Help /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
