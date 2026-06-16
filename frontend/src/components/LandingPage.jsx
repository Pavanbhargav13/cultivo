// frontend/src/components/LandingPage.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { Sprout, ArrowRight, Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import greenhouseMonitoringImg from '../assets/greenhouse_monitoring.png';
import techIrrigationImg from '../assets/tech_irrigation.png';
import organicFertilizerImg from '../assets/organic_fertilizer.png';
import heroAgricultureImg from '../assets/hero_agriculture.png';

const LandingPage = () => {
  const { setActiveView } = useCrop();

  const features = [
    {
      title: 'Precision Irrigation',
      desc: 'Smart moisture tracking triggers automated drip networks to match crop ranges exactly.',
      img: techIrrigationImg,
    },
    {
      title: 'Climate Optimization',
      desc: 'Ventilation, shading, and heating adapt dynamically to solar indexes and temperature trends.',
      img: heroAgricultureImg,
    },
    {
      title: 'Optimal Nutrition',
      desc: 'NPK and moisture levels are continuously analyzed to feed root zones with zero nutrient waste.',
      img: organicFertilizerImg,
    },
  ];

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <a href="#home" className="logo-brand">
          <span className="logo-icon"><Sprout size={22} /></span>
          <span>Cultivo</span>
        </a>
        <nav>
          <ul className="landing-nav">
            <li><a href="#home">Home</a></li>
            <li><a href="#about" onClick={() => alert('About Us module coming soon!')}>About Us</a></li>
            <li><a href="#reviews" onClick={() => alert('Client reviews coming soon!')}>Reviews</a></li>
            <li><a href="#products" onClick={() => alert('Product specs coming soon!')}>Products</a></li>
          </ul>
        </nav>
        <div className="landing-actions">
          <a href="#signin" className="btn-text" onClick={() => setActiveView('dashboard')}>Sign In</a>
          <button className="btn-primary" onClick={() => setActiveView('dashboard')}>
            Launch Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" id="home">
        <div className="hero-content">
          <span className="badge-tag">Top-Notch Automation Platform</span>
          <h1 className="hero-title">Bring Fresh Growth To Agriculture.</h1>
          <p className="hero-subtitle">
            Experience the ultimate cultivation journey with real-time telemetry tracking, machine learning forecasts, and precision micro-climates tailored to your crops.
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-green" onClick={() => setActiveView('dashboard')}>
              Get Started Now <ArrowRight size={16} />
            </button>
            <button className="btn-primary" style={{ background: 'transparent', color: 'var(--text-dark)', border: '1px solid #e7e5e4' }} onClick={() => setActiveView('dashboard')}>
              Explore Features
            </button>
          </div>
        </div>
        
        <div className="hero-image-container">
          <img src={greenhouseMonitoringImg} alt="Greenhouse Telemetry Monitoring" className="hero-image" />
        </div>
      </section>

      {/* Stats Block */}
      <section className="landing-stats">
        <div className="stat-item">
          <span className="stat-number">50+</span>
          <span className="stat-label">Years of Combined Agriculture Experience</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">200+</span>
          <span className="stat-label">Smart Greenhouse Installations</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">120,000+</span>
          <span className="stat-label">Managed Crop Profiles Worldwide</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">$15 Billion</span>
          <span className="stat-label">Saved in Water & Fertilizer Waste</span>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div style={{ maxWidth: '550px' }}>
            <h2 className="section-title">Next-Gen Solutions For Commercial Growing</h2>
            <p className="db-text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
              We provide cutting-edge automation tools to maximize crop yields, optimize resource consumption, and prevent anomalies before they happen.
            </p>
          </div>
        </div>
        
        <div className="features-grid">
          {features.map((feat, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-img-wrapper">
                <img src={feat.img} alt={feat.title} className="feature-img" />
              </div>
              <div className="feature-body">
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaborations Banner */}
      <section className="collab-banner">
        <h2 className="collab-title">Collaborate And Learn From Industry Experts And Enthusiasts</h2>
        <p className="collab-subtitle">
          Join a global network of smart farmers sharing optimization thresholds and sustainable techniques.
        </p>
        <button className="collab-cta" onClick={() => setActiveView('dashboard')}>
          Connect With Community
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <a href="#home" className="logo-brand">
            <span className="logo-icon"><Sprout size={22} /></span>
            <span>Cultivo</span>
          </a>
          <ul className="footer-links">
            <li><a href="#privacy" onClick={() => alert('Privacy Policy coming soon')}>Privacy Policy</a></li>
            <li><a href="#terms" onClick={() => alert('Terms of Service coming soon')}>Terms of Service</a></li>
            <li><a href="#support" onClick={() => alert('Support portal coming soon')}>Support Center</a></li>
          </ul>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Cultivo Inc. All rights reserved.</span>
          <span>Designed with premium precision in 2026.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
