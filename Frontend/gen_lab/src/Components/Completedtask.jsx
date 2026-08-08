import React from 'react';

function Completedtasks({ completedTasks = [], onDeleteTask }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <span>✅</span> Completed Tasks ({completedTasks.length})
      </h3>

      <div className="task-list">
        {completedTasks.length === 0 ? (
          <div className="empty-state">No tasks completed yet. Keep pushing!</div>
        ) : (
          completedTasks.map((task) => (
            <div key={task.id} className="task-item completed">
              <div className="task-item-main">
                <div className="task-item-title done">{task.title}</div>
                <div className="task-item-meta">
                  <span>
                    Done: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Today'}
                  </span>
                  <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
                </div>
              </div>
              <div className="task-item-actions">
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

export default Completedtasks;
