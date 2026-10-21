"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { escapeHtml, shortPlace } from "@/lib/format";
import { themeColor } from "@/lib/themes";

export type MapGuide = {
  id: number;
  destination: string;
  title: string;
  lat: number;
  lng: number;
  coverTheme: string;
};

export type MapPerson = {
  userId: number;
  nickname: string;
  lat: number;
  lng: number;
  label: string;
};

type Point = { lat: number; lng: number };

type Props = {
  guides: MapGuide[];
  presences?: MapPerson[];
  selectedId?: number | null;
  hoverId?: number | null;
  focusToken?: number;
  focusGuideId?: number | null;
  focusPoint?: Point | null;
  selfPoint?: Point | null;
  fitKey?: string;
  initialCenter?: { lat: number; lng: number; zoom: number } | null;
  pickEnabled?: boolean;
  picked?: Point | null;
  onSelect?: (id: number) => void;
  onPick?: (lat: number, lng: number) => void;
  currentUserId?: number | null;
};

export function MapCanvas(props: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const propsRef = useRef(props);
  const initialRef = useRef(props.initialCenter ?? null);
  const groupsRef = useRef<{ guides: LayerGroup; people: LayerGroup; extra: LayerGroup } | null>(null);
  const [ready, setReady] = useState(false);
  propsRef.current = props;

  useEffect(() => {
    const element = elRef.current;
    if (!element) return;
    let alive = true;
    let map: LeafletMap | null = null;
    let observer: ResizeObserver | null = null;

    (async () => {
      const L = await import("leaflet");
      if (!alive || !elRef.current) return;
      map = L.map(element, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 18,
        worldCopyJump: true,
      }).setView([34.2, 104], 4);
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (event) => {
        if (!propsRef.current.pickEnabled) return;
        propsRef.current.onPick?.(event.latlng.lat, event.latlng.lng);
      });
      map.on("zoomend", () => drawRef.current());
      mapRef.current = map;
      leafletRef.current = L;
      observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(element);
      setReady(true);
    })();

    return () => {
      alive = false;
      observer?.disconnect();
      groupsRef.current = null;
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
      setReady(false);
    };
  }, []);

  const drawRef = useRef<() => void>(() => {});
  drawRef.current = () => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    const current = propsRef.current;
    const zoom = map.getZoom();
    const near = zoom >= 6;

    if (!groupsRef.current) {
      groupsRef.current = {
        guides: L.layerGroup().addTo(map),
        people: L.layerGroup().addTo(map),
        extra: L.layerGroup().addTo(map),
      };
    }
    const groups = groupsRef.current;
    groups.guides.clearLayers();
    groups.people.clearLayers();
    groups.extra.clearLayers();

    for (const guide of current.guides) {
      const active = guide.id === current.selectedId;
      const hover = guide.id === current.hoverId;
      const color = themeColor(guide.coverTheme);
      const label = near ? `<em>${escapeHtml(shortPlace(guide.destination))}</em>` : "";
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="gpin${active ? " is-active" : ""}${hover ? " is-hover" : ""}" title="${escapeHtml(guide.destination)} · ${escapeHtml(guide.title)}"><i style="background:${color}"></i>${label}</div>`,
        iconSize: near ? [150, 32] : [18, 18],
        iconAnchor: near ? [8, 16] : [9, 9],
      });
      const marker = L.marker([guide.lat, guide.lng], {
        icon,
        keyboard: false,
        zIndexOffset: active ? 900 : hover ? 600 : 100,
      });
      marker.on("click", (event) => {
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        current.onSelect?.(guide.id);
      });
      marker.addTo(groups.guides);
    }

    for (const person of current.presences ?? []) {
      const self = person.userId === current.currentUserId;
      const name = self ? "我" : person.nickname.slice(0, 1);
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="who${self ? " is-self" : ""}" title="${escapeHtml(self ? "我共享的位置" : person.nickname)}${person.label ? ` · ${escapeHtml(person.label)}` : ""}"><i></i><b>${escapeHtml(name)}</b></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([person.lat, person.lng], { icon, keyboard: false, zIndexOffset: 400 }).addTo(groups.people);
    }

    if (current.selfPoint) {
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="self-dot" title="我的位置，仅自己可见"><i></i></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([current.selfPoint.lat, current.selfPoint.lng], { icon, keyboard: false, zIndexOffset: 1200 }).addTo(
        groups.extra,
      );
    }

    if (current.picked) {
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="picked"><i></i><em>钉在这里</em></div>`,
        iconSize: [120, 32],
        iconAnchor: [8, 16],
      });
      L.marker([current.picked.lat, current.picked.lng], { icon, keyboard: false, zIndexOffset: 1300 }).addTo(
        groups.extra,
      );
    }
  };

  useEffect(() => {
    if (!ready) return;
    drawRef.current();
  }, [
    ready,
    props.guides,
    props.presences,
    props.selectedId,
    props.hoverId,
    props.selfPoint,
    props.picked,
    props.currentUserId,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!ready || !map || !L) return;
    const current = propsRef.current;
    const center = initialRef.current;
    if (center && current.fitKey === "write") {
      map.setView([center.lat, center.lng], center.zoom);
      return;
    }
    if (!current.guides.length) {
      map.setView([34.2, 104], 4);
      return;
    }
    const bounds = L.latLngBounds(current.guides.map((guide) => [guide.lat, guide.lng] as [number, number]));
    if (current.guides.length === 1) map.setView(bounds.getCenter(), 11, { animate: false });
    else map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7, animate: false });
  }, [ready, props.fitKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !props.focusToken) return;
    const current = propsRef.current;
    const guide = current.guides.find((item) => item.id === current.focusGuideId);
    const point = guide ? { lat: guide.lat, lng: guide.lng } : current.focusPoint;
    if (!point) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const zoom = guide ? Math.max(map.getZoom(), 9) : 13;
    if (reduce) map.setView([point.lat, point.lng], zoom);
    else map.flyTo([point.lat, point.lng], zoom, { duration: 0.7 });
  }, [ready, props.focusToken]);

  return <div ref={elRef} className="map-canvas" data-ready={ready ? "true" : "false"} />;
}
