import React, { useState } from 'react';
import {
  AlertOctagon,
  Phone,
  Users,
  MapPin,
  Send,
  Droplet,
  Compass,
  CheckCircle2,
  ShieldAlert,
  HeartHandshake,
  Clock,
  Search,
  MessageCircle,
  Mail,
  Building2,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { searchLocationCoordinates } from '../utils/geocoder';
import {
  createWhatsAppSosLink,
  createEmailSosLink,
  getGoogleMapsDirectionsLink
} from '../utils/shareAlert';

export function VictimPortal({
  sosList = [],
  onSosSubmitted,
  onSelectLocationOnMap,
  selectedCoords,
  onOpenNgoModal
}) {
  const [victimName, setVictimName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(selectedCoords?.lat || '');
  const [lng, setLng] = useState(selectedCoords?.lng || '');
  const [peopleCount, setPeopleCount] = useState(2);
  const [waterLevelFeet, setWaterLevelFeet] = useState(3);
  const [urgency, setUrgency] = useState('critical');
  const [needTypes, setNeedTypes] = useState(['rescue', 'water']);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submittedSos, setSubmittedSos] = useState(null);

  // Search Place State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Sync selectedCoords from map
  React.useEffect(() => {
    if (selectedCoords?.lat && selectedCoords?.lng) {
      setLat(selectedCoords.lat);
      setLng(selectedCoords.lng);
    }
  }, [selectedCoords]);

  const toggleNeed = (needKey) => {
    if (needTypes.includes(needKey)) {
      if (needTypes.length > 1) {
        setNeedTypes(needTypes.filter((n) => n !== needKey));
      }
    } else {
      setNeedTypes([...needTypes, needKey]);
    }
  };

  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    setSearchResults([]);

    try {
      const data = await searchLocationCoordinates(searchQuery.trim());
      setSearchResults(data || []);
      if (data && data.length > 0) {
        selectFoundLocation(data[0]);
      } else {
        setFeedback({
          type: 'error',
          message: `No location found for "${searchQuery}". Please click directly on the map or add city name.`
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Could not connect to location search.'
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectFoundLocation = (place) => {
    const newLat = place.lat;
    const newLng = place.lng;
    setLat(newLat);
    setLng(newLng);
    setAddress(place.display_name.split(',').slice(0, 3).join(', '));
    setSearchResults([]);

    if (onSelectLocationOnMap) {
      onSelectLocationOnMap({ lat: newLat, lng: newLng });
    }

    setFeedback({
      type: 'info',
      message: `📍 Pinned via ${place.source || 'Map'}: ${newLat}, ${newLng} (${place.display_name.split(',')[0]})`
    });
  };

  const handleGetGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = Number(pos.coords.latitude.toFixed(5));
          const newLng = Number(pos.coords.longitude.toFixed(5));
          setLat(newLat);
          setLng(newLng);
          if (onSelectLocationOnMap) {
            onSelectLocationOnMap({ lat: newLat, lng: newLng });
          }
          setFeedback({
            type: 'info',
            message: `GPS locked: ${newLat}, ${newLng}`
          });
        },
        () => {
          alert('GPS location permission denied. Please click on the map or search your area.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!victimName.trim() || !contactPhone.trim()) {
      setFeedback({ type: 'error', message: 'Please provide your name and a working phone number.' });
      return;
    }

    if (!lat || !lng) {
      setFeedback({
        type: 'error',
        message: 'Please search your location, detect GPS, or click on the map.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          victimName: victimName.trim(),
          contactPhone: contactPhone.trim(),
          address: address.trim(),
          lat: Number(lat),
          lng: Number(lng),
          peopleCount: Number(peopleCount),
          waterLevelFeet: Number(waterLevelFeet),
          urgency,
          needTypes,
          description: description.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit SOS');
      }

      const created = await response.json();
      setSubmittedSos(created);
      setFeedback({
        type: 'success',
        message: '🚨 SOS Emergency Alert broadcasted! Rescue teams and nearby relief camps have received your location pin.'
      });

      // Clear form
      setVictimName('');
      setContactPhone('');
      setDescription('');
      setAddress('');
      setSearchQuery('');

      if (onSosSubmitted) onSosSubmitted(created);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error connecting to relief server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableNeeds = [
    { id: 'rescue', label: '🚤 Boat Rescue / Evacuation', icon: '🚤' },
    { id: 'water', label: '💧 Drinking Water', icon: '💧' },
    { id: 'food', label: '🍲 Food & Dry Rations', icon: '🍲' },
    { id: 'medical', label: '💊 First Aid / Medical Aid', icon: '💊' },
    { id: 'shelter', label: '⛺ Shelter / Dry Tarpaulin', icon: '⛺' },
    { id: 'baby_supplies', label: '🍼 Baby Milk / Diapers', icon: '🍼' }
  ];

  return (
    <div className="portal-container">
      {/* Top Banner */}
      <div className="victim-hero-banner">
        <div className="victim-hero-content">
          <div className="sos-badge-pulse">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h2 className="victim-hero-title">Victim SOS & Emergency Relief Portal</h2>
            <p className="victim-hero-sub">
              Stranded or need critical supplies? Search your landmark or use GPS to broadcast your position to NDRF, SDRF, Relief Camps, and Disaster NGOs via WhatsApp and Email.
            </p>
          </div>
        </div>

        <button
          className="btn-ngo-directory-chip"
          onClick={() => {
            if (onOpenNgoModal) onOpenNgoModal();
          }}
        >
          <Building2 size={16} />
          <span>View Disaster NGOs & Agencies</span>
        </button>
      </div>

      <div className="portal-grid">
        {/* SOS Form Column */}
        <div className="form-column">
          <div className="card-glass">
            <div className="card-glass-header">
              <h3 className="card-title text-rose">
                <ShieldAlert size={20} /> Submit Emergency Rescue / Supply Request
              </h3>
              <p className="card-subtitle">All submissions appear live on the disaster map with your GPS location</p>
            </div>

            {feedback && (
              <div className={`feedback-alert feedback-${feedback.type}`}>
                {feedback.type === 'success' && <CheckCircle2 size={18} />}
                {feedback.type === 'error' && <AlertOctagon size={18} />}
                {feedback.type === 'info' && <Compass size={18} />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Post-Submission Quick WhatsApp/Email Share Banner */}
            {submittedSos && (
              <div className="post-sos-dispatch-box mb-4">
                <div className="dispatch-header">
                  <MessageCircle size={16} className="text-emerald" />
                  <strong>Mobilize NGOs & Volunteers via WhatsApp / Email:</strong>
                </div>
                <div className="dispatch-buttons-row mt-2">
                  <button
                    className="btn-whatsapp-action"
                    onClick={() => {
                      if (onOpenNgoModal) {
                        onOpenNgoModal(submittedSos);
                      } else {
                        window.open(createWhatsAppSosLink(submittedSos), '_blank');
                      }
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp Disaster NGOs</span>
                  </button>

                  <a
                    href={createEmailSosLink(submittedSos)}
                    className="btn-email-action"
                  >
                    <Mail size={15} />
                    <span>Email Disaster Taskforce</span>
                  </a>
                </div>
              </div>
            )}

            {/* Instant Location Search Bar */}
            <div className="location-search-box mb-4">
              <label className="input-label text-rose">
                🔍 Search Trapped Area / Landmark on Map
              </label>
              <div className="search-input-row">
                <input
                  type="text"
                  className="input-field search-location-input"
                  placeholder="Type colony, riverbank, landmark, road or town name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-search-loc btn-search-sos"
                  onClick={handleSearchLocation}
                  disabled={isSearchingLocation || !searchQuery.trim()}
                >
                  <Search size={15} />
                  <span>{isSearchingLocation ? 'Searching...' : 'Locate'}</span>
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  onClick={handleGetGps}
                  title="Use Current Device GPS"
                >
                  <Compass size={14} /> My GPS
                </button>
              </div>

              {searchResults.length > 1 && (
                <div className="search-results-dropdown">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="search-result-item"
                      onClick={() => selectFoundLocation(result)}
                    >
                      <MapPin size={14} className="text-rose" />
                      <span>{result.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="portal-form">
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Your Name / Family Head *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Ramesh Kalita"
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Active Contact Phone Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. +91 98765 43210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Location Input with GPS autolock */}
              <div className="input-group">
                <div className="coords-inputs-row">
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Latitude (Auto-filled or 26.155)"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Longitude (Auto-filled or 91.745)"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    required
                  />
                </div>
                <span className="helper-text">💡 Tip: Coordinates auto-fill when searching or clicking on the interactive map.</span>
              </div>

              <div className="input-group">
                <label className="input-label">Landmark / Local Address / Sector</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Near Kalibari Mandir, Ward 4, Blue 2-story building"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">People Trapped / Affected</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    >
                      -
                    </button>
                    <span className="stepper-val">{peopleCount} persons</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setPeopleCount(peopleCount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Estimated Water Level (Feet)</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setWaterLevelFeet(Math.max(0, waterLevelFeet - 1))}
                    >
                      -
                    </button>
                    <span className="stepper-val text-cyan">{waterLevelFeet} ft</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setWaterLevelFeet(waterLevelFeet + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Urgency selection */}
              <div className="input-group">
                <label className="input-label">Severity & Urgency</label>
                <div className="urgency-selector">
                  <button
                    type="button"
                    className={`urgency-opt urgency-critical ${urgency === 'critical' ? 'selected' : ''}`}
                    onClick={() => setUrgency('critical')}
                  >
                    🔴 Critical (Immediate Danger / Water Rising)
                  </button>
                  <button
                    type="button"
                    className={`urgency-opt urgency-high ${urgency === 'high' ? 'selected' : ''}`}
                    onClick={() => setUrgency('high')}
                  >
                    🟠 High (Within few hours)
                  </button>
                  <button
                    type="button"
                    className={`urgency-opt urgency-medium ${urgency === 'medium' ? 'selected' : ''}`}
                    onClick={() => setUrgency('medium')}
                  >
                    🟡 Moderate (Need rations/supplies)
                  </button>
                </div>
              </div>

              {/* Needs multi-select */}
              <div className="input-group">
                <label className="input-label">What supplies or assistance do you need?</label>
                <div className="needs-chip-grid">
                  {availableNeeds.map((need) => {
                    const isSelected = needTypes.includes(need.id);
                    return (
                      <button
                        key={need.id}
                        type="button"
                        className={`need-chip ${isSelected ? 'chip-active' : ''}`}
                        onClick={() => toggleNeed(need.id)}
                      >
                        <span>{need.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Additional Urgent Notes</label>
                <textarea
                  className="input-textarea"
                  rows="3"
                  placeholder="e.g. Stranded on rooftop with 1 infant and elderly grandmother. Need drinking water urgently."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-sos-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>Broadcasting SOS...</span>
                ) : (
                  <>
                    <Send size={18} />
                    <span>BROADCAST RESCUE & RELIEF SOS</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live SOS Calls Feed Column */}
        <div className="feed-column">
          <div className="card-glass">
            <div className="card-glass-header">
              <h3 className="card-title text-cyan">
                <HeartHandshake size={20} /> Live Community SOS Broadcasts ({sosList.length})
              </h3>
              <p className="card-subtitle">Real-time distress signals visible to volunteers, NGOs, and camps</p>
            </div>

            <div className="sos-scroll-list">
              {sosList.length === 0 ? (
                <div className="empty-box">
                  <CheckCircle2 size={32} className="text-emerald" />
                  <p>No pending distress signals right now.</p>
                </div>
              ) : (
                sosList.map((sos) => {
                  const isResolved = sos.status === 'resolved';
                  const isInProgress = sos.status === 'in_progress';

                  return (
                    <div
                      key={sos._id}
                      className={`sos-item-card ${
                        isResolved ? 'sos-resolved' : sos.urgency === 'critical' ? 'sos-item-critical' : 'sos-item-high'
                      }`}
                    >
                      <div className="sos-item-header">
                        <div className="sos-item-victim">
                          <span className="victim-name">{sos.victimName}</span>
                          <span className={`status-pill-small ${isResolved ? 'pill-surplus' : 'pill-deficit'}`}>
                            {isResolved ? '✅ RESOLVED' : isInProgress ? '⏳ RESCUE IN PROGRESS' : '🔴 PENDING'}
                          </span>
                        </div>
                        <span className="sos-item-time">
                          <Clock size={11} />
                          {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="sos-item-details">
                        <div className="meta-tag">
                          <Users size={12} /> {sos.peopleCount} trapped
                        </div>
                        {sos.waterLevelFeet > 0 && (
                          <div className="meta-tag text-cyan">
                            <Droplet size={12} /> {sos.waterLevelFeet} ft water
                          </div>
                        )}
                        <div className="meta-tag">
                          <MapPin size={12} /> {sos.address || `${sos.lat}, ${sos.lng}`}
                        </div>
                      </div>

                      {sos.description && <p className="sos-item-desc">"{sos.description}"</p>}

                      <div className="sos-needs-pills">
                        {sos.needTypes?.map((n) => (
                          <span key={n} className="pill-need">{n}</span>
                        ))}
                      </div>

                      <div className="sos-item-footer-grid">
                        <a href={`tel:${sos.contactPhone}`} className="btn-call-link">
                          <Phone size={12} /> Call: {sos.contactPhone}
                        </a>

                        <button
                          className="btn-chip"
                          onClick={() => {
                            if (onOpenNgoModal) {
                              onOpenNgoModal(sos);
                            } else {
                              window.open(createWhatsAppSosLink(sos), '_blank');
                            }
                          }}
                          title="Forward SOS to NGO on WhatsApp"
                        >
                          <MessageCircle size={12} className="text-emerald" /> WhatsApp NGO
                        </button>

                        <a
                          href={createEmailSosLink(sos)}
                          className="btn-chip"
                          title="Email SOS to Relief Desk"
                        >
                          <Mail size={12} className="text-amber" /> Email Alert
                        </a>

                        <a
                          href={getGoogleMapsDirectionsLink(sos.lat, sos.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-chip"
                          title="Navigate in Google Maps"
                        >
                          <Navigation size={12} className="text-cyan" /> Map
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
