import React, { useState, useEffect } from 'react';
import { Project, EngineerMatchItem, ProposalEmail } from '../types';
import { api } from '../services/api';
import { ProposalModal } from './ProposalModal';
import { 
  Briefcase, 
  Search, 
  Sparkles, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  UserCheck, 
  MapPin, 
  Clock, 
  CircleDollarSign,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<EngineerMatchItem[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);

  // Proposal / Contact modal
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ProposalEmail | null>(null);
  const [activeEngineerName, setActiveEngineerName] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        handleSelectProject(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = async (prj: Project) => {
    setSelectedProject(prj);
    setLoadingCandidates(true);
    try {
      // Feature 2-A: Match project to incoming email engineers (top 10 candidates)
      const res = await api.matchProjectToEngineers(prj.id, true, 10);
      setCandidates(res.candidates);
      setTotalScanned(res.total_engineers_scanned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openContactProposal = (item: EngineerMatchItem) => {
    if (!item.match.proposal_email) return;
    setActiveProposal(item.match.proposal_email);
    setActiveEngineerName(item.engineer.name);
    setProposalModalOpen(true);
  };

  const filteredProjects = projects.filter((prj) => {
    const matchesSearch = 
      prj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prj.required_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (sourceFilter === 'all') return matchesSearch;
    return matchesSearch && prj.source === sourceFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              案件情報 ➜ 人材メール探索（機能2-A：候補10人）
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              スプレッドシートの案件を指定して、メーリングリストで受信した「人材メール」群から最適な技術者を10名自動探索・ランキング表示します。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Projects List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="案件名、必須スキル (Java, AWS等) で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">案件の登録元:</span>
                <div className="flex space-x-1">
                  {['all', 'spreadsheet', 'email'].map((src) => (
                    <button
                      key={src}
                      onClick={() => setSourceFilter(src)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        sourceFilter === src
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {src === 'all' ? 'すべて' : src === 'spreadsheet' ? 'スプレッドシート' : '受信メール'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {filteredProjects.map((prj) => {
                const isSelected = selectedProject?.id === prj.id;
                return (
                  <div
                    key={prj.id}
                    onClick={() => handleSelectProject(prj)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            prj.source === 'spreadsheet' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {prj.source === 'spreadsheet' ? 'シート案件' : 'メール案件'}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[160px]">
                            {prj.client_company || 'パートナー企業'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                          {prj.title}
                        </h3>
                      </div>
                    </div>

                    {/* Skill tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prj.required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Meta specs */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <CircleDollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>予算: <strong className="text-slate-700">{prj.min_rate}〜{prj.max_rate}万</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>形態: <strong className="text-slate-700 truncate">{prj.remote_pref || '都内'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Top 10 Engineer Candidates from Email (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedProject ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">選択中の案件</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      受信人材メール {totalScanned}件から探索
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                    {selectedProject.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] text-blue-700 font-bold block">推薦候補者</span>
                    <span className="text-sm font-extrabold text-blue-800">Top {candidates.length}名</span>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              {loadingCandidates ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                  <p className="text-xs font-medium">受信人材メールから最適な技術者を解析・マッチング中...</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">該当する候補者メールが見つかりませんでした。</p>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {candidates.map((item, idx) => {
                    const { engineer, match } = item;
                    const badgeColor = match.score >= 80 
                      ? 'bg-emerald-500 text-white' 
                      : match.score >= 60 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-700';

                    return (
                      <div
                        key={engineer.id}
                        className="rounded-xl border border-slate-200 p-4.5 bg-white hover:border-blue-300 transition-all shadow-xs"
                      >
                        {/* Top: Rank, Score, Name */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <div className={`px-2.5 py-1 rounded-lg font-black text-xs text-center ${badgeColor}`}>
                                {match.score}%
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-sm text-slate-900">
                                  {engineer.name}
                                </h3>
                                {engineer.age && <span className="text-xs text-slate-500">({engineer.age}歳)</span>}
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  経験 {engineer.experience_years || 5}年
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                                {engineer.title}
                              </p>
                            </div>
                          </div>

                          {match.score >= 60 && (
                            <button
                              onClick={() => openContactProposal(item)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex-shrink-0"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>打診メール</span>
                            </button>
                          )}
                        </div>

                        {/* Engineer specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">希望単価</span>
                            <span className="font-semibold text-slate-800">
                              {engineer.min_rate || 70}万円〜
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">最寄駅</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {engineer.nearest_station || '都内'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">稼働形態</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {engineer.remote_pref || 'リモート可'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">稼働開始</span>
                            <span className="font-semibold text-slate-800">
                              {engineer.available_from || '即日'}
                            </span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {engineer.skills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* AI Match Reasons */}
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
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">左側のリストから案件を選択してください</p>
              <p className="text-xs text-slate-400 mt-1">受信した人材メール群からTop 10の最適候補者が表示されます。</p>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        proposal={activeProposal}
        engineerName={activeEngineerName}
        projectTitle={selectedProject?.title || ''}
      />
    </div>
  );
};
