import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import TuViIztroPage from "./pages/TuViIztroPage";
import Compatibility from "./pages/Compatibility";
import DayAnalysis from "./pages/DayAnalysis";
import BoiKieu from "./pages/BoiKieu";
import BoiQue from "./pages/BoiQue";
import VanHan from "./pages/VanHan";

import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DieuKhoanSuDung from "./pages/DieuKhoanSuDung";
import NguHanhTest from "./components/NguHanhTest";
import CompatibilityTest from "./components/CompatibilityTest";
import Test from "./pages/Test";
import TuViTest from "./pages/TuViTest";
import TestChartPage from "./components/test-chart-page";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/lap-la-so" element={<TuViIztroPage />} />
              <Route path="/tuoi-hop" element={<Compatibility />} />
              <Route path="/xem-ngay" element={<DayAnalysis />} />
              <Route path="/boi-kieu" element={<BoiKieu />} />
              <Route path="/boi-que" element={<BoiQue />} />
              <Route path="/van-han" element={<VanHan />} />
              
              <Route path="/admin-tuvi-2026" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
              <Route path="/dieu-khoan-su-dung" element={<DieuKhoanSuDung />} />
              <Route path="/test-nguhanh" element={<NguHanhTest />} />
              <Route path="/test-compatibility" element={<CompatibilityTest />} />
              <Route path="/test" element={<Test />} />
              <Route path="/test-tuvi" element={<TuViTest />} />
              <Route path="/test-chart" element={<TestChartPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
