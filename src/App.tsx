import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import BuyRPC from "./pages/BuyRPC";
import Broadcast from "./pages/Broadcast";
import Refer from "./pages/Refer";
import Community from "./pages/Community";
import Support from "./pages/Support";
import History from "./pages/History";
import Withdraw from "./pages/Withdraw";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buy-rpc" element={<BuyRPC />} />
            <Route path="/broadcast" element={<Broadcast />} />
            <Route path="/refer" element={<Refer />} />
            <Route path="/community" element={<Community />} />
            <Route path="/support" element={<Support />} />
            <Route path="/history" element={<History />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
