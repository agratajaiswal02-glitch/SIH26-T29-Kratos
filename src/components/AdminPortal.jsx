import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  PlusCircle,
  Tent,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
  MapPin,
  Compass,
  Send,
  Check,
  Globe,
  ShoppingCart,
  Building2,
  Truck,
  MessageCircle,
  Mail,
  ShieldCheck,
  Edit3,
  Clock,
  XCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { searchLocationCoordinates } from '../utils/geocoder';
import {
  createWhatsAppSosLink,
  createEmailSosLink,
  createWhatsAppCampRequisitionLink,
  createEmailCampRequisitionLink,
  sanitizePhoneForWhatsApp
} from '../utils/shareAlert';

export function AdminPortal({
  isAdmin,
  setIsAdmin,
  camps = [],
  alerts = [],
  sosList = [],
  requisitions = [],
  ngos = [],
  onCampsRefresh,
  onAlertsRefresh,
  onSosRefresh,
  onRequisitionsRefresh,
  onNgosRefresh,
  onStatusUpdate,
  onOpenNgoModal
}) {
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('camps'); // 'camps' | 'requisitions' | 'ngos' | 'alerts' | 'sos'

  // New Camp Form State
  const [campName, setCampName] = useState('');
  const [campLocation, setCampLocation] = useState('');
  const [campLat, setCampLat] = useState('');
  const [campLng, setCampLng] = useState('');
  const [campCapacity, setCampCapacity] = useState(250);
  const [campOccupancy, setCampOccupancy] = useState(0);
  const [campContact, setCampContact] = useState('');
  const [campPhone, setCampPhone] = useState('');
  const [campSubmitting, setCampSubmitting] = useState(false);
  const [campFeedback, setCampFeedback] = useState(null);

  // Place Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // New Alert Form State
  const [alertTitle, setAlertTitle] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('high');
  const [alertArea, setAlertArea] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Editing Admin Directives for Requisitions ("What they are told for")
  const [editingReqId, setEditingReqId] = useState(null);
  const [directiveText, setDirectiveText] = useState('');
  const [sourceChoice, setSourceChoice] = useState('Central Emergency Warehouse');

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdmin(true);
        setPasscode('');
      } else {
        setAuthError(data.error || 'Invalid admin passcode.');
      }
    } catch (e) {
      setAuthError('Connection error to server.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  // Location search using Google Maps + Progressive Geocoding
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
        setCampFeedback({
          type: 'error',
          message: `No GPS coordinates found for "${searchQuery}". Please try adding city/state name or click on map.`
        });
      }
    } catch (err) {
      console.error(err);
      setCampFeedback({
        type: 'error',
        message: 'Could not connect to geocoding search service.'
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectFoundLocation = (place) => {
    const lat = place.lat;
    const lng = place.lng;
    setCampLat(lat);
    setCampLng(lng);
    setCampLocation(place.display_name.split(',').slice(0, 3).join(', '));
    if (!campName) {
      setCampName(place.display_name.split(',')[0]);
    }
    setSearchResults([]);
    setCampFeedback({
      type: 'success',
      message: `📍 Pinned via ${place.source || 'Map'}: ${lat}, ${lng} (${place.display_name.split(',')[0]})`
    });
  };

  const handleGetGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setCampLat(lat);
          setCampLng(lng);
          setCampFeedback({
            type: 'success',
            message: `📍 GPS locked: ${lat}, ${lng}`
          });
        },
        () => {
          alert('Could not access current GPS location.');
        }
      );
    }
  };

  // Add Camp
  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (!campName || !campLat || !campLng) {
      setCampFeedback({ type: 'error', message: 'Name, Latitude, and Longitude are required.' });
      return;
    }

    setCampSubmitting(true);
    setCampFeedback(null);

    try {
      const res = await fetch('/api/camps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName.trim(),
          locationName: campLocation.trim(),
          lat: Number(campLat),
          lng: Number(campLng),
          capacity: Number(campCapacity),
          currentOccupancy: Number(campOccupancy),
          contactPerson: campContact.trim(),
          contactPhone: campPhone.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to create camp');

      setCampFeedback({
        type: 'success',
        message: `Relief camp "${campName}" registered successfully and marked on the map!`
      });
      setCampName('');
      setCampLocation('');
      setCampLat('');
      setCampLng('');
      setCampPhone('');
      setCampContact('');
      setSearchQuery('');

      if (onCampsRefresh) onCampsRefresh();
    } catch (err) {
      setCampFeedback({ type: 'error', message: err.message });
    } finally {
      setCampSubmitting(false);
    }
  };

  // Delete Camp
  const handleDeleteCamp = async (campId) => {
    if (!window.confirm('Are you sure you want to permanently delete this relief camp?')) return;
    try {
      const res = await fetch(`/api/camps/${campId}`, { method: 'DELETE' });
      if (res.ok && onCampsRefresh) onCampsRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Update Camp Occupancy
  const handleUpdateOccupancy = async (campId, newOccupancy) => {
    try {
      await fetch(`/api/camps/${campId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentOccupancy: Number(newOccupancy) })
      });
      if (onCampsRefresh) onCampsRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Update Requisition Status & Directive ("What they are told for")
  const handleUpdateRequisition = async (reqId, newStatus, customDirective) => {
    try {
      const body = {};
      if (newStatus) body.status = newStatus;
      if (customDirective !== undefined) body.adminInstructions = customDirective;
      if (sourceChoice) body.sourceType = sourceChoice;

      const res = await fetch(`/api/requisitions/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setEditingReqId(null);
        if (onRequisitionsRefresh) onRequisitionsRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Requisition
  const handleDeleteRequisition = async (reqId) => {
    if (!window.confirm('Remove this supply requisition record?')) return;
    try {
      const res = await fetch(`/api/requisitions/${reqId}`, { method: 'DELETE' });
      if (res.ok && onRequisitionsRefresh) onRequisitionsRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete NGO
  const handleDeleteNgo = async (ngoId) => {
    if (!window.confirm('Remove this organization from directory?')) return;
    try {
      const res = await fetch(`/api/ngos/${ngoId}`, { method: 'DELETE' });
      if (res.ok && onNgosRefresh) onNgosRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Broadcast Alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertTitle || !alertMessage) {
      setAlertFeedback({ type: 'error', message: 'Title and message are required.' });
      return;
    }

    setAlertSubmitting(true);
    setAlertFeedback(null);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alertTitle.trim(),
          severity: alertSeverity,
          affectedArea: alertArea.trim() || 'All Sectors',
          message: alertMessage.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to post alert');

      setAlertFeedback({ type: 'success', message: 'Emergency broadcast published across the network!' });
      setAlertTitle('');
      setAlertArea('');
      setAlertMessage('');

      if (onAlertsRefresh) onAlertsRefresh();
    } catch (err) {
      setAlertFeedback({ type: 'error', message: err.message });
    } finally {
      setAlertSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Delete this emergency alert?')) return;
    try {
      const res = await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
      if (res.ok && onAlertsRefresh) onAlertsRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSos = async (sosId) => {
    if (!window.confirm('Delete this SOS record?')) return;
    try {
      const res = await fetch(`/api/sos/${sosId}`, { method: 'DELETE' });
      if (res.ok && onSosRefresh) onSosRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Login Screen if not authenticated
  if (!isAdmin) {
    return (
      <div className="portal-container">
        <div className="admin-lock-screen">
          <div className="lock-card">
            <div className="lock-icon-wrap">
              <Shield size={36} className="text-cyan" />
            </div>
            <h2 className="lock-title">Disaster Response Head Portal</h2>
            <p className="lock-sub">
              Authorized access for relief coordinators, district collectors, and NDRF commanders.
            </p>

            {authError && (
              <div className="feedback-alert feedback-error">
                <AlertTriangle size={18} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="lock-form">
              <div className="input-group">
                <label className="input-label">Admin Passcode</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter passcode (Default: admin123)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                <Unlock size={16} /> Unlock Head Console
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const pendingRequisitionsCount = requisitions.filter((r) => r.status === 'requested').length;

  return (
    <div className="portal-container">
      {/* Head Top Bar */}
      <div className="admin-head-banner">
        <div className="admin-head-left">
          <div className="admin-shield-badge">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="admin-title">Disaster Response Operations Command</h2>
            <p className="admin-sub">
              Central database controls: Manage Camps, Direct Supply Orders, Broadcast Alerts, and Mobilize NGOs
            </p>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          <Lock size={14} /> Lock & Exit Admin
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeAdminTab === 'camps' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('camps')}
        >
          <Tent size={16} /> Relief Camps ({camps.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'requisitions' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('requisitions')}
        >
          <ShoppingCart size={16} /> Supply Requisitions & Directives ({requisitions.length})
          {pendingRequisitionsCount > 0 && <span className="nav-badge-sos">{pendingRequisitionsCount}</span>}
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'ngos' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('ngos')}
        >
          <Building2 size={16} /> NGO & Agency Grid ({ngos.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('alerts')}
        >
          <Bell size={16} /> Emergency Alerts ({alerts.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'sos' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('sos')}
        >
          <AlertTriangle size={16} /> SOS Operations Queue ({sosList.length})
        </button>
      </div>

      {/* TAB 1: RELIEF CAMPS MANAGEMENT */}
      {activeAdminTab === 'camps' && (
        <div className="portal-grid">
          {/* Add Camp Form */}
          <div className="form-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-cyan">
                  <PlusCircle size={18} /> Register New Relief Shelter Hub
                </h3>
                <p className="card-subtitle">
                  Search any landmark, school, or stadium to auto-detect its map pin and GPS coordinates
                </p>
              </div>

              {campFeedback && (
                <div className={`feedback-alert feedback-${campFeedback.type}`}>
                  {campFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{campFeedback.message}</span>
                </div>
              )}

              {/* Instant Location Search Bar */}
              <div className="location-search-box mb-4">
                <label className="input-label text-cyan">
                  🔍 Find Place on Map (Auto-fill GPS)
                </label>
                <div className="search-input-row">
                  <input
                    type="text"
                    className="input-field search-location-input"
                    placeholder="Type city, stadium, school, college, or hospital name..."
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
                    className="btn-search-loc"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation || !searchQuery.trim()}
                  >
                    <Search size={15} />
                    <span>{isSearchingLocation ? 'Searching...' : 'Find Place'}</span>
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
                        <MapPin size={14} className="text-cyan" />
                        <span>{result.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateCamp} className="portal-form">
                <div className="input-group">
                  <label className="input-label">Relief Camp / Shelter Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Cotton University Indoor Stadium Shelter #4"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Landmark / Sector Address</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Panbazar MG Road, Elevated Pavilion"
                    value={campLocation}
                    onChange={(e) => setCampLocation(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">GPS Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="input-field"
                      placeholder="26.155"
                      value={campLat}
                      onChange={(e) => setCampLat(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">GPS Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="input-field"
                      placeholder="91.750"
                      value={campLng}
                      onChange={(e) => setCampLng(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Max Bed Capacity</label>
                    <input
                      type="number"
                      className="input-field"
                      value={campCapacity}
                      onChange={(e) => setCampCapacity(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Current Occupancy</label>
                    <input
                      type="number"
                      className="input-field"
                      value={campOccupancy}
                      onChange={(e) => setCampOccupancy(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Camp Manager / In-Charge</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Officer Name"
                      value={campContact}
                      onChange={(e) => setCampContact(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Official Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={campPhone}
                      onChange={(e) => setCampPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full" disabled={campSubmitting}>
                  <PlusCircle size={16} />
                  <span>{campSubmitting ? 'Registering Camp...' : 'Deploy Camp on Live Grid'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Camps Roster */}
          <div className="feed-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-cyan">
                  <Tent size={20} /> Active Relief Shelters ({camps.length})
                </h3>
                <p className="card-subtitle">Manage shelter capacity and live occupancy</p>
              </div>

              <div className="admin-camps-list">
                {camps.map((camp) => (
                  <div key={camp._id} className="admin-camp-row-card">
                    <div className="admin-camp-info">
                      <h4 className="camp-row-name">{camp.name}</h4>
                      <p className="camp-row-loc">📍 {camp.locationName || 'Shelter Hub'}</p>
                      <div className="camp-row-coords">
                        <span>GPS: {camp.lat}, {camp.lng}</span>
                        {camp.contactPhone && (
                          <span>• Contact: {camp.contactPhone}</span>
                        )}
                      </div>
                    </div>

                    <div className="admin-camp-controls">
                      <div className="occupancy-inline-edit">
                        <label>Occupancy:</label>
                        <input
                          type="number"
                          className="input-field-mini"
                          defaultValue={camp.currentOccupancy}
                          onBlur={(e) => handleUpdateOccupancy(camp._id, e.target.value)}
                        />
                        <span>/ {camp.capacity} beds</span>
                      </div>

                      <button
                        className="btn-trash"
                        title="Delete Camp"
                        onClick={() => handleDeleteCamp(camp._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLY REQUISITIONS & ALLOCATION DIRECTIVES */}
      {activeAdminTab === 'requisitions' && (
        <div className="admin-requisitions-section">
          <div className="card-glass mb-4">
            <div className="card-glass-header">
              <div>
                <h3 className="card-title text-cyan">
                  <ShoppingCart size={20} /> Central Supply Requisitions & Directives Ledger
                </h3>
                <p className="card-subtitle">
                  Review what relief camps requested materials for, assign source depots, and set directives ("what they are told for").
                </p>
              </div>
              <div className="admin-head-stats-pills">
                <span className="stat-pill-mini text-orange">
                  ⏳ {requisitions.filter((r) => r.status === 'requested').length} Awaiting Approval
                </span>
                <span className="stat-pill-mini text-cyan">
                  🚚 {requisitions.filter((r) => r.status === 'dispatched').length} Dispatched
                </span>
                <span className="stat-pill-mini text-emerald">
                  ✅ {requisitions.filter((r) => r.status === 'received').length} Delivered
                </span>
              </div>
            </div>

            <div className="admin-requisitions-table-wrap">
              {requisitions.length === 0 ? (
                <div className="empty-box p-8">
                  <ShoppingCart size={36} className="text-muted mb-2" />
                  <p>No supply orders placed yet.</p>
                </div>
              ) : (
                <div className="admin-req-cards-grid">
                  {requisitions.map((req) => {
                    const isEditing = editingReqId === req._id;

                    return (
                      <div
                        key={req._id}
                        className={`admin-req-card req-${req.status}`}
                      >
                        <div className="admin-req-top">
                          <div>
                            <div className="admin-req-header-row">
                              <h4 className="admin-req-title">{req.item}</h4>
                              <span className={`status-pill-small pill-${req.status}`}>
                                {req.status.toUpperCase()}
                              </span>
                            </div>
                            <span className="admin-req-camp-sub">
                              🏛️ <strong>{req.campName}</strong> • Qty: <strong>{req.quantity}</strong> ({req.urgency} urgency)
                            </span>
                          </div>
                          <span className="text-muted text-xs">
                            {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Stated Camp Purpose */}
                        <div className="admin-req-purpose">
                          <span className="font-bold text-xs text-cyan">🎯 Camp Stated Purpose:</span>
                          <p className="text-sm italic">"{req.purpose}"</p>
                        </div>

                        {/* Admin Directive & Instructions ("What they are told for") */}
                        <div className="admin-req-directive-box">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-amber flex items-center gap-1">
                              <ShieldCheck size={13} /> Admin Directive & Allocation Instructions ("What they are told for"):
                            </span>
                            {!isEditing && (
                              <button
                                className="btn-chip btn-edit-chip"
                                onClick={() => {
                                  setEditingReqId(req._id);
                                  setDirectiveText(req.adminInstructions || '');
                                  setSourceChoice(req.sourceType || 'Central Emergency Warehouse');
                                }}
                              >
                                <Edit3 size={11} /> Edit Instructions
                              </button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="directive-editor-wrap mt-2">
                              <textarea
                                className="input-textarea"
                                rows="2"
                                placeholder="Enter specific instructions (e.g. Approved for Ward 4 shelter; hand over exclusively to senior citizens and infants)..."
                                value={directiveText}
                                onChange={(e) => setDirectiveText(e.target.value)}
                              />
                              <div className="directive-edit-actions mt-2">
                                <select
                                  className="input-select-mini"
                                  value={sourceChoice}
                                  onChange={(e) => setSourceChoice(e.target.value)}
                                >
                                  <option value="Central Emergency Warehouse">Central Emergency Warehouse</option>
                                  <option value="NGO Donor Fleet">NGO Donor Fleet (Red Cross/Goonj)</option>
                                  <option value="District Disaster Reserve">District Disaster Reserve</option>
                                  <option value="Inter-Camp Surplus Transfer">Inter-Camp Transfer</option>
                                </select>
                                <button
                                  className="btn-primary-mini"
                                  onClick={() => handleUpdateRequisition(req._id, null, directiveText)}
                                >
                                  Save Directive
                                </button>
                                <button
                                  className="btn-cancel-mini"
                                  onClick={() => setEditingReqId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="admin-directive-text">
                              "{req.adminInstructions || 'No specific instructions added yet. Click edit to set directives for the camp.'}"
                            </p>
                          )}
                        </div>

                        {/* Order Management Actions */}
                        <div className="admin-req-actions-bar">
                          {req.status === 'requested' && (
                            <button
                              className="btn-action-approve"
                              onClick={() =>
                                handleUpdateRequisition(
                                  req._id,
                                  'approved',
                                  req.adminInstructions || 'Approved for dispatch from Central Supply Depot.'
                                )
                              }
                            >
                              <CheckCircle2 size={13} /> Approve Order
                            </button>
                          )}

                          {req.status === 'approved' && (
                            <button
                              className="btn-action-dispatch"
                              onClick={() =>
                                handleUpdateRequisition(
                                  req._id,
                                  'dispatched',
                                  req.adminInstructions || 'Dispatched via Emergency Relief Truck #04. En route.'
                                )
                              }
                            >
                              <Truck size={13} /> Dispatch Truck
                            </button>
                          )}

                          {req.status === 'dispatched' && (
                            <button
                              className="btn-action-resolve"
                              onClick={() => handleUpdateRequisition(req._id, 'received', req.adminInstructions)}
                            >
                              <Check size={13} /> Confirm Stocked
                            </button>
                          )}

                          <button
                            className="btn-chip"
                            onClick={() => {
                              const campObj = camps.find((c) => c._id === req.campId) || {};
                              const waUrl = createWhatsAppCampRequisitionLink(campObj, req);
                              window.open(waUrl, '_blank');
                            }}
                          >
                            <MessageCircle size={12} className="text-emerald" /> WhatsApp
                          </button>

                          <button
                            className="btn-trash"
                            title="Delete Requisition"
                            onClick={() => handleDeleteRequisition(req._id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NGO & AGENCY DIRECTORY */}
      {activeAdminTab === 'ngos' && (
        <div className="admin-ngos-section">
          <div className="card-glass">
            <div className="card-glass-header">
              <div>
                <h3 className="card-title text-cyan">
                  <Building2 size={20} /> Verified Disaster Relief NGOs & Agencies Grid ({ngos.length})
                </h3>
                <p className="card-subtitle">
                  Direct WhatsApp and Email contact details for mobilizing rescue boats, medical teams, and ration fleets
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  if (onOpenNgoModal) onOpenNgoModal();
                }}
              >
                <PlusCircle size={15} /> Add New NGO / Agency
              </button>
            </div>

            <div className="admin-ngos-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Organization / Agency</th>
                    <th>Type & Capability</th>
                    <th>WhatsApp Helpline</th>
                    <th>Emergency Email</th>
                    <th>Coverage Area</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ngos.map((ngo) => (
                    <tr key={ngo._id}>
                      <td>
                        <div className="cell-victim">
                          <strong>{ngo.name}</strong>
                          <span className="text-xs text-muted">Desk: {ngo.contactPerson}</span>
                        </div>
                      </td>
                      <td>
                        <span className="ngo-type-tag">{ngo.type}</span>
                      </td>
                      <td>
                        <a
                          href={`https://wa.me/${sanitizePhoneForWhatsApp(ngo.whatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald text-sm font-bold flex items-center gap-1"
                        >
                          <MessageCircle size={13} /> {ngo.whatsapp}
                        </a>
                      </td>
                      <td>
                        <a href={`mailto:${ngo.email}`} className="text-cyan text-sm">
                          {ngo.email}
                        </a>
                      </td>
                      <td>
                        <span className="text-xs">{ngo.operationalZones?.join(', ') || 'All Sectors'}</span>
                      </td>
                      <td>
                        <button
                          className="btn-trash"
                          title="Remove NGO"
                          onClick={() => handleDeleteNgo(ngo._id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTS MANAGEMENT */}
      {activeAdminTab === 'alerts' && (
        <div className="portal-grid">
          <div className="form-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-rose">
                  <Bell size={18} /> Broadcast Emergency Flood Alert
                </h3>
                <p className="card-subtitle">Push urgent alerts across the top ribbon of all connected users</p>
              </div>

              {alertFeedback && (
                <div className={`feedback-alert feedback-${alertFeedback.type}`}>
                  {alertFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{alertFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleCreateAlert} className="portal-form">
                <div className="input-group">
                  <label className="input-label">Alert Headline *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. River Breach Warning in North Ward 4"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Severity Level</label>
                    <select
                      className="input-select"
                      value={alertSeverity}
                      onChange={(e) => setAlertSeverity(e.target.value)}
                    >
                      <option value="critical">🔴 Critical Danger</option>
                      <option value="high">🟠 High Alert</option>
                      <option value="medium">🟡 Advisory / Watch</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Affected Area / Sector</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ward 4 & 5 Lowlands"
                      value={alertArea}
                      onChange={(e) => setAlertArea(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Alert Message & Public Directives *</label>
                  <textarea
                    className="input-textarea"
                    rows="3"
                    placeholder="e.g. Water level rising fast. Evacuate to City High School Relief Shelter immediately. Boats mobilized."
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary w-full" disabled={alertSubmitting}>
                  <Send size={16} />
                  <span>{alertSubmitting ? 'Broadcasting Alert...' : 'Publish Emergency Broadcast'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="feed-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-amber">
                  <Bell size={20} /> Active Broadcast Alerts ({alerts.length})
                </h3>
              </div>

              <div className="admin-alerts-list">
                {alerts.map((alert) => (
                  <div key={alert._id} className="admin-alert-card">
                    <div className="admin-alert-top">
                      <span className={`popup-badge ${alert.severity === 'critical' ? 'badge-critical' : 'badge-high'}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <button
                        className="btn-trash"
                        title="Delete Alert"
                        onClick={() => handleDeleteAlert(alert._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 className="alert-card-title">{alert.title}</h4>
                    <p className="alert-card-area">📍 Area: {alert.affectedArea}</p>
                    <p className="alert-card-msg">"{alert.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SOS OPERATIONS QUEUE */}
      {activeAdminTab === 'sos' && (
        <div className="card-glass">
          <div className="card-glass-header">
            <h3 className="card-title text-rose">
              <AlertTriangle size={20} /> Emergency SOS Queue ({sosList.length})
            </h3>
            <p className="card-subtitle">Real-time distress signals from stranded citizens</p>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Victim / Phone</th>
                  <th>Location</th>
                  <th>Stranded</th>
                  <th>Needs</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sosList.map((sos) => (
                  <tr key={sos._id}>
                    <td>
                      <div className="cell-victim">
                        <strong>{sos.victimName}</strong>
                        <a href={`tel:${sos.contactPhone}`} className="text-cyan text-xs">
                          {sos.contactPhone}
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="cell-loc">
                        <span>{sos.address || 'GPS Coordinates'}</span>
                        <span className="text-muted text-xs font-mono">{sos.lat}, {sos.lng}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-people">
                        <span>👥 {sos.peopleCount} trapped</span>
                        {sos.waterLevelFeet > 0 && (
                          <span className="text-cyan text-xs">💧 ~{sos.waterLevelFeet} ft water</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cell-needs">
                        {sos.needTypes?.map((n) => (
                          <span key={n} className="pill-need-small">{n}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill-small ${sos.status === 'resolved' ? 'pill-surplus' : 'pill-deficit'}`}>
                        {sos.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        {sos.status === 'pending' && (
                          <button
                            className="btn-table-action"
                            onClick={() => onStatusUpdate(sos._id, 'in_progress', 'NDRF Team Alpha')}
                          >
                            Assign Team
                          </button>
                        )}
                        {sos.status === 'in_progress' && (
                          <button
                            className="btn-table-resolve"
                            onClick={() => onStatusUpdate(sos._id, 'resolved')}
                          >
                            <Check size={13} /> Resolve
                          </button>
                        )}
                        <button
                          className="btn-chip"
                          onClick={() => {
                            if (onOpenNgoModal) {
                              onOpenNgoModal(sos);
                            } else {
                              window.open(createWhatsAppSosLink(sos), '_blank');
                            }
                          }}
                          title="Forward to NGO via WhatsApp"
                        >
                          <MessageCircle size={12} className="text-emerald" /> WhatsApp NGO
                        </button>
                        <button
                          className="btn-table-del"
                          title="Delete SOS"
                          onClick={() => handleDeleteSos(sos._id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
