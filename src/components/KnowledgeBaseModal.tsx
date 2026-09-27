import React, { useState, useMemo } from 'react';
import { X, Search, Database, Tag, BookOpen, Layers } from 'lucide-react';
import { KnowledgeEntry, KNOWLEDGE_CATEGORIES, CategoryName } from '../data/defaultKnowledgeBase.ts';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: KnowledgeEntry[];
  onSelectQuestion: (question: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectQuestion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryName>('Все');

  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const matchesCategory =
        activeCategory === 'Все' || item.category.toLowerCase() === activeCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [entries, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#18110b] border border-[#3e2c1f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d1f14] bg-[#1e150f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f8ede2] font-serif-heading">
                Активная база знаний ({entries.length} записей)
              </h2>
              <p className="text-xs text-[#a18f80]">
                Структура: category | question | answer | tags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9a8676] hover:text-white hover:bg-[#2e1f15] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-[#2d1f14] bg-[#1a120c] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a7767] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросу, ответу или тегам..."
              className="w-full bg-[#120b07] border border-[#372619] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#f6eee7] placeholder-[#6b594b] focus:outline-none focus:border-[#ba7c42]"
            />
          </div>

          {/* Category Chips inside modal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#ba7c42] text-white'
                    : 'bg-[#241a12] text-[#c0ada0] hover:bg-[#322319] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Records list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs leading-relaxed flex-1">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-[#8e7c6d]">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#cca175]" />
              <p>Записи не найдены по заданным критериям.</p>
            </div>
          ) : (
            filteredEntries.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 rounded-xl bg-[#20160f] border border-[#382619] hover:border-[#5a3f2b] transition space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#332317] border border-[#4d3624] text-[11px] font-semibold text-[#e2b083]">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[#716053]">#{index + 1}</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectQuestion(item.question);
                      onClose();
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-[#2e1f15] hover:bg-[#ba7c42] text-[#cca175] hover:text-white border border-[#483322] hover:border-transparent transition cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Спросить ассистента</span>
                  </button>
                </div>

                <div className="font-semibold text-sm text-[#f8ede3] group-hover:text-amber-200 transition">
                  {item.question}
                </div>

                <div className="text-[#c8b7a7] text-xs leading-relaxed pl-2 border-l-2 border-[#543b27]">
                  {item.answer}
                </div>

                {item.tags && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap text-[10px] text-[#8e7a6b]">
                    <Tag className="w-3 h-3 text-[#b37e4c]" />
                    <span>{item.tags}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2d1f14] bg-[#1a120c] flex items-center justify-between text-xs text-[#8a7767]">
          <span>Показано: {filteredEntries.length} из {entries.length} записей</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#241a12] hover:bg-[#342419] text-[#e8dacd] transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
