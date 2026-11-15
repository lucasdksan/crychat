import type { Product, ProductCategory, SearchFilters } from "@/experience/commerce-types";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

const KNOWN_TERMS = [
  'notebook',
  'programacao',
  'desenvolvimento',
  'celular',
  'smartphone',
  'camera',
  'fone',
  'headphone',
  'monitor',
  '4k',
  'escritorio',
  'workstation',
  'ultrabook',
  'bateria',
  'titanio',
];

function correctTypo(token: string): { corrected: string; wasCorrected: boolean } {
  if (token.length < 4) return { corrected: token, wasCorrected: false };
  if (KNOWN_TERMS.includes(token)) return { corrected: token, wasCorrected: false };

  let bestTerm = token;
  let bestDist = Infinity;
  for (const term of KNOWN_TERMS) {
    const dist = levenshtein(token, term);
    if (dist <= 2 && dist < bestDist) {
      bestDist = dist;
      bestTerm = term;
    }
  }
  return { corrected: bestTerm, wasCorrected: bestTerm !== token };
}

export interface ParsedIntent {
  detectedCategory: ProductCategory | null;
  detectedMaxPrice: number | null;
  detectedMinRamGb: number | null;
  correctedQuery: string | null;
  intentSignals: string[];
}

export function extractQueryIntent(rawQuery: string): ParsedIntent {
  const normalized = normalizeText(rawQuery);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  let correctedAny = false;
  const correctedTokens = tokens.map((token) => {
    const { corrected, wasCorrected } = correctTypo(token);
    if (wasCorrected) correctedAny = true;
    return corrected;
  });
  const text = correctedTokens.join(' ');

  let detectedCategory: ProductCategory | null = null;
  if (/(notebook|laptop|ultrabook|workstation|macbook|pc)/.test(text)) {
    detectedCategory = 'Notebooks';
  } else if (/(celular|smartphone|telefone|iphone|android|camera)/.test(text) && !/monitor/.test(text)) {
    detectedCategory = 'Smartphones';
  } else if (/(fone|headphone|audio|anc|ruido|ouvido)/.test(text)) {
    detectedCategory = 'Áudio';
  } else if (/(monitor|tela|display|4k)/.test(text)) {
    detectedCategory = 'Monitores';
  }

  let detectedMaxPrice: number | null = null;
  const priceMatch = rawQuery.match(/(?:ate|até|abaixo de|menor que|maximo|máximo|orcamento|orçamento)?\s*r?\$?\s*(\d{1,2}[.\s]?\d{3}|\d{3,5})/i);
  if (priceMatch && /(ate|até|abaixo|menos|r\$|reais|orcamento|orçamento)/i.test(rawQuery)) {
    const numeric = Number(priceMatch[1].replace(/[.\s]/g, ''));
    if (!Number.isNaN(numeric) && numeric >= 200 && numeric <= 50000) {
      detectedMaxPrice = numeric;
    }
  }

  let detectedMinRamGb: number | null = null;
  const ramMatch = text.match(/(\d{1,2})\s*gb(?:\s*(?:de\s*)?ram)?/);
  if (ramMatch) {
    const gb = Number(ramMatch[1]);
    if ([8, 12, 16, 32, 64].includes(gb)) {
      detectedMinRamGb = gb;
    }
  }

  const intentSignals: string[] = [];
  if (detectedCategory) intentSignals.push(`Categoria: ${detectedCategory}`);
  if (detectedMinRamGb) intentSignals.push(`RAM mínima: ${detectedMinRamGb} GB`);
  if (detectedMaxPrice) {
    intentSignals.push(`Orçamento: até R$ ${detectedMaxPrice.toLocaleString('pt-BR')}`);
  }
  if (/programacao|dev|codigo|docker|trabalho/.test(text)) {
    intentSignals.push('Uso: Programação e produtividade');
  } else if (/camera|foto|video/.test(text)) {
    intentSignals.push('Foco: Câmera e fotografia');
  } else if (/escritorio|reuniao|ruido/.test(text)) {
    intentSignals.push('Uso: Escritório e chamadas');
  }

  return {
    detectedCategory,
    detectedMaxPrice,
    detectedMinRamGb,
    correctedQuery: correctedAny ? correctedTokens.join(' ') : null,
    intentSignals,
  };
}

