// frontend/src/components/CropSelector.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { Sprout } from 'lucide-react';

const CropSelector = () => {
  const { selectedCrop, setSelectedCrop, cropsData } = useCrop();

  const getCatClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'vegetable': return 'cat-vegetable';
      case 'fruit': return 'cat-fruit';
      case 'fungi': return 'cat-fungi';
      default: return 'cat-vegetable';
    }
  };

  const getSensorLabel = (key) => {
    if (key === 'co2') return 'CO₂ Level';
    if (key === 'nutrition') return 'Soil Moisture';
    return key;
  };

  const getSensorUnit = (key) => {
    if (key === 'temperature') return '°C';
    if (key === 'humidity' || key === 'nutrition') return '%';
    if (key === 'co2') return ' ppm';
    if (key === 'light') return ' lx';
    return '';
  };

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">Crops Threshold Manager</h1>
        </div>
      </header>

      {/* Content */}
      <div className="db-content">
        <div className="db-widget">
          <div className="widget-header">
            <div>
              <h3 className="widget-title"><Sprout size={18} style={{ color: 'var(--db-green)' }} /> Cultivo Crop Profiles</h3>
              <span className="widget-subtitle">Select a crop to establish target thresholds across all automation loops.</span>
            </div>
          </div>

          <div className="crops-card-grid" style={{ marginTop: '1rem' }}>
            {cropsData.map((crop) => {
              const isActive = selectedCrop === crop.name;
              return (
                <div
                  className={`crop-detail-card ${isActive ? 'active' : ''}`}
                  key={crop.name}
                  onClick={() => setSelectedCrop(crop.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="crop-card-header">
                    <span className="crop-name-title">{crop.name}</span>
                    <span className={`crop-cat-badge ${getCatClass(crop.category)}`}>
                      {crop.category || 'vegetable'}
                    </span>
                  </div>

                  <div className="ranges-list">
                    {Object.entries(crop.ranges).map(([sensorKey, bounds]) => (
                      <div className="range-item" key={sensorKey}>
                        <span className="range-label">{getSensorLabel(sensorKey)}</span>
                        <span className="range-val">
                          {bounds.min} - {bounds.max}
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', opacity: 0.7 }}>
                            {getSensorUnit(sensorKey)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-submit"
                    style={{
                      padding: '0.4rem',
                      fontSize: '0.8rem',
                      background: isActive ? 'var(--db-green)' : 'var(--text-dark)',
                      color: isActive ? '#000' : '#fff',
                      marginTop: '0.5rem',
                    }}
                  >
                    {isActive ? '✓ Active Threshold' : 'Apply Crop Limits'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropSelector;
