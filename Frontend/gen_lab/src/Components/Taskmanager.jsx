import React from 'react';

const PendingIcon = () => <span className="w-emoji">📋</span>;
const UrgentIcon = () => <span className="w-emoji">🔥</span>;
const CompletedIcon = () => <span className="w-emoji">✅</span>;
const ClockIcon = () => <span className="w-emoji">⏰</span>;

function Taskmanager({
  user,
  tasks = [],
  stats = null,
  loading = false,
  taskProgressPercent = 0,
  totalTasksAssigned = 0,
  completedTasksCount = 0,
  pendingTasksCount = 0,
  urgentTasksCount = 0,
  overdueTasksCount = 0,
  pendingTasksList = [],
  highPriorityTasksList = [],
  onStartTask,
  onCompleteTask,
  onDeleteTask,
}) {
  const canManage = ['manager', 'super_admin'].includes(user?.role);
  if (!canManage) {
    return <div className="empty-state">Access denied. Only managers can view this interface.</div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const createdToday = tasks.filter((t) => (t.created_at || '').slice(0, 10) === today).length;
  const resolvedToday = tasks.filter(
    (t) => t.status === 'completed' && (t.completed_at || '').slice(0, 10) === today
  ).length;

  return (
    <div className="manager-dashboard">
      <div className="widgets-grid">
        <div className="widget-card">
          <div className="widget-title-area">
            <span>Daily Tasks Done</span>
            <div className="widget-icon-box purple">
              <CompletedIcon />
            </div>
          </div>
          <div className="calorie-balance-widget">
            <div className="progress-ring-container">
              <div className="progress-ring-text">
                <span className="progress-ring-percentage">{taskProgressPercent}%</span>
                <span className="progress-ring-label">Done</span>
              </div>
              <svg className="progress-ring-svg" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
                <circle className="progress-ring-circle-bg" cx="50" cy="50" r="42" />
                <circle
                  className="progress-ring-circle-fg"
                  cx="50"
                  cy="50"
                  r="42"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 42}`,
                    strokeDashoffset: `${2 * Math.PI * 42 * (1 - (taskProgressPercent || 0) / 100)}`,
                  }}
                />
              </svg>
            </div>
            <div>
              <div className="widget-body">
                <span className="widget-value">{completedTasksCount}</span>
                <span className="widget-unit">/ {totalTasksAssigned} tasks</span>
              </div>
              <p className="widget-subtext">
                Pending today:{' '}
                <b className={pendingTasksCount > 0 ? 'text-rose' : 'text-emerald'}>
                  {pendingTasksCount} remaining
                </b>
              </p>
            </div>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-title-area">
            <span>Urgent Issues</span>
            <div className="widget-icon-box cyan">
              <UrgentIcon />
            </div>
          </div>
          <div className="widget-body">
            <span className="widget-value">{urgentTasksCount}</span>
            <span className="widget-unit">high priority</span>
          </div>
          <p className="widget-subtext">Tasks flagged with critical or high urgency levels</p>
        </div>

        <div className="widget-card">
          <div className="widget-title-area">
            <span>Overdue Tasks</span>
            <div className="widget-icon-box green">
              <ClockIcon />
            </div>
          </div>
          <div className="widget-body">
            <span className="widget-value">{overdueTasksCount}</span>
            <span className="widget-unit">past due date</span>
          </div>
          <p className="widget-subtext">Items that missed their scheduled completion timelines</p>
        </div>

        <div className="widget-card">
          <div className="widget-title-area">
            <span>Active Tasks</span>
            <div className="widget-icon-box pink">
              <PendingIcon />
            </div>
          </div>
          <div className="widget-body">
            <span className="widget-value">{stats?.inProgress ?? tasks.filter((t) => t.status === 'in_progress').length}</span>
            <span className="widget-unit">in progress now</span>
          </div>
          <p className="widget-subtext">Keep track of the overall team workflow pipeline</p>
        </div>
      </div>

      <div className="dashboard-details-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-title">Today's Activity</span>
            <div className="chart-legends">
              <div className="legend-item">
                <div className="legend-dot consumed" style={{ backgroundColor: 'var(--primary)' }}></div> Created ({createdToday})
              </div>
              <div className="legend-item">
                <div className="legend-dot burned" style={{ backgroundColor: 'var(--secondary)' }}></div> Resolved ({resolvedToday})
              </div>
            </div>
          </div>
          <WeeklyChart tasks={tasks} />
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-card-title">Priority Action Items</span>
          </div>
          <div className="info-summary-list">
            {highPriorityTasksList.slice(0, 3).map((task) => (
              <div key={`urgent-${task.id}`} className="info-summary-item">
                <div className="info-summary-details">
                  <span className="info-summary-name">{task.title}</span>
                  <span className="info-summary-meta">Priority: {task.priority} &bull; {task.status}</span>
                </div>
                <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
              </div>
            ))}

            {pendingTasksList.slice(0, 3).map((task) => (
              <div key={`pending-${task.id}`} className="info-summary-item">
                <div className="info-summary-details">
                  <span className="info-summary-name">{task.title}</span>
                  <span className="info-summary-meta">Due: {task.due_date || 'No Date'}</span>
                </div>
                <span className="info-summary-value pending">Pending</span>
              </div>
            ))}

            {highPriorityTasksList.length === 0 && pendingTasksList.length === 0 && (
              <div className="empty-state">All caught up! No active tasks to show.</div>
            )}
          </div>
        </div>
      </div>

      <TaskTable
        tasks={tasks}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
}

function WeeklyChart({ tasks }) {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const created = tasks.filter((t) => (t.created_at || '').slice(0, 10) === key).length;
    const resolved = tasks.filter(
      (t) => t.status === 'completed' && (t.completed_at || '').slice(0, 10) === key
    ).length;
    days.push({ label: dayNames[d.getDay()], key, created, resolved });
  }
  const max = Math.max(1, ...days.map((d) => Math.max(d.created, d.resolved)));

  return (
    <div className="weekly-chart">
      {days.map((d) => (
        <div key={d.key} className="chart-column">
          <div className="chart-bars">
            <div
              className="bar created"
              style={{ height: `${(d.created / max) * 100}%`, minHeight: d.created ? 4 : 0 }}
              title={`${d.label}: ${d.created} created`}
            />
            <div
              className="bar resolved"
              style={{ height: `${(d.resolved / max) * 100}%`, minHeight: d.resolved ? 4 : 0 }}
              title={`${d.label}: ${d.resolved} resolved`}
            />
          </div>
          <span className="chart-day-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function TaskTable({ tasks, onStartTask, onCompleteTask, onDeleteTask }) {
  const sorted = [...tasks].sort((a, b) =>
    b.created_at && a.created_at ? new Date(b.created_at) - new Date(a.created_at) : 0
  );

  return (
    <div className="task-table-card">
      <div className="task-table-header">
        <span className="chart-title">Recent Tasks</span>
        <span className="task-table-count">{tasks.length} total</span>
      </div>
      {sorted.length === 0 ? (
        <div className="empty-state">No tasks yet. Add your first task!</div>
      ) : (
        <div className="task-table">
          <div className="task-table-row task-table-head">
            <span>Task</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Actions</span>
          </div>
          {sorted.slice(0, 8).map((task) => (
            <div key={task.id} className="task-table-row">
              <span className="task-title-cell">{task.title}</span>
              <span>
                <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
              </span>
              <span>
                <span className={`status-pill ${task.status}`}>{task.status.replace('_', ' ')}</span>
              </span>
              <span className="task-due-cell">{task.due_date || '—'}</span>
              <span className="task-actions">
                {task.status === 'pending' && (
                  <button className="btn-mini primary" onClick={() => onStartTask?.(task.id)}>
                    Start
                  </button>
                )}
                {task.status !== 'completed' && (
                  <button className="btn-mini green" onClick={() => onCompleteTask?.(task.id)}>
                    Complete
                  </button>
                )}
                <button className="btn-mini danger" onClick={() => onDeleteTask?.(task.id)}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Taskmanager;
