"use client";

import { useEffect, useState } from "react";
import { getDefaultStoreLocation } from "@/services/product.service";
import type { StoreLocation } from "@/types/product.type";

type LocationState = {
  loading: boolean;
  latitude?: number;
  longitude?: number;
  store?: StoreLocation;
  source: "browser" | "default" | "pending";
};

export function useCatalogLocation() {
  const [location, setLocation] = useState<LocationState>({ loading: true, source: "pending" });

  useEffect(() => {
    let active = true;
    const setDefaultLocation = async () => {
      const store = await getDefaultStoreLocation();
      if (!active) return;
      setLocation({ loading: false, latitude: store.latitude, longitude: store.longitude, store, source: "default" });
    };
    if (!navigator.geolocation) {
      setDefaultLocation().catch(() => setLocation({ loading: false, source: "default" }));
      return () => { active = false; };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => active && setLocation({ loading: false, latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: "browser" }),
      () => setDefaultLocation().catch(() => setLocation({ loading: false, source: "default" })),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    return () => { active = false; };
  }, []);

  return location;
}
