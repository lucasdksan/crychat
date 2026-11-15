export type ExperienceMode = 'hybrid' | 'discover' | 'classic';

export type CommerceProvider =
  | 'vtex'
  | 'shopify'
  | 'woocommerce'
  | 'nuvemshop'
  | 'custom';

export type AIProviderId =
  | 'google-gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'mistral';

export type AIQuotaMode = 'crychat-managed' | 'customer-byok';

export type PineconeQuotaMode = 'crychat-quota' | 'customer-token';

export type ProductCategory =
  | 'Notebooks'
  | 'Smartphones'
  | 'Áudio'
  | 'Monitores';

export interface ProductSpecs {
  processor?: string;
  ramGb?: number;
  storage?: string;
  display?: string;
  camera?: string;
  battery?: string;
  connectivity?: string;
  weight?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  imageKey: string;
  imageUrl?: string;
  shortDescription: string;
  highlights: string[];
  specs: ProductSpecs;
  semanticKeywords: string[];
  promotionLabel?: string;
  vectorIndexedAt: string;
}

export interface SearchFilters {
  query: string;
  category: ProductCategory | 'Todos';
  minRamGb: number | null;
  maxPrice: number | null;
  brand: string | 'Todas';
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
}

export interface IntegrationConfig {
  provider: CommerceProvider;
  label: string;
  connected: boolean;
  storeDomain: string;
  appKeyMasked: string;
  webhookActive: boolean;
  lastSyncAt: string | null;
  indexedVectors: number;
  syncStatus: 'ok' | 'pending' | 'error';
}

export interface PineconeConfig {
  mode: PineconeQuotaMode;
  indexName: string;
  region: string;
  namespace: string;
  tokenMasked: string;
  dimensions: number;
  vectorsCount: number;
  lastIndexedAt: string | null;
}

export interface AIConfig {
  provider: AIProviderId;
  quotaMode: AIQuotaMode;
  model: string;
  tone: 'Consultivo' | 'Técnico' | 'Objetivo';
  temperature: number;
  maxRecommendations: number;
  monthlyTokenLimit: number;
  tokensUsed: number;
  welcomeMessage: string;
  starterPrompts: string[];
}

export interface VisualCustomization {
  primaryColor: string;
  borderRadiusPx: number;
  cardDensity: 'detalhado' | 'compacto';
  widgetPosition: 'bottom-right' | 'bottom-left';
  installTarget: 'floating-widget' | 'search-bar' | 'hybrid-page' | 'custom-slot';
  customCss: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  defaultMode: ExperienceMode;
  integrations: IntegrationConfig[];
  pineconeConfig: PineconeConfig;
  aiConfig: AIConfig;
  visualConfig: VisualCustomization;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendedProductIds?: string[];
  compareProductIds?: string[];
  appliedFilters?: Partial<SearchFilters>;
  suggestedFollowUps?: string[];
  escalatedToHuman?: boolean;
  visualMatchSummary?: string;
  feedbackVote?: 'helpful' | 'unhelpful';
}

export interface SatisfactionFeedback {
  id: string;
  rating: number; // 1 to 5
  helpful: boolean;
  context: 'chat' | 'busca' | 'comparacao';
  reason?: string;
  comment?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  tenantId: string;
  searchesCount: number;
  conversationsCount: number;
  productViewsCount: number;
  recommendationClicksCount: number;
  comparisonsCount: number;
  satisfactionPercent: number;
  averageRating: number;
  totalFeedbackCount: number;
  helpfulResponsesCount: number;
  unhelpfulResponsesCount: number;
  recentFeedbacks: SatisfactionFeedback[];
  zeroResultQueries: { query: string; count: number; lastSeenAt: string }[];
  topIntents: {
    intent: string;
    category: string;
    queries: number;
    ctrPercent: number;
    satisfactionPercent: number;
  }[];
  dailySeries: {
    day: string;
    searches: number;
    conversations: number;
    positiveRatings: number;
    negativeRatings: number;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}
