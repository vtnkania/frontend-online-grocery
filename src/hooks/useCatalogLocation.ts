"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getDefaultStoreLocation } from "@/services/product.service";
import type { StoreLocation } from "@/types/product.type";

type LocationState = {
  loading: boolean;
  latitude?: number;
  longitude?: number;
  store?: StoreLocation;
  source: "browser" | "default" | "manual" | "pending";
  setManualStore: (store: StoreLocation) => void;
  setAutomatedLocation: (state: Partial<LocationState>) => void;
};

// 🚀 ZUSTAND GLOBAL STORE: Membuat state terbagi secara global
const useLocationStore = create<LocationState>((set) => ({
  loading: true,
  source: "pending",
  store: undefined,
  latitude: undefined,
  longitude: undefined,
  
  // Aksi ketika user klik ganti toko secara manual di modal
  setManualStore: (store) => set({
    loading: false,
    latitude: store.latitude,
    longitude: store.longitude,
    store,
    source: "manual"
  }),
  setAutomatedLocation: (state) => set(state)
}));

export function useCatalogLocation() {
  const state = useLocationStore();

  useEffect(() => {
    // 🎯 KUNCINYA: Jika user sudah memilih toko secara manual, matikan auto-detect GPS agar lokasi tidak berubah kembali
    if (state.source === "manual") return;

    let active = true;
    const setDefaultLocation = async () => {
      const store = await getDefaultStoreLocation();
      if (!active) return;
      state.setAutomatedLocation({ loading: false, latitude: store.latitude, longitude: store.longitude, store, source: "default" });
    };

    if (!navigator.geolocation) {
      setDefaultLocation().catch(() => state.setAutomatedLocation({ loading: false, source: "default" }));
      return () => { active = false; };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => active && state.setAutomatedLocation({ loading: false, latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: "browser" }),
      () => setDefaultLocation().catch(() => state.setAutomatedLocation({ loading: false, source: "default" })),
      { enableHighAccuracy: true, timeout: 8000 },
    );

    return () => { active = false; };
  }, [state.source]);

  return state;
}