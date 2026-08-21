import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyMap } from './components/EmergencyMap';
import { VictimPortal } from './components/VictimPortal';
import { CampPortal } from './components/CampPortal';
import { AdminPortal } from './components/AdminPortal';
import { AlertsBar } from './components/AlertsBar';
import { NgoDirectoryModal } from './components/NgoDirectoryModal';
import {
  Map,
  AlertOctagon,
  Tent,
  Shield,
  Radio,
  Users,
  Droplets,
  RefreshCw,
  Building2,
  Download,
  WifiOff,
  CheckCircle2
} from 'lucide-react';

export function App() {
  // Support PWA shortcuts via URL parameters
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['map', 'victim', 'camps', 'admin'].includes(tab)) return tab;
    }
    return 'map';
  });

  const [sosList, setSosList] = useState([]);
  const [camps, setCamps] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // NGO Directory Modal state
  const [isNgoModalOpen, setIsNgoModalOpen] = useState(false);
  const [forwardSosData, setForwardSosData] = useState(null);

  // Selected map location for dropping pin
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Track online/offline status for disaster conditions
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Fetch all live data from MongoDB
  const fetchAllData = useCallback(async () => {
    try {
      const [sosRes, campsRes, alertsRes, reqsRes, ngosRes, statsRes] = await Promise.all([
        fetch('/api/sos'),
        fetch('/api/camps'),
        fetch('/api/alerts'),
        fetch('/api/requisitions'),
        fetch('/api/ngos'),
        fetch('/api/stats')
      ]);

      if (sosRes.ok) setSosList(await sosRes.json());
      if (campsRes.ok) setCamps(await campsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (reqsRes.ok) setRequisitions(await reqsRes.json());
      if (ngosRes.ok) setNgos(await ngosRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('[App] Error fetching disaster data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 12 seconds for real-time dispatch updates
    const interval = setInterval(fetchAllData, 12000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Status updater for SOS items
  const handleUpdateSosStatus = async (id, newStatus, assignedTo) => {
    try {
      const res = await fetch(`/api/sos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, assignedTo })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocationPicked = (coords) => {
    setSelectedCoords(coords);
  };

  const handleSosSubmitted = (newSos) => {
    setSosList((prev) => [newSos, ...prev]);
    fetchAllData();
  };

  const handleOpenNgoModal = (sosToForward = null) => {
    setForwardSosData(sosToForward);
    setIsNgoModalOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          <div className="offline-banner-inner">
            <WifiOff size={15} className="offline-icon" />
            <span><strong>Offline Emergency Mode:</strong> Cellular connection unavailable. Showing cached relief grid & local data.</span>
          </div>
        </div>
      )}

      {/* Top Alerts Ribbon */}
      <AlertsBar alerts={alerts} />

      {/* Main App Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-logo-wrap">
              <Radio className="brand-pulse-icon" size={20} />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-title">SETU</h1>
                <span className="brand-badge-live">LIVE GRID</span>
              </div>
              <p className="brand-tagline">Disaster Relief, Citizen SOS & Supply Coordination Network</p>
            </div>
          </div>

          {/* Top Quick Stats Pill Bar */}
          <div className="header-stats-bar">
            <div className="header-stat-chip chip-sos">
              <AlertOctagon size={13} />
              <span><strong>{stats?.pendingSos || sosList.filter(s => s.status !== 'resolved').length}</strong> Active SOS</span>
            </div>
            <div className="header-stat-chip chip-camps">
              <Tent size={13} />
              <span><strong>{camps.length}</strong> Relief Camps</span>
            </div>
            <div className="header-stat-chip chip-beds">
              <Users size={13} />
              <span><strong>{stats?.availableBeds || 0}</strong> Beds Free</span>
            </div>

            {/* NGO Quick Connect Button in Header */}
            <button
              className="btn-header-ngo"
              onClick={() => handleOpenNgoModal()}
              title="Disaster Relief NGOs & Agencies Directory"
            >
              <Building2 size={13} />
              <span>NGO Desk ({ngos.length})</span>
            </button>

            {/* PWA Install Button when installable */}
            {isInstallable && (
              <button
                className="btn-header-install"
                onClick={handleInstallClick}
                title="Install SETU Disaster App on Phone or PC"
              >
                <Download size={13} />
                <span>Install App</span>
              </button>
            )}

            <button className="btn-icon" onClick={fetchAllData} title="Refresh Live Data">
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Portal Navigation Bar */}
        <nav className="portal-nav-bar" aria-label="Portal Navigation">
          <button
            className={`portal-nav-btn ${activeTab === 'map' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <Map size={18} />
            <span>Interactive Map</span>
          </button>

          <button
            className={`portal-nav-btn nav-sos ${activeTab === 'victim' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('victim')}
          >
            <AlertOctagon size={18} />
            <span>Victim SOS & Needs</span>
            {sosList.filter(s => s.status === 'pending').length > 0 && (
              <span className="nav-badge-sos">{sosList.filter(s => s.status === 'pending').length}</span>
            )}
          </button>

          <button
            className={`portal-nav-btn nav-camps ${activeTab === 'camps' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('camps')}
          >
            <Tent size={18} />
            <span>Camp Supply Hub</span>
            {requisitions.filter(r => r.status !== 'received').length > 0 && (
              <span className="nav-badge-info">
                {requisitions.filter(r => r.status !== 'received').length} Orders
              </span>
            )}
          </button>

          <button
            className={`portal-nav-btn nav-admin ${activeTab === 'admin' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Shield size={18} />
            <span>Head Admin</span>
            {isAdmin && <span className="nav-badge-admin">UNLOCKED</span>}
          </button>
        </nav>

        {/* Tab Panels */}
        <div className="portal-view-container">
          {activeTab === 'map' && (
            <div className="map-view-section">
              <EmergencyMap
                sosRequests={sosList}
                camps={camps}
                selectedCoords={selectedCoords}
                onLocationSelect={handleLocationPicked}
                isSelectionMode={true}
                onStatusUpdate={handleUpdateSosStatus}
                onOpenNgoModal={handleOpenNgoModal}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {activeTab === 'victim' && (
            <VictimPortal
              sosList={sosList}
              onSosSubmitted={handleSosSubmitted}
              onSelectLocationOnMap={handleLocationPicked}
              selectedCoords={selectedCoords}
              onOpenNgoModal={handleOpenNgoModal}
            />
          )}

          {activeTab === 'camps' && (
            <CampPortal
              camps={camps}
              requisitions={requisitions}
              onCampsRefresh={fetchAllData}
              onRequisitionsRefresh={fetchAllData}
              onOpenNgoModal={handleOpenNgoModal}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPortal
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
              camps={camps}
              alerts={alerts}
              sosList={sosList}
              requisitions={requisitions}
              ngos={ngos}
              onCampsRefresh={fetchAllData}
              onAlertsRefresh={fetchAllData}
              onSosRefresh={fetchAllData}
              onRequisitionsRefresh={fetchAllData}
              onNgosRefresh={fetchAllData}
              onStatusUpdate={handleUpdateSosStatus}
              onOpenNgoModal={handleOpenNgoModal}
            />
          )}
        </div>
      </main>

      {/* Global NGO Directory & WhatsApp/Email Dispatch Modal */}
      <NgoDirectoryModal
        isOpen={isNgoModalOpen}
        onClose={() => {
          setIsNgoModalOpen(false);
          setForwardSosData(null);
        }}
        ngos={ngos}
        onNgosRefresh={fetchAllData}
        forwardSosData={forwardSosData}
      />

      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-brand-title">SETU Flood Response & Logistics Grid</span>
          <span className="footer-divider">•</span>
          <span>Offline Capable Grid</span>
          <span className="footer-divider">•</span>
          <span>WhatsApp & Email NGO Dispatch</span>
          <span className="footer-divider">•</span>
          <span>Online Supply Directives</span>
          <span className="footer-divider">•</span>
          <span className="footer-hotlines">Emergency Hotlines: <strong>1070 (Disaster)</strong> / <strong>112 (Police)</strong></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
