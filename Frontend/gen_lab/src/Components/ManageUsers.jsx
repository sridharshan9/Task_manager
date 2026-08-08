import React, { useEffect, useState } from 'react';
import { fetchUsers } from '../api';
import { useAuth } from '../AuthContext';

const ROLES = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  employee: 'Employee',
};

function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (user?.role !== 'super_admin') {
    return <div className="empty-state">Access denied. Super admins only.</div>;
  }

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <span>👥</span> Manage Users ({users.length})
      </h3>

      {loading ? (
        <div className="empty-state">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">No registered users yet.</div>
      ) : (
        <div className="task-table">
          <div className="task-table-row task-table-head">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {users.map((u) => (
            <div key={u.id} className="task-table-row">
              <span className="task-title-cell">{u.full_name || '—'}</span>
              <span>{u.email}</span>
              <span>
                <span className={`status-pill ${u.role}`}>{ROLES[u.role] || u.role}</span>
              </span>
              <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
