import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker as LMarker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Phone,
  Users,
  AlertTriangle,
  Tent,
  Compass,
  Layers,
  CheckCircle2,
  Droplet,
  Globe,
  Navigation,
  MessageCircle,
  Mail,
  ExternalLink,
  Shield,
  HelpCircle,
  Eye,
  ArrowRight,
  Package,
  Info
} from 'lucide-react';
import {
  createWhatsAppSosLink,
  createEmailSosLink,
  getGoogleMapsDirectionsLink
} from '../utils/shareAlert';

const defaultCenter = {
  lat: 26.155,
  lng: 91.75
};

// High-Definition, Intuitive Custom Leaflet Icons with clear status emblems & live badges
const createLeafletIcon = (type, data = {}) => {
  let bgColor = '#0284c7';
  let iconSymbol = '⛺';
  let pulseClass = '';
  let badgeText = '';
  let pinShape = 'pin-teardrop';

  if (type === 'sos') {
    const isCritical = data.urgency === 'critical';
    const isInProgress = data.status === 'in_progress';
    const trapped = data.peopleCount ? `${data.peopleCount}👥` : '';

    if (isInProgress) {
      bgColor = '#06b6d4'; // Cyan/Teal
      iconSymbol = '🚤';
      pulseClass = 'marker-pulse-cyan';
      badgeText = 'RESCUING';
    } else if (isCritical) {
      bgColor = '#f43f5e'; // Bright Rose Red
      iconSymbol = '🆘';
      pulseClass = 'marker-pulse-critical';
      badgeText = trapped ? `${trapped} CRITICAL` : 'CRITICAL';
    } else {
      bgColor = '#f97316'; // Vivid Orange
      iconSymbol = '🚨';
      pulseClass = 'marker-pulse-high';
      badgeText = trapped ? `${trapped} SOS` : 'HIGH SOS';
    }

    return L.divIcon({
      className: 'custom-leaflet-marker-sos',
      html: `
        <div class="enhanced-marker-wrap ${pulseClass}">
          ${badgeText ? `<div class="marker-floating-badge badge-${isCritical ? 'rose' : isInProgress ? 'cyan' : 'orange'}">${badgeText}</div>` : ''}
          <div class="marker-bubble" style="background: ${bgColor}; box-shadow: 0 0 16px ${bgColor}88;">
            <span class="marker-icon-glyph">${iconSymbol}</span>
          </div>
          <div class="marker-point-tip" style="border-top-color: ${bgColor};"></div>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -48],
      tooltipAnchor: [0, -50]
    });
  } else if (type === 'camp') {
    const totalCap = data.capacity || 100;
    const occ = data.currentOccupancy || 0;
    const freeBeds = Math.max(0, totalCap - occ);
    const isFull = freeBeds === 0;

    bgColor = isFull ? '#e11d48' : '#10b981'; // Emerald if beds free, Red if full
    iconSymbol = '⛺';
    badgeText = isFull ? 'FULL' : `${freeBeds}🛏️ FREE`;

    return L.divIcon({
      className: 'custom-leaflet-marker-camp',
      html: `
        <div class="enhanced-marker-wrap marker-pulse-camp">
          <div class="marker-floating-badge badge-${isFull ? 'rose' : 'emerald'}">${badgeText}</div>
          <div class="marker-bubble marker-camp-hexagon" style="background: ${bgColor}; box-shadow: 0 0 14px ${bgColor}77;">
            <span class="marker-icon-glyph">${iconSymbol}</span>
          </div>
          <div class="marker-point-tip" style="border-top-color: ${bgColor};"></div>
        </div>
      `,
      iconSize: [46, 52],
      iconAnchor: [23, 52],
      popupAnchor: [0, -48],
      tooltipAnchor: [0, -50]
    });
  } else if (type === 'selected') {
    bgColor = '#eab308'; // Amber Gold
    iconSymbol = '📍';

    return L.divIcon({
      className: 'custom-leaflet-marker-selected',
      html: `
        <div class="enhanced-marker-wrap marker-pulse-gold">
          <div class="marker-floating-badge badge-gold">TARGET PIN</div>
          <div class="marker-bubble" style="background: #eab308; box-shadow: 0 0 16px rgba(234, 179, 8, 0.8);">
            <span class="marker-icon-glyph">📍</span>
          </div>
          <div class="marker-point-tip" style="border-top-color: #eab308;"></div>
        </div>
      `,
      iconSize: [42, 50],
      iconAnchor: [21, 50],
      popupAnchor: [0, -46],
      tooltipAnchor: [0, -48]
    });
  }

  return L.divIcon({ className: 'custom-leaflet-marker' });
};

function LeafletLocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5))
        });
      }
    }
  });
  return null;
}

function LeafletMapFlyer({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export function EmergencyMap({
  sosRequests = [],
  camps = [],
  selectedCoords,
  onLocationSelect,
  isSelectionMode = false,
  onStatusUpdate,
  onOpenNgoModal, // Trigger modal with selected SOS data
  onNavigateToTab
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'sos' | 'camps'
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showLegend, setShowLegend] = useState(true);

  // Center on selected location if available
  useEffect(() => {
    if (selectedCoords?.lat && selectedCoords?.lng) {
      setMapCenter({ lat: selectedCoords.lat, lng: selectedCoords.lng });
    }
  }, [selectedCoords]);

  // GPS Locate handler
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          };
          setMapCenter(coords);
          if (onLocationSelect) onLocationSelect(coords);
        },
        () => {
          alert('Could not retrieve GPS location. Click directly on the map to place your pin.');
        }
      );
    }
  };

  // Filter Pins
  const activeSos = sosRequests.filter((s) => s.status !== 'resolved');
  const criticalSosCount = activeSos.filter((s) => s.urgency === 'critical').length;
  const inProgressSosCount = activeSos.filter((s) => s.status === 'in_progress').length;

  const filteredSos = activeSos.filter((s) => {
    if (filter === 'camps') return false;
    if (filter === 'critical') return s.urgency === 'critical';
    return true;
  });

  const filteredCamps = filter === 'sos' || filter === 'critical' ? [] : camps;

  return (
    <div className="map-wrapper">
      {/* Map Header Toolbar */}
      <div className="map-toolbar">
        <div className="map-filters">
          <button
            className={`map-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Layers size={14} /> All Pins ({activeSos.length + camps.length})
          </button>
          <button
            className={`map-filter-btn ${filter === 'critical' ? 'active' : ''}`}
            onClick={() => setFilter('critical')}
          >
            <span className="dot-pulse-rose"></span> Critical SOS ({criticalSosCount})
          </button>
          <button
            className={`map-filter-btn ${filter === 'sos' ? 'active' : ''}`}
            onClick={() => setFilter('sos')}
          >
            <AlertTriangle size={14} className="text-orange" /> All Active SOS ({activeSos.length})
          </button>
          <button
            className={`map-filter-btn ${filter === 'camps' ? 'active' : ''}`}
            onClick={() => setFilter('camps')}
          >
            <Tent size={14} className="text-emerald" /> Relief Camps ({camps.length})
          </button>
        </div>

        <div className="map-tools">
          {isSelectionMode && (
            <span className="selection-mode-badge">
              📍 Click map to set pin
            </span>
          )}
          <button
            className={`btn-legend-toggle ${showLegend ? 'active' : ''}`}
            onClick={() => setShowLegend(!showLegend)}
            title="Toggle Pin Legend Guide"
          >
            <Info size={14} /> Map Legend
          </button>
          <button className="btn-locate" onClick={handleLocateUser} title="Locate My GPS">
            <Compass size={15} /> Find My GPS
          </button>
        </div>
      </div>

      {/* Map Body: OpenStreetMap via Leaflet */}
      <div className="leaflet-container-holder">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          scrollWheelZoom={true}
          className="leaflet-map-root"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LeafletMapFlyer center={[mapCenter.lat, mapCenter.lng]} />
          {isSelectionMode && <LeafletLocationPicker onLocationSelect={onLocationSelect} />}

          {/* Selected Location Pin */}
          {selectedCoords?.lat && selectedCoords?.lng && (
            <LMarker
              position={[selectedCoords.lat, selectedCoords.lng]}
              icon={createLeafletIcon('selected')}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="popup-header">
                    <span className="popup-badge badge-high">📍 Selected Incident Location</span>
                  </div>
                  <p className="popup-desc mt-2">
                    Coordinates: <strong>{selectedCoords.lat}, {selectedCoords.lng}</strong>
                  </p>
                  <div className="popup-actions mt-3">
                    <a
                      href={getGoogleMapsDirectionsLink(selectedCoords.lat, selectedCoords.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-popup-nav"
                    >
                      <Navigation size={13} /> Navigate in Google Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </LMarker>
          )}

          {/* SOS Pins */}
          {filteredSos.map((sos) => {
            const isCritical = sos.urgency === 'critical';
            const isInProgress = sos.status === 'in_progress';

            return (
              <LMarker
                key={sos._id}
                position={[sos.lat, sos.lng]}
                icon={createLeafletIcon('sos', sos)}
              >
                {/* Instant Hover Tooltip for quick scanning */}
                <Tooltip direction="top" offset={[0, -48]} opacity={0.95}>
                  <div className="pin-hover-tooltip">
                    <strong>{sos.victimName}</strong> ({sos.peopleCount} trapped)
                    <br />
                    <span className={isCritical ? 'text-rose font-bold' : 'text-orange'}>
                      {isCritical ? '🔴 CRITICAL SOS' : isInProgress ? '🚤 RESCUING' : '🟠 HIGH SOS'}
                    </span>
                    {sos.waterLevelFeet > 0 && ` • ~${sos.waterLevelFeet}ft water`}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="map-popup-card">
                    <div className="popup-header">
                      <span
                        className={`popup-badge ${
                          isCritical ? 'badge-critical' : isInProgress ? 'badge-progress' : 'badge-high'
                        }`}
                      >
                        {isInProgress ? '🚤 RESCUE IN PROGRESS' : `${sos.urgency.toUpperCase()} SOS`}
                      </span>
                      <span className="popup-time">
                        {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="popup-name">{sos.victimName}</h3>

                    <div className="popup-meta-list">
                      <div className="popup-meta-item">
                        <Users size={13} className="text-amber" />
                        <span>
                          <strong>{sos.peopleCount}</strong> person(s) stranded
                        </span>
                      </div>

                      {sos.waterLevelFeet > 0 && (
                        <div className="popup-meta-item text-cyan">
                          <Droplet size={13} />
                          <span>
                            Water Level: <strong>~{sos.waterLevelFeet} ft</strong>
                          </span>
                        </div>
                      )}

                      <div className="popup-meta-item">
                        <Phone size={13} className="text-emerald" />
                        <a href={`tel:${sos.contactPhone}`} className="popup-phone-link">
                          {sos.contactPhone}
                        </a>
                      </div>
                    </div>

                    {sos.address && <p className="popup-address">📍 {sos.address}</p>}
                    {sos.description && <p className="popup-desc">"{sos.description}"</p>}

                    <div className="popup-needs-row">
                      {sos.needTypes?.map((need) => (
                        <span key={need} className="popup-need-tag">
                          {need}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons: WhatsApp, Email, Call, Navigation */}
                    <div className="popup-quick-dispatch-grid">
                      <button
                        className="btn-popup-wa"
                        onClick={() => {
                          if (onOpenNgoModal) {
                            onOpenNgoModal(sos);
                          } else {
                            window.open(createWhatsAppSosLink(sos), '_blank');
                          }
                        }}
                        title="Alert Disaster Relief NGOs via WhatsApp"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp NGO</span>
                      </button>

                      <a
                        href={createEmailSosLink(sos)}
                        className="btn-popup-mail"
                        title="Send SOS Report to Relief Agencies"
                      >
                        <Mail size={13} />
                        <span>Email NGO</span>
                      </a>

                      <a
                        href={getGoogleMapsDirectionsLink(sos.lat, sos.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-popup-nav"
                        title="Open GPS Driving / Boat Navigation in Google Maps"
                      >
                        <Navigation size={13} />
                        <span>Navigate</span>
                      </a>

                      <a href={`tel:${sos.contactPhone}`} className="btn-popup-call">
                        <Phone size={13} />
                        <span>Call Victim</span>
                      </a>
                    </div>

                    {/* Status Management */}
                    <div className="popup-status-row">
                      {onStatusUpdate && sos.status === 'pending' && (
                        <button
                          className="btn-popup-action w-full"
                          onClick={() => onStatusUpdate(sos._id, 'in_progress', 'Volunteer Team')}
                        >
                          🚤 Accept & Dispatch Rescue Team
                        </button>
                      )}
                      {onStatusUpdate && sos.status === 'in_progress' && (
                        <button
                          className="btn-popup-resolve w-full"
                          onClick={() => onStatusUpdate(sos._id, 'resolved')}
                        >
                          <CheckCircle2 size={13} /> Mark Evacuation Complete
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </LMarker>
            );
          })}

          {/* Relief Camp Pins */}
          {filteredCamps.map((camp) => {
            const totalCap = camp.capacity || 100;
            const occ = camp.currentOccupancy || 0;
            const freeBeds = Math.max(0, totalCap - occ);
            const isFull = freeBeds === 0;

            return (
              <LMarker
                key={camp._id}
                position={[camp.lat, camp.lng]}
                icon={createLeafletIcon('camp', camp)}
              >
                {/* Instant Hover Tooltip */}
                <Tooltip direction="top" offset={[0, -48]} opacity={0.95}>
                  <div className="pin-hover-tooltip">
                    <strong>{camp.name}</strong>
                    <br />
                    <span className={isFull ? 'text-rose font-bold' : 'text-emerald font-bold'}>
                      ⛺ {isFull ? 'FULL CAPACITY' : `${freeBeds} Free Beds Available`}
                    </span>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="map-popup-card">
                    <div className="popup-header">
                      <span className="popup-camp-badge">⛺ RELIEF SHELTER HUB</span>
                      <span className={`popup-occupancy ${isFull ? 'text-rose' : 'text-emerald'}`}>
                        {occ}/{totalCap} beds ({isFull ? 'FULL' : `${freeBeds} free`})
                      </span>
                    </div>

                    <h3 className="popup-name">{camp.name}</h3>
                    {camp.locationName && <p className="popup-address">📍 {camp.locationName}</p>}

                    {camp.contactPhone && (
                      <div className="popup-meta-item">
                        <Phone size={13} className="text-emerald" />
                        <span>
                          {camp.contactPerson || 'Helpdesk'}:{' '}
                          <a href={`tel:${camp.contactPhone}`} className="popup-phone-link">
                            {camp.contactPhone}
                          </a>
                        </span>
                      </div>
                    )}

                    {/* Surpluses Available */}
                    {camp.resources?.filter((r) => r.type === 'surplus').length > 0 && (
                      <div className="popup-supplies-box surplus-box">
                        <div className="supplies-heading text-emerald">🟢 Surplus Available to Share:</div>
                        <ul className="supplies-mini-list">
                          {camp.resources
                            ?.filter((r) => r.type === 'surplus')
                            .slice(0, 3)
                            .map((s, idx) => (
                              <li key={idx}>
                                • {s.resource} {s.quantity ? `(${s.quantity})` : ''}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Critical Deficits */}
                    {camp.resources?.filter((r) => r.type === 'deficit').length > 0 && (
                      <div className="popup-supplies-box deficit-box">
                        <div className="supplies-heading text-rose">🔴 Critical Deficits Needed:</div>
                        <ul className="supplies-mini-list">
                          {camp.resources
                            ?.filter((r) => r.type === 'deficit')
                            .slice(0, 3)
                            .map((d, idx) => (
                              <li key={idx}>
                                • {d.resource} {d.quantity ? `(${d.quantity})` : ''}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <div className="popup-actions mt-3">
                      <a
                        href={getGoogleMapsDirectionsLink(camp.lat, camp.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-popup-nav"
                      >
                        <Navigation size={13} /> Driving Directions
                      </a>

                      {onNavigateToTab && (
                        <button
                          className="btn-popup-action"
                          onClick={() => onNavigateToTab('camps')}
                        >
                          <Package size={13} /> Requisition Supplies
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </LMarker>
            );
          })}
        </MapContainer>

        {/* Floating Intuitive Pin Legend & Decoder */}
        {showLegend && (
          <div className="map-legend-overlay">
            <div className="legend-header">
              <span className="legend-title">📍 Pin Guide & Indicators</span>
              <button className="legend-close-btn" onClick={() => setShowLegend(false)}>✕</button>
            </div>
            <div className="legend-items-list">
              <div className="legend-item">
                <div className="legend-icon-swatch swatch-critical">🆘</div>
                <div className="legend-desc">
                  <strong>Critical SOS (Pulsing Red)</strong>
                  <span>Life threat / rising water / elderly trapped</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-icon-swatch swatch-high">🚨</div>
                <div className="legend-desc">
                  <strong>High SOS (Vivid Orange)</strong>
                  <span>Stranded families requiring food/water rations</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-icon-swatch swatch-progress">🚤</div>
                <div className="legend-desc">
                  <strong>In Progress (Cyan Boat)</strong>
                  <span>Rescue boat or volunteer team en route</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-icon-swatch swatch-camp">⛺</div>
                <div className="legend-desc">
                  <strong>Relief Camp (Green Hexagon)</strong>
                  <span>Live bed capacity & supply exchange hub</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
