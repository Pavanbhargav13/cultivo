// frontend/src/components/LandingPage.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { Sprout, ArrowRight } from 'lucide-react';
import greenhouseMonitoringImg from '../assets/greenhouse_monitoring.png';
import techIrrigationImg from '../assets/tech_irrigation.png';
import organicFertilizerImg from '../assets/organic_fertilizer.png';
import heroAgricultureImg from '../assets/hero_agriculture.png';

const LandingPage = () => {
  const { setActiveView, t } = useCrop();

  const features = [
    {
      title: t('feat_irrigation_title'),
      desc: t('feat_irrigation_desc'),
      img: techIrrigationImg,
    },
    {
      title: t('feat_climate_title'),
      desc: t('feat_climate_desc'),
      img: heroAgricultureImg,
    },
    {
      title: t('feat_nutrition_title'),
      desc: t('feat_nutrition_desc'),
      img: organicFertilizerImg,
    },
  ];

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <a href="#home" className="logo-brand">
          <span className="logo-icon"><Sprout size={32} /></span>
          <span>Cultivo</span>
        </a>
        <nav>
          <ul className="landing-nav">
            <li><a href="#home">{t('home')}</a></li>
            <li><a href="#about">{t('about_us')}</a></li>
            <li><a href="#reviews">{t('reviews')}</a></li>
            <li><a href="#products" onClick={() => alert('Product specs coming soon!')}>{t('products')}</a></li>
          </ul>
        </nav>
        <div className="landing-actions">
          <a href="#signin" className="btn-text" onClick={() => setActiveView('dashboard')}>{t('sign_in')}</a>
          <button className="btn-primary" onClick={() => setActiveView('dashboard')}>
            {t('launch_dashboard')} <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" id="home">
        <div className="hero-content">
          <span className="badge-tag">{t('hero_tag')}</span>
          <h1 className="hero-title">{t('hero_title')}</h1>
          <p className="hero-subtitle">
            {t('hero_subtitle')}
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-green" onClick={() => setActiveView('dashboard')}>
              {t('get_started_now')} <ArrowRight size={16} />
            </button>
            <button className="btn-primary" style={{ background: 'transparent', color: 'var(--text-dark)', border: '1px solid #e7e5e4' }} onClick={() => setActiveView('dashboard')}>
              {t('explore_features')}
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
          <span className="stat-label">{t('stat_exp')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">200+</span>
          <span className="stat-label">{t('stat_installs')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">120,000+</span>
          <span className="stat-label">{t('stat_profiles')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">$15 Billion</span>
          <span className="stat-label">{t('stat_saved')}</span>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div style={{ maxWidth: '550px' }}>
            <h2 className="section-title">{t('features_title')}</h2>
            <p className="db-text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
              {t('features_subtitle')}
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

      {/* About Us Section */}
      <section className="about-section" id="about">
        <div className="section-header">
          <div>
            <span className="badge-tag">{t('about_mission')}</span>
            <h2 className="section-title">{t('about_title')}</h2>
          </div>
        </div>
        <div className="about-grid">
          <div className="about-card">
            <h3 className="about-subtitle">{t('about_story_title')}</h3>
            <p className="about-text">
              {t('about_story_p1')}
            </p>
            <p className="about-text">
              {t('about_story_p2')}
            </p>
          </div>
          <div className="about-card highlight">
            <h3 className="about-subtitle">{t('about_pillars_title')}</h3>
            <ul className="about-list">
              <li>
                <strong>{t('pillar1_title')}</strong>
                <span>{t('pillar1_desc')}</span>
              </li>
              <li>
                <strong>{t('pillar2_title')}</strong>
                <span>{t('pillar2_desc')}</span>
              </li>
              <li>
                <strong>{t('pillar3_title')}</strong>
                <span>{t('pillar3_desc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials / Client Reviews Section */}
      <section className="testimonials-section" id="reviews">
        <div className="testimonial-header">
          <span className="testimonial-tag">{t('reviews_testimonial')}</span>
          <h2 className="testimonial-title">{t('reviews_title')}</h2>
        </div>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="testimonial-quote">
              {t('review1_quote')}
            </p>
            <div className="testimonial-meta">
              <span className="testimonial-author">Ramesh Gowda</span>
              <span className="testimonial-location">Bengaluru, Karnataka, India</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="testimonial-quote">
              {t('review2_quote')}
            </p>
            <div className="testimonial-meta">
              <span className="testimonial-author">Sunitha Patil</span>
              <span className="testimonial-location">Hubli, Karnataka, India</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="testimonial-quote">
              {t('review3_quote')}
            </p>
            <div className="testimonial-meta">
              <span className="testimonial-author">Rajesh Hegde</span>
              <span className="testimonial-location">Shimoga, Karnataka, India</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote-icon">“</div>
            <p className="testimonial-quote">
              {t('review4_quote')}
            </p>
            <div className="testimonial-meta">
              <span className="testimonial-author">Devika Rao</span>
              <span className="testimonial-location">Chikmagalur, Karnataka, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collaborations Banner */}
      <section className="collab-banner">
        <h2 className="collab-title">{t('collab_title')}</h2>
        <p className="collab-subtitle">
          {t('collab_subtitle')}
        </p>
        <button className="collab-cta" onClick={() => setActiveView('dashboard')}>
          {t('connect_community')}
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <a href="#home" className="logo-brand">
            <span className="logo-icon"><Sprout size={32} /></span>
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
