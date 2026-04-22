import { createContext, useContext, useState, ReactNode } from "react";
import UpgradeModal from "@/components/UpgradeModal";

interface UpgradeModalContextType {
  openUpgrade: () => void;
  closeUpgrade: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export const UpgradeModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <UpgradeModalContext.Provider
      value={{ openUpgrade: () => setOpen(true), closeUpgrade: () => setOpen(false) }}
    >
      {children}
      <UpgradeModal open={open} onOpenChange={setOpen} />
    </UpgradeModalContext.Provider>
  );
};

export const useUpgradeModal = () => {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  return ctx;
};