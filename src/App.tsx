/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Timer, 
  Calendar, 
  Settings as SettingsIcon,
  Trophy,
  Plus,
  ChevronRight,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ListTodo,
  Trash2,
  CalendarDays,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  Play,
  Pause,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { UserData, ChapterStatus, MockTest, StudySession, UserChapterData, Task, TaskPriority, TaskCategory } from './types';
import { SYLLABUS } from './syllabus';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_DATA: UserData = {
  chapters: {},
  studySessions: [],
  mockTests: [],
  tasks: [],
  settings: {
    userName: 'Aspirant',
    targetYear: 2026,
    dailyGoalMinutes: 360,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('rankforge_data');
    if (!saved) return INITIAL_DATA;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_DATA,
        ...parsed,
        // Ensure arrays exist
        chapters: parsed.chapters || {},
        studySessions: parsed.studySessions || [],
        mockTests: parsed.mockTests || [],
        tasks: parsed.tasks || [],
        settings: { ...INITIAL_DATA.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      return INITIAL_DATA;
    }
  });
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    localStorage.setItem('rankforge_data', JSON.stringify(userData));
  }, [userData]);

  const updateChapterStatus = (chapterId: string, status: ChapterStatus) => {
    setUserData(prev => ({
      ...prev,
      chapters: {
        ...prev.chapters,
        [chapterId]: {
          ...prev.chapters[chapterId],
          chapterId,
          status,
          lastStudied: new Date().toISOString(),
        }
      }
    }));
  };

  const addStudySession = (durationMinutes: number, subject?: string) => {
    const newSession: StudySession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      durationMinutes,
      subject,
    };
    setUserData(prev => ({
      ...prev,
      studySessions: [...prev.studySessions, newSession]
    }));
  };

  const addMockTest = (test: Omit<MockTest, 'id'>) => {
    const newTest: MockTest = {
      ...test,
      id: Math.random().toString(36).substr(2, 9),
    };
    setUserData(prev => ({
      ...prev,
      mockTests: [...prev.mockTests, newTest]
    }));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setUserData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    showNotification('Task added successfully!', 'success');
  };

  const toggleTask = (taskId: string) => {
    setUserData(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (task && !task.completed) {
        showNotification('Task completed! Keep it up.', 'success');
      }
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    });
  };

  const deleteTask = (taskId: string | string[]) => {
    const idsToDelete = Array.isArray(taskId) ? taskId : [taskId];
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => !idsToDelete.includes(t.id))
    }));
    showNotification(idsToDelete.length > 1 ? 'Completed tasks cleared.' : 'Task deleted.');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard userData={userData} setActiveTab={setActiveTab} addStudySession={addStudySession} />;
      case 'chapters': return <ChapterTracker userData={userData} updateChapterStatus={updateChapterStatus} />;
      case 'tests': return <MockTestTracker userData={userData} addMockTest={addMockTest} />;
      case 'analytics': return <Analytics userData={userData} />;
      case 'tasks': return <Tasks userData={userData} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />;
      case 'pomodoro': return <Pomodoro userData={userData} addStudySession={addStudySession} toggleTask={toggleTask} />;
      case 'rank': return <RankSimulator userData={userData} />;
      case 'settings': return <Settings userData={userData} setUserData={setUserData} />;
      default: return <Dashboard userData={userData} setActiveTab={setActiveTab} addStudySession={addStudySession} />;
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-white selection:bg-accent selection:text-black overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <nav className="hidden md:flex w-64 bg-surface border-r border-border p-4 flex-col gap-2 z-10 overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Zap className="text-black fill-black" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">RankForge</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Precision Tracker</p>
          </div>
        </div>

        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<BookOpen size={20} />} label="Syllabus" active={activeTab === 'chapters'} onClick={() => setActiveTab('chapters')} />
        <NavItem icon={<Trophy size={20} />} label="Mock Tests" active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} />
        <NavItem icon={<BarChart3 size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        <NavItem icon={<ListTodo size={20} />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <NavItem icon={<Target size={20} />} label="Rank Sim" active={activeTab === 'rank'} onClick={() => setActiveTab('rank')} />
        <NavItem icon={<Timer size={20} />} label="Pomodoro" active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} />
        
        <div className="mt-auto pt-4 border-t border-border">
          <NavItem icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>

      {/* Mobile Smart Navigation */}
      <div className="smart-nav-container">
        <div className="smart-nav">
          <ul className="relative grid grid-cols-7 w-full h-full">
            {(['dashboard', 'chapters', 'tests', 'tasks', 'analytics', 'rank', 'pomodoro'] as const).map((tab) => {
              const icons: Record<string, React.ReactNode> = {
                dashboard: <LayoutDashboard size={24} />,
                chapters: <BookOpen size={24} />,
                tests: <Trophy size={24} />,
                tasks: <ListTodo size={24} />,
                analytics: <BarChart3 size={24} />,
                rank: <Target size={24} />,
                pomodoro: <Timer size={24} />
              };
              const labels: Record<string, string> = {
                dashboard: 'Home',
                chapters: 'Study',
                tests: 'Tests',
                tasks: 'Tasks',
                analytics: 'Stats',
                rank: 'Rank',
                pomodoro: 'Focus'
              };
              return (
                <SmartNavItem 
                  key={tab}
                  icon={icons[tab]} 
                  label={labels[tab]} 
                  active={activeTab === tab} 
                  onClick={() => setActiveTab(tab)} 
                />
              );
            })}
            
            <div 
              className="indicator" 
              style={{ 
                left: `calc((${['dashboard', 'chapters', 'tests', 'tasks', 'analytics', 'rank', 'pomodoro'].indexOf(activeTab)} + 0.5) * (100% / 7))`
              }}
            />
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 dot-grid pb-32 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-24 md:bottom-8 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border",
              notification.type === 'success' ? "bg-accent text-black border-accent" : "bg-surface text-white border-border"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SmartNavItemProps {
  key?: React.Key;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SmartNavItem({ icon, label, active, onClick }: SmartNavItemProps) {
  return (
    <li className={cn(active && "active")} onClick={onClick}>
      <a href="#">
        <span className="icon">{icon}</span>
        <span className="text">{label}</span>
      </a>
    </li>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full text-left",
        active 
          ? "bg-white text-black font-medium shadow-lg shadow-white/5" 
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </motion.button>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg nothing-card p-8 shadow-2xl border border-white/10"
          >
            {title && (
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-light tracking-tight">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Dashboard Component ---
function Dashboard({ userData, setActiveTab, addStudySession }: { userData: UserData, setActiveTab: (t: string) => void, addStudySession: (d: number) => void }) {
  const stats = useMemo(() => {
    const totalChapters = SYLLABUS.length;
    const completedChapters = Object.values(userData.chapters).filter(c => c.status === 'COMPLETED').length;
    const inProgressChapters = Object.values(userData.chapters).filter(c => c.status === 'IN_PROGRESS').length;
    const progress = Math.round((completedChapters / totalChapters) * 100);

    const todaySessions = userData.studySessions.filter(s => isSameDay(parseISO(s.date), new Date()));
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    const pendingTasks = userData.tasks.filter(t => !t.completed).length;
    const completedTasksToday = userData.tasks.filter(t => t.completed && isSameDay(parseISO(t.createdAt), new Date())).length;

    return { totalChapters, completedChapters, inProgressChapters, progress, todayMinutes, pendingTasks, completedTasksToday };
  }, [userData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userData.settings.userName}</h2>
          <p className="text-white/50 mt-1">Targeting JEE {userData.settings.targetYear}. Keep pushing.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('tasks')} 
            className="nothing-button-outline flex items-center gap-2"
          >
            <ListTodo size={18} /> {stats.pendingTasks} Tasks Pending
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('pomodoro')} 
            className="nothing-button flex items-center gap-2"
          >
            <Timer size={18} /> Start Session
          </motion.button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Syllabus Progress" 
          value={`${stats.progress}%`} 
          subValue={`${stats.completedChapters}/${stats.totalChapters} Chapters`}
          icon={<BookOpen className="text-accent" />}
          progress={stats.progress}
          delay={0.1}
        />
        <StatCard 
          label="Today's Study" 
          value={`${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`} 
          subValue={`Goal: ${Math.floor(userData.settings.dailyGoalMinutes / 60)}h`}
          icon={<Clock className="text-secondary" />}
          progress={Math.min(100, (stats.todayMinutes / userData.settings.dailyGoalMinutes) * 100)}
          delay={0.2}
        />
        <StatCard 
          label="Tasks Completed" 
          value={stats.completedTasksToday.toString()} 
          subValue={`${stats.pendingTasks} more to go`}
          icon={<CheckCircle2 className="text-accent" />}
          progress={userData.tasks.length > 0 ? (stats.completedTasksToday / userData.tasks.length) * 100 : 0}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="nothing-card">
          <h3 className="text-2xl font-serif font-light mb-8 flex items-center gap-3 border-b border-border pb-4">
            <Calendar size={24} className="text-accent" /> Study Heatmap
          </h3>
          <Heatmap sessions={userData.studySessions} />
        </motion.div>

        <motion.div variants={itemVariants} className="nothing-card">
          <h3 className="text-2xl font-serif font-light mb-8 flex items-center gap-3 border-b border-border pb-4">
            <BarChart3 size={24} className="text-secondary" /> Score Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userData.mockTests.slice(-5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, subValue, icon, progress, delay = 0 }: { label: string, value: string, subValue: string, icon: React.ReactNode, progress?: number, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="nothing-card group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        {progress !== undefined && (
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live</span>
        )}
      </div>
      <p className="text-white/50 text-sm font-medium">{label}</p>
      <h4 className="text-3xl font-bold mt-1">{value}</h4>
      <p className="text-white/30 text-xs mt-2 font-mono uppercase tracking-wider">{subValue}</p>
      
      {progress !== undefined && (
        <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent"
          />
        </div>
      )}
    </motion.div>
  );
}

function Heatmap({ sessions }: { sessions: StudySession[] }) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 27; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), date));
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      result.push({ date, minutes: totalMinutes });
    }
    return result;
  }, [sessions]);

  const getIntensity = (minutes: number) => {
    if (minutes === 0) return 'bg-white/5';
    if (minutes < 60) return 'bg-accent/20';
    if (minutes < 180) return 'bg-accent/40';
    if (minutes < 360) return 'bg-accent/70';
    return 'bg-accent';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day, i) => (
        <div 
          key={i}
          title={`${format(day.date, 'MMM d')}: ${Math.floor(day.minutes / 60)}h ${day.minutes % 60}m`}
          className={cn("w-8 h-8 rounded-lg transition-transform hover:scale-110 cursor-help", getIntensity(day.minutes))}
        />
      ))}
    </div>
  );
}

