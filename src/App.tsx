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
  RotateCcw
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

import { UserData, ChapterStatus, MockTest, StudySession, UserChapterData } from './types';
import { SYLLABUS } from './syllabus';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_DATA: UserData = {
  chapters: {},
  studySessions: [],
  mockTests: [],
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
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard userData={userData} setActiveTab={setActiveTab} addStudySession={addStudySession} />;
      case 'chapters': return <ChapterTracker userData={userData} updateChapterStatus={updateChapterStatus} />;
      case 'tests': return <MockTestTracker userData={userData} addMockTest={addMockTest} />;
      case 'analytics': return <Analytics userData={userData} />;
      case 'pomodoro': return <Pomodoro addStudySession={addStudySession} />;
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
        <NavItem icon={<Target size={20} />} label="Rank Sim" active={activeTab === 'rank'} onClick={() => setActiveTab('rank')} />
        <NavItem icon={<Timer size={20} />} label="Pomodoro" active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} />
        
        <div className="mt-auto pt-4 border-t border-border">
          <NavItem icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>

      {/* Mobile Smart Navigation */}
      <div className="smart-nav-container">
        <div className="smart-nav">
          <ul className="relative grid grid-cols-5 w-full h-full">
            {(['dashboard', 'chapters', 'tests', 'analytics', 'rank'] as const).map((tab) => {
              const icons: Record<string, React.ReactNode> = {
                dashboard: <LayoutDashboard size={24} />,
                chapters: <BookOpen size={24} />,
                tests: <Trophy size={24} />,
                analytics: <BarChart3 size={24} />,
                rank: <Target size={24} />
              };
              const labels: Record<string, string> = {
                dashboard: 'Home',
                chapters: 'Study',
                tests: 'Tests',
                analytics: 'Stats',
                rank: 'Rank'
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
                left: `calc(${['dashboard', 'chapters', 'tests', 'analytics', 'rank'].indexOf(activeTab)} * 20% + 10% - 30px)`
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
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-white text-black font-medium shadow-lg shadow-white/5" 
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </button>
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

    return { totalChapters, completedChapters, inProgressChapters, progress, todayMinutes };
  }, [userData]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userData.settings.userName}</h2>
          <p className="text-white/50 mt-1">Targeting JEE {userData.settings.targetYear}. Keep pushing.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('pomodoro')} className="nothing-button flex items-center gap-2">
            <Timer size={18} /> Start Session
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Syllabus Progress" 
          value={`${stats.progress}%`} 
          subValue={`${stats.completedChapters}/${stats.totalChapters} Chapters`}
          icon={<BookOpen className="text-accent" />}
          progress={stats.progress}
        />
        <StatCard 
          label="Today's Study" 
          value={`${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`} 
          subValue={`Goal: ${Math.floor(userData.settings.dailyGoalMinutes / 60)}h`}
          icon={<Clock className="text-secondary" />}
          progress={Math.min(100, (stats.todayMinutes / userData.settings.dailyGoalMinutes) * 100)}
        />
        <StatCard 
          label="Mock Avg Score" 
          value={userData.mockTests.length > 0 
            ? Math.round(userData.mockTests.reduce((acc, t) => acc + (t.score / t.totalMarks) * 300, 0) / userData.mockTests.length).toString() 
            : '0'} 
          subValue={`${userData.mockTests.length} Tests Taken`}
          icon={<Trophy className="text-yellow-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nothing-card">
          <h3 className="text-2xl font-serif font-light mb-8 flex items-center gap-3 border-b border-border pb-4">
            <Calendar size={24} className="text-accent" /> Study Heatmap
          </h3>
          <Heatmap sessions={userData.studySessions} />
        </div>

        <div className="nothing-card">
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
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#00ffcc' }}
                />
                <Line type="monotone" dataKey="score" stroke="#00ffcc" strokeWidth={3} dot={{ fill: '#00ffcc', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, progress }: { label: string, value: string, subValue: string, icon: React.ReactNode, progress?: number }) {
  return (
    <div className="nothing-card group">
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
    </div>
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
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-light tracking-tight">Syllabus Progress</h2>
          <p className="text-white/50 mt-2 font-light tracking-wide">Track your journey through JEE concepts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Physics', 'Chemistry', 'Mathematics'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all",
                filter === f ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {f}
            </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChapters.map(chapter => {
          const userChapter = userData.chapters[chapter.id];
          return (
            <div key={chapter.id} className="nothing-card flex flex-col justify-between group">
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
            </div>
          );
        })}
      </div>
    </div>
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
        {userData.mockTests.length === 0 ? (
          <div className="nothing-card text-center py-12">
            <Trophy size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40">No tests recorded yet. Take your first leap!</p>
          </div>
        ) : (
          userData.mockTests.slice().reverse().map(test => (
            <div key={test.id} className="nothing-card flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-accent/50">
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
            </div>
          ))
        )}
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
                  stroke="#00ffcc"
                  fill="#00ffcc"
                  fillOpacity={0.3}
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

// --- Pomodoro Component ---
function Pomodoro({ addStudySession }: { addStudySession: (d: number) => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        addStudySession(25);
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

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

  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-12">
      <header className="border-b border-border pb-8 mb-8">
        <h2 className="text-4xl font-serif font-light tracking-tight">Focus Timer</h2>
        <p className="text-white/50 mt-2 font-light tracking-wide">Deep work sessions for maximum retention.</p>
      </header>

      <div className="nothing-card p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-accent"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }}
          />
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={cn("px-4 py-1 rounded-full text-xs font-mono uppercase tracking-widest transition-all", mode === 'work' ? "bg-accent text-black" : "text-white/40 hover:text-white")}
          >
            Work
          </button>
          <button 
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={cn("px-4 py-1 rounded-full text-xs font-mono uppercase tracking-widest transition-all", mode === 'break' ? "bg-secondary text-white" : "text-white/40 hover:text-white")}
          >
            Break
          </button>
        </div>

        <h3 className="text-8xl font-bold font-mono tracking-tighter mb-8">{formatTime(timeLeft)}</h3>

        <div className="flex justify-center gap-4">
          <button onClick={toggleTimer} className="nothing-button px-12 py-4 text-lg">
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={resetTimer} className="nothing-button-outline px-6 py-4">
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="nothing-card p-4">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Sessions Today</p>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="nothing-card p-4">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Focus Time</p>
          <p className="text-2xl font-bold">1h 40m</p>
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
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Rank Simulator</h2>
        <p className="text-white/50 mt-1">Estimate your standing based on mock performance.</p>
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
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-white/50 mt-1">Manage your profile and data.</p>
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
