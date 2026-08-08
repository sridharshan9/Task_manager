import React from 'react';

const Icon = ({ path, size = 20, strokeWidth = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
);

const HomeIcon = () => (
  <Icon path={<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>} />
);
const ClipboardIcon = () => (
  <Icon path={<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M9 12h6M9 16h6" /></>} />
);
const ActivityIcon = () => (
  <Icon path={<><path d="M3 12h4l3-8 4 16 3-8h4" /></>} />
);
const CheckIcon = () => (
  <Icon path={<><path d="M20 6 9 17l-5-5" /></>} />
);
const PlusIcon = () => (
  <Icon path={<><path d="M12 5v14M5 12h14" /></>} />
);
const ChartIcon = () => (
  <Icon path={<><path d="M3 21h18" /><rect x="4" y="13" width="4" height="8" /><rect x="10" y="8" width="4" height="13" /><rect x="16" y="3" width="4" height="18" /></>} />
);
const UsersIcon = () => (
  <Icon path={<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.5a5 5 0 0 1 6 4" /></>} />
);
const MessageIcon = () => (
  <Icon path={<><path d="M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.4-.7L3 21l1.9-5.6A8.38 8.38 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" /></>} />
);
const ProfileIcon = () => (
  <Icon path={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />
);
const LogoutIcon = () => (
  <Icon path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>} />
);
const CloseIcon = () => (
  <Icon path={<><path d="M18 6 6 18M6 6l12 12" /></>} />
);

const ROLES = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  employee: 'Employee',
};

function Navbar({ user, activeTab, onTabChange, onLogout, isMobile, sidebarOpen, onCloseSidebar }) {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: HomeIcon },
    { key: 'pending', label: 'Pending Tasks', icon: ClipboardIcon },
    { key: 'inprogress', label: 'In Progress', icon: ActivityIcon },
    { key: 'completed', label: 'Completed Tasks', icon: CheckIcon },
    { key: 'addnewtask', label: 'Add New Task', icon: PlusIcon },
    { key: 'taskreport', label: 'Task Report & Statistics', icon: ChartIcon },
  ];

  const extraTabs =
    user?.role === 'super_admin'
      ? [{ key: 'users', label: 'Manage Users', icon: UsersIcon }]
      : [];

  return (
    <>
      {isMobile && sidebarOpen && <div className="sidebar-overlay" onClick={onCloseSidebar} />}
      <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            <span className="sidebar-logo">GT</span>
            <span className="sidebar-brand">GenLab Tasks</span>
            {isMobile && (
              <button className="sidebar-close-btn" onClick={onCloseSidebar}>
                <CloseIcon />
              </button>
            )}
          </div>
          <div className="sidebar-role-badge-row">
            <span className={`sidebar-role-badge ${user?.role || 'manager'}`}>
              {ROLES[user?.role] || 'Manager'}
            </span>
          </div>
        </div>

        <nav className="sidebar-menu">
          {tabs.map((tab) => (
            <li key={tab.key} className="sidebar-item">
              <button
                className={`sidebar-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  onTabChange(tab.key);
                  onCloseSidebar();
                }}
              >
                <tab.icon /> <span>{tab.label}</span>
              </button>
            </li>
          ))}

          {extraTabs.map((tab) => (
            <li key={tab.key} className="sidebar-item">
              <button
                className={`sidebar-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  onTabChange(tab.key);
                  onCloseSidebar();
                }}
              >
                <tab.icon /> <span>{tab.label}</span>
              </button>
            </li>
          ))}

          <li className="sidebar-item">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Support</div>
              <button
                className={`sidebar-btn ${activeTab === 'chats' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('chats');
                  onCloseSidebar();
                }}
              >
                <MessageIcon /> <span>Team Chat</span>
              </button>
              <button
                className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('profile');
                  onCloseSidebar();
                }}
              >
                <ProfileIcon /> <span>Profile</span>
              </button>
            </div>
          </li>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogoutIcon /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
