import { DEFAULT_KNOWLEDGE_BASE, KnowledgeEntry } from '../src/data/defaultKnowledgeBase.ts';

export interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
  gid?: string;
  sourceType: 'google_sheets' | 'default_template';
  lastSyncedAt: string | null;
  status: 'connected' | 'error' | 'syncing' | 'default';
  errorMessage?: string;
  itemCount: number;
}

// In-memory store for active knowledge base
let activeKnowledgeBase: KnowledgeEntry[] = [...DEFAULT_KNOWLEDGE_BASE];
let activeConfig: SheetConfig = {
  sheetUrl: process.env.GOOGLE_SHEET_URL || '',
  sheetId: '',
  sourceType: 'default_template',
  lastSyncedAt: new Date().toISOString(),
  status: 'default',
  itemCount: DEFAULT_KNOWLEDGE_BASE.length,
};

// Extracts Sheet ID and optional GID from Google Sheets URL
export function parseGoogleSheetUrl(urlOrId: string): { sheetId: string; gid?: string } | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Check if it's already a clean ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return { sheetId: trimmed };
  }

  // Parse standard Google Sheets URLs
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }

  const sheetId = idMatch[1];
  let gid: string | undefined;

  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  }

  return { sheetId, gid };
}

// Robust CSV parser supporting quotes, commas, newlines within quotes
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of CRLF
      }
      currentRow.push(currentCell.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Map CSV matrix to KnowledgeEntry list
export function mapCsvToKnowledgeEntries(rows: string[][]): KnowledgeEntry[] {
  if (rows.length < 2) {
    throw new Error('Таблица пуста или содержит только заголовок. Добавьте записи.');
  }

  // Normalize header names
  const headers = rows[0].map(h => h.toLowerCase().trim());

  const categoryIdx = headers.findIndex(h => h === 'category' || h === 'категория');
  const questionIdx = headers.findIndex(h => h === 'question' || h === 'вопрос');
  const answerIdx = headers.findIndex(h => h === 'answer' || h === 'ответ');
  const tagsIdx = headers.findIndex(h => h === 'tags' || h === 'теги' || h === 'tag');

  if (categoryIdx === -1 || questionIdx === -1 || answerIdx === -1) {
    throw new Error(
      `В таблице не найдены обязательные столбцы. Ожидаемая структура: category | question | answer | tags. Найдено в заголовке: ${headers.join(', ')}`
    );
  }

  const entries: KnowledgeEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const category = row[categoryIdx]?.trim() || 'Разное';
    const question = row[questionIdx]?.trim() || '';
    const answer = row[answerIdx]?.trim() || '';
    const tags = tagsIdx !== -1 ? row[tagsIdx]?.trim() || '' : '';

    if (question && answer) {
      entries.push({
        id: `gs-${i}`,
        category,
        question,
        answer,
        tags,
      });
    }
  }

  if (entries.length === 0) {
    throw new Error('Не найдено ни одной заполненной строки (question и answer должны быть заполнены).');
  }

  return entries;
}

// Fetch knowledge base from a Google Sheet
export async function syncGoogleSheet(urlOrId: string): Promise<{ entries: KnowledgeEntry[]; config: SheetConfig }> {
  const parsed = parseGoogleSheetUrl(urlOrId);

  if (!parsed) {
    throw new Error('Некорректная ссылка на Google Таблицу. Ссылка должна быть вида https://docs.google.com/spreadsheets/d/.../edit');
  }

  const { sheetId, gid } = parsed;
  const exportUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`,
  ];

  let csvText = '';
  let fetchError: Error | null = null;

  for (const exportUrl of exportUrls) {
    try {
      const response = await fetch(exportUrl, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (response.ok) {
        csvText = await response.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
          break; // successfully fetched CSV
        }
      }
    } catch (err: any) {
      fetchError = err;
    }
  }

  if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
    throw new Error(
      'Не удалось загрузить данные из таблицы. Убедитесь, что в настройках доступа Google Таблицы выбран пункт «Доступ всем, у кого есть ссылка» (Читатель) или «Опубликовать в Интернете».'
    );
  }

  const rows = parseCsv(csvText);
  const parsedEntries = mapCsvToKnowledgeEntries(rows);

  activeKnowledgeBase = parsedEntries;
  activeConfig = {
    sheetUrl: urlOrId,
    sheetId,
    gid,
    sourceType: 'google_sheets',
    lastSyncedAt: new Date().toISOString(),
    status: 'connected',
    itemCount: parsedEntries.length,
  };

  return { entries: activeKnowledgeBase, config: activeConfig };
}

// Reset to default base
export function resetToDefaultBase(): { entries: KnowledgeEntry[]; config: SheetConfig } {
  activeKnowledgeBase = [...DEFAULT_KNOWLEDGE_BASE];
  activeConfig = {
    sheetUrl: '',
    sheetId: '',
    sourceType: 'default_template',
    lastSyncedAt: new Date().toISOString(),
    status: 'default',
    itemCount: DEFAULT_KNOWLEDGE_BASE.length,
  };
  return { entries: activeKnowledgeBase, config: activeConfig };
}

export function getActiveKnowledgeBase(): KnowledgeEntry[] {
  return activeKnowledgeBase;
}

export function getActiveConfig(): SheetConfig {
  return activeConfig;
}

// Generate template CSV for users to copy or download
export function generateKnowledgeBaseCsv(entries = DEFAULT_KNOWLEDGE_BASE): string {
  const header = ['category', 'question', 'answer', 'tags'];
  const lines = [
    header.join(','),
    ...entries.map(e => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [escape(e.category), escape(e.question), escape(e.answer), escape(e.tags)].join(',');
    }),
  ];
  return lines.join('\n');
}
