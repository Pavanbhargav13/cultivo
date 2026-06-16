// frontend/src/components/TopMetrics.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const TopMetrics = () => {
  const { liveLogs, selectedCrop, cropsData } = useCrop();

  const currentCropObj = cropsData.find(c => c.name === selectedCrop);
  const ranges = currentCropObj?.ranges || {};

  // Sensors configuration
  const sensorConfigs = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      formatVal: (v) => `${v.toFixed(1)}°C`,
      rangeKey: 'temperature',
    },
    {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      formatVal: (v) => `${v.toFixed(0)}%`,
      rangeKey: 'humidity',
    },
    {
      key: 'co2',
      label: 'CO₂ Level',
      unit: ' ppm',
      formatVal: (v) => `${v.toFixed(0)} ppm`,
      rangeKey: 'co2',
    },
    {
      key: 'soil_moisture',
      label: 'Soil Moisture',
      unit: '%',
      formatVal: (v) => `${v.toFixed(0)}%`,
      rangeKey: 'nutrition', // Fallback or map to nutrition thresholds in crop DB
    },
  ];

  return (
    <div className="metrics-grid">
      {sensorConfigs.map((sensor) => {
        // Filter historical logs for this sensor to construct the sparkline
        const sensorHistory = liveLogs
          .filter((l) => l.sensor_type === sensor.key)
          .slice(-10); // last 10 points
        
        const latestLog = sensorHistory[sensorHistory.length - 1];
        const latestVal = latestLog ? latestLog.predicted_value : 0;
        
        // Calculate status relative to crop ranges
        const range = ranges[sensor.rangeKey] || { min: 0, max: 100 };
        let status = 'optimal'; // optimal, warning, critical
        let comparisonText = 'Within target';
        
        if (latestVal > range.max) {
          const diff = latestVal - range.max;
          status = diff > (range.max - range.min) * 0.3 ? 'critical' : 'warning';
          comparisonText = `+${diff.toFixed(1)}${sensor.unit} above max`;
        } else if (latestVal < range.min) {
          const diff = range.min - latestVal;
          status = diff > (range.max - range.min) * 0.3 ? 'critical' : 'warning';
          comparisonText = `-${diff.toFixed(1)}${sensor.unit} below min`;
        } else {
          comparisonText = `Target: ${range.min}-${range.max}${sensor.unit}`;
        }

        // Prepare simple data structure for Recharts sparkline
        const sparklineData = sensorHistory.map((h, i) => ({
          index: i,
          val: h.predicted_value,
        }));

        const isTrendUp = sparklineData.length >= 2 
          ? sparklineData[sparklineData.length - 1].val >= sparklineData[sparklineData.length - 2].val 
          : true;

        return (
          <div className="metric-card" key={sensor.key}>
            <div className="metric-header">
              <span>{sensor.label}</span>
              <span className={`metric-status-dot status-${status}`}></span>
            </div>
            
            <div className="metric-value-row">
              <span className="metric-value">
                {latestLog ? sensor.formatVal(latestVal) : '---'}
              </span>
              
              {/* Mini Sparkline Chart */}
              <div className="metric-sparkline">
                {sparklineData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="val"
                        stroke={status === 'optimal' ? 'var(--db-green)' : status === 'warning' ? '#f59e0b' : '#ef4444'}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="metric-footer">
              <span className={`metric-trend ${isTrendUp ? 'trend-up' : 'trend-down'}`}>
                {isTrendUp ? '↗ Upward' : '↘ Downward'}
              </span>
              <span className="db-text-muted" style={{ fontSize: '0.7rem' }}>
                {comparisonText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopMetrics;
