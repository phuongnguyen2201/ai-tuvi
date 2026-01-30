import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import BirthInput from "./pages/BirthInput";
import TuViResult from "./pages/TuViResult";
import Compatibility from "./pages/Compatibility";
import DayAnalysis from "./pages/DayAnalysis";
import BoiKieu from "./pages/BoiKieu";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NguHanhTest from "./components/NguHanhTest";
import CompatibilityTest from "./components/CompatibilityTest";
import Test from "./pages/Test";
import TuViTest from "./pages/TuViTest";
import TestChartPage from "./pages/TestChartPage";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/lap-la-so" element={<BirthInput />} />
            <Route path="/ket-qua" element={<TuViResult />} />
            <Route path="/tuoi-hop" element={<Compatibility />} />
            <Route path="/xem-ngay" element={<DayAnalysis />} />
            <Route path="/boi-kieu" element={<BoiKieu />} />
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
  </QueryClientProvider>
);

export default App;
