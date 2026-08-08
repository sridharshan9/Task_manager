import React from 'react';

function Pendingtasks({ pendingTasks = [], onStartTask, onCompleteTask, onDeleteTask }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <span>⏳</span> Pending Tasks ({pendingTasks.length})
      </h3>

      <div className="task-list">
        {pendingTasks.length === 0 ? (
          <div className="empty-state">All caught up! No pending tasks remaining.</div>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className="task-item pending">
              <div className="task-item-main">
                <div className="task-item-title">{task.title}</div>
                <div className="task-item-meta">
                  {task.description && <span>{task.description}</span>}
                  <span>Due: {task.due_date || 'Today'}</span>
                  <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
                </div>
              </div>
              <div className="task-item-actions">
                <button className="btn-mini primary" onClick={() => onStartTask?.(task.id)}>
                  Start
                </button>
                <button className="btn-mini green" onClick={() => onCompleteTask?.(task.id)}>
                  Mark Done
                </button>
                <button className="btn-mini danger" onClick={() => onDeleteTask?.(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Pendingtasks;
