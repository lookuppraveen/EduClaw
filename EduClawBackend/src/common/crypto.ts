import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

const encryptedStringPrefix = "enc:v1";

const deriveEncryptionKey = (keyMaterial: string): Buffer => {
  return createHash("sha256").update(keyMaterial).digest();
};

export const sha256 = (value: string): string => {
  return createHash("sha256").update(value).digest("hex");
};

export const newId = (): string => randomUUID();

export const encryptString = (value: string, keyMaterial: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveEncryptionKey(keyMaterial), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    encryptedStringPrefix,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url")
  ].join(":");
};

export const decryptString = (value: string, keyMaterial: string): string => {
  if (!value.startsWith(`${encryptedStringPrefix}:`)) {
    return value;
  }

  const parts = value.split(":");
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== encryptedStringPrefix) {
    throw new Error("Encrypted value has an unsupported format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveEncryptionKey(keyMaterial),
    Buffer.from(parts[2] ?? "", "base64url")
  );
  decipher.setAuthTag(Buffer.from(parts[3] ?? "", "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(parts[4] ?? "", "base64url")),
    decipher.final()
  ]).toString("utf8");
};
