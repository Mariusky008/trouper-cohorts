"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSubscription } from "@/lib/actions/notifications";
import { toast } from "sonner";

export function PushManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check support
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Don't wait forever for SW. If it's not ready quickly, just show button.
      const checkTimeout = setTimeout(() => {
          setLoading(false);
      }, 2000); // 2s timeout

      navigator.serviceWorker.ready.then((registration) => {
          clearTimeout(checkTimeout); // Clear timeout if ready
          registration.pushManager.getSubscription().then((subscription) => {
              setIsSubscribed(!!subscription);
              setLoading(false);
          }).catch((e) => {
              console.error("Error getting subscription:", e);
              setLoading(false);
          });
      }).catch((e) => {
          console.error("Error waiting for SW ready:", e);
          setLoading(false);
      });
    } else {
      setIsSupported(false);
      setLoading(false);
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      // 1. Force fetch environment variable (sometimes Next.js caches old envs in SW)
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      console.log("VAPID Key check:", vapidKey ? "Present" : "Missing", vapidKey?.substring(0, 5));

      if (!vapidKey) {
          throw new Error("Clé VAPID non trouvée. Redéploiement nécessaire ?");
      }

      // 2. Check permission first
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permission refusée. Vérifiez vos réglages.");
      }

      // 3. Wait for SW with timeout
      const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Service Worker")), 4000))
      ]) as ServiceWorkerRegistration;

      if (!registration) throw new Error("Service Worker non enregistré.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save to backend
      await saveSubscription(subscription);
      
      setIsSubscribed(true);
      toast.success("Notifications activées !");
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      toast.error(`Erreur: ${error.message || "Impossible d'activer"}`);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.info("Notifications désactivées.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
    } finally {
      setLoading(false);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (loading) {
      return (
        <Button variant="outline" disabled className="w-full justify-start gap-3 bg-white/5 border-white/10 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Vérification...
        </Button>
      );
  }

  if (!isSupported) {
      return (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
              Non supporté sur cet appareil.
          </div>
      );
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      className={`w-full justify-start gap-3 ${
          isSubscribed 
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300" 
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
      }`}
      onClick={isSubscribed ? unsubscribe : subscribe}
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" /> Notifications actives
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" /> Activer les notifications
        </>
      )}
    </Button>
  );
}
