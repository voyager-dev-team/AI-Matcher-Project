import React, { useState } from 'react';
import { ProposalEmail } from '../types';
import { X, Copy, Check, ExternalLink, Send, Sparkles, AlertCircle } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProposalEmail | null;
  engineerName: string;
  projectTitle: string;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  engineerName,
  projectTitle,
}) => {
  if (!isOpen || !proposal) return null;

  const [toAddress, setToAddress] = useState(proposal.to_address || '');
  const [subject, setSubject] = useState(proposal.subject || '');
  const [body, setBody] = useState(proposal.body || '');
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleCopy = () => {
    const fullText = `宛先: ${toAddress}\n件名: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailer = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toAddress)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">提案メール自動生成（営業下書き確認）</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  適合度 {proposal.match_score}%
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xl">
                技術者: <span className="font-semibold text-slate-700">{engineerName}</span> ➜ 案件: <span className="font-semibold text-slate-700">{projectTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center space-x-2 text-xs text-amber-8適合度00 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            AIが自動生成した推薦文面です。内容を確認・編集のうえ、<strong>営業担当者の判断</strong>で送信またはコピーしてください。
          </span>
        </div>

        {/* Editor Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* To Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">宛先 (To):</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="client-partner@example.com"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">件名 (Subject):</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">本文 (Body):</label>
              <span className="text-[11px] text-slate-400">直接編集できます</span>
            </div>
            <textarea
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs font-mono leading-relaxed p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Approval Checkbox */}
          <div className="pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                営業担当者として提案内容を確認し、送信対象として承認する
              </span>
            </label>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            閉じる
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">コピー完了！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>全文をコピー</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenMailer}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                isApproved
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>メーラーで開いて送信</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
