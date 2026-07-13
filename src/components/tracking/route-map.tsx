"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import { formatDate } from "@/components/crm/crm-format";
import type { RouteStop, GeoPoint } from "@/lib/mock/tracking";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
  }, [map, points]);
  return null;
}

function stopIcon(kind: "start" | "end" | "stop", index: number) {
  const bg = kind === "start" ? "#059669" : kind === "end" ? "#dc2626" : "#0f2942";
  const label = kind === "start" ? "B" : kind === "end" ? "S" : String(index);
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${bg};color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

interface RouteMapProps {
  stops: RouteStop[];
  breadcrumbs: GeoPoint[];
  liveIndex?: number | null;
}

export function RouteMap({ stops, breadcrumbs, liveIndex = null }: RouteMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (breadcrumbs.length === 0) return [40.8237, 29.2987];
    const mid = breadcrumbs[Math.floor(breadcrumbs.length / 2)];
    return [mid.lat, mid.lng];
  }, [breadcrumbs]);

  const path = useMemo<[number, number][]>(() => breadcrumbs.map((p) => [p.lat, p.lng]), [breadcrumbs]);
  const boundsPoints = useMemo<[number, number][]>(() => stops.map((s) => [s.lat, s.lng]), [stops]);
  const walked = liveIndex !== null ? path.slice(0, liveIndex + 1) : path;
  const livePoint = liveIndex !== null ? breadcrumbs[liveIndex] : null;

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full rounded-2xl" style={{ minHeight: 360 }}>
      <FitBounds points={boundsPoints} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#0f2942", weight: 3, opacity: 0.35, dashArray: "1 8" }} />}
      {walked.length > 1 && <Polyline positions={walked} pathOptions={{ color: "#059669", weight: 4, opacity: 0.9 }} />}

      {stops.map((stop, i) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={stopIcon(i === 0 ? "start" : i === stops.length - 1 ? "end" : "stop", i)}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{stop.label}</p>
              {stop.workOrderNo && <p className="text-muted-foreground">İş Emri: {stop.workOrderNo}</p>}
              <p className="text-muted-foreground">
                Varış: {formatTime(stop.arrivedAt)} · Ayrılış: {formatTime(stop.departedAt)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {livePoint && (
        <CircleMarker
          center={[livePoint.lat, livePoint.lng]}
          radius={9}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#059669", fillOpacity: 1 }}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">Anlık Konum</p>
              <p className="text-muted-foreground">{formatDate(livePoint.timestamp)} {formatTime(livePoint.timestamp)}</p>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