// --- Chapter Tracker Component ---
function ChapterTracker({ userData, updateChapterStatus }: { userData: UserData, updateChapterStatus: (id: string, s: ChapterStatus) => void }) {
  const [filter, setFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Mathematics'>('All');
  const [search, setSearch] = useState('');

  const filteredChapters = SYLLABUS.filter(c => {
    const matchesFilter = filter === 'All' || c.subject === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status?: ChapterStatus) => {
    switch (status) {
      case 'COMPLETED': return 'text-accent';
      case 'IN_PROGRESS': return 'text-yellow-400';
      case 'REVISION_NEEDED': return 'text-secondary';
      default: return 'text-white/20';
    }
  };

  const getStatusIcon = (status?: ChapterStatus) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={18} />;
      case 'IN_PROGRESS': return <AlertCircle size={18} />;
      case 'REVISION_NEEDED': return <RotateCcw size={18} />;
      default: return <Plus size={18} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-light tracking-tight">Syllabus Progress</h2>
          <p className="text-white/50 mt-2 font-light tracking-wide">Track your journey through JEE concepts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Physics', 'Chemistry', 'Mathematics'].map(f => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all",
                filter === f ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </header>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Search chapters..." 
          className="w-full nothing-input pl-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredChapters.map((chapter, index) => {
            const userChapter = userData.chapters[chapter.id];
            return (
              <motion.div 
                key={chapter.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(index * 0.02, 0.2) }}
                className="nothing-card flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{chapter.category}</span>
                    <div className={cn("transition-colors", getStatusColor(userChapter?.status))}>
                      {getStatusIcon(userChapter?.status)}
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg leading-tight group-hover:text-accent transition-colors">{chapter.name}</h4>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <select 
                    value={userChapter?.status || 'NOT_STARTED'}
                    onChange={(e) => updateChapterStatus(chapter.id, e.target.value as ChapterStatus)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REVISION_NEEDED">Revision Needed</option>
                  </select>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// --- Mock Test Tracker Component ---
function MockTestTracker({ userData, addMockTest }: { userData: UserData, addMockTest: (t: Omit<MockTest, 'id'>) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalMarks: 300,
    physicsScore: 0,
    chemistryScore: 0,
    mathsScore: 0,
    timeTakenMinutes: 180,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(formData.physicsScore) + Number(formData.chemistryScore) + Number(formData.mathsScore);
    const accuracy = Math.round((score / formData.totalMarks) * 100); // Simplified accuracy
    addMockTest({
      name: formData.name,
      date: new Date().toISOString(),
      score,
      totalMarks: Number(formData.totalMarks),
      physicsScore: Number(formData.physicsScore),
      chemistryScore: Number(formData.chemistryScore),
      mathsScore: Number(formData.mathsScore),
      accuracy,
      timeTakenMinutes: Number(formData.timeTakenMinutes),
    });
    setShowAdd(false);
    setFormData({ name: '', totalMarks: 300, physicsScore: 0, chemistryScore: 0, mathsScore: 0, timeTakenMinutes: 180 });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between border-b border-border pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-light tracking-tight">Mock Tests</h2>
          <p className="text-white/50 mt-2 font-light tracking-wide">Analyze your performance under pressure.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="nothing-button flex items-center gap-2">
          <Plus size={18} /> New Test
        </button>
      </header>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="nothing-card overflow-hidden">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Test Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g., JEE Main Full Test 01" 
                className="w-full nothing-input"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Total Marks</label>
              <input 
                type="number" 
                className="w-full nothing-input"
                value={formData.totalMarks}
                onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Physics</label>
              <input 
                type="number" 
                className="w-full nothing-input"
                value={formData.physicsScore}
                onChange={e => setFormData({...formData, physicsScore: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Chemistry</label>
              <input 
                type="number" 
                className="w-full nothing-input"
                value={formData.chemistryScore}
                onChange={e => setFormData({...formData, chemistryScore: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Mathematics</label>
              <input 
                type="number" 
                className="w-full nothing-input"
                value={formData.mathsScore}
                onChange={e => setFormData({...formData, mathsScore: Number(e.target.value)})}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="nothing-button-outline">Cancel</button>
              <button type="submit" className="nothing-button">Save Results</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {userData.mockTests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="nothing-card text-center py-12"
            >
              <Trophy size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/40">No tests recorded yet. Take your first leap!</p>
            </motion.div>
          ) : (
            userData.mockTests.slice().reverse().map((test, index) => (
              <motion.div 
                key={test.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="nothing-card flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-accent font-bold">
                    {Math.round((test.score / test.totalMarks) * 100)}%
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{test.name}</h4>
                    <p className="text-white/40 text-sm">{format(parseISO(test.date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Physics</p>
                    <p className="font-bold text-lg">{test.physicsScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Chem</p>
                    <p className="font-bold text-lg">{test.chemistryScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Math</p>
                    <p className="font-bold text-lg">{test.mathsScore}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Score</p>
                    <p className="text-2xl font-bold text-accent">{test.score}<span className="text-white/20 text-sm font-normal">/{test.totalMarks}</span></p>
                  </div>
                  <ChevronRight className="text-white/20 group-hover:text-accent transition-colors" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Analytics Component ---
function Analytics({ userData }: { userData: UserData }) {
  const radarData = useMemo(() => {
    if (userData.mockTests.length === 0) return [];
    
    const latest = userData.mockTests[userData.mockTests.length - 1];
    return [
      { subject: 'Physics', score: (latest.physicsScore / (latest.totalMarks / 3)) * 100 },
      { subject: 'Chemistry', score: (latest.chemistryScore / (latest.totalMarks / 3)) * 100 },
      { subject: 'Mathematics', score: (latest.mathsScore / (latest.totalMarks / 3)) * 100 },
    ];
  }, [userData]);

  const syllabusStats = useMemo(() => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    return subjects.map(sub => {
      const total = SYLLABUS.filter(c => c.subject === sub).length;
      const completed = Object.values(userData.chapters).filter(c => {
        const chapter = SYLLABUS.find(s => s.id === c.chapterId);
        return chapter?.subject === sub && c.status === 'COMPLETED';
      }).length;
      return { name: sub, value: Math.round((completed / total) * 100) };
    });
  }, [userData]);

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-8 mb-8">
        <h2 className="text-4xl font-serif font-light tracking-tight">Performance Analytics</h2>
        <p className="text-white/50 mt-2 font-light tracking-wide">Deep dive into your strengths and weaknesses.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nothing-card">
          <h3 className="text-2xl font-serif font-light mb-8 border-b border-border pb-4">Subject Strength (Latest Test)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#ffffff"
                  fill="#ffffff"
                  fillOpacity={0.1}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nothing-card">
          <h3 className="text-2xl font-serif font-light mb-8 border-b border-border pb-4">Syllabus Completion by Subject</h3>
          <div className="space-y-8 mt-4">
            {syllabusStats.map(stat => (
              <div key={stat.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{stat.name}</span>
                  <span className="text-accent font-mono">{stat.value}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    className={cn(
                      "h-full",
                      stat.name === 'Physics' ? 'bg-accent' : stat.name === 'Chemistry' ? 'bg-secondary' : 'bg-blue-500'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Pomodoro Sub-Components ---

function FocusStats({ stats }: { stats: { sessionsToday: number, totalMinutesToday: number } }) {
  return (
    <div className="nothing-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <History className="text-accent" size={20} />
        <h4 className="text-sm font-mono uppercase tracking-widest text-white/60">Today's Stats</h4>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold">{stats.sessionsToday}</p>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Sessions Completed</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.floor(stats.totalMinutesToday / 60)}h {stats.totalMinutesToday % 60}m</p>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Focus Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusGoal({ stats, dailyGoalMinutes }: { stats: { totalMinutesToday: number }, dailyGoalMinutes: number }) {
  const progress = Math.min(100, (stats.totalMinutesToday / dailyGoalMinutes) * 100);
  
  return (
    <div className="nothing-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="text-secondary" size={20} />
        <h4 className="text-sm font-mono uppercase tracking-widest text-white/60">Session Goal</h4>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent"
          />
        </div>
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2">
          Goal: {Math.floor(dailyGoalMinutes / 60)}h
        </p>
      </div>
    </div>
  );
}

function FocusContext({ 
  tasks, 
  selectedTask, 
  setSelectedTask, 
  toggleTask, 
  ambientSound, 
  setAmbientSound 
}: { 
  tasks: Task[], 
  selectedTask: string | null, 
  setSelectedTask: (id: string) => void,
  toggleTask: (id: string) => void,
  ambientSound: string,
  setAmbientSound: (s: any) => void
}) {
  const currentTask = tasks.find(t => t.id === selectedTask);

  return (
    <div className="nothing-card">
      <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Session Context</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Working on Task</label>
          <select 
            value={selectedTask || ''} 
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full nothing-input bg-white/5"
          >
            <option value="">No specific task</option>
            {tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {currentTask && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
            >
              <span className="text-xs truncate max-w-[150px]">{currentTask.title}</span>
              <button 
                onClick={() => toggleTask(currentTask.id)}
                className="text-[10px] font-mono text-accent hover:underline"
              >
                Mark Done
              </button>
            </motion.div>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Ambient Sound</label>
          <div className="grid grid-cols-2 gap-2">
            {(['none', 'rain', 'forest', 'lofi'] as const).map(s => (
              <button
                key={s}
                onClick={() => setAmbientSound(s)}
                className={cn(
                  "py-2 text-[10px] font-mono uppercase tracking-widest rounded border transition-all",
                  ambientSound === s ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-white/30 hover:border-white/10"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusReflection({ reflection, setReflection }: { reflection: string, setReflection: (s: string) => void }) {
  return (
    <div className="nothing-card">
      <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Post-Session Reflection</h4>
      <textarea 
        placeholder="What did you achieve? (Optional)"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="w-full nothing-input bg-white/5 h-24 resize-none text-xs"
      />
    </div>
  );
}

function FocusHistory({ studySessions }: { studySessions: StudySession[] }) {
  return (
    <div className="nothing-card">
      <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Recent Sessions</h4>
      <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
        {studySessions.slice(-5).reverse().map((session, i) => (
          <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-white/60">{format(parseISO(session.date), 'HH:mm')}</span>
            </div>
            <span className="font-mono">{session.durationMinutes}m</span>
          </div>
        ))}
        {studySessions.length === 0 && (
          <p className="text-[10px] text-white/20 italic">No sessions yet today.</p>
        )}
      </div>
    </div>
  );
}

// --- Advanced Pomodoro Component ---
function Pomodoro({ userData, addStudySession, toggleTask }: { userData: UserData, addStudySession: (d: number) => void, toggleTask: (id: string) => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'forest' | 'lofi'>('none');
  const [reflection, setReflection] = useState('');
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const totalTime = mode === 'work' ? 25 * 60 : 5 * 60;
  const progress = (timeLeft / totalTime) * 100;

  useEffect(() => {
    if (ambientSound !== 'none' && isActive && !isMuted) {
      const urls = {
        rain: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-on-window-loop-2442.mp3',
        forest: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-ambience-loop-1229.mp3',
        lofi: 'https://assets.mixkit.co/music/preview/mixkit-lo-fi-hip-hop-624.mp3'
      };
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
      }
      
      if (audioRef.current.src !== urls[ambientSound as keyof typeof urls]) {
        audioRef.current.src = urls[ambientSound as keyof typeof urls];
      }
      
      audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
    } else {
      audioRef.current?.pause();
    }
    return () => audioRef.current?.pause();
  }, [ambientSound, isActive, isMuted]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        addStudySession(25);
        if (!isMuted) {
          try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
            audio.play();
          } catch (e) {}
        }
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, isMuted]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    const today = userData.studySessions.filter(s => isSameDay(parseISO(s.date), new Date()));
    const totalMinutes = today.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      sessionsToday: today.length,
      totalMinutesToday: totalMinutes
    };
  }, [userData.studySessions]);

  const currentTask = userData.tasks.find(t => t.id === selectedTask);

  return (
    <div className={cn(
      "max-w-4xl mx-auto space-y-8 transition-all duration-500",
      isDeepFocus && "fixed inset-0 z-[100] bg-background p-8 overflow-y-auto"
    )}>
      <header className="flex items-center justify-between border-b border-border pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-light tracking-tight">Focus Engine <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded ml-2 uppercase tracking-widest">v2.0</span></h2>
          <p className="text-white/50 mt-2 font-light tracking-wide">Advanced neuro-rhythmic timing for peak cognitive performance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="nothing-button-outline p-3 rounded-full hover:bg-white/5"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button 
            onClick={() => setIsDeepFocus(!isDeepFocus)}
            className={cn("nothing-button-outline p-3 rounded-full transition-all", isDeepFocus && "bg-accent text-black")}
            title="Deep Focus Mode"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="nothing-card p-12 flex flex-col items-center justify-center relative group">
            {/* Pulsating Glow */}
            <motion.div 
              animate={{ 
                scale: isActive ? [1, 1.05, 1] : 1,
                opacity: isActive ? [0.1, 0.2, 0.1] : 0.05
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className={cn(
                "absolute inset-0 rounded-xl transition-colors duration-1000",
                mode === 'work' ? "bg-accent" : "bg-secondary"
              )}
            />

            {/* Circular Progress Ring */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center z-10">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="50%" cy="50%" r="48%" 
                  className="stroke-white/5 fill-none" 
                  strokeWidth="2" 
                />
                <motion.circle 
                  cx="50%" cy="50%" r="48%" 
                  className={cn("fill-none transition-colors duration-500", mode === 'work' ? "stroke-accent" : "stroke-secondary")}
                  strokeWidth="6"
                  strokeDasharray="100 100"
                  animate={{ strokeDashoffset: 100 - progress }}
                  transition={{ duration: 1, ease: "linear" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  animate={{ opacity: isActive ? [0.4, 1, 0.4] : 0.4 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-2"
                >
                  {mode}
                </motion.span>
                <h3 className="text-7xl md:text-8xl font-bold font-mono tracking-tighter">{formatTime(timeLeft)}</h3>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-12 w-full max-w-sm z-10">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleTimer} 
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all shadow-2xl",
                  isActive ? "bg-white/5 text-white border border-white/10" : "bg-accent text-black"
                )}
              >
                {isActive ? <Pause size={24} /> : <Play size={24} />}
                {isActive ? 'Pause' : 'Start Session'}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, rotate: -90 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer} 
                className="nothing-button-outline px-6 py-4 rounded-xl"
              >
                <RotateCcw size={24} />
              </motion.button>
            </div>

            <div className="flex justify-center gap-4 mt-8 z-10">
              <button 
                onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
                className={cn("px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border", mode === 'work' ? "bg-accent text-black border-accent" : "text-white/40 border-white/10 hover:border-white/30")}
              >
                Work
              </button>
              <button 
                onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
                className={cn("px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border", mode === 'break' ? "bg-secondary text-white border-secondary" : "text-white/40 border-white/10 hover:border-white/30")}
              >
                Break
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FocusStats stats={stats} />
            <FocusGoal stats={stats} dailyGoalMinutes={userData.settings.dailyGoalMinutes} />
          </div>
        </div>

        <div className="space-y-6">
          <FocusContext 
            tasks={userData.tasks}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            toggleTask={toggleTask}
            ambientSound={ambientSound}
            setAmbientSound={setAmbientSound}
          />

          <FocusReflection reflection={reflection} setReflection={setReflection} />

          <FocusHistory studySessions={userData.studySessions} />
        </div>
      </div>
    </div>
  );
}

// --- Tasks Component ---
function Tasks({ userData, addTask, toggleTask, deleteTask }: { 
  userData: UserData, 
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void,
  toggleTask: (id: string) => void,
  deleteTask: (id: string | string[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Study' | 'Personal' | 'Work'>('All');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Study' as TaskCategory,
    priority: 'Medium' as TaskPriority,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredTasks = userData.tasks.filter(t => filter === 'All' || t.category === filter);
  
  const stats = useMemo(() => {
    const total = userData.tasks.length;
    const completed = userData.tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate streak (consecutive days with at least one task completed)
    let streak = 0;
    const completedDates = [...new Set(userData.tasks
      .filter(t => t.completed)
      .map(t => format(parseISO(t.createdAt), 'yyyy-MM-dd'))
    )].sort().reverse();

    if (completedDates.length > 0) {
      let current = new Date();
      const today = format(current, 'yyyy-MM-dd');
      const yesterday = format(subDays(current, 1), 'yyyy-MM-dd');
      
      if (completedDates[0] === today || completedDates[0] === yesterday) {
        streak = 1;
        for (let i = 0; i < completedDates.length - 1; i++) {
          const d1 = parseISO(completedDates[i]);
          const d2 = parseISO(completedDates[i+1]);
          if (isSameDay(subDays(d1, 1), d2)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return { total, completed, progress, streak };
  }, [userData.tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      title: formData.title,
      category: formData.category,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
    });
    setShowAdd(false);
    setFormData({ title: '', category: 'Study', priority: 'Medium', dueDate: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-light tracking-tight">Task Tracker</h2>
          <p className="text-white/50 mt-2 font-light tracking-wide">Stay organized and productive.</p>
        </div>
        <div className="flex gap-3">
          <div className="nothing-card py-2 px-4 flex items-center gap-2 border-accent/20 bg-accent/5">
            <Flame size={18} className="text-orange-500 fill-orange-500" />
            <span className="font-bold text-accent">{stats.streak} Day Streak</span>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="nothing-button flex items-center gap-2">
            <Plus size={18} /> Add Task
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="nothing-card">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Progress</h3>
            <div className="relative h-32 w-32 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: stats.completed },
                      { name: 'Remaining', value: stats.total - stats.completed || 1 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#ffffff" />
                    <Cell fill="#1f1f1f" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{stats.progress}%</span>
              </div>
            </div>
            <p className="text-center text-[10px] font-mono text-white/40 uppercase tracking-widest mt-4">
              {stats.completed}/{stats.total} Tasks Done
            </p>
          </div>

          <div className="nothing-card">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Categories</h3>
            <div className="space-y-2">
              {['All', 'Study', 'Personal', 'Work'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilter(cat as any)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                    filter === cat ? "bg-white text-black font-medium" : "text-white/60 hover:bg-white/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {userData.tasks.some(t => t.completed) && (
              <button 
                onClick={() => {
                  const completedIds = userData.tasks.filter(t => t.completed).map(t => t.id);
                  deleteTask(completedIds);
                }}
                className="w-full mt-6 text-left px-3 py-2 rounded-lg text-xs text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} />
                Clear Completed
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Modal 
            isOpen={showAdd} 
            onClose={() => setShowAdd(false)}
            title="Create New Task"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Task Title</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  placeholder="What needs to be done?" 
                  className="w-full nothing-input text-lg py-4"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Category</label>
                  <select 
                    className="w-full nothing-input"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as TaskCategory})}
                  >
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Priority</label>
                  <select 
                    className="w-full nothing-input"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Due Date</label>
                <input 
                  type="date" 
                  className="w-full nothing-input"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="nothing-button-outline px-6">Cancel</button>
                <button type="submit" className="nothing-button px-8">Create Task</button>
              </div>
            </form>
          </Modal>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="nothing-card text-center py-12 border-dashed"
                >
                  <ListTodo size={48} className="mx-auto text-white/10 mb-4" />
                  <p className="text-white/40">No tasks found in this category.</p>
                </motion.div>
              ) : (
                filteredTasks.sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  const pMap = { High: 0, Medium: 1, Low: 2 };
                  return pMap[a.priority] - pMap[b.priority];
                }).map(task => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "nothing-card p-4 flex items-center gap-4 group transition-all",
                      task.completed && "opacity-50 grayscale"
                    )}
                  >
                    <motion.button 
                      whileTap={{ scale: 0.8 }}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed ? "bg-accent border-accent text-black" : "border-white/20 hover:border-accent"
                      )}
                    >
                      {task.completed && <CheckCircle2 size={14} />}
                    </motion.button>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium truncate",
                        task.completed && "line-through text-white/40"
                      )}>{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded",
                          task.priority === 'High' ? "bg-red-500/10 text-red-500" : 
                          task.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500" : 
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1">
                          <CalendarDays size={10} /> {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : 'No date'}
                        </span>
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                          • {task.category}
                        </span>
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.1, color: '#ef4444' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteTask(task.id)}
                      className="opacity-40 group-hover:opacity-100 p-2 text-white/40 hover:text-red-500 transition-all"
                      title="Delete Task"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Rank Simulator Component ---
function RankSimulator({ userData }: { userData: UserData }) {
  const [score, setScore] = useState(180);
  
  const percentile = useMemo(() => {
    // Simplified JEE Percentile Formula based on historical data
    // This is a rough estimation, not official
    if (score >= 280) return 99.99;
    if (score >= 250) return 99.9;
    if (score >= 200) return 99.5;
    if (score >= 180) return 99.0;
    if (score >= 150) return 98.0;
    if (score >= 120) return 95.0;
    if (score >= 100) return 90.0;
    if (score >= 80) return 80.0;
    return Math.max(0, (score / 300) * 100);
  }, [score]);

  const expectedRank = useMemo(() => {
    const totalCandidates = 1200000;
    return Math.round((100 - percentile) * (totalCandidates / 100));
  }, [percentile]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="border-b border-border pb-8 mb-8">
        <h2 className="text-4xl font-serif font-light tracking-tight">Rank Simulator</h2>
        <p className="text-white/50 mt-2 font-light tracking-wide">Estimate your standing based on mock performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="nothing-card space-y-8">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Input Mock Score (out of 300)</label>
            <input 
              type="range" 
              min="0" 
              max="300" 
              step="1"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between mt-2 text-xs font-mono text-white/20">
              <span>0</span>
              <span>150</span>
              <span>300</span>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-6xl font-bold text-accent">{score}</p>
            <p className="text-white/40 uppercase tracking-widest text-xs mt-2">Simulated Score</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="nothing-card bg-accent/5 border-accent/20">
            <p className="text-xs font-mono text-accent/60 uppercase tracking-widest mb-1">Expected Percentile</p>
            <p className="text-5xl font-bold text-accent">{percentile.toFixed(2)}</p>
          </div>
          <div className="nothing-card bg-secondary/5 border-secondary/20">
            <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-1">Estimated AIR</p>
            <p className="text-5xl font-bold text-secondary">~{expectedRank.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-white/20 italic text-center">
            *Estimates based on 1.2M candidates. Actual results may vary based on shift difficulty.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Settings Component ---
function Settings({ userData, setUserData }: { userData: UserData, setUserData: React.Dispatch<React.SetStateAction<UserData>> }) {
  const exportData = () => {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'rankforge_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearData = () => {
    if (confirm('Are you sure? This will delete all your progress permanently.')) {
      setUserData(INITIAL_DATA);
      localStorage.removeItem('rankforge_data');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header className="border-b border-border pb-8 mb-8">
        <h2 className="text-4xl font-serif font-light tracking-tight">Settings</h2>
        <p className="text-white/50 mt-2 font-light tracking-wide">Manage your profile and data.</p>
      </header>

      <div className="nothing-card space-y-6">
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">User Name</label>
          <input 
            type="text" 
            className="w-full nothing-input"
            value={userData.settings.userName}
            onChange={e => setUserData({...userData, settings: {...userData.settings, userName: e.target.value}})}
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Target JEE Year</label>
          <input 
            type="number" 
            className="w-full nothing-input"
            value={userData.settings.targetYear}
            onChange={e => setUserData({...userData, settings: {...userData.settings, targetYear: Number(e.target.value)}})}
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-white/40 mb-2">Daily Study Goal (Minutes)</label>
          <input 
            type="number" 
            className="w-full nothing-input"
            value={userData.settings.dailyGoalMinutes}
            onChange={e => setUserData({...userData, settings: {...userData.settings, dailyGoalMinutes: Number(e.target.value)}})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={exportData} className="nothing-button-outline flex items-center justify-center gap-2">
          Export Data (JSON)
        </button>
        <button onClick={clearData} className="border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded-full transition-all flex items-center justify-center gap-2">
          Clear All Data
        </button>
      </div>

      <div className="nothing-card bg-white/5 border-white/10 text-center py-8">
        <p className="text-sm text-white/40">RankForge v1.0.0</p>
        <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest">Privacy First • Local Only</p>
      </div>
    </div>
  );
}
