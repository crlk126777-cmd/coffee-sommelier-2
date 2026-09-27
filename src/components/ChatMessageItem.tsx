import React from 'react';
import { User, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category?: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatMessageItemProps {
  message: Message;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 py-3 px-2 sm:px-4 rounded-xl transition-all ${
        isUser
          ? 'justify-end'
          : message.isError
          ? 'bg-rose-950/20 border border-rose-900/30'
          : 'bg-[#1b130e]/70 border border-[#2f2218]/50'
      }`}
    >
      {!isUser && (
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#c89255] to-[#73431d] p-0.5 shrink-0 shadow-sm mt-0.5">
          <div className="w-full h-full bg-[#18110b] rounded-[6px] flex items-center justify-center">
            {message.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#e8ab6e]" />
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name / Category Header */}
        <div className="flex items-center gap-2 mb-1 text-[11px] text-[#9c8979]">
          <span className="font-semibold text-[#cfb7a3]">
            {isUser ? 'Вы' : 'Кофейный сомелье'}
          </span>
          {message.category && message.category !== 'Все' && (
            <span className="px-1.5 py-0.2 rounded bg-[#2b1f16] text-[#c99564] border border-[#3e2c1f] text-[10px]">
              {message.category}
            </span>
          )}
          <span className="text-[10px] text-[#716154]">{message.timestamp}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-[#945f31] to-[#72441d] text-[#fff8f0] rounded-tr-xs shadow-md shadow-amber-950/20'
              : message.isError
              ? 'bg-[#291313] border border-rose-900/40 text-rose-200 rounded-tl-xs'
              : 'bg-[#231811] border border-[#3d2a1c] text-[#f2e6db] rounded-tl-xs shadow-sm'
          }`}
        >
          <div className="whitespace-pre-wrap select-text">{message.content}</div>

          {/* Retry button for error states */}
          {message.isError && onRetry && (
            <div className="mt-3 pt-2 border-t border-rose-900/30 flex items-center justify-end">
              <button
                onClick={onRetry}
                className="text-xs px-2.5 py-1 rounded bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 border border-rose-700/50 transition cursor-pointer"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>

        {/* Actions row for assistant */}
        {!isUser && !message.isError && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <button
              onClick={handleCopy}
              className="text-[11px] text-[#867566] hover:text-[#cca175] flex items-center gap-1 transition"
              title="Скопировать ответ"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-[#2e1f15] border border-[#4a3424] flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-[#d9a87d]" />
        </div>
      )}
    </div>
  );
};
