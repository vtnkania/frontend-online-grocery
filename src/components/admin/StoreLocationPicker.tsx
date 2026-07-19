"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { LoaderCircle, Search } from "lucide-react";
import { forwardGeocodeLocations, type ForwardGeocodingResult } from "@/services/address.service";
import "leaflet/dist/leaflet.css";

const JAKARTA_CENTER = { latitude: -6.17511, longitude: 106.86503 };

type StoreLocationPickerProps = {
  latitude?: number;
  longitude?: number;
  onSelect: (latitude: number, longitude: number, formattedAddress?: string) => void;
};

export default function StoreLocationPicker({ latitude, longitude, onSelect }: StoreLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialCoordinatesRef = useRef(validCoordinates(latitude, longitude));
  const positionMarkerRef = useRef<((latitude: number, longitude: number, focus: boolean) => void) | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ForwardGeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let active = true;
    let animationFrame = 0;

    const initializeMap = async () => {
      const L = await import("leaflet");
      if (!active || !containerRef.current) return;

      const initialCoordinates = initialCoordinatesRef.current;
      const center = initialCoordinates ?? JAKARTA_CENTER;
      const map = L.map(containerRef.current).setView([center.latitude, center.longitude], initialCoordinates ? 16 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: '<span aria-hidden="true" style="display:grid;width:28px;height:28px;place-items:center;border:3px solid white;border-radius:50% 50% 50% 0;background:#047857;box-shadow:0 3px 8px rgba(15,23,42,.35);transform:rotate(-45deg)"><span style="display:block;width:8px;height:8px;border-radius:999px;background:white"></span></span>',
        iconAnchor: [14, 28],
        iconSize: [28, 28],
      });

      const positionMarker = (selectedLatitude: number, selectedLongitude: number, focus: boolean) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([selectedLatitude, selectedLongitude], {
            draggable: true,
            icon: markerIcon,
            title: "Selected store location",
          }).addTo(map);

          markerRef.current.on("dragend", () => {
            const position = markerRef.current?.getLatLng();
            if (position) onSelectRef.current(position.lat, position.lng);
          });
        } else {
          markerRef.current.setLatLng([selectedLatitude, selectedLongitude]);
        }

        if (focus) map.setView([selectedLatitude, selectedLongitude], 16);
      };

      const selectLocation = (selectedLatitude: number, selectedLongitude: number) => {
        positionMarker(selectedLatitude, selectedLongitude, false);
        onSelectRef.current(selectedLatitude, selectedLongitude);
      };

      if (initialCoordinates) {
        markerRef.current = L.marker([initialCoordinates.latitude, initialCoordinates.longitude], {
          draggable: true,
          icon: markerIcon,
          title: "Selected store location",
        }).addTo(map);

        markerRef.current.on("dragend", () => {
          const position = markerRef.current?.getLatLng();
          if (position) onSelectRef.current(position.lat, position.lng);
        });
      }

      map.on("click", (event) => selectLocation(event.latlng.lat, event.latlng.lng));
      mapRef.current = map;
      positionMarkerRef.current = positionMarker;
      setMapReady(true);
      animationFrame = window.requestAnimationFrame(() => map.invalidateSize());
    };

    void initializeMap();

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      markerRef.current?.off();
      markerRef.current = null;
      positionMarkerRef.current = null;
      mapRef.current?.off();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => () => searchControllerRef.current?.abort(), []);

  const searchLocation = async () => {
    if (!mapReady) {
      setSearchMessage("Peta sedang disiapkan. Coba lagi sesaat.");
      return;
    }

    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearchMessage("Ketik minimal 2 karakter untuk mencari lokasi.");
      return;
    }

    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setSearching(true);
    setResults([]);
    setSearchMessage("Mencari lokasi...");

    try {
      const nextResults = await forwardGeocodeLocations(normalizedQuery, controller.signal);
      if (searchControllerRef.current !== controller) return;
      setResults(nextResults);
      setSearchMessage(nextResults.length ? `${nextResults.length} lokasi ditemukan. Pilih salah satu hasil.` : "Lokasi tidak ditemukan.");
    } catch (error) {
      if (!isAbortError(error) && searchControllerRef.current === controller) {
        setSearchMessage(error instanceof Error ? error.message : "Gagal mencari lokasi.");
      }
    } finally {
      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null;
        setSearching(false);
      }
    }
  };

  const chooseResult = (result: ForwardGeocodingResult) => {
    positionMarkerRef.current?.(result.latitude, result.longitude, true);
    setQuery(result.formatted);
    setResults([]);
    setSearchMessage(null);
    onSelectRef.current(result.latitude, result.longitude, result.formatted);
  };

  return (
    <div className="space-y-2">
      <div role="search" className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Cari lokasi store</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input-admin pl-10"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setResults([]);
              setSearchMessage(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void searchLocation();
              }
            }}
            placeholder="Cari jalan, area, atau nama tempat..."
          />
        </label>
        <button
          type="button"
          className="inline-flex min-w-24 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={searching || !mapReady}
          onClick={() => void searchLocation()}
        >
          {searching ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </button>
      </div>

      {searchMessage && <p className="text-xs text-slate-500" role="status" aria-live="polite">{searchMessage}</p>}

      {results.length > 0 && (
        <ul className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Hasil pencarian lokasi">
          {results.map((result, index) => (
            <li className="border-b border-slate-100 last:border-b-0" key={`${result.latitude}-${result.longitude}-${index}`}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left transition hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none"
                onClick={() => chooseResult(result)}
              >
                <span className="block text-sm font-medium text-slate-800">{result.formatted}</span>
                <span className="mt-1 block text-xs text-slate-500">{result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
        <div
          ref={containerRef}
          className="h-64 w-full"
          aria-label="Store location map. Click the map or drag the marker to select a location."
        />
      </div>
    </div>
  );
}

function validCoordinates(latitude?: number, longitude?: number) {
  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
