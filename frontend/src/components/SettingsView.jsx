// frontend/src/components/SettingsView.jsx
import React, { useState } from 'react';
import { useCrop } from '../context/CropContext.jsx';
import { User, Mail, Phone, MapPin, Bell, ShieldCheck, CheckCircle2, Globe } from 'lucide-react';
import userAvatarImg from '../assets/user_avatar.png';

const SettingsView = () => {
  const { operator, setOperator, t } = useCrop();
  const [formData, setFormData] = useState({ ...operator });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOperator(formData);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 4000);
  };

  return (
    <div className="main-panel">
      {/* Topbar */}
      <header className="db-topbar">
        <div className="db-title-section">
          <h1 className="db-title">{t('profile_preferences')}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="db-content">
        <div className="settings-grid">
          {/* Left: Profile Summary Card */}
          <div className="db-widget profile-card-widget">
            <div className="profile-summary">
              <div className="profile-avatar-wrapper">
                <img src={userAvatarImg} alt="Operator Avatar" className="profile-large-avatar" />
              </div>
              <h2 className="profile-name">{operator.name}</h2>
              <span className="profile-role-badge">{operator.role}</span>
            </div>

            <div className="profile-info-list">
              <div className="info-list-item">
                <Mail size={16} />
                <span>{operator.email}</span>
              </div>
              <div className="info-list-item">
                <Phone size={16} />
                <span>{operator.phone}</span>
              </div>
              <div className="info-list-item">
                <MapPin size={16} />
                <span>{operator.timezone}</span>
              </div>
              <div className="info-list-item">
                <Globe size={16} />
                <span>{operator.language}</span>
              </div>
            </div>

            <div className="profile-status-box">
              <ShieldCheck size={20} style={{ color: 'var(--db-green)' }} />
              <div>
                <strong>{t('active_operator')}</strong>
                <p>{t('authorized_permission')}</p>
              </div>
            </div>
          </div>

          {/* Right: Settings Form */}
          <div className="db-widget settings-form-widget">
            <div className="widget-header">
              <div>
                <h3 className="widget-title">{t('edit_personal_details')}</h3>
                <span className="widget-subtitle">Changes will update the system workspace identity and alert dispatch routes.</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
              {success && (
                <div className="success-banner">
                  <CheckCircle2 size={16} />
                  <span>{t('profile_updated_success')}</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name"><User size={14} /> {t('operator_name')}</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">{t('terminal_role')}</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email"><Mail size={14} /> {t('email_address')}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone"><Phone size={14} /> {t('mobile_number')}</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timezone"><MapPin size={14} /> {t('timezone_context')}</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                  >
                    <option value="IST (UTC+5:30)">India Standard Time (IST - UTC+5:30)</option>
                    <option value="GMT (UTC+0:00)">Greenwich Mean Time (GMT - UTC+0:00)</option>
                    <option value="EST (UTC-5:00)">Eastern Standard Time (EST - UTC-5:00)</option>
                    <option value="PST (UTC-8:00)">Pacific Standard Time (PST - UTC-8:00)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="language"><Globe size={14} /> {t('preferred_language')}</label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option value="English">English</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                  </select>
                </div>
              </div>

              <div className="form-group notification-toggle-group">
                <div className="toggle-label-desc">
                  <label htmlFor="notifications" className="toggle-main-label">
                    <Bell size={16} /> {t('webhook_alarm_dispatch')}
                  </label>
                  <span className="toggle-sub-label">Route critical temperature and emergency warnings to cloud notification endpoints.</span>
                </div>
                <div className="switch-wrapper">
                  <input
                    type="checkbox"
                    id="notifications"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleChange}
                    className="toggle-switch-checkbox"
                  />
                  <label htmlFor="notifications" className="toggle-switch-slider"></label>
                </div>
              </div>

              <button type="submit" className="btn-submit save-settings-btn">
                {t('save_apply_settings')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
