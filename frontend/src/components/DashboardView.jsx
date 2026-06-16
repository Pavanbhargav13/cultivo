// frontend/src/components/DashboardView.jsx
import React, { useState } from 'react';
import { useCrop } from '../context/CropContext.jsx';
import TopMetrics from './TopMetrics.jsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Bell, Plus, Activity, Wind, Zap, Eye } from 'lucide-react';

const DashboardView = () => {
  const { liveLogs, selectedCrop, logDays, setLogDays } = useCrop();
  const [activeZone, setActiveZone] = useState('Bay 01');

  // Format ISO timestamp to nice short format
  const formatTimeLabel = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  const formatFullDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  // Restructure live logs to group by timestamp for the line chart (Recharts expects one object per X-axis tick)
  const getChartData = () => {
    const grouped = {};
    liveLogs.forEach((log) => {
      const timeKey = new Date(log.timestamp).getTime();
      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          timestampRaw: timeKey,
          timestampStr: formatTimeLabel(log.timestamp),
          timestampFull: formatFullDate(log.timestamp),
        };
      }
      grouped[timeKey][log.sensor_type] = parseFloat(log.predicted_value.toFixed(1));
    });
    
    // Convert to sorted array
    return Object.values(grouped)
      .sort((a, b) => a.timestampRaw - b.timestampRaw)
      .slice(-30); // show last 30 readings for clarity
  };

  const chartData = getChartData();

  // Get only logs that resulted in an actuator activation (action !== 'none')
  const actuatorLogs = liveLogs
    .filter((l) => l.action !== 'none')
    .slice(-5) // get latest 5 actions
    .reverse();

  // Simulated Zone statuses
  const zones = [
    { name: 'Bay 01', temp: 24.2, status: 'Active Cooling', load: '65%' },
    { name: 'Bay 02', temp: 21.8, status: 'Normal', load: '0%' },
    { name: 'Bay 03', temp: 26.5, status: 'Vent Open', load: '30%' },
    { name: 'Bay 04', temp: 19.5, status: 'Heating Active', load: '80%' },
  ];

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">Dashboard Overview</h1>
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

        {/* First Row Grid: Chart + Resource usage */}
        <div className="dashboard-grid-1">
          {/* Main Line Chart widget */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Activity size={18} style={{ color: 'var(--db-green)' }} /> Climate Telemetry Monitor</h3>
                <span className="widget-subtitle">Real-time scrolling data feed. Hover over nodes to inspect details.</span>
              </div>
              <select
                className="widget-filter-select"
                value={logDays}
                onChange={(e) => setLogDays(parseInt(e.target.value, 10))}
              >
                <option value={7}>Last 7 Days</option>
                <option value={20}>Last 20 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            
            <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timestampStr" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      labelFormatter={(label, items) => {
                        return items[0]?.payload?.timestampFull || label;
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--db-border)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        fontSize: '0.8rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature (°C)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="co2"
                      name="CO₂ (ppm)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="soil_moisture"
                      name="Soil Moisture (%)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--db-text-muted)' }}>
                  Loading telemetry feed...
                </div>
              )}
            </div>
          </div>

          {/* Right Resource Offset widget */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Zap size={18} style={{ color: '#eab308' }} /> Carbon & Energy Offsets</h3>
                <span className="widget-subtitle">Crop: {selectedCrop} context</span>
              </div>
            </div>
            
            <div className="offset-container" style={{ marginTop: '0.5rem' }}>
              <div className="offset-main-value">
                <span className="offset-big-number">99,681 TONS</span>
                <span className="offset-lbl">↗ 20% Reduced CO₂ this quarter</span>
              </div>

              <div className="offset-bars-list">
                <div className="offset-bar-item">
                  <div className="offset-bar-lbl-row">
                    <span className="db-text-muted">Solar Microgrid Load</span>
                    <span>52%</span>
                  </div>
                  <div className="offset-bar-bg">
                    <div className="offset-bar-fill" style={{ width: '52%' }}></div>
                  </div>
                </div>

                <div className="offset-bar-item">
                  <div className="offset-bar-lbl-row">
                    <span className="db-text-muted">Rainwater Reclamation</span>
                    <span>86%</span>
                  </div>
                  <div className="offset-bar-bg">
                    <div className="offset-bar-fill chemical" style={{ width: '86%' }}></div>
                  </div>
                </div>

                <div className="offset-bar-item">
                  <div className="offset-bar-lbl-row">
                    <span className="db-text-muted">Organic Recycle Ratio</span>
                    <span>70%</span>
                  </div>
                  <div className="offset-bar-bg">
                    <div className="offset-bar-fill" style={{ width: '70%', backgroundColor: '#8b5cf6' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row Grid: Actuators Activation logs + Zone Heatmap */}
        <div className="dashboard-grid-2">
          {/* Actuator Trigger Table */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Wind size={18} style={{ color: 'var(--db-green)' }} /> Actuator Activation Log</h3>
                <span className="widget-subtitle">Latest automated system responses</span>
              </div>
            </div>
            
            <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Sensor</th>
                    <th>Command</th>
                    <th>Value</th>
                    <th>Est. Power</th>
                    <th>Trigger Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {actuatorLogs.length > 0 ? (
                    actuatorLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: '600' }}>{log.crop_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{log.sensor_type.replace('_', ' ')}</td>
                        <td>
                          <span className={`badge-action ${
                            log.action === 'fan_on' ? 'badge-fan' :
                            log.action === 'vent_open' ? 'badge-vent' :
                            log.action === 'light_on' ? 'badge-light' :
                            log.action === 'irrigate' ? 'badge-irrigate' : 'badge-default'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{log.predicted_value ? log.predicted_value.toFixed(1) : '---'}</td>
                        <td style={{ fontWeight: '500' }}>{log.power_consumption}W</td>
                        <td className="db-text-muted">{log.cause}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--db-text-muted)', padding: '2rem' }}>
                        No recent actuator logs. Try sending a manual command.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zones Heatmap widget */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Eye size={18} style={{ color: 'var(--db-green)' }} /> Active Zones Map</h3>
                <span className="widget-subtitle">Greenhouse bay status overlays</span>
              </div>
            </div>

            <div className="heatmap-grid" style={{ marginTop: '0.5rem' }}>
              {zones.map((zone) => (
                <div
                  key={zone.name}
                  className={`heatmap-zone ${activeZone === zone.name ? 'active' : ''}`}
                  onClick={() => setActiveZone(zone.name)}
                  style={{
                    borderWidth: activeZone === zone.name ? '2px' : '1px',
                    borderColor: activeZone === zone.name ? 'var(--db-green)' : 'var(--db-border)'
                  }}
                >
                  <div className="zone-title">{zone.name}</div>
                  <div className="zone-temp">{zone.temp}°C</div>
                  <div className="zone-status" style={{
                    color: zone.status === 'Normal' ? 'var(--db-text-muted)' : 'var(--db-green-dark)',
                    fontWeight: zone.status === 'Normal' ? 'normal' : '600'
                  }}>
                    {zone.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
