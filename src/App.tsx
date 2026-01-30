import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BirthInput from "./pages/BirthInput";
import TuViResult from "./pages/TuViResult";
import Compatibility from "./pages/Compatibility";
import DayAnalysis from "./pages/DayAnalysis";
import BoiKieu from "./pages/BoiKieu";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lap-la-so" element={<BirthInput />} />
          <Route path="/ket-qua" element={<TuViResult />} />
          <Route path="/tuoi-hop" element={<Compatibility />} />
          <Route path="/xem-ngay" element={<DayAnalysis />} />
          <Route path="/boi-kieu" element={<BoiKieu />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
