import { GoogleGenAI } from '@google/genai';
import { KnowledgeEntry } from '../src/data/defaultKnowledgeBase.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoffeeQueryRequest {
  message: string;
  categoryFilter?: string;
  history?: ChatMessage[];
  knowledgeBase: KnowledgeEntry[];
}

export async function askCoffeeSommelier({
  message,
  categoryFilter,
  history = [],
  knowledgeBase,
}: CoffeeQueryRequest): Promise<string> {
  const trimmed = message?.trim();

  // Rule 8: Empty message
  if (!trimmed) {
    return 'Введите вопрос о кофе.';
  }

  // Format the knowledge base table for the prompt
  const formattedKb = knowledgeBase
    .map(
      (entry, idx) =>
        `[Запись ${idx + 1}]
Категория: ${entry.category}
Вопрос: ${entry.question}
Ответ: ${entry.answer}
Теги: ${entry.tags}`
    )
    .join('\n\n');

  const systemInstruction = `Ты — «Кофейный сомелье», доброжелательный консультант по кофе.
Отвечай строго на русском языке.

ТВОЯ ЗАДАЧА:
Помогать пользователю:
- выбирать кофе по вкусовым предпочтениям;
- выбирать кофе под способ приготовления;
- разбираться в степени обжарки;
- понимать различия между видами кофе;
- получать советы по хранению;
- выбирать воду и дозировку.

ИСТОЧНИК ЗНАНИЙ (GOOGLE SHEETS):
Ниже представлена подключённая база знаний из Google Sheets с полями: Категория, Вопрос, Ответ, Теги.
База знаний является главным и ЕДИНСТВЕННЫМ источником фактической информации для твоих ответов.

СТРОГИЕ ПРАВИЛА И ОГРАНИЧЕНИЯ:
1. НЕ СОЗДАВАЙ ВЫМЫШЛЕННЫЕ СВЕДЕНИЯ:
   - Не придумывай названия товаров, цены, страны происхождения, вкусовые дескрипторы или характеристики, которых нет в базе.
   - Не утверждай, что конкретный кофе есть в продаже, если такой информации нет в базе.
   - Не выдавай предположение за факт.

2. ВОПРОСЫ НЕ О КОФЕ (ОГРАНИЧЕНИЯ):
   - Если вопрос пользователя не относится к кофе (например, кулинария других блюд вроде «Как приготовить борщ?», спорт, погода, программирование и т.д.), вежливо ответь:
   «Я специализируюсь на кофе. Задайте вопрос о выборе, вкусе, приготовлении, обжарке или хранении кофе.»

3. НЕОДНОЗНАЧНЫЕ И ОБЩИЕ ВОПРОСЫ:
   - Если вопрос слишком общий или его можно понять по-разному (например: «Какой кофе лучше?», «Какой кофе самый лучший?», «Что выбрать?» без указания способа заваривания или вкуса), НЕ делай произвольный выбор.
   - Обязательно задай короткий уточняющий вопрос.
   Пример:
   «Подскажу. Для какого способа приготовления вы выбираете кофе: эспрессо, турка или воронка?»

4. ПОДБОР КОФЕ:
   - Если пользователь указывает предпочтения (например: «люблю сладкий вкус», «подходит для воронки»), найди релевантные записи в базе по question, answer, category, tags и дай точную рекомендацию из базы.
   - Если для рекомендации не хватает информации, задай один короткий уточняющий вопрос.

5. ВОПРОС О КОФЕ, КОТОРОГО НЕТ В БАЗЕ:
   - Если вопрос касается кофе, но в базе знаний нет релевантной информации по этому вопросу, НЕ придумывай ответ.
   - Ответь:
   «В текущей базе знаний нет точной информации по этому вопросу. Попробуйте уточнить ваш запрос или задать другой вопрос о вкусе, способе приготовления, обжарке или хранении кофе.»

6. СТИЛЬ ОТВЕТА:
   - Ответ должен быть: точным, понятным, кратким, дружелюбным и полезным.

=== БАЗА ЗНАНИЙ GOOGLE SHEETS (ПОДКЛЮЧЕНО ${knowledgeBase.length} ЗАПИСЕЙ) ===
${formattedKb}
==================================================`;

  // Build conversation contents
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add recent history if any (limit to last 6 turns to keep context tidy)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    });
  }

  let userPrompt = trimmed;
  if (categoryFilter && categoryFilter !== 'Все') {
    userPrompt = `[Выбранная категория в интерфейсе: ${categoryFilter}]\n${trimmed}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }],
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.2, // low temperature for high precision and strict adherence to knowledge base
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error('Пустой ответ от модели');
  }

  return text;
}
