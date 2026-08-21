import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export function AlertsBar({ alerts = [] }) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || alerts.length === 0) return null;

  const topAlert = alerts[0];

  return (
    <div className={`alerts-top-ribbon alert-ribbon-${topAlert.severity}`}>
      <div className="ribbon-inner">
        <div className="ribbon-tag">
          <ShieldAlert size={16} />
          <span>{topAlert.severity.toUpperCase()} ALERT</span>
        </div>
        <div className="ribbon-text">
          <strong>{topAlert.title}:</strong> {topAlert.message} — <span className="ribbon-sector">Sector: {topAlert.affectedArea}</span>
        </div>
        <button className="ribbon-close" onClick={() => setDismissed(true)}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
