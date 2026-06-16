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
  const { subView, setSubView, activeView, setActiveView } = useCrop();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'crops', label: 'Crops Manager', icon: Sprout },
    { id: 'controls', label: 'Actuator Controls', icon: Sliders },
    { id: 'logs', label: 'System Logs', icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Brand Logo */}
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveView('landing')}>
          <div className="sidebar-logo-icon">
            <Sprout size={24} />
          </div>
          <span>Cultivo</span>
        </div>

        {/* Workspace Dropdown */}
        <div className="workspace-selector">
          <div className="workspace-info">
            <span className="workspace-label">Team Workspace</span>
            <span className="workspace-name">Main Greenhouse</span>
          </div>
          <ChevronDown size={16} className="workspace-chevron" style={{ color: 'var(--sb-text-muted)' }} />
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <Search size={14} className="search-icon" />
          <input type="text" placeholder="Search sensors..." disabled />
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
        <button className="settings-btn" onClick={() => alert('Settings module coming soon!')}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="operator-profile">
          <div className="operator-avatar">
            <img src={userAvatarImg} alt="Operator Avatar" />
          </div>
          <div className="operator-details">
            <span className="operator-name">Alex Williamson</span>
            <span className="operator-role">Greenhouse Operator</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
