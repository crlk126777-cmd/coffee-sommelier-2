import React from 'react';
import { Database, FileSpreadsheet, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SheetConfig } from '../../server/sheetsService.ts';

interface HeaderProps {
  sheetConfig: SheetConfig | null;
  isLoadingSheet: boolean;
  onOpenSheetsModal: () => void;
  onOpenKbModal: () => void;
  onRefreshSheet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetConfig,
  isLoadingSheet,
  onOpenSheetsModal,
  onOpenKbModal,
  onRefreshSheet,
}) => {
  const isCustomSheet = sheetConfig?.sourceType === 'google_sheets';
  const isConnected = sheetConfig?.status === 'connected';

  return (
    <header className="border-b border-[#2e231c] bg-[#140e0a]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand and Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#d49758] via-[#a36531] to-[#593414] p-0.5 shadow-lg shadow-amber-950/40 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#1c140e] rounded-[10px] flex items-center justify-center">
              <span className="text-xl select-none" role="img" aria-label="coffee">☕</span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#140e0a] flex items-center justify-center shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-black" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#fbf6f0] font-serif-heading">
                Кофейный сомелье
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase rounded-full bg-[#342417] text-[#e0a96d] border border-[#523823]/60">
                AI Эксперт
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#b09e8f]">
              Персональный помощник по выбору и приготовлению кофе
            </p>
          </div>
        </div>

        {/* Source of Knowledge / Google Sheets Status Badge & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={onOpenSheetsModal}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              isConnected
                ? 'bg-[#1b261b]/80 border-[#2f5530] text-[#86efac] hover:bg-[#1b261b] hover:border-[#3d6e3e]'
                : 'bg-[#241a14] border-[#443124] text-[#e8cbb0] hover:bg-[#2e2119] hover:border-[#634835]'
            }`}
            title="Нажмите, чтобы настроить подключение Google Таблицы"
          >
            <div className="relative">
              <FileSpreadsheet className={`w-4 h-4 ${isConnected ? 'text-[#4ade80]' : 'text-[#d49758]'}`} />
              {isConnected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight flex items-center gap-1">
                {isCustomSheet ? 'Google Sheets' : 'База знаний Google Sheets'}
                {isConnected ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                )}
              </span>
              <span className="text-[10px] text-[#a39385] leading-tight">
                {sheetConfig ? `${sheetConfig.itemCount} записей` : 'Загрузка...'}
              </span>
            </div>
          </button>

          {isCustomSheet && (
            <button
              onClick={onRefreshSheet}
              disabled={isLoadingSheet}
              className="p-1.5 rounded-lg bg-[#241a14] border border-[#443124] text-[#cbb8a7] hover:text-white hover:bg-[#2f221a] transition disabled:opacity-50"
              title="Обновить данные из таблицы"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSheet ? 'animate-spin text-[#d49758]' : ''}`} />
            </button>
          )}

          <button
            onClick={onOpenKbModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#241a14] border border-[#443124] text-[#cbb8a7] hover:text-[#f3e7dc] hover:bg-[#2f221a] hover:border-[#5a4231] transition"
            title="Просмотреть все записи базы знаний"
          >
            <Database className="w-3.5 h-3.5 text-[#d49758]" />
            <span className="hidden sm:inline">База знаний</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#33251c] rounded-full text-[#d6b088]">
              {sheetConfig?.itemCount || 0}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
