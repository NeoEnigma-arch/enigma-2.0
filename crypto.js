const TextCrypto = (() => {
  const PREFIX_V1 = "ENC:v1:";
  const PREFIX = "⎔MX2:";
  const BRAND_PREFIX = "Enigma 2.0";
  const PBKDF2_ITERATIONS = 250000;

  const MATRIX_ALPHABET = [
    "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
    "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
    "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
    "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ",
    "ル", "レ", "ロ", "ワ", "ヲ", "ン", "零", "一", "二", "三",
    "四", "五", "六", "七", "八", "九", "⊕", "⊗", "⌁", "⌇",
    "⎔", "⎕", "◈", "◇"
  ].join("");

  const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const MATRIX_PADDING = "⌇";

  const base64ToMatrix = new Map(
    [...BASE64_ALPHABET].map((char, index) => [char, MATRIX_ALPHABET[index]])
  );
  const matrixToBase64 = new Map(
    [...MATRIX_ALPHABET].map((char, index) => [char, BASE64_ALPHABET[index]])
  );
  matrixToBase64.set(MATRIX_PADDING, "=");

  const matrixTokenPattern = new RegExp(
    `[${MATRIX_ALPHABET.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${MATRIX_PADDING}]+`,
    "u"
  );

  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function encodeMatrixPayload(base64Payload) {
    let matrixPayload = "";

    for (const char of base64Payload) {
      if (char === "=") {
        matrixPayload += MATRIX_PADDING;
        continue;
      }

      const mapped = base64ToMatrix.get(char);
      if (!mapped) {
        throw new Error("Ungültige Matrix-Kodierung.");
      }

      matrixPayload += mapped;
    }

    return matrixPayload;
  }

  function decodeMatrixPayload(matrixPayload) {
    let base64Payload = "";

    for (const char of matrixPayload) {
      const mapped = matrixToBase64.get(char);
      if (!mapped) {
        throw new Error("Ungültiger Matrix-Emblem-Block.");
      }

      base64Payload += mapped;
    }

    return base64Payload;
  }

  function stripBrandPrefix(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith(`${BRAND_PREFIX}${PREFIX}`)) {
      return trimmed.slice(BRAND_PREFIX.length);
    }

    if (trimmed.startsWith(`${BRAND_PREFIX} ${PREFIX}`)) {
      return trimmed.slice(BRAND_PREFIX.length + 1);
    }

    if (trimmed.startsWith(BRAND_PREFIX)) {
      return trimmed.slice(BRAND_PREFIX.length).trimStart();
    }

    return trimmed;
  }

  function getPayloadBase64(encryptedText) {
    const normalized = stripBrandPrefix(encryptedText);

    if (normalized.startsWith(PREFIX_V1)) {
      return normalized.slice(PREFIX_V1.length);
    }

    if (normalized.startsWith(PREFIX)) {
      return decodeMatrixPayload(normalized.slice(PREFIX.length));
    }

    throw new Error("Kein gültiger verschlüsselter Text.");
  }

  async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encrypt(plaintext, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plaintext)
    );

    const payload = {
      s: bytesToBase64(salt),
      i: bytesToBase64(iv),
      c: bytesToBase64(new Uint8Array(ciphertext))
    };

    const base64Payload = btoa(JSON.stringify(payload));
    return BRAND_PREFIX + PREFIX + encodeMatrixPayload(base64Payload);
  }

  async function decrypt(encryptedText, password) {
    if (!isEncrypted(encryptedText)) {
      throw new Error("Kein gültiger verschlüsselter Text.");
    }

    const payload = JSON.parse(atob(getPayloadBase64(encryptedText)));
    const salt = base64ToBytes(payload.s);
    const iv = base64ToBytes(payload.i);
    const ciphertext = base64ToBytes(payload.c);
    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  function isEncrypted(text) {
    if (typeof text !== "string") {
      return false;
    }

    const normalized = stripBrandPrefix(text);
    return normalized.startsWith(PREFIX) || normalized.startsWith(PREFIX_V1);
  }

  function hasEncryptedContent(text) {
    return typeof text === "string" && (text.includes(PREFIX) || text.includes(PREFIX_V1));
  }

  function findTokens(text) {
    const tokens = [];
    let index = 0;

    while ((index = text.indexOf(PREFIX_V1, index)) !== -1) {
      let end = index + PREFIX_V1.length;

      while (end < text.length && /[A-Za-z0-9+/=]/.test(text[end])) {
        end += 1;
      }

      tokens.push({
        start: index,
        end,
        cipher: text.slice(index, end)
      });

      index = end;
    }

    index = 0;
    while ((index = text.indexOf(PREFIX, index)) !== -1) {
      let start = index;
      const brandAt = index - BRAND_PREFIX.length;

      if (brandAt >= 0 && text.slice(brandAt, index) === BRAND_PREFIX) {
        start = brandAt;
      } else if (
        brandAt - 1 >= 0 &&
        text.slice(brandAt - 1, index) === `${BRAND_PREFIX} `
      ) {
        start = brandAt - 1;
      }

      let end = index + PREFIX.length;
      const body = text.slice(end);
      const match = body.match(matrixTokenPattern);

      if (match) {
        end += match[0].length;
      }

      tokens.push({
        start,
        end,
        cipher: text.slice(start, end)
      });

      index = end;
    }

    return tokens.sort((a, b) => a.start - b.start);
  }

  return {
    encrypt,
    decrypt,
    isEncrypted,
    hasEncryptedContent,
    findTokens,
    PREFIX,
    PREFIX_V1,
    BRAND_PREFIX
  };
})();