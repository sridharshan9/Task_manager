import React from 'react';

function Inprogress({ activeTasks = [], onCompleteTask, onDeleteTask }) {
  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <span>⚡</span> Active Tasks ({activeTasks.length})
      </h3>

      <div className="task-list">
        {activeTasks.length === 0 ? (
          <div className="empty-state">No tasks currently in progress. Start working on one!</div>
        ) : (
          activeTasks.map((task) => (
            <div key={task.id} className="task-item in_progress">
              <div className="task-item-main">
                <div className="task-item-title">{task.title}</div>
                <div className="task-item-meta">
                  <span className="status-pill in_progress">In Progress</span>
                  <span>{task.description}</span>
                  <span>Started: {task.started_at ? new Date(task.started_at).toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
              <div className="task-item-actions">
                <button className="btn-mini green" onClick={() => onCompleteTask?.(task.id)}>
                  Complete
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

export default Inprogress;
