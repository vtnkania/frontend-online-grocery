"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getDefaultStoreLocation, getProducts } from "@/services/product.service";
import type { StoreLocation } from "@/types/product.type";

type LocationState = {
  loading: boolean;
  latitude?: number;
  longitude?: number;
  store?: StoreLocation;
  source: "browser" | "default" | "manual" | "pending";
  isAutoLocation: boolean;
  setManualStore: (store: StoreLocation) => void;
  setAutomatedLocation: (state: Partial<LocationState>) => void;
  setAutoLocationMode: (enabled: boolean) => void;
  hydrateStore: () => void;
};

const useLocationStore = create<LocationState>((set) => ({
  loading: true,
  source: "pending",
  store: undefined,
  latitude: undefined,
  longitude: undefined,
  isAutoLocation: true,

  setManualStore: (store) => {
    const newState = {
      loading: false,
      latitude: store.latitude,
      longitude: store.longitude,
      store,
      source: "manual" as const,
      isAutoLocation: false,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("freshmart_location_cache", JSON.stringify(newState));
    }
    set(newState);
  },

  setAutomatedLocation: (state) =>
    set((prev) => {
      const newState = { ...prev, ...state };
      if (typeof window !== "undefined" && state.source && state.source !== "pending") {
        localStorage.setItem(
          "freshmart_location_cache",
          JSON.stringify({
            loading: newState.loading,
            latitude: newState.latitude,
            longitude: newState.longitude,
            store: newState.store,
            source: newState.source,
            isAutoLocation: newState.isAutoLocation,
          })
        );
      }
      return newState;
    }),

  setAutoLocationMode: (enabled) =>
    set((prev) => {
      const newState = {
        ...prev,
        isAutoLocation: enabled,
        source: enabled ? ("pending" as const) : ("manual" as const),
        loading: enabled,
        store: enabled ? undefined : prev.store,
        latitude: enabled ? undefined : prev.latitude,
        longitude: enabled ? undefined : prev.longitude,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("freshmart_location_cache", JSON.stringify(newState));
      }
      return newState;
    }),

  hydrateStore: () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("freshmart_location_cache");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          set({
            loading: parsed.loading,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            store: parsed.store,
            source: parsed.source,
            isAutoLocation: parsed.isAutoLocation ?? true,
          });
        } catch (e) {
          console.error("Gagal sinkronisasi cache lokasi:", e);
        }
      }
    }
  },
}));

export function useCatalogLocation() {
  const state = useLocationStore();

  useEffect(() => {
    state.hydrateStore();
  }, []);

  // 1. Fetch koordinat GPS dari Browser / Fallback Default Store
  useEffect(() => {
    if (state.source === "manual" || !state.isAutoLocation) return;

    let active = true;
    const setDefaultLocation = async () => {
      const store = await getDefaultStoreLocation();
      if (!active) return;
      state.setAutomatedLocation({
        loading: false,
        latitude: store.latitude,
        longitude: store.longitude,
        store,
        source: "default",
      });
    };

    if (!navigator.geolocation) {
      setDefaultLocation().catch(() => state.setAutomatedLocation({ loading: false, source: "default" }));
      return () => { active = false; };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (active) {
          state.setAutomatedLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            source: "browser",
          });
        }
      },
      () => {
        if (active) {
          setDefaultLocation()
            .then(() => state.setAutomatedLocation({ isAutoLocation: false, source: "default" }))
            .catch(() => state.setAutomatedLocation({ loading: false, source: "default", isAutoLocation: false }));
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => { active = false; };
  }, [state.source, state.isAutoLocation]);

  // 🚀 2. FIX: Otomatis cari 'nearestStore' dari backend saat koordinat lat/lng tersedia
  useEffect(() => {
    if (!state.isAutoLocation || state.source === "manual") return;
    if (state.latitude === undefined || state.longitude === undefined) return;

    let active = true;
    getProducts({ latitude: state.latitude, longitude: state.longitude, limit: 1 })
      .then((res) => {
        if (!active) return;
        const nearest = res?.meta?.nearestStore;
        if (nearest && state.store?.id !== nearest.id) {
          state.setAutomatedLocation({ store: nearest, loading: false });
        } else {
          state.setAutomatedLocation({ loading: false });
        }
      })
      .catch(() => {
        if (active) state.setAutomatedLocation({ loading: false });
      });

    return () => { active = false; };
  }, [state.latitude, state.longitude, state.isAutoLocation, state.source]);

  return state;
}