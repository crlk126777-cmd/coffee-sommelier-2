import React from 'react';
import {
  Sparkles,
  Flame,
  Coffee,
  Package,
  Clock,
  Droplets,
  Scale,
  SlidersHorizontal,
  Heart,
} from 'lucide-react';
import { CategoryName } from '../data/defaultKnowledgeBase.ts';

interface CategoryChipsProps {
  selectedCategory: CategoryName;
  onSelectCategory: (category: CategoryName) => void;
  categoryCounts?: Record<string, number>;
}

interface CategoryMeta {
  name: CategoryName;
  icon: React.ReactNode;
  hint: string;
}

const CATEGORY_ITEMS: CategoryMeta[] = [
  { name: 'Все', icon: <SlidersHorizontal className="w-3.5 h-3.5" />, hint: 'Все темы и разделы' },
  { name: 'Вкус', icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, hint: 'Сладость, кислотность, горечь' },
  { name: 'Приготовление', icon: <Coffee className="w-3.5 h-3.5 text-amber-400" />, hint: 'Воронка, турка, эспрессо, френч-пресс' },
  { name: 'Зёрна', icon: <Sparkles className="w-3.5 h-3.5 text-yellow-400" />, hint: 'Арабика, робуста, высота, микролоты' },
  { name: 'Обжарка', icon: <Flame className="w-3.5 h-3.5 text-orange-400" />, hint: 'Светлая, средняя, темная, профили' },
  { name: 'Хранение', icon: <Package className="w-3.5 h-3.5 text-emerald-400" />, hint: 'Клапаны, упаковка, температура' },
  { name: 'Свежесть', icon: <Clock className="w-3.5 h-3.5 text-blue-400" />, hint: 'Дегазация, пик вкуса, сроки' },
  { name: 'Вода', icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />, hint: 'Минерализация, TDS, температура' },
  { name: 'Дозировка', icon: <Scale className="w-3.5 h-3.5 text-purple-400" />, hint: 'Пропорции 1:16, граммовки, весы' },
];

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="bg-[#18110b] border-b border-[#2d2219] py-3 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9b8979] flex items-center gap-1.5">
            <span>Категории базы знаний</span>
            <span className="text-[#6d5e53]">|</span>
            <span className="text-[#c89255] font-normal lowercase">выберите тему для фильтрации</span>
          </span>

          {selectedCategory !== 'Все' && (
            <button
              onClick={() => onSelectCategory('Все')}
              className="text-[11px] text-[#cca175] hover:text-[#f8e5d0] hover:underline transition"
            >
              Сбросить фильтр
            </button>
          )}
        </div>

        {/* Scrollable chip container */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {CATEGORY_ITEMS.map(cat => {
            const isSelected = selectedCategory === cat.name;
            const count = categoryCounts[cat.name];

            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#b3753b] to-[#8d5423] text-white border-[#d89758] shadow-md shadow-amber-950/40 ring-2 ring-[#d89758]/20 scale-102'
                    : 'bg-[#221811] text-[#d6c5b6] border-[#38281d] hover:bg-[#2c2017] hover:border-[#573f2f] hover:text-[#fff4ea]'
                }`}
                title={`${cat.name}: ${cat.hint}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-black/30 text-amber-100'
                        : 'bg-[#2f2217] text-[#9d8978]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