export function executeHybridSearch(
  catalog: Product[],
  filters: SearchFilters,
  options?: { inferIntentFromQuery?: boolean },
): {
  products: Product[];
  parsedIntent: ParsedIntent;
  effectiveFilters: SearchFilters;
} {
  const parsedIntent = extractQueryIntent(filters.query);
  const effectiveFilters: SearchFilters = { ...filters };

  if (options?.inferIntentFromQuery && filters.query.trim()) {
    if (effectiveFilters.category === 'Todos' && parsedIntent.detectedCategory) {
      effectiveFilters.category = parsedIntent.detectedCategory;
    }
    if (effectiveFilters.maxPrice === null && parsedIntent.detectedMaxPrice) {
      effectiveFilters.maxPrice = parsedIntent.detectedMaxPrice;
    }
    if (effectiveFilters.minRamGb === null && parsedIntent.detectedMinRamGb) {
      effectiveFilters.minRamGb = parsedIntent.detectedMinRamGb;
    }
  }

  const queryForMatch = normalizeText(parsedIntent.correctedQuery ?? effectiveFilters.query);
  const stopWords = new Set(['quero', 'um', 'uma', 'para', 'com', 'ate', 'de', 'da', 'do', 'em', 'que', 'quais', 'preciso', 'estou', 'procurando', 'boa', 'bom', 'melhor', 'r$', 'reais']);
  const queryTerms = queryForMatch
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !stopWords.has(t) && !/^\d+[.\d]*$/.test(t));

  const scored = catalog
    .map((product) => {
      if (effectiveFilters.category !== 'Todos' && product.category !== effectiveFilters.category) {
        return null;
      }
      if (effectiveFilters.brand !== 'Todas' && product.brand !== effectiveFilters.brand) {
        return null;
      }
      if (effectiveFilters.maxPrice !== null && product.price > effectiveFilters.maxPrice) {
        return null;
      }
      if (
        effectiveFilters.minRamGb !== null &&
        (product.specs.ramGb ?? 0) < effectiveFilters.minRamGb
      ) {
        return null;
      }

      let score = product.rating * 4;
      if (queryTerms.length > 0) {
        const corpus = normalizeText(
          [
            product.name,
            product.brand,
            product.category,
            product.sku,
            product.shortDescription,
            ...product.highlights,
            ...product.semanticKeywords,
            product.specs.processor ?? '',
            product.specs.camera ?? '',
            product.specs.display ?? '',
            product.specs.storage ?? '',
          ].join(' '),
        );

        let hits = 0;
        for (const term of queryTerms) {
          if (normalizeText(product.name).includes(term) || normalizeText(product.sku).includes(term)) {
            score += 30;
            hits++;
          } else if (product.semanticKeywords.some((k) => normalizeText(k).includes(term))) {
            score += 20;
            hits++;
          } else if (corpus.includes(term)) {
            score += 12;
            hits++;
          }
        }

        // If user provided explicit meaningful terms and none matched at all (even after category inference), filter out non-matching items unless category matched
        if (hits === 0 && !parsedIntent.detectedCategory) {
          return null;
        }
        if (hits === 0 && parsedIntent.detectedCategory && product.category !== parsedIntent.detectedCategory) {
          return null;
        }
      }

      if (product.promotionLabel) score += 2;
      return { product, score };
    })
    .filter((entry): entry is { product: Product; score: number } => entry !== null);

  scored.sort((a, b) => {
    switch (effectiveFilters.sortBy) {
      case 'price_asc':
        return a.product.price - b.product.price;
      case 'price_desc':
        return b.product.price - a.product.price;
      case 'rating':
        return b.product.rating - a.product.rating;
      case 'relevance':
      default:
        return b.score - a.score;
    }
  });

  return {
    products: scored.map((s) => s.product),
    parsedIntent,
    effectiveFilters,
  };
}
