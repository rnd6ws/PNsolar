"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { MapContainer as LeafletMap, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// @ts-ignore
import "leaflet.markercluster";
import { RefreshCw, MapPin } from "lucide-react";
import type { MapKhachHang } from "@/features/ban-do-kh/types";
import { getMarkerColor } from "@/features/ban-do-kh/utils/mapUtils";

// ── Fix Leaflet default icon ─────────────────────────────────────────
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ── Tile Layer Config ─────────────────────────────────────────────────
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// ── MapEventHandler ───────────────────────────────────────────────────
function MapEventHandler({
    onBoundsChanged,
    setMapRef,
}: {
    onBoundsChanged?: (bounds: L.LatLngBounds) => void;
    setMapRef?: (map: L.Map) => void;
}) {
    const map = useMap();

    useEffect(() => {
        setMapRef?.(map);
    }, [map, setMapRef]);

    useMapEvents({
        moveend: () => onBoundsChanged?.(map.getBounds()),
        zoomend: () => onBoundsChanged?.(map.getBounds()),
    });
    return null;
}

// ── MapViewController ─────────────────────────────────────────────────
function MapViewController({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    const isFirst = useRef(true);
    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        map.setView([center.lat, center.lng], map.getZoom());
    }, [center, map]);
    return null;
}

// ── Cluster Markers ───────────────────────────────────────────────────
function ClusterMarkers({
    customers,
    onMarkerClick,
    onViewDetail,
}: {
    customers: MapKhachHang[];
    onMarkerClick: (c: MapKhachHang) => void;
    onViewDetail: (c: MapKhachHang) => void;
}) {
    const map = useMap();
    const clusterRef = useRef<any>(null);

    const handleGetDirections = useCallback((customer: MapKhachHang) => {
        if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ định vị");
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${customer.LAT},${customer.LONG}&travelmode=driving`;
                window.open(url, "_blank");
            },
            () => alert("Không thể lấy vị trí hiện tại")
        );
    }, []);

    useEffect(() => {
        if (clusterRef.current) map.removeLayer(clusterRef.current);

        // @ts-ignore
        clusterRef.current = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true,
            removeOutsideVisibleBounds: true,
            animate: true,
            maxClusterRadius: 60,
            iconCreateFunction: (cluster: any) => {
                const count = cluster.getChildCount();
                const c =
                    count > 100
                        ? "#7c3aed"
                        : count > 50
                        ? "#6366f1"
                        : count > 10
                        ? "#f59e0b"
                        : "#10b981";
                return L.divIcon({
                    html: `<div style="background:${c};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
                    className: "custom-cluster-icon",
                    iconSize: L.point(40, 40, true),
                });
            },
        });

        customers.forEach((customer) => {
            const lat = parseFloat(String(customer.LAT));
            const lng = parseFloat(String(customer.LONG));
            const color = getMarkerColor(customer.PHAN_LOAI, customer.DANH_GIA);

            const icon = L.divIcon({
                className: "custom-marker-icon",
                html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);position:relative;"><div style="width:8px;height:8px;background-color:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                popupAnchor: [0, -26],
            });

            const marker = L.marker([lat, lng], { icon });

            // Build popup DOM
            const popup = document.createElement("div");
            popup.style.minWidth = "260px";
            popup.style.fontFamily = "inherit";
            popup.innerHTML = `
                <div style="padding:12px">
                    <div style="display:flex;align-items:start;gap:8px;margin-bottom:8px">
                        <div style="width:10px;height:10px;border-radius:50%;background:${color};margin-top:4px;shrink:0;"></div>
                        <div>
                            <p style="font-weight:700;font-size:14px;color:#111827;line-height:1.3">${customer.TEN_KH}</p>
                            ${customer.TEN_VT ? `<p style="font-size:11px;color:#6b7280">${customer.TEN_VT}</p>` : ""}
                        </div>
                    </div>
                    ${
                        customer.DIA_CHI
                            ? `<p style="font-size:12px;color:#6b7280;margin-bottom:8px">📍 ${customer.DIA_CHI}</p>`
                            : ""
                    }
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
                        ${
                            customer.PHAN_LOAI
                                ? `<span style="padding:2px 8px;border-radius:20px;font-size:11px;background:${color}20;color:${color};font-weight:600">${customer.PHAN_LOAI}</span>`
                                : ""
                        }
                        ${customer.DANH_GIA ? `<span style="font-size:12px">${customer.DANH_GIA}</span>` : ""}
                    </div>
                    ${
                        customer.SALES_PT
                            ? `<p style="font-size:11px;color:#6b7280;margin-bottom:8px">👤 ${customer.SALES_PT}</p>`
                            : ""
                    }
                    <div style="display:flex;gap:6px">
                        <button class="popup-detail-btn" style="flex:1;padding:7px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:linear-gradient(135deg,#f59e0b,#d97706);color:white">👁️ Chi tiết</button>
                        <button class="popup-dir-btn" style="flex:1;padding:7px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white">🧭 Chỉ đường</button>
                    </div>
                </div>
            `;

            popup.querySelector(".popup-detail-btn")?.addEventListener("click", () => {
                marker.closePopup();
                onViewDetail(customer);
            });
            popup.querySelector(".popup-dir-btn")?.addEventListener("click", () =>
                handleGetDirections(customer)
            );

            marker.bindPopup(popup, { maxWidth: 320 });
            marker.on("click", () => onMarkerClick(customer));
            clusterRef.current!.addLayer(marker);
        });

        map.addLayer(clusterRef.current);
        return () => {
            if (clusterRef.current) map.removeLayer(clusterRef.current);
        };
    }, [map, customers, onMarkerClick, onViewDetail, handleGetDirections]);

    return null;
}

