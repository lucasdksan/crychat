-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CommercePlatform" AS ENUM ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'custom');

-- CreateEnum
CREATE TYPE "AiProviderKind" AS ENUM ('gemini', 'openai', 'custom');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('search', 'chat_turn', 'product_click', 'product_view', 'add_to_cart', 'custom');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "activeStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "platform" "CommercePlatform" NOT NULL DEFAULT 'vtex',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCredential" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "platform" "CommercePlatform" NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "provider" "AiProviderKind" NOT NULL,
    "model" TEXT NOT NULL,
    "encryptedApiKey" TEXT,
    "baseUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "productRefs" JSONB,
    "toolCalls" JSONB,
    "intent" TEXT,
    "latencyMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "listPrice" DECIMAL(12,2),
    "available" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT,
    "imageUrl" TEXT,
    "embeddingId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "platform" "CommercePlatform" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "zeroResults" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'chat',
    "intent" TEXT,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductClickEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreCredential_storeId_key" ON "StoreCredential"("storeId");

-- CreateIndex
CREATE INDEX "AiProviderConfig_storeId_idx" ON "AiProviderConfig"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderConfig_storeId_provider_key" ON "AiProviderConfig"("storeId", "provider");

-- CreateIndex
CREATE INDEX "ChatSession_storeId_createdAt_idx" ON "ChatSession"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "CatalogProduct_storeId_name_idx" ON "CatalogProduct"("storeId", "name");

-- CreateIndex
CREATE INDEX "CatalogProduct_storeId_updatedAt_idx" ON "CatalogProduct"("storeId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_storeId_externalId_key" ON "CatalogProduct"("storeId", "externalId");

-- CreateIndex
CREATE INDEX "SyncJob_storeId_status_idx" ON "SyncJob"("storeId", "status");

-- CreateIndex
CREATE INDEX "SearchEvent_storeId_createdAt_idx" ON "SearchEvent"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductClickEvent_storeId_createdAt_idx" ON "ProductClickEvent"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_storeId_type_occurredAt_idx" ON "AnalyticsEvent"("storeId", "type", "occurredAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeStoreId_fkey" FOREIGN KEY ("activeStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCredential" ADD CONSTRAINT "StoreCredential_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProviderConfig" ADD CONSTRAINT "AiProviderConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchEvent" ADD CONSTRAINT "SearchEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductClickEvent" ADD CONSTRAINT "ProductClickEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

