import React, { useState } from 'react';
import { Engineer } from '../types';
import { api } from '../services/api';
import { X, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineer: Engineer | null;
  onUploaded: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  engineer,
  onUploaded,
}) => {
  if (!isOpen || !engineer) return null;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.uploadResume(engineer.id, file);
      setMessage(`経歴書を取り込みました！ 検出スキル: ${res.skills_detected.join(', ') || 'なし'}`);
      setFile(null);
      setTimeout(() => {
        onUploaded();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'アップロードに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">職務経歴書・スキルシート確認</h3>
              <p className="text-xs text-slate-500">
                技術者: <strong className="text-slate-700">{engineer.name}</strong> ({engineer.title})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload new file */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 block mb-2">経歴書ファイルの追加・更新 (PDF / Word / Text):</span>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{loading ? '解析中...' : 'アップロード・AI解析'}</span>
              </button>
            </div>
            {engineer.resume_filename && (
              <p className="text-[11px] text-slate-500 mt-2">
                現在登録済みファイル: <span className="font-medium text-slate-700">{engineer.resume_filename}</span>
              </p>
            )}
          </div>

          {/* Current Resume Text */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">経歴書テキスト・詳細情報:</label>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-all">
              {engineer.resume_text || engineer.notes || '経歴書テキストがまだ登録されていません。'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
