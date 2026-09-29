import React, { useState } from 'react';
import { api } from '../services/api';
import { X, FileSpreadsheet, Upload, Link, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface SheetsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SheetsImportModal: React.FC<SheetsImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [sheetUrl, setSheetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImportUrl = async () => {
    if (!sheetUrl.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setResultMessage(null);
    try {
      const res = await api.importSheetUrl(sheetUrl);
      setResultMessage(res.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'インポートに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage(null);
    setResultMessage(null);
    try {
      const res = await api.importSheetFile(file);
      setResultMessage(res.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'ファイルの取り込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleEngineerCSV = () => {
    const csvContent = "氏名,職種,主要スキル,最寄駅,稼働形態,稼働開始時期,希望単価,経験年数,経歴書要約\n" +
      "山田 太郎,Javaバックエンド,Java;Spring Boot;AWS;Docker,新宿駅,フルリモート,即日,75,6,EC基盤刷新プロジェクトにてAPI開発を担当。\n" +
      "加藤 亮,フロントエンド,TypeScript;React;Next.js;Tailwind,渋谷駅,リモート併用,来月1日,70,4,SaaSプロダクトのUI開発をリード。";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_engineers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleProjectCSV = () => {
    const csvContent = "案件名,企業名,必須スキル,尚可スキル,勤務地,稼働形態,開始時期,単価,精算幅\n" +
      "【Java/AWS】基幹決済システム開発,フィンテックパートナーズ,Java;Spring Boot;AWS,Docker;Kubernetes,品川,フルリモート,即日,80-90万,140-180h\n" +
      "【React】DXプラットフォーム刷新,デジタルソリューションズ,React;TypeScript,Next.js;GraphQL,六本木,週1出社,来月,70-80万,140-180h";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_projects.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">スプレッドシート / CSV取込</h3>
              <p className="text-xs text-slate-500">GoogleスプレッドシートやCSVから人材・案件を一括登録</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center space-x-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>GoogleスプレッドシートURL連携</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center space-x-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV / Excelファイルアップロード</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resultMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{resultMessage}</span>
            </div>
          )}

          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Googleスプレッドシートの共有リンク (URL):
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/XXXXXXXXX/edit..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ※スプレッドシートの共有設定を「リンクを知っている全員が閲覧可」に設定してください。
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">ヘッダーの自動判別:</p>
                <p>「氏名」「スキル」「希望単価」等が含まれる場合は<strong>人材シート</strong>として自動登録。</p>
                <p>「案件名」「必須スキル」「単価」等が含まれる場合は<strong>案件シート</strong>として自動登録されます。</p>
              </div>

              <button
                onClick={handleImportUrl}
                disabled={loading || !sheetUrl.trim()}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <span>取り込み中...</span> : <span>スプレッドシートを取り込む</span>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">ファイルを選択</span>
                  <span className="text-xs text-slate-500"> またはドラッグ＆ドロップ</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {file ? (
                  <p className="text-xs font-semibold text-slate-700 mt-2 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                    選択中: {file.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">.csv, .xlsx, .xls に対応</p>
                )}
              </div>

              <button
                onClick={handleImportFile}
                disabled={loading || !file}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <span>アップロード処理中...</span> : <span>ファイルをインポート</span>}
              </button>

              {/* Sample Download Links */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">サンプルCSVフォーマット:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadSampleEngineerCSV}
                    className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
                  >
                    <Download className="w-3 h-3" />
                    <span>人材サンプルCSV</span>
                  </button>
                  <button
                    onClick={downloadSampleProjectCSV}
                    className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
                  >
                    <Download className="w-3 h-3" />
                    <span>案件サンプルCSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
