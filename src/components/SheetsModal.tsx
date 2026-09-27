import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
} from 'lucide-react';
import { SheetConfig } from '../../server/sheetsService.ts';

interface SheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig | null;
  onSync: (url: string) => Promise<boolean>;
  onReset: () => Promise<void>;
  isLoading: boolean;
}

export const SheetsModal: React.FC<SheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSync,
  onReset,
  isLoading,
}) => {
  const [urlInput, setUrlInput] = useState(config?.sheetUrl || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMessage('Пожалуйста, введите ссылку на Google Таблицу.');
      return;
    }

    try {
      const ok = await onSync(trimmed);
      if (ok) {
        setSuccessMessage('Google Таблица успешно подключена и синхронизирована!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка подключения Google Таблицы.');
    }
  };

  const handleReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await onReset();
      setUrlInput('');
      setSuccessMessage('База знаний сброшена к эталонному набору данных (20 записей).');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка при сбросе.');
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/knowledge-base/template-csv';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#19110b] border border-[#3f2b1d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#302115] flex items-center justify-between bg-[#1f150e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f7ece2] font-serif-heading">
                Подключение Google Sheets
              </h2>
              <p className="text-xs text-[#a89585]">
                Единый источник знаний и ответов для «Кофейного сомелье»
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9a8676] hover:text-white hover:bg-[#2b1c12] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              config?.status === 'connected'
                ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
                : 'bg-[#261b13] border-[#4b3524] text-[#e0cfbe]'
            }`}
          >
            {config?.status === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#d49758] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-sm text-[#fff]">
                {config?.sourceType === 'google_sheets'
                  ? 'Подключена внешняя Google Таблица'
                  : 'Используется эталонная база знаний (20 записей)'}
              </div>
              <p className="text-[#bfada0]">
                {config?.sourceType === 'google_sheets'
                  ? `Успешно загружено ${config.itemCount} записей. Ассистент берет факты исключительно из этой таблицы.`
                  : 'Вы можете подключить свою Google Таблицу ниже, чтобы ассистент отвечал на основе ваших данных.'}
              </p>
              {config?.lastSyncedAt && (
                <div className="text-[11px] text-[#8e7a6b]">
                  Последняя синхронизация: {new Date(config.lastSyncedAt).toLocaleString('ru-RU')}
                </div>
              )}
            </div>
          </div>

          {/* Form to submit Google Sheets URL */}
          <form onSubmit={handleSyncSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#cca175] mb-1.5">
                Ссылка на вашу Google Таблицу:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs.../edit"
                  className="w-full bg-[#120b07] border border-[#3f2b1d] rounded-xl px-4 py-2.5 text-sm text-[#f6ede4] placeholder-[#6b5849] focus:outline-none focus:border-[#ba7c42] focus:ring-1 focus:ring-[#ba7c42]"
                />
              </div>
              <p className="text-[11px] text-[#938172] mt-1">
                Поддерживаются любые ссылки вида <code>/spreadsheets/d/&lt;ID&gt;</code> или прямой Spreadsheet ID.
              </p>
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-700/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{successMessage}</div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ba7c42] to-[#8d5423] hover:from-[#c8894d] hover:to-[#9e602b] text-white font-medium text-xs flex items-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Синхронизация...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Подключить и синхронизировать</span>
                  </>
                )}
              </button>

              {config?.sourceType === 'google_sheets' && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#261a12] border border-[#443124] hover:bg-[#322218] text-[#cbb8a7] hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Сбросить к исходной базе</span>
                </button>
              )}
            </div>
          </form>

          {/* Step-by-step instructions */}
          <div className="pt-4 border-t border-[#2e2016] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d49758] uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Инструкция по подключению Google Таблицы:</span>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#c5b4a5] leading-relaxed">
              <li>
                Создайте новую Google Таблицу на Google Диске или откройте существующую.
              </li>
              <li>
                Задайте обязательные столбцы в первой строке:
                <div className="mt-1 p-2 bg-[#120b07] rounded-lg font-mono text-[11px] text-[#e0a96d] border border-[#302115] flex flex-wrap gap-2">
                  <span>category</span> | <span>question</span> | <span>answer</span> | <span>tags</span>
                </div>
              </li>
              <li>
                Заполните записи по категориям кофе (Вкус, Приготовление, Зёрна, Обжарка, Хранение, Свежесть, Вода, Дозировка).
              </li>
              <li>
                В верхнем правом углу Google Таблицы нажмите <strong>«Поделиться» (Share)</strong> и выберите{' '}
                <strong>«Доступ всем, у кого есть ссылка» (Читатель)</strong>.
              </li>
              <li>Вставьте скопированную ссылку в поле выше и нажмите «Подключить».</li>
            </ol>

            {/* Template download action */}
            <div className="pt-2 flex items-center justify-between bg-[#20160f] p-3 rounded-xl border border-[#3b291c]">
              <div className="text-xs">
                <span className="font-semibold text-[#eedbca] block">Нужен готовый пример?</span>
                <span className="text-[#a49182]">
                  Скачайте готовый CSV-шаблон с 20 записями и импортируйте его в Google Таблицу.
                </span>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-[#2e1f15] hover:bg-[#3d2a1d] text-[#e2b083] border border-[#543b27] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать шаблон CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#302115] bg-[#1a110a] flex items-center justify-between text-xs text-[#8a7767]">
          <span>Колоночная схема: category | question | answer | tags</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#271b13] hover:bg-[#342419] text-[#e8dacd] transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
