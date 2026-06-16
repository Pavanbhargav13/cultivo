// frontend/src/components/Sidebar.jsx
import React from 'react';
import { useCrop } from '../context/CropContext.jsx';
import {
  LayoutDashboard,
  BarChart3,
  Sprout,
  Sliders,
  Database,
  Settings,
  Search,
  ChevronDown
} from 'lucide-react';
import userAvatarImg from '../assets/user_avatar.png';

const Sidebar = () => {
  const { subView, setSubView, activeView, setActiveView, operator, t } = useCrop();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'crops', label: t('crops_manager'), icon: Sprout },
    { id: 'controls', label: t('actuator_controls'), icon: Sliders },
    { id: 'logs', label: t('system_logs'), icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Brand Logo */}
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveView('landing')}>
          <div className="sidebar-logo-icon">
            <Sprout size={30} />
          </div>
          <span>Cultivo</span>
        </div>

        {/* Workspace Dropdown */}
        <div className="workspace-selector">
          <div className="workspace-info">
            <span className="workspace-label">{t('team_workspace')}</span>
            <span className="workspace-name">{t('main_greenhouse')}</span>
          </div>
          <ChevronDown size={16} className="workspace-chevron" style={{ color: 'var(--sb-text-muted)' }} />
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <Search size={14} className="search-icon" />
          <input type="text" placeholder={t('search_placeholder')} disabled />
          <span className="search-hotkey">⌘F</span>
        </div>

        {/* Menu Items */}
        <nav>
          <ul className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = subView === item.id;
              return (
                <li key={item.id}>
                  <button
                     className={`sidebar-item-btn ${isActive ? 'active' : ''}`}
                     onClick={() => setSubView(item.id)}
                  >
                    <div className="sidebar-item-link-left">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'logs' && <span className="badge-count">1</span>}
                    {item.id === 'controls' && <span className="badge-new">New</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-bottom">
        <button 
          className={`settings-btn ${subView === 'settings' ? 'active-settings' : ''}`} 
          onClick={() => setSubView('settings')}
          style={{ color: subView === 'settings' ? 'var(--sb-accent)' : 'inherit', fontWeight: subView === 'settings' ? '600' : 'normal' }}
        >
          <Settings size={18} />
          <span>{t('settings')}</span>
        </button>

        <div className="operator-profile">
          <div className="operator-avatar">
            <img src={userAvatarImg} alt="Operator Avatar" />
          </div>
          <div className="operator-details">
            <span className="operator-name">{operator.name}</span>
            <span className="operator-role">
              {operator.role === 'Greenhouse Operator' ? t('greenhouse_operator') : operator.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
