import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Navbar from './Navbar';
import Taskmanager from './Taskmanager';
import Pendingtasks from './Pendingtask';
import Inprogress from './Inprogress';
import Completedtasks from './Completedtask';
import AddNewTask from './Addnewtask';
import Chatpartner from './Chatpartner';
import TaskReport from './TaskReport';
import ProfilePanel from './ProfilePanel';
import ManageUsers from './ManageUsers';
import { fetchTasks, fetchStats, createTask, updateTask, deleteTask } from '../api';

const TITLES = {
  overview: 'Overview',
  pending: 'Pending Tasks',
  inprogress: 'In Progress',
  completed: 'Completed Tasks',
  addnewtask: 'Add New Task',
  taskreport: 'Task Report & Statistics',
  users: 'Manage Users',
  chats: 'Team Chat',
  profile: 'My Profile',
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [chatMessages, setChatMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('genlab_chat')) || [];
    } catch {
      return [];
    }
  });
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskList, statData] = await Promise.all([fetchTasks(), fetchStats()]);
      setTasks(taskList);
      setStats(statData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 992);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleAddTask = async (taskData) => {
    setSaving(true);
    try {
      await createTask({ ...taskData, created_by: user?.id });
      await loadData();
      setActiveTab('overview');
      return true;
    } catch (err) {
      console.error('Failed to create task', err);
      alert(err.response?.data?.message || 'Failed to create task.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (id, data) => {
    try {
      await updateTask(id, data);
      await loadData();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await deleteTask(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    setChatLoading(true);
    setTimeout(() => {
      const updated = [
        ...chatMessages,
        { id: Date.now(), sender_id: user?.id, message_text: chatText.trim() },
      ];
      setChatMessages(updated);
      localStorage.setItem('genlab_chat', JSON.stringify(updated));
      setChatText('');
      setChatLoading(false);
    }, 250);
  };

  const handleDeleteMessage = (id) => {
    const updated = chatMessages.filter((m) => m.id !== id);
    setChatMessages(updated);
    localStorage.setItem('genlab_chat', JSON.stringify(updated));
  };

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === 'pending'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'in_progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const urgentTasks = useMemo(
    () => tasks.filter((t) => ['high', 'urgent'].includes(t.priority)),
    [tasks]
  );

  const renderContent = () => {
    if (loading && tasks.length === 0) {
      return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    switch (activeTab) {
      case 'pending':
        return (
          <Pendingtasks
            pendingTasks={pendingTasks}
            onStartTask={(id) => handleUpdateTask(id, { status: 'in_progress' })}
            onCompleteTask={(id) => handleUpdateTask(id, { status: 'completed' })}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'inprogress':
        return (
          <Inprogress
            activeTasks={inProgressTasks}
            onCompleteTask={(id) => handleUpdateTask(id, { status: 'completed' })}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'completed':
        return <Completedtasks completedTasks={completedTasks} onDeleteTask={handleDeleteTask} />;
      case 'addnewtask':
        return <AddNewTask onAddTask={handleAddTask} isLoading={saving} />;
      case 'taskreport':
        return <TaskReport tasks={tasks} stats={stats} />;
      case 'users':
        return <ManageUsers />;
      case 'chats':
        return (
          <Chatpartner
            user={user}
            chatMessages={chatMessages}
            chatText={chatText}
            setChatText={setChatText}
            chatLoading={chatLoading}
            sendMessage={handleSendMessage}
            deleteMessage={handleDeleteMessage}
          />
        );
      case 'profile':
        return <ProfilePanel user={user} onLogout={handleLogout} />;
      case 'overview':
      default:
        return (
          <Taskmanager
            user={user}
            tasks={tasks}
            stats={stats}
            loading={loading}
            taskProgressPercent={stats?.completionPercent || 0}
            totalTasksAssigned={stats?.total || tasks.length}
            completedTasksCount={stats?.completed || completedTasks.length}
            pendingTasksCount={stats?.pending || pendingTasks.length}
            urgentTasksCount={stats?.urgent || urgentTasks.length}
            overdueTasksCount={stats?.overdue || 0}
            recentProjects={tasks}
            pendingTasksList={pendingTasks}
            highPriorityTasksList={urgentTasks}
            onStartTask={(id) => handleUpdateTask(id, { status: 'in_progress' })}
            onCompleteTask={(id) => handleUpdateTask(id, { status: 'completed' })}
            onDeleteTask={handleDeleteTask}
          />
      );
    }
  };

  return (
    <div className={`app-shell ${isMobile ? 'app-shell-mobile' : ''}`}>
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <header className="topbar">
          {isMobile && (
            <button className="topbar-burger" onClick={() => setSidebarOpen((v) => !v)}>
              <span />
              <span />
              <span />
            </button>
          )}
          <h1 className="topbar-title">{TITLES[activeTab] || 'Dashboard'}</h1>
          <div className="topbar-user">
            <div className="topbar-user-meta">
              <span className="topbar-name">{user?.full_name || user?.email || 'User'}</span>
              <span className="topbar-role">{user?.role || ''}</span>
            </div>
            <span className="topbar-avatar">
              {(user?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="app-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default Dashboard;
