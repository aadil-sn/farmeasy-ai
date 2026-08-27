import { MapPin, Route } from "lucide-react";
import { MapView } from "./Map";

export function RouteContextMap() {
  return (
    <div className="route-map-shell">
      <MapView
        className="route-map"
        initialCenter={{ lat: 13.091, lng: 77.72 }}
        initialZoom={10}
        onMapReady={map => {
          const stops = [
            { position: { lat: 13.136, lng: 78.133 }, title: "Kolar pickup" },
            { position: { lat: 13.004, lng: 77.936 }, title: "Malur pickup" },
            { position: { lat: 12.978, lng: 77.641 }, title: "FreshBasket delivery" },
          ];
          stops.forEach(stop => new google.maps.Marker({ map, ...stop }));
          new google.maps.Polyline({
            map,
            path: stops.map(stop => stop.position),
            geodesic: true,
            strokeColor: "#0c1e17",
            strokeOpacity: 0.72,
            strokeWeight: 4,
          });
        }}
      />
      <div className="route-map-label">
        <span className="route-icon"><Route size={14} /></span>
        <div><strong>Consolidated route</strong><small>3 pickup points · 42 km</small></div>
      </div>
      <div className="route-map-pin"><MapPin size={14} /> Indiranagar</div>
    </div>
  );
}
