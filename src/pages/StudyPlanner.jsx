import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Calendar as CalIcon } from 'lucide-react';

const StudyPlanner = () => {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    subject: '', title: '', date: '', priority: 'medium'
  });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to fetch tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setFormData({ subject: '', title: '', date: '', priority: 'medium' });
        fetchTasks();
      } else {
        alert(data.error || 'Unable to schedule this task. Try again.');
      }
    } catch (err) {
      console.error('Failed to add task');
      alert('Plan interrupted. Check your server connection.');
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !currentStatus })
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to toggle task');
    }
  };

  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || (filter === 'completed' ? t.completed : !t.completed);
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  return (
    <section className="page active">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Planner 📅</h1>
          <p className="page-subtitle">Organize your subjects. Stay on schedule. Crush your goals.</p>
        </div>
        <div className="planner-progress-badge">
          <span className="pp-label">Today's Progress</span>
          <div className="pp-bar-wrap">
            <div className="pp-bar" style={{ width: `${completionRate}%` }}></div>
          </div>
          <span className="pp-percent">{Math.round(completionRate)}%</span>
        </div>
      </div>

      <div className="planner-layout">
        <div className="glass-card add-task-card">
          <h3>Add New Task</h3>
          <form className="task-form" onSubmit={handleAddTask}>
            <div className="field-group">
              <label className="field-label">Subject</label>
              <input 
                type="text" required value={formData.subject} 
                placeholder="e.g. Physics, Math..."
                onChange={(e) => setFormData({...formData, subject: e.target.value})} 
              />
            </div>
            <div className="field-group">
              <label className="field-label">Task Title</label>
              <input 
                type="text" required value={formData.title} 
                placeholder="e.g. Solve 20 problems..."
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            <div className="task-form-row">
              <div className="field-group">
                <label className="field-label">Due Date</label>
                <input 
                  type="date" required value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})} 
                />
              </div>
              <div className="field-group">
                <label className="field-label">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary btn-add-task">
              <Plus size={16} /> Add Task
            </button>
          </form>
        </div>

        <div className="tasks-panel">
          <div className="tasks-filters">
            {['all', 'pending', 'completed'].map(f => (
              <button 
                key={f} 
                className={`task-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <div className="tasks-search-wrap">
              <Search size={16} />
              <input 
                type="text" placeholder="Search tasks…" 
                value={search} onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="tasks-list">
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
              <div key={task.id} className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
                <div 
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={() => toggleTask(task.id, task.completed)}
                ></div>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className="task-subject-badge">{task.subject}</span>
                    <span className="task-date">Due: {new Date(task.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="task-delete-btn" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )) : (
              <div className="tasks-empty-state">
                <div className="empty-icon">📅</div>
                <p>No tasks yet. Add your first study task!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudyPlanner;
