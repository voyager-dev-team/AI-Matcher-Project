import React, { useState, useEffect } from 'react';
import { CrossMatchPairItem, ProposalEmail } from '../types';
import { api } from '../services/api';
import { ProposalModal } from './ProposalModal';
import { 
  GitCompare, 
  Sparkles, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  SlidersHorizontal,
  Users,
  Briefcase,
  TrendingUp,
  CircleDollarSign
} from 'lucide-react';

export const CrossMatchView: React.FC = () => {
  const [pairs, setPairs] = useState<CrossMatchPairItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState<number>(60);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalEngineers, setTotalEngineers] = useState(0);

  // Proposal modal
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ProposalEmail | null>(null);
  const [activeEngineerName, setActiveEngineerName] = useState('');
  const [activeProjectTitle, setActiveProjectTitle] = useState('');

  useEffect(() => {
    loadCrossMatches(minScore);
  }, [minScore]);

  const loadCrossMatches = async (score: number) => {
    setLoading(true);
    try {
      const data = await api.crossMatchEmails(score);
      setPairs(data.pairs);
      setTotalProjects(data.total_email_projects);
      setTotalEngineers(data.total_email_engineers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openProposal = (pair: CrossMatchPairItem) => {
    if (!pair.proposal_email) return;
    setActiveProposal(pair.proposal_email);
    setActiveEngineerName(pair.engineer.name);
    setActiveProjectTitle(pair.project.title);
    setProposalModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 text-white p-2.5 rounded-xl shadow-md">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              メール同士の全自動クロス突合（機能3）
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              メーリングリストから届いた「案件メール」と「人材メール」をAIが自動解析し、商談成立の可能性が高い組み合わせをリアルタイム突合します。
            </p>
          </div>
        </div>

        {/* Stats badge */}
        <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold">受信案件メール</span>
            <span className="text-sm font-bold text-slate-800">{totalProjects} 件</span>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold">受信人材メール</span>
            <span className="text-sm font-bold text-slate-800">{totalEngineers} 件</span>
          </div>
          <div className="text-center px-3">
            <span className="text-[10px] text-purple-600 block font-bold">推奨商談ペア</span>
            <span className="text-sm font-extrabold text-purple-700">{pairs.length} 組</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">最低適合度フィルター:</span>
          <div className="flex items-center space-x-2">
            {[50, 60, 70, 80].map((score) => (
              <button
                key={score}
                onClick={() => setMinScore(score)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  minScore === score
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {score}% 以上
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500">
          適合度60%以上のペアには、営業提案メールが自動生成されます
        </span>
      </div>

      {/* Pairs List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <Sparkles className="w-8 h-8 mx-auto animate-spin text-purple-500" />
          <p className="text-sm font-medium">メール同士のスキル・単価・稼働条件をクロス分析中...</p>
        </div>
      ) : pairs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <GitCompare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">適合度 {minScore}% 以上のペアは見つかりませんでした</p>
          <p className="text-xs text-slate-400 mt-1">フィルターの適合度を下げるか、新しいメールを取り込んでください。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pairs.map((pair, idx) => {
            const { engineer, project, score, match_reasons, concern_points } = pair;
            const badgeColor = score >= 80 
              ? 'bg-emerald-500 text-white' 
              : score >= 60 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-200 text-slate-700';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all"
              >
                {/* Header with Score & Action */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1.5 rounded-xl font-black text-sm text-center shadow-xs flex items-center space-x-1 ${badgeColor}`}>
                      <span>適合度</span>
                      <span className="text-base">{score}%</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      商談推奨ペア #{idx + 1}
                    </span>
                  </div>

                  {pair.proposal_email && (
                    <button
                      onClick={() => openProposal(pair)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>商談メール下書きを確認</span>
                    </button>
                  )}
                </div>

                {/* Side-by-Side Match View */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                  {/* Left: Engineer Box (5 cols) */}
                  <div className="md:col-span-5 bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>受信人材メール</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        希望 {engineer.min_rate || 70}万〜
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {engineer.name}
                      {engineer.age && <span className="text-xs font-normal text-slate-500 ml-1">({engineer.age}歳)</span>}
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                      {engineer.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {engineer.skills.slice(0, 5).map((s, sIdx) => (
                        <span key={sIdx} className="bg-white text-indigo-800 text-[10px] px-1.5 py-0.5 rounded border border-indigo-200 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle Arrow (1 col) */}
                  <div className="hidden md:flex md:col-span-1 justify-center">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>

                  {/* Right: Project Box (5 cols) */}
                  <div className="md:col-span-5 bg-blue-50/50 rounded-xl p-3.5 border border-blue-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span>受信案件メール</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        予算 {project.min_rate}〜{project.max_rate}万
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 line-clamp-1">
                      {project.title}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      発注元: {project.client_company || 'パートナー企業'} ({project.remote_pref || '都内'})
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.required_skills.slice(0, 5).map((s, sIdx) => (
                        <span key={sIdx} className="bg-white text-blue-800 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                  {match_reasons.map((reason, rIdx) => (
                    <div key={rIdx} className="flex items-start space-x-1.5 text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  {concern_points.map((concern, cIdx) => (
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

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        proposal={activeProposal}
        engineerName={activeEngineerName}
        projectTitle={activeProjectTitle}
      />
    </div>
  );
};
