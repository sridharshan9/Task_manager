import React from 'react';

const ROLES = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  employee: 'Employee',
};

function ProfilePanel({ user, onLogout }) {
  if (!user) return <div className="empty-state">No user data available.</div>;

  const initials = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="profile-layout">
      <div className="profile-card">
        <div className="profile-avatar-large">{initials}</div>
        <h3>{user.full_name || 'GenLab User'}</h3>
        <span className={`sidebar-role-badge ${user.role}`}>{ROLES[user.role] || user.role}</span>
        <p className="profile-email">{user.email}</p>
        <button className="btn-secondary logout-btn-inline" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="form-card">
        <h3 className="form-card-title"><span>ℹ️</span> Account Details</h3>
        <div className="profile-details">
          <div className="profile-detail-row">
            <span>Full Name</span><b>{user.full_name || '—'}</b>
          </div>
          <div className="profile-detail-row">
            <span>Email</span><b>{user.email}</b>
          </div>
          <div className="profile-detail-row">
            <span>Role</span><b>{ROLES[user.role] || user.role}</b>
          </div>
          <div className="profile-detail-row">
            <span>User ID</span><b>#{user.id}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePanel;
