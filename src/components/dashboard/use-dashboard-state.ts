"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSnapshot } from "@/components/dashboard/dashboard-api";
import type { DashboardSnapshot } from "@/types/dashboard";

const REFRESH_MS = 60_000;

export function useDashboardState(initial: DashboardSnapshot): {
  snapshot: DashboardSnapshot;
  loading: boolean;
  error: string | null;
} {
  const [snapshot, setSnapshot] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchDashboardSnapshot();
      setSnapshot(next);
    } catch {
      setError("Dashboard refresh failed. Showing last known data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  return { snapshot, loading, error };
}
