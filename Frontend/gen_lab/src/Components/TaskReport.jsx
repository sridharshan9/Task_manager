import React from 'react';

function TaskReport({ tasks = [], stats = null }) {
  const statusCount = (s) => tasks.filter((t) => t.status === s).length;
  const priorityCount = (p) => tasks.filter((t) => t.priority === p).length;

  const total = tasks.length;
  const pending = statusCount('pending');
  const inProgress = statusCount('in_progress');
  const completed = statusCount('completed');

  const bar = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));

  return (
    <div className="report-grid">
      <div className="form-card">
        <h3 className="form-card-title"><span>📊</span> Task Breakdown</h3>
        <div className="report-bars">
          <ReportBar label="Pending" count={pending} pct={bar(pending)} color="var(--amber)" />
          <ReportBar label="In Progress" count={inProgress} pct={bar(inProgress)} color="var(--primary)" />
          <ReportBar label="Completed" count={completed} pct={bar(completed)} color="var(--emerald)" />
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title"><span>🏷️</span> Priority Distribution</h3>
        <div className="priority-grid">
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <div key={p} className={`priority-stat ${p}`}>
              <span className="priority-stat-label">{p}</span>
              <span className="priority-stat-value">{priorityCount(p)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-card report-overview-card">
        <h3 className="form-card-title"><span>🎯</span> Summary</h3>
        <div className="report-summary">
          <div className="report-summary-row">
            <span>Total tasks</span><b>{total}</b>
          </div>
          <div className="report-summary-row">
            <span>Completion rate</span><b>{stats?.completionPercent ?? 0}%</b>
          </div>
          <div className="report-summary-row">
            <span>Urgent + high</span><b>{stats?.urgent ?? 0}</b>
          </div>
          <div className="report-summary-row">
            <span>Overdue</span><b>{stats?.overdue ?? 0}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportBar({ label, count, pct, color }) {
  return (
    <div className="report-bar-row">
      <div className="report-bar-meta">
        <span>{label}</span>
        <b>{count}</b>
      </div>
      <div className="report-bar-track">
        <div className="report-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="report-bar-pct">{pct}%</span>
    </div>
  );
}

export default TaskReport;