// ── HeatmapLayer ──────────────────────────────────────────────────────
function HeatmapLayer({ customers }: { customers: MapKhachHang[] }) {
    const map = useMap();
    const heatRef = useRef<L.Layer | null>(null);

    useEffect(() => {
        import("leaflet.heat" as any).then(() => {
            if (heatRef.current) map.removeLayer(heatRef.current);
            const data = customers.map((c) => {
                const rating = (c.DANH_GIA || "").length;
                const pl = (c.PHAN_LOAI || "").toLowerCase();
                const weight = pl.includes("triển khai") || pl.includes("sử dụng")
                    ? 3
                    : rating >= 4
                    ? 2.5
                    : rating >= 2
                    ? 1.5
                    : 1;
                return [
                    parseFloat(String(c.LAT)),
                    parseFloat(String(c.LONG)),
                    weight,
                ] as [number, number, number];
            });
            if ((L as any).heatLayer && data.length > 0) {
                heatRef.current = (L as any)
                    .heatLayer(data, {
                        radius: 25,
                        blur: 15,
                        maxZoom: 17,
                        max: 3.0,
                        gradient: {
                            0.0: "#a5f3fc",
                            0.4: "#6366f1",
                            0.7: "#f59e0b",
                            1.0: "#ef4444",
                        },
                    })
                    .addTo(map);
            }
        }).catch(console.warn);
        return () => {
            if (heatRef.current) map.removeLayer(heatRef.current);
        };
    }, [customers, map]);

    return null;
}

// ── Main MapContainer ─────────────────────────────────────────────────
export interface MapContainerProps {
    customers: MapKhachHang[];
    viewMode: "cluster" | "heatmap";
    center: { lat: number; lng: number };
    loading?: boolean;
    onMarkerClick: (c: MapKhachHang) => void;
    onViewDetail: (c: MapKhachHang) => void;
    onBoundsChanged?: (bounds: L.LatLngBounds) => void;
    setMapRef?: (map: L.Map) => void;
}

export default function MapContainer({
    customers,
    viewMode,
    center,
    loading,
    onMarkerClick,
    onViewDetail,
    onBoundsChanged,
    setMapRef,
}: MapContainerProps) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 100);
        return () => clearTimeout(t);
    }, []);

    if (!ready || loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
                </div>
            </div>
        );
    }

    if (customers.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                <div className="text-center">
                    <MapPin className="w-14 h-14 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-1 text-foreground">Không có dữ liệu</h3>
                    <p className="text-sm text-muted-foreground">
                        Không tìm thấy khách hàng nào phù hợp với bộ lọc
                    </p>
                </div>
            </div>
        );
    }

    return (
        <LeafletMap
            center={[center.lat, center.lng]}
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
        >
            <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
            <MapEventHandler onBoundsChanged={onBoundsChanged} setMapRef={setMapRef} />
            <MapViewController center={center} />
            {viewMode === "cluster" && (
                <ClusterMarkers
                    customers={customers}
                    onMarkerClick={onMarkerClick}
                    onViewDetail={onViewDetail}
                />
            )}
            {viewMode === "heatmap" && <HeatmapLayer customers={customers} />}
        </LeafletMap>
    );
}
