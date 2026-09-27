import React from 'react';
import { HelpCircle, Sparkles, TestTube2 } from 'lucide-react';
import { CategoryName } from '../data/defaultKnowledgeBase.ts';

interface QuickPromptsProps {
  selectedCategory: CategoryName;
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const CATEGORY_PROMPTS: Record<string, string[]> = {
  'Все': [
    'Какой кофе выбрать, если я люблю сладкий вкус?',
    'Какой кофе подходит для воронки?',
    'В чем разница между арабикой и робустой?',
    'Как правильно хранить кофе дома?',
  ],
  'Вкус': [
    'Какой кофе выбрать, если я люблю сладкий вкус?',
    'Какой кофе выбрать, если мне нравится яркая ягодная или цитрусовая кислотность?',
    'Как избавиться от излишней горечи в чашке кофе?',
  ],
  'Приготовление': [
    'Какой кофе подходит для воронки?',
    'Как приготовить кофе в турке (джезве)?',
    'Какой кофе и помол использовать для эспрессо?',
    'Как заваривать кофе во френч-прессе?',
  ],
  'Зёрна': [
    'В чем разница между арабикой и робустой?',
    'Что означает высота произрастания кофе?',
    'Что такое моносорт и микролот?',
  ],
  'Обжарка': [
    'Чем отличаются степени обжарки кофе?',
    'Почему кофе темной обжарки иногда блестит маслянистым блеском?',
  ],
  'Хранение': [
    'Как правильно хранить кофе дома?',
    'Можно ли замораживать кофе в морозилке?',
  ],
  'Свежесть': [
    'Когда кофе готов к употреблению после обжарки и сколько длится пик свежести?',
    'Для чего нужен клапан на кофейной пачке?',
  ],
  'Вода': [
    'Какая вода нужна для вкусного кофе?',
    'Какой температуры должна быть вода для заваривания кофе?',
  ],
  'Дозировка': [
    'Какая стандартная пропорция кофе и воды для фильтра и чашки?',
    'Сколько кофе нужно для двойного эспрессо?',
  ],
};

const OFFICIAL_TEST_SCENARIOS = [
  { label: 'Тест 1 (Вкус: сладкий)', prompt: 'Какой кофе выбрать, если я люблю сладкий вкус?' },
  { label: 'Тест 2 (Приготовление: воронка)', prompt: 'Какой кофе подходит для воронки?' },
  { label: 'Тест 3 (Неоднозначный вопрос)', prompt: 'Какой кофе лучше вообще?' },
  { label: 'Тест 4 (Вопрос не по теме)', prompt: 'Как приготовить борщ?' },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  selectedCategory,
  onSelectPrompt,
  disabled = false,
}) => {
  const prompts = CATEGORY_PROMPTS[selectedCategory] || CATEGORY_PROMPTS['Все'];

  return (
    <div className="space-y-3 pt-2">
      {/* Category Suggestions */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#a89382] uppercase tracking-wider mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#d49758]" />
          <span>Быстрые вопросы ({selectedCategory}):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p)}
              disabled={disabled}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-[#211710] border border-[#3b2a1e] text-[#e0cfbe] hover:bg-[#2e2017] hover:border-[#674934] hover:text-white transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              «{p}»
            </button>
          ))}
        </div>
      </div>

      {/* Official Required Test Scenarios */}
      <div className="pt-2 border-t border-[#261c14]/80">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#cca175] uppercase tracking-wider mb-2">
          <TestTube2 className="w-3.5 h-3.5 text-[#cca175]" />
          <span>Сценарии тестирования ТЗ:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {OFFICIAL_TEST_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(scenario.prompt)}
              disabled={disabled}
              className="group flex items-center justify-between text-left text-xs px-2.5 py-2 rounded-lg bg-[#271d15] border border-[#4d3625] text-[#edd9c6] hover:bg-[#342418] hover:border-[#96633b] hover:text-[#fff6ed] transition disabled:opacity-50 cursor-pointer"
            >
              <span className="truncate pr-1">«{scenario.prompt}»</span>
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#170f0a] border border-[#3f2a1b] text-[#c99564] group-hover:text-amber-200">
                {scenario.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
