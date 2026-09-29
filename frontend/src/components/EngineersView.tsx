import React, { useState, useEffect } from 'react';
import { Engineer, ProjectMatchItem, ProposalEmail } from '../types';
import { api } from '../services/api';
import { ProposalModal } from './ProposalModal';
import { ResumeModal } from './ResumeModal';
import { 
  Users, 
  Search, 
  Sparkles, 
  FileText, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CircleDollarSign, 
  Briefcase,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';

export const EngineersView: React.FC = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [matches, setMatches] = useState<ProjectMatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);
  const [highMatchCount, setHighMatchCount] = useState(0);

  // Proposal modal state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ProposalEmail | null>(null);
  const [activeProjectTitle, setActiveProjectTitle] = useState('');

  // Resume modal state
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeTargetEngineer, setResumeTargetEngineer] = useState<Engineer | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    loadEngineers();
  }, []);

  const loadEngineers = async () => {
    try {
      const data = await api.getEngineers();
      setEngineers(data);
      if (data.length > 0 && !selectedEngineer) {
        handleSelectEngineer(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEngineer = async (eng: Engineer) => {
    setSelectedEngineer(eng);
    setLoadingMatches(true);
    try {
      const res = await api.matchEngineerToProjects(eng.id, true, 10);
      setMatches(res.matches);
      setTotalScanned(res.total_projects_scanned);
      setHighMatchCount(res.high_match_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const openProposal = (item: ProjectMatchItem) => {
    if (!item.match.proposal_email) return;
    setActiveProposal(item.match.proposal_email);
    setActiveProjectTitle(item.project.title);
    setProposalModalOpen(true);
  };

  const openResumeModal = (eng: Engineer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResumeTargetEngineer(eng);
    setResumeModalOpen(true);
  };

  const filteredEngineers = engineers.filter((eng) => {
    const matchesSearch = 
      eng.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eng.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eng.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (sourceFilter === 'all') return matchesSearch;
    return matchesSearch && eng.source === sourceFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              人材情報 ➜ 案件自動探索・提案メール作成（機能1 & 2-B）
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              スプレッドシートや経歴書の人材を選択すると、受信した案件メール群から最適な案件（Top 10）をAI判定。適合度60%以上の案件には営業提案メールを自動生成します。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Engineer Selector & List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="人材名、スキル (Java, React等) で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">登録元フィルター:</span>
                <div className="flex space-x-1">
                  {['all', 'spreadsheet', 'email'].map((src) => (
                    <button
                      key={src}
                      onClick={() => setSourceFilter(src)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        sourceFilter === src
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {src === 'all' ? 'すべて' : src === 'spreadsheet' ? 'スプレッドシート' : '受信メール'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Engineer Cards List */}
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {filteredEngineers.map((eng) => {
                const isSelected = selectedEngineer?.id === eng.id;
                return (
                  <div
                    key={eng.id}
                    onClick={() => handleSelectEngineer(eng)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{eng.name}</span>
                          {eng.age && <span className="text-xs text-slate-500">({eng.age}歳)</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            eng.source === 'spreadsheet' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {eng.source === 'spreadsheet' ? 'シート' : 'メール'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{eng.title}</p>
                      </div>

                      {/* Resume button */}
                      <button
                        onClick={(e) => openResumeModal(eng, e)}
                        title="職務経歴書を確認 / アップロード"
                        className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                          eng.resume_text || eng.resume_filename
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">経歴書</span>
                      </button>
                    </div>

                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {eng.skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {eng.skills.length > 5 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{eng.skills.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Bottom specs */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>希望: <strong className="text-slate-700 font-semibold">{eng.min_rate || 70}万円〜</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>稼働: <strong className="text-slate-700">{eng.available_from || '即日'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Matched Projects from incoming emails (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedEngineer ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              
              {/* Active Engineer Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">選択中の技術者</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {totalScanned}件の受信案件メールを探索中
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedEngineer.name} への提案可能案件 (適合度順)
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-700 font-bold block">適合度60%以上</span>
                    <span className="text-sm font-extrabold text-emerald-800">{highMatchCount} 件</span>
                  </div>
                </div>
              </div>

              {/* Match Results List */}
              {loadingMatches ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
                  <p className="text-xs font-medium">AIがメール案件との適合度・適合理由を解析中...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">該当する案件メールが見つかりませんでした。</p>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {matches.map((item, idx) => {
                    const { project, match } = item;
                    const isHighMatch = match.score >= 60;
                    
                    // Score badge style
                    const badgeColor = match.score >= 80 
                      ? 'bg-emerald-500 text-white shadow-emerald-200' 
                      : match.score >= 60 
                      ? 'bg-blue-600 text-white shadow-blue-200' 
                      : 'bg-slate-200 text-slate-700 shadow-none';

                    return (
                      <div
                        key={project.id}
                        className={`rounded-xl border p-4.5 transition-all shadow-xs ${
                          isHighMatch 
                            ? 'border-indigo-200 bg-gradient-to-r from-white to-indigo-50/30' 
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Top: Score & Title */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className={`px-2.5 py-1.5 rounded-xl font-black text-sm text-center shadow-sm flex flex-col justify-center ${badgeColor}`}>
                              <span>{match.score}%</span>
                              <span className="text-[9px] font-semibold opacity-90">適合度</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                発信元: {project.client_company || 'パートナー企業'} (受信メール)
                              </span>
                              <h3 className="font-bold text-sm text-slate-900 leading-snug">
                                {project.title}
                              </h3>
                            </div>
                          </div>

                          {/* Feature 1 Action: Proposal Button */}
                          {isHighMatch && (
                            <button
                              onClick={() => openProposal(item)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-200 transition-all flex-shrink-0 animate-pulse hover:animate-none"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>提案メール作成</span>
                            </button>
                          )}
                        </div>

                        {/* Specs row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">必須スキル</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {project.required_skills.join(', ') || '特になし'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">単価</span>
                            <span className="font-semibold text-slate-800">
                              {project.min_rate}〜{project.max_rate}万円
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">勤務形態</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {project.remote_pref || '都内'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">開始時期</span>
                            <span className="font-semibold text-slate-800">
                              {project.start_date || '即日'}
                            </span>
                          </div>
                        </div>

                        {/* AI Match Reasons & Concerns */}
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                          {match.match_reasons.map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-start space-x-1.5 text-slate-700">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                          {match.concern_points.map((concern, cIdx) => (
                            <div key={cIdx} className="flex items-start space-x-1.5 text-amber-800 bg-amber-50/50 p-1.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{concern}</span>
                            </div>
                          ))}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">左側のリストから技術者を選択してください</p>
              <p className="text-xs text-slate-400 mt-1">受信した案件メールとのAIマッチング結果が表示されます。</p>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        proposal={activeProposal}
        engineerName={selectedEngineer?.name || ''}
        projectTitle={activeProjectTitle}
      />

      {/* Resume Modal */}
      <ResumeModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        engineer={resumeTargetEngineer}
        onUploaded={() => {
          loadEngineers();
          if (selectedEngineer) {
            handleSelectEngineer(selectedEngineer);
          }
        }}
      />
    </div>
  );
};
