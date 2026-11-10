import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export class StoreCredentialsCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreCredentialsCryptoError";
  }
}

function parseEncryptionKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new StoreCredentialsCryptoError(
      "CREDENTIALS_ENCRYPTION_KEY não está configurada.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new StoreCredentialsCryptoError(
      "CREDENTIALS_ENCRYPTION_KEY deve ter 32 bytes em base64.",
    );
  }
  return key;
}

function aadFor(storeId: string): Buffer {
  return Buffer.from(`store:${storeId}:credentials`, "utf8");
}

export function encryptStorePayload(storeId: string, payload: string): string {
  const key = parseEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv) as CipherGCM;
  cipher.setAAD(aadFor(storeId));
  const ciphertext = Buffer.concat([
    cipher.update(payload, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptStorePayload(
  storeId: string,
  payload: string,
): string {
  const key = parseEncryptionKey();
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new StoreCredentialsCryptoError("Formato de segredo inválido.");
  }
  const [, ivPart, tagPart, dataPart] = parts;
  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const ciphertext = Buffer.from(dataPart, "base64url");
  const decipher = createDecipheriv(ALGORITHM, key, iv) as DecipherGCM;
  decipher.setAAD(aadFor(storeId));
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
