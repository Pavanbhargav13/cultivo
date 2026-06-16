// frontend/src/components/LogsChart.jsx
import React, { useState } from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { Database, Calendar, Sliders, Sprout } from 'lucide-react';

const LogsChart = () => {
  const { liveLogs, logDays, setLogDays } = useCrop();
  const [selectedCropFilter, setSelectedCropFilter] = useState('all');
  const [selectedSensorFilter, setSelectedSensorFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const formatFullDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Get distinct crop names and actions for filters
  const crops = Array.from(new Set(liveLogs.map((l) => l.crop_name).filter(Boolean)));
  const actions = Array.from(new Set(liveLogs.map((l) => l.action).filter(Boolean)));
  const sensors = Array.from(new Set(liveLogs.map((l) => l.sensor_type).filter(Boolean)));

  // Filter logs based on inputs
  const filteredLogs = liveLogs
    .filter((log) => {
      const cropMatch = selectedCropFilter === 'all' || log.crop_name === selectedCropFilter;
      const sensorMatch = selectedSensorFilter === 'all' || log.sensor_type === selectedSensorFilter;
      const actionMatch = selectedActionFilter === 'all' || log.action === selectedActionFilter;
      return cropMatch && sensorMatch && actionMatch;
    })
    .reverse(); // newest first

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">System Audit Logs</h1>
        </div>
      </header>

      {/* Content */}
      <div className="db-content">
        <div className="db-widget">
          {/* Filters Area */}
          <div className="logs-filter-bar">
            <div className="filter-item">
              <label><Sprout size={10} style={{ marginRight: '0.2rem' }} /> Crop Context</label>
              <select value={selectedCropFilter} onChange={(e) => setSelectedCropFilter(e.target.value)}>
                <option value="all">All Crops</option>
                {crops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label><Sliders size={10} style={{ marginRight: '0.2rem' }} /> Sensor Loop</label>
              <select value={selectedSensorFilter} onChange={(e) => setSelectedSensorFilter(e.target.value)}>
                <option value="all">All Sensors</option>
                {sensors.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Action Command</label>
              <select value={selectedActionFilter} onChange={(e) => setSelectedActionFilter(e.target.value)}>
                <option value="all">All Actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label><Calendar size={10} style={{ marginRight: '0.2rem' }} /> Log Range</label>
              <select value={logDays} onChange={(e) => setLogDays(parseInt(e.target.value, 10))}>
                <option value={7}>7 Days</option>
                <option value={20}>20 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="widget-header" style={{ marginTop: '1rem' }}>
            <div>
              <h3 className="widget-title"><Database size={18} style={{ color: 'var(--db-green)' }} /> Log Audit Trail ({filteredLogs.length} entries)</h3>
              <span className="widget-subtitle">A chronological record of sensor predictions, actuator actions, and triggering causes.</span>
            </div>
          </div>

          <div className="table-responsive" style={{ marginTop: '0.5rem', maxHeight: '450px' }}>
            <table className="db-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Crop</th>
                  <th>Sensor Loop</th>
                  <th>Predicted Val</th>
                  <th>Action Trigger</th>
                  <th>Cause Explanation</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--db-text-muted)', fontSize: '0.8rem' }}>
                        {formatFullDate(log.timestamp)}
                      </td>
                      <td style={{ fontWeight: '600' }}>{log.crop_name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{log.sensor_type.replace('_', ' ')}</td>
                      <td style={{ fontWeight: '500' }}>{log.predicted_value.toFixed(1)}</td>
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
                      <td className="db-text-muted" style={{ maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {log.cause}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--db-text-muted)', padding: '3rem' }}>
                      No matching log records found. Try adjusting the filter settings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsChart;
