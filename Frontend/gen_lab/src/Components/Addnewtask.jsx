import React, { useState } from 'react';

function AddNewTask({ onAddTask, isLoading = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ok = await onAddTask?.({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || '',
    });

    if (ok) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  };

  return (
    <div className="form-card">
      <h3 className="form-card-title">
        <span>➕</span> Create New Task
      </h3>

      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="field-group">
          <label>Task Title</label>
          <input
            type="text"
            className="glass-input"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="field-group">
          <label>Description</label>
          <textarea
            className="glass-input"
            placeholder="Optional details about this task"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label>Priority</label>
            <select
              className="glass-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="field-group">
            <label>Due Date</label>
            <input
              type="date"
              className="glass-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Saving...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
}

export default AddNewTask;
