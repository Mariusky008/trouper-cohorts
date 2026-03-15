"use client";

import { useState, useEffect } from "react";
import { getNotificationCounts } from "@/lib/actions/notifications";

export function useNotifications() {
  const [counts, setCounts] = useState({ market: 0, offers: 0 });
  const [badges, setBadges] = useState({ market: 0, offers: 0 });

  useEffect(() => {
    async function load() {
      try {
        const serverCounts = await getNotificationCounts();
        setCounts(serverCounts);

        // Calculate badges
        const lastMarket = parseInt(localStorage.getItem("lastCount_market") || "0");
        const lastOffers = parseInt(localStorage.getItem("lastCount_offers") || "0");

        setBadges({
          market: Math.max(0, serverCounts.market - lastMarket),
          offers: Math.max(0, serverCounts.offers - lastOffers)
        });
      } catch (e) {
        console.error("Failed to load notifications", e);
      }
    }
    load();
  }, []);

  const markAsSeen = (type: 'market' | 'offers') => {
    if (type === 'market') {
      localStorage.setItem("lastCount_market", counts.market.toString());
      setBadges(prev => ({ ...prev, market: 0 }));
    } else if (type === 'offers') {
      localStorage.setItem("lastCount_offers", counts.offers.toString());
      setBadges(prev => ({ ...prev, offers: 0 }));
    }
  };

  return { badges, markAsSeen };
}