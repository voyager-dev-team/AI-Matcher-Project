import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CrossMatchPairItem, ProposalEmail } from '../types';
import { ProposalModal } from './ProposalModal';
import { 
  Users, 
  Briefcase, 
  GitCompare, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  onOpenSheetsModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setCurrentTab,
  onOpenSheetsModal,
}) => {
  const [stats, setStats] = useState({
    engineersCount: 0,
    projectsCount: 0,
    emailsCount: 0,
    highMatchesCount: 0,
  });
  const [topPairs, setTopPairs] = useState<CrossMatchPairItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal modal
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ProposalEmail | null>(null);
  const [activeEngineerName, setActiveEngineerName] = useState('');
  const [activeProjectTitle, setActiveProjectTitle] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [engineers, projects, emails, cross] = await Promise.all([
        api.getEngineers(),
        api.getProjects(),
        api.getEmails(),
        api.crossMatchEmails(60),
      ]);

      setStats({
        engineersCount: engineers.length,
        projectsCount: projects.length,
        emailsCount: emails.length,
        highMatchesCount: cross.pairs.length,
      });

      setTopPairs(cross.pairs.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposal = (pair: CrossMatchPairItem) => {
    if (!pair.proposal_email) return;
    setActiveProposal(pair.proposal_email);
    setActiveEngineerName(pair.engineer.name);
    setActiveProjectTitle(pair.project.title);
    setProposalModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>SES営業DX・AI自動マッチング＆提案メール生成</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            スプレッドシートと受信メールを、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300">
              AIが最短で成約チャンスへ繋ぐ。
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            メーリングリストに届く大量の「案件」「人材」メールと、Googleスプレッドシートの情報をAIがリアルタイム解析。適合度判定、60%以上の案件への提案メール自動作成、双方向Top10探索をワンストップで実行します。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentTab('engineers')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>人材から案件を探す (機能1)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setCurrentTab('cross')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/15 backdrop-blur-xs transition-all flex items-center space-x-2"
            >
              <GitCompare className="w-4 h-4" />
              <span>メール同士の自動突合 (機能3)</span>
            </button>

            <button
              onClick={onOpenSheetsModal}
              className="px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>シート連携</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-10 w-72 h-72 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">蓄積人材数</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {stats.engineersCount} <span className="text-xs font-normal text-slate-400">名</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">スプレッドシート & 受信メール</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">蓄積案件数</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {stats.projectsCount} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">募集要項・単価・条件データ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">受信メール総数</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {stats.emailsCount} <span className="text-xs font-normal text-slate-400">通</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">AI解析済みのMLメール</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-md text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100">60%以上の商談チャンス</span>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {stats.highMatchesCount} <span className="text-xs font-normal text-emerald-100">組</span>
          </div>
          <p className="text-[11px] text-emerald-100/90 mt-1">提案メール即時作成可能</p>
        </div>
      </div>

      {/* Feature Navigation Cards (機能1, 機能2, 機能3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Feature 1 Card */}
        <div 
          onClick={() => setCurrentTab('engineers')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                機能 １
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
              人材 ➜ 受信案件メール探索 ＆ 提案メール作成
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              技術者の経歴書を読み込ませ、受信した案件メール群から最適な案件を抽出。適合度60%以上の案件には、営業提案メール文面を自動生成します。
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>機能１を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 2 Card */}
        <div 
          onClick={() => setCurrentTab('projects')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                機能 ２
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
              双方向マッチング (案件 ⇔ 人材 Top 10)
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              スプレッドシートの案件から受信人材メールの10人候補を探索。また人材から受信案件メール10件を高速検索します。
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>機能２を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 3 Card */}
        <div 
          onClick={() => setCurrentTab('cross')}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <GitCompare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                機能 ３
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
              メール同士の全自動クロス突合
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              メーリングリストで飛び交う「案件メール」と「人材メール」同士をAIが自律的にクロス突合し、商談ペアをレコメンドします。
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <span>機能３を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Highlighted AI Matches */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                最新のAI高適合度マッチング（商談推奨）
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              受信メール群から即座に商談化できる組み合わせをピックアップしています。
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('cross')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>全件を見る</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {topPairs.map((pair, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                    適合度 {pair.score}%
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {pair.engineer.name}
                  </span>
                </div>

                {pair.proposal_email && (
                  <button
                    onClick={() => handleOpenProposal(pair)}
                    className="text-[11px] bg-indigo-600 text-white font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>提案下書き</span>
                  </button>
                )}
              </div>

              <p className="text-xs font-medium text-slate-700 mt-2 line-clamp-1">
                ➜ {pair.project.title}
              </p>

              <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                {pair.match_reasons.slice(0, 1).map((r, rIdx) => (
                  <div key={rIdx} className="flex items-start space-x-1 text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
