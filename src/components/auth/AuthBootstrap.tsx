"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthBootstrap() {
  const initialize = useAuth((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}
