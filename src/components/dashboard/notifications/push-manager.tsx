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
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        throw new Error("VAPID public key not found");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save to backend
      await saveSubscription(subscription);
      
      setIsSubscribed(true);
      toast.success("Notifications activées !");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Impossible d'activer les notifications. Vérifiez les permissions.");
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
        // Ideally remove from backend too, but for now browser unsub is enough
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

  if (!isSupported) return null;

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-full justify-start gap-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      className={`w-full justify-start gap-3 ${isSubscribed ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-blue-600 hover:bg-blue-500"}`}
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
