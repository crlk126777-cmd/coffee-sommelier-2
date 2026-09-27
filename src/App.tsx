import React, { useState, useEffect, useRef } from 'react';
import {
  Coffee,
  Sparkles,
  Trash2,
  RefreshCw,
  Info,
  ExternalLink,
  MessageSquare,
  Flame,
  Droplets,
  Scale,
  FileSpreadsheet,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { CategoryChips } from './components/CategoryChips.tsx';
import { ChatMessageItem, Message } from './components/ChatMessageItem.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { QuickPrompts } from './components/QuickPrompts.tsx';
import { SheetsModal } from './components/SheetsModal.tsx';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal.tsx';
import {
  CategoryName,
  DEFAULT_KNOWLEDGE_BASE,
  KnowledgeEntry,
} from './data/defaultKnowledgeBase.ts';
import { SheetConfig } from '../server/sheetsService.ts';

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    'Приветствую! Я «Кофейный сомелье» — ваш персональный AI-консультант по кофе ☕\n\nЯ помогу вам:\n• подобрать кофе по вкусовым предпочтениям (сладкий, ягодный, без горечи);\n• выбрать зёрна и помол под ваш способ приготовления (воронка, эспрессо, турка, френч-пресс);\n• разобраться в степенях обжарки и видах зёрен (арабика и робуста);\n• узнать секреты правильного хранения, выбора воды и пропорций заваривания.\n\nВсе мои ответы строго основаны на подключённой базе знаний Google Sheets. Задайте мне любой вопрос или выберите тему выше!',
  timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
};

