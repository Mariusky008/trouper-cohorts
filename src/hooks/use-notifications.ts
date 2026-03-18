"use client";

import { useState, useEffect } from "react";
import { getNotificationCounts } from "@/lib/actions/notifications";

export function useNotifications() {
  const [counts, setCounts] = useState({ market: 0, offers: 0 });
  const [badges, setBadges] = useState({ market: 0, offers: 0 });

  const markAsSeen = (type: 'market' | 'offers') => {
    
  };

  return { badges, markAsSeen };
}