import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import TuViIztroPage from "./pages/TuViIztroPage";
import Compatibility from "./pages/Compatibility";
import DayAnalysis from "./pages/DayAnalysis";
import BoiKieu from "./pages/BoiKieu";
import MyNFTs from "./pages/MyNFTs";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NguHanhTest from "./components/NguHanhTest";
import CompatibilityTest from "./components/CompatibilityTest";
import Test from "./pages/Test";
import TuViTest from "./pages/TuViTest";
import TestChartPage from "./components/test-chart-page";

const App = () => (
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
          <Route path="/my-nfts" element={<MyNFTs />} />
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
);

export default App;
