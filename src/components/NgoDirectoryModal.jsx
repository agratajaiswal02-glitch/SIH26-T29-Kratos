import React, { useState } from 'react';
import {
  Building2,
  X,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle2,
  Shield,
  MapPin,
  ExternalLink,
  PlusCircle,
  AlertOctagon,
  Search,
  Filter,
  Send,
  HeartHandshake
} from 'lucide-react';
import {
  createWhatsAppSosLink,
  createEmailSosLink,
  sanitizePhoneForWhatsApp
} from '../utils/shareAlert';

export function NgoDirectoryModal({
  isOpen,
  onClose,
  ngos = [],
  onNgosRefresh,
  forwardSosData = null // If passed, modal acts as "Forward SOS to NGO" mode
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'register'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Register NGO Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('All-Round Relief');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [operationalZones, setOperationalZones] = useState('');
  const [availableResources, setAvailableResources] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleRegisterNgo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Name, WhatsApp number, and Email are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/ngos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          contactPerson: contactPerson.trim() || 'Disaster Desk',
          operationalZones: operationalZones
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          availableResources: availableResources
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          headquarters: headquarters.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register NGO');
      }

      setFeedback({
        type: 'success',
        message: `Organization "${name}" registered successfully! Verified for emergency WhatsApp & Email dispatch.`
      });

      setName('');
      setWhatsapp('');
      setEmail('');
      setContactPerson('');
      setOperationalZones('');
      setAvailableResources('');
      setHeadquarters('');

      if (onNgosRefresh) onNgosRefresh();
      setTimeout(() => setActiveTab('directory'), 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNgos = ngos.filter((ngo) => {
    const matchesFilter = filterType === 'all' || ngo.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      ngo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.operationalZones?.some((z) => z.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ngo.type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleWhatsAppNgo = (ngo) => {
    if (forwardSosData) {
      const waUrl = createWhatsAppSosLink(forwardSosData, ngo.whatsapp);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else {
      const text = encodeURIComponent(
        `Hello ${ngo.name}, I am reaching out through the SETU Flood Relief Coordination Network regarding urgent flood relief operations.`
      );
      const cleanPhone = sanitizePhoneForWhatsApp(ngo.whatsapp);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailNgo = (ngo) => {
    if (forwardSosData) {
      const mailUrl = createEmailSosLink(forwardSosData, ngo.email);
      window.location.href = mailUrl;
    } else {
      const subject = encodeURIComponent(`[SETU RELIEF INQUIRY] Direct Contact to ${ngo.name}`);
      const body = encodeURIComponent(
        `Dear ${ngo.name} Disaster Response Team,\n\nI am contacting your team via the SETU Flood Disaster Coordination Network regarding ongoing relief and rescue coordination.\n\nRegards,\nSETU User`
      );
      window.location.href = `mailto:${ngo.email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ngo-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Building2 size={22} className="text-cyan" />
            </div>
            <div>
              <h3 className="modal-title">
                {forwardSosData ? 'Forward SOS Alert to NGO / Agency' : 'Disaster Relief NGOs & Agencies Directory'}
              </h3>
              <p className="modal-subtitle">
                {forwardSosData
                  ? `Dispatching emergency alert for ${forwardSosData.victimName} (${forwardSosData.peopleCount} trapped)`
                  : 'Direct 1-click WhatsApp & Email dispatch to verified disaster relief taskforces'}
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* SOS Forwarding Summary Bar (if forward mode active) */}
        {forwardSosData && (
          <div className="forward-sos-banner">
            <div className="forward-sos-left">
              <AlertOctagon size={18} className="text-rose" />
              <div>
                <strong>{forwardSosData.victimName}</strong> ({forwardSosData.contactPhone}) •{' '}
                <span className="text-rose font-bold">{forwardSosData.urgency?.toUpperCase()}</span> •{' '}
                {forwardSosData.address || `${forwardSosData.lat}, ${forwardSosData.lng}`}
              </div>
            </div>
            <span className="badge-critical">Ready to Dispatch</span>
          </div>
        )}

        {/* Modal Tabs */}
        <div className="ngo-modal-tabs">
          <button
            className={`ngo-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Building2 size={16} />
            <span>Verified NGOs & Agencies ({ngos.length})</span>
          </button>
          <button
            className={`ngo-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <PlusCircle size={16} />
            <span>Register New Relief Org / Volunteer Fleet</span>
          </button>
        </div>

        {/* Tab 1: Directory */}
        {activeTab === 'directory' && (
          <div className="ngo-modal-body">
            {/* Search & Filter Toolbar */}
            <div className="ngo-toolbar">
              <div className="ngo-search-wrap">
                <Search size={15} className="ngo-search-icon" />
                <input
                  type="text"
                  className="input-field ngo-search-input"
                  placeholder="Search NGO name, sector, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="ngo-filter-pills">
                <button
                  className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({ngos.length})
                </button>
                <button
                  className={`filter-pill ${filterType === 'Rescue & Evacuation' ? 'active' : ''}`}
                  onClick={() => setFilterType('Rescue & Evacuation')}
                >
                  🚤 Rescue
                </button>
                <button
                  className={`filter-pill ${filterType === 'Medical & First Aid' ? 'active' : ''}`}
                  onClick={() => setFilterType('Medical & First Aid')}
                >
                  💊 Medical
                </button>
                <button
                  className={`filter-pill ${filterType === 'Food & Drinking Water' ? 'active' : ''}`}
                  onClick={() => setFilterType('Food & Drinking Water')}
                >
                  🍲 Food/Water
                </button>
                <button
                  className={`filter-pill ${filterType === 'Shelter & Kits' ? 'active' : ''}`}
                  onClick={() => setFilterType('Shelter & Kits')}
                >
                  ⛺ Shelter
                </button>
              </div>
            </div>

            {/* NGOs Grid */}
            <div className="ngos-card-grid">
              {filteredNgos.length === 0 ? (
                <div className="empty-box p-8">
                  <Building2 size={36} className="text-muted mb-2" />
                  <p>No NGOs match your filter.</p>
                </div>
              ) : (
                filteredNgos.map((ngo) => (
                  <div key={ngo._id} className="ngo-card">
                    <div className="ngo-card-top">
                      <div>
                        <div className="ngo-name-row">
                          <h4 className="ngo-title">{ngo.name}</h4>
                          {ngo.verified && (
                            <span className="ngo-badge-verified" title="Verified Disaster Responder">
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          )}
                        </div>
                        <span className="ngo-type-tag">{ngo.type}</span>
                      </div>
                      {ngo.headquarters && <span className="ngo-hq-tag">📍 {ngo.headquarters}</span>}
                    </div>

                    <div className="ngo-contact-meta">
                      <div className="ngo-meta-row">
                        <Phone size={13} className="text-cyan" />
                        <span>Desk: <strong>{ngo.contactPerson || 'Coordinator'}</strong> ({ngo.whatsapp})</span>
                      </div>
                      <div className="ngo-meta-row">
                        <Mail size={13} className="text-amber" />
                        <span>{ngo.email}</span>
                      </div>
                    </div>

                    {/* Operational Zones */}
                    {ngo.operationalZones && ngo.operationalZones.length > 0 && (
                      <div className="ngo-zones-row">
                        <span className="zones-label">Coverage:</span>
                        {ngo.operationalZones.map((zone, idx) => (
                          <span key={idx} className="zone-pill">{zone}</span>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {ngo.availableResources && ngo.availableResources.length > 0 && (
                      <div className="ngo-resources-box">
                        <span className="resources-title">Capabilities:</span>
                        <div className="resources-pills">
                          {ngo.availableResources.map((res, idx) => (
                            <span key={idx} className="resource-pill">✓ {res}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="ngo-actions-row">
                      <button
                        className="btn-whatsapp-action"
                        onClick={() => handleWhatsAppNgo(ngo)}
                      >
                        <MessageCircle size={15} />
                        <span>{forwardSosData ? 'Forward on WhatsApp' : 'WhatsApp Desk'}</span>
                      </button>
                      <button
                        className="btn-email-action"
                        onClick={() => handleEmailNgo(ngo)}
                      >
                        <Mail size={15} />
                        <span>{forwardSosData ? 'Email SOS Report' : 'Send Email'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Register Organization */}
        {activeTab === 'register' && (
          <div className="ngo-modal-body">
            <div className="card-glass-form p-6">
              <div className="mb-4">
                <h4 className="text-cyan font-bold text-lg">Register Organization or Volunteer Taskforce</h4>
                <p className="text-muted text-sm">
                  Join SETU's emergency routing grid to receive direct WhatsApp SOS distress alerts and supply requests.
                </p>
              </div>

              {feedback && (
                <div className={`feedback-alert feedback-${feedback.type} mb-4`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleRegisterNgo} className="portal-form">
                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Organization / Group Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rapid Relief Taskforce Assam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Specialization / Domain *</label>
                    <select
                      className="input-select"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="All-Round Relief">All-Round Relief</option>
                      <option value="Rescue & Evacuation">Rescue & Evacuation (Boats & Divers)</option>
                      <option value="Medical & First Aid">Medical & First Aid (Ambulance/Doctors)</option>
                      <option value="Food & Drinking Water">Food & Drinking Water Supplies</option>
                      <option value="Shelter & Kits">Shelter & Emergency Tarpaulins</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">WhatsApp Helpline Number *</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="e.g. +91 98765 43210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                    />
                    <span className="helper-text">Disaster alerts and victim coordinates will be sent here.</span>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Emergency Email Address *</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. dispatch@reliefgroup.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Lead Contact Person</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Coordinator Bipin Hazarika"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Base Location / HQ</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. District Sports Stadium Control Room"
                      value={headquarters}
                      onChange={(e) => setHeadquarters(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Operational Zones / Covered Sectors (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Ward 4 Lowlands, East Riverbank, High Risk Islands"
                    value={operationalZones}
                    onChange={(e) => setOperationalZones(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Available Equipment & Resources (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 4 Inflatable Motorboats, 200 Ration Kits, 3 Mobile Water Purifiers"
                    value={availableResources}
                    onChange={(e) => setAvailableResources(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
                  <HeartHandshake size={18} />
                  <span>{isSubmitting ? 'Registering...' : 'Register Organization on SETU Grid'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
