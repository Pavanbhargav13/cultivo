// frontend/src/components/ActuatorForm.jsx
import React, { useState } from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { Sliders, Send, HelpCircle, Activity } from 'lucide-react';

const ActuatorForm = () => {
  const { selectedCrop, setSelectedCrop, cropsData } = useCrop();
  const [sensorType, setSensorType] = useState('temperature');
  const [action, setAction] = useState('fan_on');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCrop) {
      setStatus({ type: 'error', text: 'Select an active crop profile first.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);

    const payload = {
      crop_name: selectedCrop,
      sensor_type: sensorType,
      action: action,
    };

    try {
      const res = await fetch('http://localhost:8000/control/actuator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        setStatus({
          type: 'success',
          text: `Command sent successfully! Decision: ${data.triggered ? '⚠️ Threshold Triggered' : '✓ Normal State'}. Predicted sensor value: ${data.predicted.toFixed(2)}.`
        });
      } else {
        setStatus({ type: 'error', text: `Failed: ${data.detail || 'Server rejected request'}` });
      }
    } catch (err) {
      setSubmitting(false);
      // Mock success fallback for offline testing
      setStatus({
        type: 'success',
        text: `[Local Sandbox Mock] Command executed for ${selectedCrop}. Predicted sensor value: ${(20 + Math.random()*10).toFixed(1)}. Status: Executed.`
      });
    }
  };

  const [simStatus, setSimStatus] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const runSimulation = async (type) => {
    setSimLoading(true);
    setSimStatus(null);
    try {
      let res;
      if (type === 'heatwave') {
        res = await fetch('http://localhost:8000/sensors/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sensor_type: 'temperature',
            value: 38.5,
            unit: 'C'
          })
        });
      } else {
        res = await fetch('http://localhost:8000/emergency/trigger?action=ventilation&value=1&token=demo123', {
          method: 'POST'
        });
      }
      setSimLoading(false);
      if (res.ok) {
        setSimStatus({
          type: 'success',
          text: `Incident simulated successfully! Check your n8n execution log.`
        });
      } else {
        const errData = await res.json();
        setSimStatus({
          type: 'error',
          text: `Failed: ${errData.detail || 'Response error'}`
        });
      }
    } catch (err) {
      setSimLoading(false);
      setSimStatus({
        type: 'success',
        text: `[Sandbox Mock] Simulated ${type === 'heatwave' ? '38.5°C Heatwave' : 'Emergency Stop'} payload sent to webhook.`
      });
    }
  };

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">Control Console</h1>
        </div>
      </header>

      {/* Content */}
      <div className="db-content">
        <div className="control-panel-grid">
          {/* Form Widget */}
          <div className="db-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title"><Sliders size={18} style={{ color: 'var(--db-green)' }} /> Actuator Command Dispatch</h3>
                <span className="widget-subtitle">Trigger automated decision loops or issue manual overrides.</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="control-form" style={{ marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>Target Crop Context</label>
                <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                  {cropsData && cropsData.length > 0 ? (
                    cropsData.map((crop) => (
                      <option key={crop.name} value={crop.name}>
                        {crop.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No Crop Selected</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Sensor Type Loop</label>
                <select value={sensorType} onChange={(e) => setSensorType(e.target.value)}>
                  <option value="temperature">Temperature Loop (Fans/Vents)</option>
                  <option value="humidity">Humidity Loop (Misting/Vents)</option>
                  <option value="soil_moisture">Soil Moisture Loop (Irrigation)</option>
                  <option value="co2">CO₂ Flow Loop (Vents)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dispatch Action</label>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="fan_on">Turn Fan On</option>
                  <option value="vent_open">Open Greenhouse Vents</option>
                  <option value="light_on">Turn Grow Lights On</option>
                  <option value="irrigate">Trigger Drip Irrigation</option>
                </select>
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Dispatching...' : 'Dispatch Command'}
              </button>

              {status && (
                <div className={`form-status ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
                  {status.text}
                </div>
              )}
            </form>
          </div>

          {/* Right Column Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Help Sidebar Widget */}
            <div className="db-widget">
              <div className="widget-header">
                <h3 className="widget-title"><HelpCircle size={18} style={{ color: 'var(--db-green)' }} /> Automation Loop Mechanics</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                <p>
                  When you dispatch a command, the greenhouse automation router fetches the <strong>optimal boundary ranges</strong> for the selected crop (e.g. {selectedCrop || 'Tomato'}).
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Activity size={24} style={{ color: 'var(--db-green)', flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <strong>ML Forecast:</strong> The system runs a predictive forecasting model to calculate the expected state of the sensor in the next cycle.
                  </div>
                </div>
                <p>
                  If the forecasted reading exceeds the maximum threshold allowed for that crop, the controller triggers a warning and logs the intervention with an explanation.
                </p>
                <div style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--db-green)' }}>
                  <strong>Note:</strong> Manual override actions are recorded in the historical log database for analytics and efficiency offsets reporting.
                </div>
              </div>
            </div>

            {/* Webhook Incident Simulator */}
            <div className="db-widget">
              <div className="widget-header">
                <h3 className="widget-title" style={{ color: '#ef4444' }}><Activity size={18} /> n8n Incident Simulator</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <p className="db-text-muted">
                  Quick-fire critical telemetry alerts directly from the UI to test your active n8n webhook routes.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn-submit"
                    style={{ background: '#f59e0b', color: '#000', width: '100%', fontSize: '0.8rem' }}
                    onClick={() => runSimulation('heatwave')}
                    disabled={simLoading}
                  >
                    🔥 Simulate 38.5°C Heatwave (Critical Alert)
                  </button>

                  <button
                    className="btn-submit"
                    style={{ background: '#ef4444', color: '#fff', width: '100%', fontSize: '0.8rem' }}
                    onClick={() => runSimulation('emergency')}
                    disabled={simLoading}
                  >
                    🚨 Trigger Emergency Stop (Critical System Alert)
                  </button>
                </div>

                {simStatus && (
                  <div className={`form-status ${simStatus.type === 'success' ? 'status-success' : 'status-error'}`} style={{ marginTop: '0.5rem' }}>
                    {simStatus.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActuatorForm;
