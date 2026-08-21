import React, { useState, useEffect } from 'react';
import {
  Tent,
  Users,
  Package,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Sparkles,
  RefreshCw,
  ShoppingCart,
  Clock,
  Truck,
  MessageCircle,
  Mail,
  ShieldCheck,
  Send,
  Building,
  Info
} from 'lucide-react';
import {
  createWhatsAppCampRequisitionLink,
  createEmailCampRequisitionLink
} from '../utils/shareAlert';

export function CampPortal({
  camps = [],
  requisitions = [],
  onCampsRefresh,
  onRequisitionsRefresh,
  onOpenNgoModal
}) {
  const [selectedCampId, setSelectedCampId] = useState(camps[0]?._id || '');
  const [activeSubTab, setActiveSubTab] = useState('requisitions'); // 'requisitions' | 'ledger'

  // Online Requisition Form State ("Take things through website only")
  const [reqItem, setReqItem] = useState('');
  const [reqCustomItem, setReqCustomItem] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqCategory, setReqCategory] = useState('food');
  const [reqUrgency, setReqUrgency] = useState('high');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqSourceType, setReqSourceType] = useState('Central Emergency Warehouse');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqFeedback, setReqFeedback] = useState(null);

  // Manual Surplus/Deficit Form State
  const [resourceName, setResourceName] = useState('');
  const [resourceType, setResourceType] = useState('surplus'); // 'surplus' | 'deficit'
  const [urgency, setUrgency] = useState('medium');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Auto-select first camp if not selected
  useEffect(() => {
    if (camps.length > 0 && !selectedCampId) {
      setSelectedCampId(camps[0]._id);
    }
  }, [camps, selectedCampId]);

  const activeCamp = camps.find((c) => c._id === selectedCampId) || camps[0];

  // Common disaster supply catalog for quick selection
  const catalogItems = [
    { name: 'Potable Drinking Water (20L Cans)', category: 'water' },
    { name: 'Family Dry Ration Kits (Rice, Dal, Salt, Biscuits)', category: 'food' },
    { name: 'Heavy Duty Waterproof Tarpaulins (15x12 ft)', category: 'shelter' },
    { name: 'Infant Milk Formula & Baby Care Kits', category: 'baby_supplies' },
    { name: 'First Aid Kits & Antiseptic Bandages', category: 'medical' },
    { name: 'Sanitary Napkins & Hygiene Packs', category: 'hygiene' },
    { name: 'Chlorine Water Purification Tablets (Bottle of 100)', category: 'water' },
    { name: 'Fleece Blankets & Sleeping Mats', category: 'shelter' },
    { name: 'Solar Emergency Lanterns & Torch Units', category: 'general' },
    { name: 'Other (Custom item)', category: 'general' }
  ];

  // Submit Online Supply Requisition ("Take things through website only")
  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    if (!activeCamp) {
      setReqFeedback({ type: 'error', message: 'Please select an active relief camp first.' });
      return;
    }

    const finalItem = reqItem === 'Other (Custom item)' ? reqCustomItem.trim() : reqItem;
    if (!finalItem || !reqQuantity.trim() || !reqPurpose.trim()) {
      setReqFeedback({
        type: 'error',
        message: 'Please choose an item, quantity, and state what the supply will be used for.'
      });
      return;
    }

    setReqSubmitting(true);
    setReqFeedback(null);

    try {
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campId: activeCamp._id,
          campName: activeCamp.name,
          requestedBy: activeCamp.contactPerson || 'Camp Officer',
          contactPhone: activeCamp.contactPhone || '',
          item: finalItem,
          quantity: reqQuantity.trim(),
          category: reqCategory,
          urgency: reqUrgency,
          purpose: reqPurpose.trim(),
          sourceType: reqSourceType
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place supply requisition');
      }

      setReqFeedback({
        type: 'success',
        message: `✅ Requisition for "${reqQuantity} of ${finalItem}" submitted online! Admin and dispatchers have received the allocation order.`
      });

      setReqItem('');
      setReqCustomItem('');
      setReqQuantity('');
      setReqPurpose('');

      if (onRequisitionsRefresh) onRequisitionsRefresh();
    } catch (err) {
      setReqFeedback({ type: 'error', message: err.message });
    } finally {
      setReqSubmitting(false);
    }
  };

  // Mark Requisition as Received by Camp
  const handleMarkReceived = async (reqId) => {
    try {
      const res = await fetch(`/api/requisitions/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'received'
        })
      });

      if (res.ok) {
        if (onRequisitionsRefresh) onRequisitionsRefresh();
        if (onCampsRefresh) onCampsRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add manual resource entry
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!selectedCampId || !resourceName.trim()) {
      setFeedback({ type: 'error', message: 'Please select a relief camp and provide the supply name.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/camps/${selectedCampId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: resourceName.trim(),
          type: resourceType,
          urgency,
          quantity: quantity.trim(),
          notes: notes.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add supply entry');
      }

      setFeedback({
        type: 'success',
        message: `Successfully logged ${resourceType.toUpperCase()} of "${resourceName}" for ${activeCamp?.name}!`
      });

      setResourceName('');
      setQuantity('');
      setNotes('');

      if (onCampsRefresh) onCampsRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Server error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (campId, resourceId) => {
    if (!window.confirm('Remove this supply entry?')) return;
    try {
      const res = await fetch(`/api/camps/${campId}/resources/${resourceId}`, {
        method: 'DELETE'
      });
      if (res.ok && onCampsRefresh) {
        onCampsRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Find matches between camp deficits and other camps' surpluses
  const getResourceMatches = () => {
    if (!activeCamp) return [];
    const myDeficits = activeCamp.resources?.filter((r) => r.type === 'deficit') || [];
    const matches = [];

    myDeficits.forEach((def) => {
      camps.forEach((otherCamp) => {
        if (otherCamp._id !== activeCamp._id) {
          const otherSurpluses = otherCamp.resources?.filter((r) => r.type === 'surplus') || [];
          otherSurpluses.forEach((sur) => {
            const defWords = def.resource.toLowerCase().split(/\s+/);
            const isMatch = defWords.some((w) => w.length > 3 && sur.resource.toLowerCase().includes(w));
            if (isMatch) {
              matches.push({
                deficitItem: def,
                surplusItem: sur,
                fromCamp: otherCamp
              });
            }
          });
        }
      });
    });

    return matches;
  };

  const matches = getResourceMatches();

  // Filter requisitions for the active camp
  const campRequisitions = requisitions.filter(
    (r) => !selectedCampId || r.campId === selectedCampId || r.campName === activeCamp?.name
  );

  return (
    <div className="portal-container">
      {/* Hero Banner */}
      <div className="camp-hero-banner">
        <div className="camp-hero-content">
          <div className="camp-badge-icon">
            <Tent size={24} />
          </div>
          <div>
            <h2 className="camp-hero-title">Relief Camp Hub & Online Supply Requisition</h2>
            <p className="camp-hero-sub">
              Camps can request, track, and take delivery of essential relief materials strictly through the website.
              Central Admins monitor allocations and issue directives.
            </p>
          </div>
        </div>
      </div>

      {/* Camp Selector Ribbon */}
      <div className="camp-selector-bar mb-4">
        <div className="selector-label-group">
          <Tent size={18} className="text-cyan" />
          <label className="font-bold text-sm">Active Relief Camp Station:</label>
        </div>
        <select
          className="input-select camp-picker-select"
          value={selectedCampId}
          onChange={(e) => setSelectedCampId(e.target.value)}
        >
          {camps.length === 0 && (
            <option value="">-- No Relief Camps Available (Connecting to backend...) --</option>
          )}
          {camps.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} — {c.locationName || 'Shelter'} ({c.currentOccupancy || 0}/{c.capacity || 100} beds occupied)
            </option>
          ))}
        </select>
      </div>

      {/* Sub-Navigation: Online Requisitions vs Manual Ledger */}
      <div className="camp-subtabs-nav mb-4">
        <button
          className={`camp-subtab-btn ${activeSubTab === 'requisitions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('requisitions')}
        >
          <ShoppingCart size={16} />
          <span>Take Things Through Website (Online Requisitions)</span>
          {campRequisitions.filter((r) => r.status !== 'received').length > 0 && (
            <span className="subtab-badge">
              {campRequisitions.filter((r) => r.status !== 'received').length}
            </span>
          )}
        </button>
        <button
          className={`camp-subtab-btn ${activeSubTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ledger')}
        >
          <Package size={16} />
          <span>Local Stock Ledger & Inter-Camp Exchange</span>
        </button>
      </div>

      {/* VIEW 1: ONLINE SUPPLY REQUISITIONS */}
      {activeSubTab === 'requisitions' && (
        <div className="portal-grid">
          {/* Left Column: Place Supply Order Form */}
          <div className="form-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-cyan">
                  <ShoppingCart size={20} /> Requisition Supplies Online
                </h3>
                <p className="card-subtitle">
                  Order rations, drinking water, tarpaulins, and baby kits directly through the system
                </p>
              </div>

              {reqFeedback && (
                <div className={`feedback-alert feedback-${reqFeedback.type}`}>
                  {reqFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{reqFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleCreateRequisition} className="portal-form">
                <div className="input-group">
                  <label className="input-label">Select Supply Item *</label>
                  <select
                    className="input-select"
                    value={reqItem}
                    onChange={(e) => {
                      setReqItem(e.target.value);
                      const catMatch = catalogItems.find((c) => c.name === e.target.value);
                      if (catMatch && catMatch.category) setReqCategory(catMatch.category);
                    }}
                    required
                  >
                    <option value="">-- Choose from Emergency Inventory --</option>
                    {catalogItems.map((item, idx) => (
                      <option key={idx} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {reqItem === 'Other (Custom item)' && (
                  <div className="input-group">
                    <label className="input-label">Specify Item Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Life Jackets, Anti-fungal skin ointment"
                      value={reqCustomItem}
                      onChange={(e) => setReqCustomItem(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Required Quantity *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 150 kits, 80 cans, 50 packets"
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Urgency Level</label>
                    <select
                      className="input-select"
                      value={reqUrgency}
                      onChange={(e) => setReqUrgency(e.target.value)}
                    >
                      <option value="critical">🔴 Critical (Immediate Danger / Empty Stock)</option>
                      <option value="high">🟠 High (Need within 6-12 hours)</option>
                      <option value="medium">🟡 Medium (Stock replenishment)</option>
                      <option value="low">🟢 Low (Routine Reserve)</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Preferred Supply Source</label>
                  <select
                    className="input-select"
                    value={reqSourceType}
                    onChange={(e) => setReqSourceType(e.target.value)}
                  >
                    <option value="Central Emergency Warehouse">Central Emergency Warehouse</option>
                    <option value="NGO Donor Fleet">NGO Donor Fleet (Red Cross / SEEDS / Goonj)</option>
                    <option value="District Disaster Reserve">District Disaster Reserve Depot</option>
                    <option value="Inter-Camp Surplus Transfer">Neighboring Camp Surplus Transfer</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Purpose of Requisition ("What this is needed for") *
                  </label>
                  <textarea
                    className="input-textarea"
                    rows="3"
                    placeholder="e.g. Distribution to 35 newly evacuated families from Ward 4 breach zone staying in Classrooms 1-4."
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    required
                  />
                  <span className="helper-text">
                    💡 Admins review this reason to approve and allocate dispatch priorities.
                  </span>
                </div>

                <button type="submit" className="btn-primary w-full" disabled={reqSubmitting}>
                  <Send size={16} />
                  <span>{reqSubmitting ? 'Submitting Order...' : 'Submit Online Supply Requisition'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Requisitions Status & Admin Directives Tracking */}
          <div className="feed-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <div>
                  <h3 className="card-title text-cyan">
                    <Truck size={20} /> Online Requisition Orders ({campRequisitions.length})
                  </h3>
                  <p className="card-subtitle">
                    Live delivery status and Admin Directives ("what you are told to do with this supply")
                  </p>
                </div>
                <button className="btn-icon" onClick={onRequisitionsRefresh} title="Refresh Orders">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="requisitions-stream">
                {campRequisitions.length === 0 ? (
                  <div className="empty-box p-8">
                    <ShoppingCart size={36} className="text-muted mb-2" />
                    <p>No supply orders placed by this camp yet.</p>
                    <p className="text-xs text-muted mt-1">Use the form on the left to order relief supplies online.</p>
                  </div>
                ) : (
                  campRequisitions.map((order) => {
                    const isReceived = order.status === 'received';
                    const isDispatched = order.status === 'dispatched';
                    const isApproved = order.status === 'approved';
                    const isRequested = order.status === 'requested';

                    return (
                      <div
                        key={order._id}
                        className={`requisition-card-item req-${order.status}`}
                      >
                        <div className="req-card-top">
                          <div>
                            <div className="req-item-title-row">
                              <h4 className="req-item-name">{order.item}</h4>
                              <span className={`status-pill-small pill-${order.status}`}>
                                {isReceived && '✅ RECEIVED & STOCKED'}
                                {isDispatched && '🚚 DISPATCHED / IN TRANSIT'}
                                {isApproved && '📋 APPROVED FOR DISPATCH'}
                                {isRequested && '⏳ PENDING ADMIN REVIEW'}
                                {order.status === 'rejected' && '❌ REJECTED'}
                              </span>
                            </div>
                            <span className="req-camp-tag">
                              🏛️ {order.campName} • Qty: <strong>{order.quantity}</strong>
                            </span>
                          </div>

                          <span className="req-time">
                            <Clock size={11} />
                            {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Stated Purpose */}
                        <div className="req-purpose-box">
                          <span className="purpose-label">🎯 Stated Camp Purpose:</span>
                          <p className="purpose-text">"{order.purpose}"</p>
                        </div>

                        {/* Admin Directive Callout ("What they are told for") */}
                        {order.adminInstructions && (
                          <div className="admin-directive-callout">
                            <div className="directive-header">
                              <ShieldCheck size={14} className="text-cyan" />
                              <span className="directive-title">Admin Allocation Directive & Instructions:</span>
                            </div>
                            <p className="directive-body">"{order.adminInstructions}"</p>
                          </div>
                        )}

                        {/* Actions: Mark Received, WhatsApp dispatch */}
                        <div className="req-card-actions">
                          {isDispatched && (
                            <button
                              className="btn-mark-received"
                              onClick={() => handleMarkReceived(order._id)}
                            >
                              <CheckCircle2 size={14} />
                              <span>Confirm Received & Add to Stock</span>
                            </button>
                          )}

                          <button
                            className="btn-chip"
                            onClick={() => {
                              const waUrl = createWhatsAppCampRequisitionLink(activeCamp, order);
                              window.open(waUrl, '_blank');
                            }}
                            title="Share Requisition on WhatsApp"
                          >
                            <MessageCircle size={13} className="text-emerald" /> WhatsApp Depot
                          </button>

                          <a
                            href={createEmailCampRequisitionLink(activeCamp, order)}
                            className="btn-chip"
                            title="Email Requisition"
                          >
                            <Mail size={13} className="text-amber" /> Email Depot
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
      )}

      {/* VIEW 2: MANUAL LOCAL STOCK LEDGER & INTER-CAMP MATCHING */}
      {activeSubTab === 'ledger' && (
        <div className="portal-grid">
          {/* Left Column: Publish Surplus / Deficit */}
          <div className="form-column">
            <div className="card-glass">
              <div className="card-glass-header">
                <h3 className="card-title text-indigo">
                  <PlusCircle size={20} /> Publish Camp Surplus / Critical Deficit
                </h3>
                <p className="card-subtitle">Broadcast materials to neighboring camps and volunteer dispatchers</p>
              </div>

              {feedback && (
                <div className={`feedback-alert feedback-${feedback.type}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAddResource} className="portal-form">
                {/* Surplus vs Deficit Toggle */}
                <div className="input-group">
                  <label className="input-label">Is this a Surplus or a Deficit?</label>
                  <div className="type-toggle-row">
                    <button
                      type="button"
                      className={`toggle-type-btn toggle-surplus ${resourceType === 'surplus' ? 'active' : ''}`}
                      onClick={() => setResourceType('surplus')}
                    >
                      <TrendingUp size={16} />
                      <span>SURPLUS (Available to Share)</span>
                    </button>
                    <button
                      type="button"
                      className={`toggle-type-btn toggle-deficit ${resourceType === 'deficit' ? 'active' : ''}`}
                      onClick={() => setResourceType('deficit')}
                    >
                      <TrendingDown size={16} />
                      <span>DEFICIT (Urgently Needed)</span>
                    </button>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Supply Item / Material Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Chlorine Tablets, 20L Water Cans"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Quantity / Volume</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 150 packets, 30 units"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Urgency Level</label>
                    <select
                      className="input-select"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                    >
                      <option value="high">High (Urgent Attention)</option>
                      <option value="medium">Medium (Standard Need)</option>
                      <option value="low">Low (Routine / Stockpile)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Logistical Notes</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Stored in Ward 2 warehouse, forklift ready"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-camp-submit ${resourceType === 'surplus' ? 'btn-surplus-submit' : 'btn-deficit-submit'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Logging entry...</span>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span>{resourceType === 'surplus' ? 'Broadcast Surplus Available' : 'Declare Critical Deficit'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Inter-Camp Matchmaker Suggestion Box */}
            {matches.length > 0 && (
              <div className="matchmaker-box">
                <div className="matchmaker-header">
                  <Sparkles size={18} className="text-amber" />
                  <h4 className="matchmaker-title">Automated Inter-Camp Resource Matches</h4>
                </div>
                <p className="matchmaker-desc">
                  Nearby camps currently have surpluses matching your camp's declared deficits:
                </p>

                <div className="matches-list">
                  {matches.map((m, idx) => (
                    <div key={idx} className="match-card">
                      <div className="match-row">
                        <span className="match-def text-rose">Needed: {m.deficitItem.resource}</span>
                        <ArrowRightLeft size={14} className="text-muted" />
                        <span className="match-sur text-emerald">Found at: {m.fromCamp.name}</span>
                      </div>
                      <div className="match-contact-row">
                        <span>
                          Available: <strong>{m.surplusItem.quantity || 'Surplus kits'}</strong>
                        </span>
                        <a href={`tel:${m.fromCamp.contactPhone}`} className="btn-chip btn-call-chip">
                          <Phone size={12} /> Call: {m.fromCamp.contactPhone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Selected Camp Details & Supplies Ledger */}
          <div className="feed-column">
            {activeCamp && (
              <div className="card-glass mb-4">
                <div className="card-glass-header">
                  <div>
                    <span className="camp-coord-tag">GPS: {activeCamp.lat}, {activeCamp.lng}</span>
                    <h3 className="card-title text-cyan mt-1">{activeCamp.name}</h3>
                    <p className="card-subtitle">{activeCamp.locationName || 'Emergency Shelter Hub'}</p>
                  </div>
                  <div className="camp-phone-pill">
                    <Phone size={13} />
                    <span>{activeCamp.contactPhone || 'Contact Desk'}</span>
                  </div>
                </div>

                {/* Occupancy Progress */}
                <div className="camp-occupancy-card">
                  <div className="occupancy-stats-row">
                    <div className="stat-unit">
                      <span className="stat-label">Capacity</span>
                      <span className="stat-val">{activeCamp.capacity} beds</span>
                    </div>
                    <div className="stat-unit">
                      <span className="stat-label">Occupied</span>
                      <span className="stat-val text-amber">{activeCamp.currentOccupancy} persons</span>
                    </div>
                    <div className="stat-unit">
                      <span className="stat-label">Available Space</span>
                      <span className="stat-val text-emerald">
                        {Math.max(0, activeCamp.capacity - activeCamp.currentOccupancy)} beds
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-track mt-2">
                    <div
                      className={`progress-bar-fill ${
                        activeCamp.currentOccupancy / activeCamp.capacity > 0.85
                          ? 'progress-critical'
                          : 'progress-normal'
                      }`}
                      style={{
                        width: `${Math.min(100, (activeCamp.currentOccupancy / activeCamp.capacity) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Camp Supplies Ledger */}
                <div className="camp-supplies-ledger mt-4">
                  <h4 className="ledger-title">
                    <Package size={15} /> Active Supplies Ledger ({activeCamp.resources?.length || 0})
                  </h4>

                  {activeCamp.resources && activeCamp.resources.length > 0 ? (
                    <div className="ledger-items-list">
                      {activeCamp.resources.map((item) => {
                        const isSurplus = item.type === 'surplus';
                        return (
                          <div
                            key={item._id}
                            className={`ledger-item ${isSurplus ? 'ledger-surplus' : 'ledger-deficit'}`}
                          >
                            <div className="ledger-item-main">
                              <div className="ledger-item-title-row">
                                <span className="ledger-item-name">{item.resource}</span>
                                <span className={`status-pill-small ${isSurplus ? 'pill-surplus' : 'pill-deficit'}`}>
                                  {isSurplus ? '🟢 SURPLUS' : '🔴 DEFICIT'}
                                </span>
                              </div>
                              <div className="ledger-item-sub">
                                {item.quantity && <span>Qty: <strong>{item.quantity}</strong></span>}
                                {item.notes && <span className="item-note">Note: {item.notes}</span>}
                                <span className="item-urgency">Priority: {item.urgency}</span>
                              </div>
                            </div>
                            <button
                              className="btn-item-delete"
                              title="Remove supply entry"
                              onClick={() => handleDeleteResource(activeCamp._id, item._id)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-subtext">No supplies registered for this camp yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
