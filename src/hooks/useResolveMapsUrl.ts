"use client";

import { useState } from "react";
import type { MapsInfo } from "@/lib/maps/resolveMapsInfo";

interface UseResolveMapsUrlReturn {
    resolve: (url: string) => Promise<void>;
    result: MapsInfo | null;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

/**
 * Hook resolve link Google Maps (rút gọn hoặc đầy đủ) → tọa độ + địa chỉ.
 * Gọi qua /api/resolve-maps để tránh CORS (Nominatim + redirect đều server-side).
 *
 * @example
 * const { resolve, result, loading, error } = useResolveMapsUrl();
 * await resolve("https://maps.app.goo.gl/xxx");
 * // result.lat, result.lng, result.address, result.name
 */
export function useResolveMapsUrl(): UseResolveMapsUrlReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MapsInfo | null>(null);

    async function resolve(url: string) {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/resolve-maps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setResult(null);
        setError(null);
    }

    return { resolve, result, loading, error, reset };
}
