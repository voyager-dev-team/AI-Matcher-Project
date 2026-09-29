import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EngineersView } from './components/EngineersView';
import { ProjectsView } from './components/ProjectsView';
import { CrossMatchView } from './components/CrossMatchView';
import { MailInboxView } from './components/MailInboxView';
import { SheetsImportModal } from './components/SheetsImportModal';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  const handleResetSeed = async () => {
    if (!window.confirm('データベースを初期化し、最新のデモデータにリセットしますか？')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetSeedData();
      setResetToast(true);
      setTimeout(() => setResetToast(false), 3000);
      // Reload current tab content
      const tab = currentTab;
      setCurrentTab('dashboard');
      setTimeout(() => setCurrentTab(tab), 50);
    } catch (err) {
      console.error(err);
      alert('リセットに失敗しました。');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            setCurrentTab={setCurrentTab}
            onOpenSheetsModal={() => setSheetsModalOpen(true)}
          />
        )}
        {currentTab === 'engineers' && <EngineersView />}
        {currentTab === 'projects' && <ProjectsView />}
        {currentTab === 'cross' && <CrossMatchView />}
        {currentTab === 'emails' && <MailInboxView />}
      </main>

      {/* Toast */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>✅ データベースを初期化し、最新デモデータを再投入しました。</span>
        </div>
      )}

      {/* Sheets / CSV Import Modal */}
      <SheetsImportModal
        isOpen={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
        onSuccess={() => {
          setSheetsModalOpen(false);
          // reload by toggling
          const tab = currentTab;
          setCurrentTab('dashboard');
          setTimeout(() => setCurrentTab(tab), 50);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <p>SES AI Matcher & Proposal Generator © 2026 - Powered by Google DeepMind & FastAPI</p>
      </footer>
    </div>
  );
}

export default App;
