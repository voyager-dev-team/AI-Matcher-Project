import React, { useState, useEffect } from 'react';
import { EmailMessage } from '../types';
import { api } from '../services/api';
import { 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Users, 
  Plus,
  FileText,
  Clock
} from 'lucide-react';

export const MailInboxView: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  
  // Input form
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      const data = await api.getEmails();
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await api.parseRawEmail(subject, body, sender);
      setResultMessage(res.message);
      setSubject('');
      setSender('');
      setBody('');
      loadEmails();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fillSampleProject = () => {
    setSubject('【案件情報】Fintech基盤Go/AWSマイクロサービス開発（単価85万/フルリモート）');
    setSender('ses-tokyo@fintech-dev.co.jp');
    setBody(`パートナー様 各位
お世話になっております。株式会社フィンテックデブの鈴木です。

新規の急募案件をご案内いたします。

■ 案件名：決済基盤Go言語マイクロサービス刷新
■ 必須スキル：
・Go言語の実務経験 2年以上
・AWS (ECS, Aurora PostgreSQL) の利用経験
・Dockerコンテナ環境での開発経験
■ 尚可スキル：
・Kubernetesでのコンテナ運用
・gRPCを用いたAPI開発
■ 勤務地：都内（フルリモート）
■ 稼働時期：即日または来月〜
■ 単価：80万 〜 90万円（スキル見合い）
■ 精算幅：140h - 180h
■ 面談回数：1回（オンライン）

ご提案よろしくお願いいたします。`);
  };

  const fillSampleEngineer = () => {
    setSubject('【要員情報】Python / FastAPI / GCP 即戦力シニアエンジニア（34歳・即日・希望80万）');
    setSender('resource@ai-partners.net');
    setBody(`いつもお世話になっております。AIパートナーズの佐藤です。

即日稼働可能なハイスペックエンジニアのご案内です。

【イニシャル】: K.S (34歳・男性)
【職種】: Pythonバックエンド / データ基盤エンジニア
【最寄駅】: JR山手線 恵比寿駅
【稼働開始】: 即日
【希望単価】: 80万円〜
【稼働形態】: フルリモート希望（月1出社可）
【主要スキル】:
・Python, FastAPI : 4年
・GCP (BigQuery, Cloud Run) : 3年
・Docker, PostgreSQL : 5年
・Terraform : 2年
【人物】:
コミュニケーションが円滑で、大規模データ処理のパフォーマンスチューニング経験が豊富です。

案件がございましたらご紹介をお願いいたします。`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 text-white p-2.5 rounded-xl shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              受信メール管理 ＆ AI自然言語パース
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              メーリングリスト等から受信したメール本文をAIが自動分類（案件／人材）し、スキル・単価・勤務地などを構造化データとしてデータベースに蓄積します。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>メール本文の貼り付け解析</span>
              </h2>

              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={fillSampleProject}
                  className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 font-semibold"
                >
                  案件例
                </button>
                <button
                  type="button"
                  onClick={fillSampleEngineer}
                  className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 font-semibold"
                >
                  人材例
                </button>
              </div>
            </div>

            {resultMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{resultMessage}</span>
              </div>
            )}

            <form onSubmit={handleParse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">件名 (Subject):</label>
                <input
                  type="text"
                  placeholder="【案件情報】... または 【要員提案】..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">送信元 (From / 送信企業):</label>
                <input
                  type="text"
                  placeholder="partner@example.com"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">メール本文 (Raw Text):</label>
                <textarea
                  rows={8}
                  placeholder="メーリングリストから届いた案件メール・人材メールの本文をそのままペーストしてください..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !body.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'AI解析中...' : 'メールをAI自動解析して登録'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Received Emails List & Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">
                受信・蓄積済みメール一覧 ({emails.length} 件)
              </span>
              <span className="text-[11px] text-slate-400">クリックで全文確認</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[500px]">
              {/* Mail list (5 cols) */}
              <div className="md:col-span-5 divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {emails.map((m) => {
                  const isSelected = selectedEmail?.id === m.id;
                  const isProject = m.category === 'project';

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedEmail(m)}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isProject 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {isProject ? '案件メール' : '人材メール'}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {m.subject}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {m.sender}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Mail Detail Viewer (7 cols) */}
              <div className="md:col-span-7 p-4 bg-slate-50/50 flex flex-col max-h-[550px]">
                {selectedEmail ? (
                  <div className="flex flex-col h-full space-y-3">
                    <div className="border-b border-slate-200 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          selectedEmail.category === 'project'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {selectedEmail.category === 'project' ? '案件メール' : '人材メール'}
                        </span>
                        <span className="text-[11px] text-slate-400">ID: {selectedEmail.id}</span>
                      </div>
                      <h2 className="font-bold text-sm text-slate-900 mt-1.5">
                        {selectedEmail.subject}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        送信元: <span className="font-medium">{selectedEmail.sender}</span>
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="text-xs font-mono text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.body}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    メールを選択してください
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
