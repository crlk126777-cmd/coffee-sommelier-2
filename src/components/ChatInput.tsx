import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, AlertCircle } from 'lucide-react';
import { CategoryName } from '../data/defaultKnowledgeBase.ts';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  selectedCategory: CategoryName;
  onClearInputError?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedCategory,
}) => {
  const [inputText, setInputText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isLoading) return;

    const trimmed = inputText.trim();
    if (!trimmed) {
      // Required exact validation message in rule 8
      setValidationError('Введите вопрос о кофе.');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    setValidationError(null);
    onSendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (validationError && e.target.value.trim()) {
      setValidationError(null);
    }
  };

  return (
    <div className="w-full">
      {/* Validation warning banner */}
      {validationError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <div className="relative flex-1 rounded-2xl bg-[#1e150f] border border-[#3f2c1e] focus-within:border-[#9c6a3c] focus-within:ring-2 focus-within:ring-[#9c6a3c]/20 transition-all shadow-inner">
          {/* Active Category Indicator inside input */}
          {selectedCategory !== 'Все' && (
            <div className="px-3.5 pt-2 text-[10px] text-[#c4925e] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c4925e]" />
              <span>Тема запроса: <strong>{selectedCategory}</strong></span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              selectedCategory !== 'Все'
                ? `Спросите о категории «${selectedCategory}» или задайте любой вопрос о кофе...`
                : 'Задайте вопрос о выборе зёрен, вкусе, обжарке, воронке, воде...'
            }
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-[#f6ece2] placeholder-[#817062] focus:outline-none disabled:opacity-60 max-h-[140px] overflow-y-auto leading-relaxed"
          />

          <div className="px-3 pb-2 flex items-center justify-between text-[11px] text-[#6b5b4e]">
            <span className="hidden sm:inline">
              <strong>Enter</strong> — отправить, <strong>Shift + Enter</strong> — новая строка
            </span>
            <span className="sm:hidden text-[10px]">Кофейный сомелье</span>
            <span>{inputText.length > 0 ? `${inputText.length} симв.` : ''}</span>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`h-11 sm:h-12 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 shadow-md ${
            isLoading
              ? 'bg-[#3b281b] text-[#8e7663] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#ba7c42] to-[#8d5423] hover:from-[#c8894d] hover:to-[#9e602b] text-white shadow-amber-950/40 hover:shadow-lg active:scale-97 cursor-pointer'
          }`}
          title="Отправить сообщение"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-amber-200/30 border-t-amber-200 rounded-full animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Спросить</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
