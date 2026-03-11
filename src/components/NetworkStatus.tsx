import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { useToast } from "@/hooks/use-toast";

const NetworkStatus = () => {
  const { toast } = useToast();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = Network.addListener("networkStatusChange", (status) => {
      if (!status.connected) {
        toast({
          title: "Mất kết nối mạng",
          description: "Một số tính năng cần internet để hoạt động",
        });
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [toast]);

  return null;
};

export default NetworkStatus;
