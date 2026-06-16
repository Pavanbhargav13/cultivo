// frontend/src/components/AnalyticsView.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import TopMetrics from './TopMetrics.jsx';
import { Bell, Plus, Award, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import img1 from '../assets/user_avatar.png';

const AnalyticsView = () => {
  const { liveLogs, selectedCrop, cropsData } = useCrop();

  const currentCropObj = cropsData.find(c => c.name === selectedCrop);

  // Calculate a dynamic "Automation Deviation Index" representing the percentage of readings within target crop ranges
  const calculateDeviationIndex = () => {
    if (!liveLogs || liveLogs.length === 0) return 86; // default fallback
    
    let inRangeCount = 0;
    let totalChecked = 0;
    const ranges = currentCropObj?.ranges || {};

    liveLogs.forEach((log) => {
      const sensor = log.sensor_type;
      const val = log.predicted_value;
      const targetRange = ranges[sensor === 'soil_moisture' ? 'nutrition' : sensor];

      if (targetRange) {
        totalChecked++;
        if (val >= targetRange.min && val <= targetRange.max) {
          inRangeCount++;
        }
      }
    });

    if (totalChecked === 0) return 86;
    return Math.round((inRangeCount / totalChecked) * 100);
  };

  const deviationIndex = calculateDeviationIndex();
  
  // Custom SVG math for semi-circle radial gauge
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // For a semi-circle or full gauge, let's render a full 360 ring, but styled premium
  const strokeDashoffset = circumference - (deviationIndex / 100) * circumference;

  const energyBreakdown = [
    { title: 'Solar Energy Output', val: '52%', color: '#2dc974' },
    { title: 'Hydropower Turbine', val: '22%', color: '#3b82f6' },
    { title: 'Geothermal Generator', val: '12%', color: '#f59e0b' },
  ];

  const zoneEfficiencies = [
    { name: 'Bay 01 - Tomato Crop', val: '89%', target: 'Greenhouse North' },
    { name: 'Bay 02 - Lettuce Crop', val: '82%', target: 'Greenhouse East' },
    { name: 'Bay 03 - Strawberry Crop', val: '85%', target: 'Greenhouse South' },
    { name: 'Bay 04 - DragonFruit Crop', val: '80%', target: 'Greenhouse West' },
    { name: 'Bay 05 - Mushroom Crop', val: '79%', target: 'Basement Pod' },
    { name: 'Service Yard Hub', val: '76%', target: 'Utility Corridor' },
  ];

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">Analytics & Efficiency</h1>
        </div>
        <div className="db-topbar-actions">
          <div className="notification-bell" onClick={() => alert('Notifications cleared!')}>
            <Bell size={18} />
            <span className="bell-badge"></span>
          </div>
          <button className="btn-db-action" onClick={() => alert('Custom Widget selector coming soon!')}>
            <Plus size={16} /> Add Custom Widget
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="db-content">
        {/* Top telemetry metrics */}
        <TopMetrics />

        {/* First Row Grid: Radial Gauge + Energy Mix + Bay Resource Distribution */}
        <div className="analytics-top-row">
          {/* Deviation index radial progress */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Award size={18} style={{ color: 'var(--db-green)' }} /> Deviation Index</h3>
                <span className="widget-subtitle">Crop stability percentage</span>
              </div>
            </div>
            
            <div className="radial-container" style={{ marginTop: '0.5rem' }}>
              <svg width="150" height="150" className="radial-svg">
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  className="radial-bg-circle"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  className="radial-fill-circle"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="radial-text-content">
                <span className="radial-big-percent">{deviationIndex}%</span>
                <span className="radial-lbl">Optimal Range</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--db-text-muted)' }}>
              Deviation Index: {(100 - deviationIndex)}% fluctuations detected.
            </div>
          </div>

          {/* Renewable energy resource card */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Sparkles size={18} style={{ color: '#eab308' }} /> Renewable Energy Mix</h3>
                <span className="widget-subtitle">Total microgrid allocation</span>
              </div>
            </div>
            
            <div className="analytics-list" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.5rem' }}>
                <span className="offset-big-number" style={{ fontSize: '2rem' }}>86%</span>
                <span className="offset-lbl" style={{ margin: 0 }}>Integrated Solar/Wind/Hydro grid load</span>
              </div>
              
              {energyBreakdown.map((item, idx) => (
                <div className="analytics-list-item" key={idx}>
                  <div className="list-item-left">
                    <span className="list-item-dot" style={{ backgroundColor: item.color }}></span>
                    <span className="list-item-title">{item.title}</span>
                  </div>
                  <span className="list-item-val">{item.val}</span>
                </div>
              ))}
            </div>

            <button
              className="btn-submit"
              style={{ padding: '0.4rem', fontSize: '0.8rem', width: '100%', marginTop: 'auto' }}
              onClick={() => alert('Detailed resource log charts coming soon!')}
            >
              View Grid Logs
            </button>
          </div>

          {/* Right Resource Distribution by Zone */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Navigation size={18} style={{ color: 'var(--db-green)' }} /> Bay Water Distribution</h3>
                <span className="widget-subtitle">Active watering efficiency</span>
              </div>
            </div>
            
            <div className="analytics-list" style={{ marginTop: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              {zoneEfficiencies.map((zone, idx) => (
                <div className="deviation-item" key={idx} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--db-border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{zone.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--db-text-muted)' }}>{zone.target}</span>
                  </div>
                  <div className="deviation-info">
                    <div className="deviation-bar-bg">
                      <div className="deviation-bar-fill" style={{ width: zone.val }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{zone.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row Grid: Water reservoir levels + Community support promo */}
        <div className="dashboard-grid-2">
          {/* Water level reservoir panel */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><ShieldAlert size={18} style={{ color: '#3b82f6' }} /> Main Irrigation Reservoir</h3>
                <span className="widget-subtitle">Telemetry monitoring on water tanks</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="db-text-muted" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Water Level Capacity</span>
                <span className="offset-big-number" style={{ fontSize: '2.5rem' }}>57m</span>
                <span className="db-text-muted" style={{ fontSize: '0.75rem' }}>Depth level with integrated ice melt harvesting</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px solid var(--db-border)', paddingLeft: '1.5rem' }}>
                <span className="db-text-muted" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Air Circulation Flow</span>
                <span className="offset-big-number" style={{ fontSize: '2.5rem', color: 'var(--db-green-dark)' }}>76.2%</span>
                <span className="db-text-muted" style={{ fontSize: '0.75rem' }}>Automated vents duty cycles index</span>
              </div>
            </div>
          </div>

          {/* Cultivo Operator community card */}
          <div className="promo-banner">
            <div className="promo-content">
              <h3 className="promo-title">Let's join our community</h3>
              <p className="widget-subtitle" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Connect with over 230k+ smart growers globally. Compare crop indexes and download optimal seed profiles.
              </p>
              <div className="promo-avatars">
                <img src={img1} alt="Avatar 1" className="promo-avatar-img" />
                <img src={img1} alt="Avatar 2" className="promo-avatar-img" />
                <img src={img1} alt="Avatar 3" className="promo-avatar-img" />
                <span className="promo-avatar-count">230k+ people</span>
              </div>
            </div>
            
            <div className="promo-arrow" onClick={() => alert('Operator forum link is active!')}>
              <Award size={18} style={{ color: '#fff' }} />
            </div>

            <div className="promo-bg-decoration"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