export default function App() {
  // Knowledge Base & Google Sheets state
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>(DEFAULT_KNOWLEDGE_BASE);
  const [sheetConfig, setSheetConfig] = useState<SheetConfig | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Все');

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingChat]);

  // Load knowledge base status on mount
  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setIsLoadingSheet(true);
      const res = await fetch('/api/knowledge-base');
      const data = await res.json();
      if (data.success) {
        setKnowledgeBase(data.entries);
        setSheetConfig(data.config);
      }
    } catch (err) {
      console.warn('Could not fetch knowledge base info from server:', err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleSyncGoogleSheet = async (url: string): Promise<boolean> => {
    setIsLoadingSheet(true);
    try {
      const res = await fetch('/api/knowledge-base/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка синхронизации Google Таблицы.');
      }

      setKnowledgeBase(data.entries);
      setSheetConfig(data.config);

      // System notification inside chat
      const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `🟢 База знаний успешно синхронизирована с Google Sheets! Загружено ${data.entries.length} записей. Теперь я использую эти данные для консультаций.`,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, sysMsg]);

      return true;
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleResetGoogleSheet = async () => {
    setIsLoadingSheet(true);
    try {
      const res = await fetch('/api/knowledge-base/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setKnowledgeBase(data.entries);
        setSheetConfig(data.config);
      }
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoadingChat) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      category: selectedCategory !== 'Все' ? selectedCategory : undefined,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoadingChat(true);
    setLastFailedMessage(null);

    try {
      // Build conversation history for API
      const historyPayload = messages
        .filter(m => !m.isError && m.id !== 'welcome-msg')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          categoryFilter: selectedCategory,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось получить ответ. Попробуйте ещё раз.');
      }

      const sommelierMsg: Message = {
        id: `som-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        category: selectedCategory !== 'Все' ? selectedCategory : undefined,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, sommelierMsg]);
    } catch (err: any) {
      console.error('Chat submit error:', err);
      setLastFailedMessage(userText);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Не удалось получить ответ. Попробуйте ещё раз.',
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setLastFailedMessage(null);
  };

  // Count items by category for chips
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { Все: knowledgeBase.length };
    knowledgeBase.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [knowledgeBase]);

  return (
    <div className="min-h-screen flex flex-col bg-[#100c09] text-[#f4ece3] selection:bg-[#c89255]/30">
      {/* Top Header */}
      <Header
        sheetConfig={sheetConfig}
        isLoadingSheet={isLoadingSheet}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenKbModal={() => setIsKbModalOpen(true)}
        onRefreshSheet={() => sheetConfig?.sheetUrl && handleSyncGoogleSheet(sheetConfig.sheetUrl)}
      />

      {/* Categories Bar */}
      <CategoryChips
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
        {/* Intro Hero Banner */}
        <section className="bg-gradient-to-r from-[#211610] via-[#1a110c] to-[#251811] border border-[#3a281c] rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
            <Coffee className="w-56 h-56 text-amber-200" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold font-serif-heading text-[#faeee1] tracking-tight">
                  Кофейный сомелье
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#352518] text-[#e0ab72] border border-[#5a3f2b]">
                  {selectedCategory !== 'Все' ? `Тема: ${selectedCategory}` : 'Все темы'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#b8a798] max-w-2xl leading-relaxed">
                Персональный консультант по кофе. Помогу выбрать зёрна под воронку, эспрессо или турку,
                расскажу о степенях обжарки, балансе вкуса, правильном хранении и воде.
                Все факты берутся исключительно из подключённой <strong>Google Таблицы</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#2b1e15] hover:bg-[#38271b] border border-[#4d3624] text-xs text-[#ddb084] hover:text-[#fff2e4] flex items-center gap-1.5 transition cursor-pointer"
                title="Настроить таблицу"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Таблица</span>
              </button>

              {messages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="px-3 py-1.5 rounded-xl bg-[#221710] hover:bg-[#2e1f16] border border-[#3e2b1d] text-xs text-[#9d8a7a] hover:text-[#f2e6dc] flex items-center gap-1.5 transition cursor-pointer"
                  title="Очистить переписку"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Очистить чат</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Chat Messages Scroll Window */}
        <section className="flex-1 bg-[#140e0a]/80 border border-[#2d2016] rounded-2xl p-3 sm:p-5 flex flex-col gap-2 min-h-[360px] max-h-[580px] overflow-y-auto shadow-inner">
          <div className="space-y-3">
            {messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onRetry={msg.isError ? handleRetry : undefined}
              />
            ))}

            {/* Loading state indicator */}
            {isLoadingChat && (
              <div className="flex items-start gap-3 py-3 px-3 sm:px-4 rounded-xl bg-[#1b130e]/70 border border-[#2f2218]/50 animate-fadeIn">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c89255] to-[#73431d] p-0.5 shrink-0 shadow-sm mt-0.5">
                  <div className="w-full h-full bg-[#18110b] rounded-[6px] flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-[#e8ab6e] animate-bounce" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#cfb7a3]">
                    Кофейный сомелье
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#cca175]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#cca175] animate-ping" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#cca175] animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#cca175]" />
                    </div>
                    <span>Ищу точный ответ в базе знаний Google Sheets...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Quick Question Prompts */}
        <QuickPrompts
          selectedCategory={selectedCategory}
          onSelectPrompt={handleSendMessage}
          disabled={isLoadingChat}
        />

        {/* Chat Input Section */}
        <section className="sticky bottom-2 z-20 pt-2">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            selectedCategory={selectedCategory}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#261c14] py-3 text-center text-xs text-[#7d6c5e] mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>«Кофейный сомелье» — Персональный AI-консультант по кофе</span>
          <span className="flex items-center gap-1">
            <span>База знаний:</span>
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-[#c89255] hover:underline cursor-pointer"
            >
              Google Sheets ({knowledgeBase.length} записей)
            </button>
          </span>
        </div>
      </footer>

      {/* Google Sheets Connection Modal */}
      <SheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetConfig}
        onSync={handleSyncGoogleSheet}
        onReset={handleResetGoogleSheet}
        isLoading={isLoadingSheet}
      />

      {/* Knowledge Base Record Explorer Modal */}
      <KnowledgeBaseModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        entries={knowledgeBase}
        onSelectQuestion={handleSendMessage}
      />
    </div>
  );
}
