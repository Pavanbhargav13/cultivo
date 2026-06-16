// frontend/src/context/CropContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CropContext = createContext();

export const CropProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('landing'); // 'landing' or 'dashboard'
  const [subView, setSubView] = useState('dashboard'); // 'dashboard', 'analytics', 'crops', 'controls', 'logs'
  const [selectedCrop, setSelectedCrop] = useState('');
  const [logDays, setLogDays] = useState(30);
  const [cropsData, setCropsData] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  
  // Sync active crop context with backend API
  useEffect(() => {
    if (selectedCrop) {
      fetch(`http://localhost:8000/crops/${selectedCrop}/active`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => console.log("Synced active crop with backend:", data))
        .catch((err) => console.error("Error syncing active crop:", err));
    }
  }, [selectedCrop]);
  
  // Fetch crops metadata on load
  useEffect(() => {
    fetch('http://localhost:8000/crops')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(async (names) => {
        const fullCrops = await Promise.all(
          names.map((name) =>
            fetch(`http://localhost:8000/crops/${name}`).then((r) => r.json())
          )
        );
        setCropsData(fullCrops);
        if (fullCrops.length > 0) {
          setSelectedCrop(fullCrops[0].name); // select first crop by default
        }
      })
      .catch((err) => {
        console.error("Failed to load crops, using fallback local mock.", err);
        // Fallback mock data in case backend is offline
        const mockCrops = [
          {
            name: "Tomato",
            category: "vegetable",
            ranges: {
              temperature: { min: 22, max: 27 },
              humidity: { min: 60, max: 80 },
              light: { min: 500, max: 1200 },
              co2: { min: 400, max: 800 },
              nutrition: { min: 12, max: 18 }
            }
          },
          {
            name: "Lettuce",
            category: "vegetable",
            ranges: {
              temperature: { min: 15, max: 20 },
              humidity: { min: 70, max: 85 },
              light: { min: 300, max: 800 },
              co2: { min: 350, max: 700 },
              nutrition: { min: 10, max: 15 }
            }
          },
          {
            name: "Strawberry",
            category: "fruit",
            ranges: {
              temperature: { min: 18, max: 22 },
              humidity: { min: 65, max: 80 },
              light: { min: 400, max: 900 },
              co2: { min: 350, max: 750 },
              nutrition: { min: 11, max: 16 }
            }
          },
          {
            name: "DragonFruit",
            category: "fruit",
            ranges: {
              temperature: { min: 24, max: 30 },
              humidity: { min: 55, max: 70 },
              light: { min: 700, max: 1500 },
              co2: { min: 400, max: 900 },
              nutrition: { min: 13, max: 19 }
            }
          },
          {
            name: "Mushroom",
            category: "fungi",
            ranges: {
              temperature: { min: 16, max: 22 },
              humidity: { min: 85, max: 95 },
              light: { min: 0, max: 200 },
              co2: { min: 500, max: 1200 },
              nutrition: { min: 8, max: 12 }
            }
          }
        ];
        setCropsData(mockCrops);
        setSelectedCrop(mockCrops[0].name);
      });
  }, []);

  // Fetch initial logs and then simulate a live stream of sensor values
  useEffect(() => {
    const fetchInitialLogs = () => {
      fetch(`http://localhost:8000/logs/actuators?days=${logDays}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setLiveLogs(data.reverse());
          } else {
            generateDummyInitialLogs();
          }
        })
        .catch(() => {
          generateDummyInitialLogs();
        });
    };

    const generateDummyInitialLogs = () => {
      // Create some initial dummy history points spanning the last 24 hours
      const dummy = [];
      const now = new Date();
      const sensors = ['temperature', 'humidity', 'co2', 'soil_moisture'];
      
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 1000 * 30);
        sensors.forEach((sensor) => {
          const val = getRandomValueForSensor(sensor);
          dummy.push({
            id: `init-${i}-${sensor}`,
            timestamp: time.toISOString(),
            action: getMockAction(sensor, val),
            sensor_type: sensor,
            predicted_value: val,
            actual_value: val - 0.5,
            power_consumption: Math.random() > 0.5 ? 20 + Math.random()*20 : 0,
            cause: val > 27 ? "Threshold exceeded" : "Routine reading",
            crop_name: selectedCrop || "Tomato"
          });
        });
      }
      setLiveLogs(dummy);
    };

    fetchInitialLogs();
  }, [logDays, selectedCrop]);

  // Periodic live updates (simulation of telemetry data coming from the greenhouse sensor grid)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const sensors = ['temperature', 'humidity', 'co2', 'soil_moisture'];
      
      const newReadings = sensors.map((sensor) => {
        const val = getRandomValueForSensor(sensor);
        return {
          id: `live-${Date.now()}-${sensor}`,
          timestamp: now.toISOString(),
          action: getMockAction(sensor, val),
          sensor_type: sensor,
          predicted_value: val,
          actual_value: val - 0.2,
          power_consumption: Math.random() > 0.7 ? 15 + Math.random()*30 : 0,
          cause: "Live telemetry",
          crop_name: selectedCrop || "Tomato"
        };
      });

      setLiveLogs((prev) => {
        const combined = [...prev, ...newReadings];
        // Limit history to 150 points for performance
        if (combined.length > 150) {
          return combined.slice(combined.length - 150);
        }
        return combined;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedCrop]);

  const getRandomValueForSensor = (type) => {
    const currentCropObj = cropsData.find(c => c.name === selectedCrop);
    const ranges = currentCropObj?.ranges || {
      temperature: { min: 20, max: 28 },
      humidity: { min: 60, max: 80 },
      co2: { min: 400, max: 800 },
      soil_moisture: { min: 30, max: 70 }
    };

    const target = ranges[type === 'soil_moisture' ? 'nutrition' : type] || { min: 10, max: 50 };
    const buffer = (target.max - target.min) * 0.25;
    // Occasionally trigger anomalies / out of range readings
    const isAnomaly = Math.random() > 0.85;
    if (isAnomaly) {
      return Math.random() > 0.5 ? target.max + buffer * 1.5 : target.min - buffer * 1.5;
    }
    return target.min + Math.random() * (target.max - target.min);
  };

  const getMockAction = (sensor, val) => {
    const currentCropObj = cropsData.find(c => c.name === selectedCrop);
    const max = currentCropObj?.ranges?.[sensor === 'soil_moisture' ? 'nutrition' : sensor]?.max || 100;
    
    if (val > max) {
      if (sensor === 'temperature') return 'fan_on';
      if (sensor === 'humidity') return 'vent_open';
      if (sensor === 'soil_moisture') return 'irrigate';
      if (sensor === 'co2') return 'vent_open';
    }
    return 'none';
  };

  return (
    <CropContext.Provider value={{
      activeView,
      setActiveView,
      subView,
      setSubView,
      selectedCrop,
      setSelectedCrop,
      logDays,
      setLogDays,
      cropsData,
      liveLogs,
      setLiveLogs
    }}>
      {children}
    </CropContext.Provider>
  );
};

export const useCrop = () => useContext(CropContext);
