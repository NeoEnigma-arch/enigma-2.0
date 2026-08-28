const TextCrypto = (() => {
  const PREFIX_V1 = "ENC:v1:";
  const BRAND_PREFIX = "Enigma 2.0";
  const PBKDF2_ITERATIONS = 250000;
  const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const DEFAULT_FORMAT = "mixed";

  // Mild Zalgo: ABOVE marks only (1 per base char).
  // Never use U+0326 COMBINING COMMA BELOW — looks like a trailing comma on X
  // and is easy to miss when selecting / may be stripped by the site.
  const ZALGO_MARKS = [
    "\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0306", "\u0307", "\u0308",
    "\u030A", "\u030B", "\u030C", "\u030F", "\u0311", "\u0313", "\u0314", "\u033D",
    "\u033E", "\u033F", "\u0342", "\u0343", "\u0344", "\u0346", "\u034A", "\u035B"
  ];

  /**
   * Minimum glyph/base64 length for a bare (prefix-free) cipher payload.
   * Compact v2 packages (magic+salt+iv+ct → base64) are well above this.
   */
  const MIN_BARE_PAYLOAD_LEN = 48;

  /**
   * Compact package v2 (new encrypt output):
   *   magic(1) || salt(16) || iv(12) || ciphertext(n+tag)
   * Magic 0xE2 ≠ '{', so it never collides with legacy JSON packages.
   * Same AES-GCM security; much shorter than JSON+nested-Base64.
   */
  const PACK_V2_MAGIC = 0xe2;
  const PACK_V2_SALT_LEN = 16;
  const PACK_V2_IV_LEN = 12;
  const PACK_V2_MIN_CT = 16; // GCM tag alone
  const PACK_V2_HEADER = 1 + PACK_V2_SALT_LEN + PACK_V2_IV_LEN;
  const PACK_V2_MIN_BYTES = PACK_V2_HEADER + PACK_V2_MIN_CT;

  /**
   * Noise X.com / social apps often inject into posts (ZWSP, soft hyphen,
   * bidi marks, line breaks). Must be stripped before detect/decode.
   */
  const CIPHER_NOISE_RE =
    /[\s\u00AD\u180E\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060\u2066-\u2069\uFEFF\uFE00-\uFE0F]/gu;

  /** Remove whitespace + invisible format chars that break bare-cipher detection. */
  function normalizeCipherText(text) {
    if (typeof text !== "string") {
      return "";
    }
    return text.replace(CIPHER_NOISE_RE, "");
  }

  /**
   * Pre-1.5.39 full-width katakana alphabet (decode-only).
   */
  const LEGACY_KATAKANA = {
    padding: "⌇",
    alphabet: [
      "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
      "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
      "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
      "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ",
      "ル", "レ", "ロ", "ワ", "ヲ", "ン", "零", "一", "二", "三",
      "四", "五", "六", "七", "八", "九", "⊕", "⊗", "⌁", "⌇",
      "⎔", "⎕", "◈", "◇"
    ]
  };

  /**
   * Brief half-width-only set (decode-only) from the intermediate rain alphabet.
   */
  const LEGACY_MATRIX_HW = {
    padding: "･",
    alphabet: [
      "ｦ", "ｧ", "ｨ", "ｩ", "ｪ", "ｫ", "ｬ", "ｭ", "ｮ", "ｯ",
      "ｰ", "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ",
      "ｺ", "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ",
      "ﾄ", "ﾅ", "ﾆ", "ﾇ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ",
      "ﾎ", "ﾏ", "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ﾔ", "ﾕ", "ﾖ", "ﾗ",
      "ﾘ", "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ﾝ", "0", "1", "2", "3",
      "4", "5", "6", "7"
    ]
  };

  /**
   * Intermediate mix alphabet (decode-only).
   */
  const LEGACY_MATRIX_MIX = {
    padding: "¤",
    alphabet: [
      "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ",
      "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ", "ﾄ",
      "0", "1", "2", "3", "4", "5", "7", "8", "9", "Z",
      "T", "H", "X", "Y", "A", "E", "R", "M", "N", "W",
      ":", "·", "=", "*", "+", "-", "¦", "|", "_", "¥",
      "◈", "◇", "◆", "○", "●", "△", "□", "※", "±", "×",
      "÷", "⌀", "⌁", "⌘"
    ]
  };

  /**
   * Brief era where Matrix format was plain Base64 (font-only display). Decode-only.
   */
  const LEGACY_MATRIX_B64 = {
    padding: "=",
    alphabet: BASE64_ALPHABET.split("")
  };

  /**
   * Brief geometric rain alphabet (◆◇▲▼…) — decode-only.
   */
  const LEGACY_MATRIX_RAIN_GEO = {
    padding: "※",
    alphabet: [
      "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ",
      "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ", "ﾄ",
      "ﾅ", "ﾆ", "ﾇ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ", "ﾎ",
      "ﾏ", "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ﾔ", "ﾕ", "ﾖ", "ﾗ", "ﾘ",
      "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ﾝ", "ｦ", "ｯ", "ｰ", "0", "1",
      "2", "3", "4", "5", "7", "8", "9", "Z", "◆", "◇",
      "▲", "▼", "●", "▣"
    ]
  };

  /**
   * Visual cipher formats. Each maps Base64 (64 symbols + padding) onto a themed alphabet.
   * Legacy messages may still start with "Enigma 2.0" and/or ⎔MX2: / ⎔RN2: / … prefixes.
   * New encryption emits only the visual payload (no brand, no format tag).
   *
   * "katakana" / Matrix c0d3 = classic digital-rain glyphs (half-width + digits + code marks).
   */
  const FORMATS = {
    katakana: {
      id: "katakana",
      prefix: "⎔MX2:",
      // Visible pad (※). Old ･ still accepted when decoding.
      padding: "※",
      // Classic Matrix rain look (as before the geometric-only experiment)
      alphabet: [
        "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ", "ｹ", "ｺ",
        "ｻ", "ｼ", "ｽ", "ｾ", "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ", "ﾄ",
        "ﾅ", "ﾆ", "ﾇ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ", "ﾎ",
        "ﾏ", "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ﾔ", "ﾕ", "ﾖ", "ﾗ", "ﾘ",
        "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ﾝ", "ｦ", "ｯ", "ｰ", "0", "1",
        "2", "3", "4", "5", "7", "8", "9", "Z", ":", ".",
        "=", "*", "+", "-"
      ]
    },
    runes: {
      id: "runes",
      prefix: "⎔RN2:",
      padding: "ᛪ",
      // U+16A0 … U+16DF (64 runic letters)
      alphabet: [
        "ᚠ", "ᚡ", "ᚢ", "ᚣ", "ᚤ", "ᚥ", "ᚦ", "ᚧ", "ᚨ", "ᚩ", "ᚪ", "ᚫ", "ᚬ", "ᚭ", "ᚮ", "ᚯ",
        "ᚰ", "ᚱ", "ᚲ", "ᚳ", "ᚴ", "ᚵ", "ᚶ", "ᚷ", "ᚸ", "ᚹ", "ᚺ", "ᚻ", "ᚼ", "ᚽ", "ᚾ", "ᚿ",
        "ᛀ", "ᛁ", "ᛂ", "ᛃ", "ᛄ", "ᛅ", "ᛆ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛋ", "ᛌ", "ᛍ", "ᛎ", "ᛏ",
        "ᛐ", "ᛑ", "ᛒ", "ᛓ", "ᛔ", "ᛕ", "ᛖ", "ᛗ", "ᛘ", "ᛙ", "ᛚ", "ᛛ", "ᛜ", "ᛝ", "ᛞ", "ᛟ"
      ]
    },
    braille: {
      id: "braille",
      prefix: "⎔BR2:",
      padding: "⣿",
      // U+2801 … U+2840 (64 braille patterns, skip blank U+2800)
      alphabet: [
        "⠁", "⠂", "⠃", "⠄", "⠅", "⠆", "⠇", "⠈", "⠉", "⠊", "⠋", "⠌", "⠍", "⠎", "⠏", "⠐",
        "⠑", "⠒", "⠓", "⠔", "⠕", "⠖", "⠗", "⠘", "⠙", "⠚", "⠛", "⠜", "⠝", "⠞", "⠟", "⠠",
        "⠡", "⠢", "⠣", "⠤", "⠥", "⠦", "⠧", "⠨", "⠩", "⠪", "⠫", "⠬", "⠭", "⠮", "⠯", "⠰",
        "⠱", "⠲", "⠳", "⠴", "⠵", "⠶", "⠷", "⠸", "⠹", "⠺", "⠻", "⠼", "⠽", "⠾", "⠿", "⡀"
      ]
    },
    zalgo: {
      id: "zalgo",
      prefix: "⎔ZL2:",
      // Special: keeps Base64 chars and decorates each with combining marks
      special: "zalgo"
    },
    /**
     * Mixed / 3nigm4: Matrix → Runes → Braille → Fullwidth.
     * Lane 3 is fullwidth Base64 (X-safe). Old Zalgo combining-mark posts still decode.
     */
    mixed: {
      id: "mixed",
      prefix: "⎔MXD:",
      special: "mixed"
    }
  };

  /** Lane order for mixed encoding (index % 4). */
  const MIXED_LANES = ["katakana", "runes", "braille", "glitch"];

  /**
   * 3nigm4 lane 4 — single-codepoint “glitch” glyphs (not plain A–Z/0–9).
   * Survives X.com better than combining-mark Zalgo; still looks alien.
   */
  const MIXED_GLITCH = {
    padding: "ʔ",
    alphabet: [
      "Ⱥ", "Ⱦ", "Ƚ", "Ƀ", "Ʉ", "Ʌ", "Ɇ", "Ɉ", "Ɋ", "Ɍ", "Ɏ", "ɐ", "ɑ", "ɒ", "ɓ", "ɔ",
      "ɕ", "ɖ", "ɗ", "ɘ", "ə", "ɚ", "ɛ", "ɜ", "ɝ", "ɞ", "ɟ", "ɠ", "ɡ", "ɢ", "ɣ", "ɤ",
      "ɥ", "ɦ", "ɧ", "ɨ", "ɩ", "ɪ", "ɫ", "ɬ", "ɭ", "ɮ", "ɯ", "ɰ", "ɱ", "ɲ", "ɳ", "ɴ",
      "ɵ", "ɶ", "ɷ", "ɸ", "ɹ", "ɺ", "ɻ", "ɼ", "ɽ", "ɾ", "ɿ", "ʀ", "ʁ", "ʂ", "ʃ", "ʄ"
    ]
  };

  // Legacy alias
  const PREFIX = FORMATS.katakana.prefix;

  // Build encode/decode maps for alphabet-based formats
  const formatMaps = {};
  for (const [id, fmt] of Object.entries(FORMATS)) {
    if (fmt.special) continue;
    if (fmt.alphabet.length !== 64) {
      throw new Error(`Format ${id}: alphabet must have 64 symbols`);
    }
    const toGlyph = new Map();
    const toBase64 = new Map();
    for (let i = 0; i < 64; i++) {
      const b64 = BASE64_ALPHABET[i];
      const glyph = fmt.alphabet[i];
      toGlyph.set(b64, glyph);
      // Prefer first mapping if padding collides with an alphabet glyph
      if (!toBase64.has(glyph)) {
        toBase64.set(glyph, b64);
      }
    }
    toBase64.set(fmt.padding, "=");
    toGlyph.set("=", fmt.padding);
    // Always accept classic Matrix pad-dot (looks like comma; still in old posts)
    if (id === "katakana") {
      toBase64.set("･", "=");
    }

    const tokenChars = new Set([...fmt.alphabet, fmt.padding]);
    if (id === "katakana") {
      tokenChars.add("･");
    }

    // Matrix format: older alphabets (separate maps — same glyph may mean different indices)
    let legacyToBase64List = null;
    if (id === "katakana") {
      legacyToBase64List = [];
      const legacySets = [
        LEGACY_KATAKANA,
        LEGACY_MATRIX_HW,
        LEGACY_MATRIX_MIX,
        LEGACY_MATRIX_RAIN_GEO,
        LEGACY_MATRIX_B64
      ];
      for (const legacy of legacySets) {
        const legMap = new Map();
        for (let i = 0; i < 64; i++) {
          const legacyGlyph = legacy.alphabet[i];
          if (!legMap.has(legacyGlyph)) {
            legMap.set(legacyGlyph, BASE64_ALPHABET[i]);
          }
          tokenChars.add(legacyGlyph);
        }
        legMap.set(legacy.padding, "=");
        tokenChars.add(legacy.padding);
        legacyToBase64List.push(legMap);
      }
    }

    const escaped = [...tokenChars]
      .map((ch) => ch.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&"))
      .join("");
    let tokenPattern;
    try {
      tokenPattern = new RegExp(`[${escaped}]+`, "u");
    } catch (reErr) {
      console.warn("Enigma: tokenPattern failed for", id, reErr);
      tokenPattern = /[\s\S]+/;
    }

    formatMaps[id] = { toGlyph, toBase64, tokenPattern, fmt, legacyToBase64List };
  }

  function getFormat(formatId) {
    if (formatId && FORMATS[formatId]) {
      return FORMATS[formatId];
    }
    return FORMATS[DEFAULT_FORMAT];
  }

  function getFormatIdByPrefix(prefix) {
    for (const [id, fmt] of Object.entries(FORMATS)) {
      if (fmt.prefix === prefix) return id;
    }
    return null;
  }

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

  function encodeAlphabetPayload(base64Payload, formatId) {
    const maps = formatMaps[formatId];
    if (!maps) {
      throw new Error("Unbekanntes Textformat.");
    }

    let out = "";
    for (const char of base64Payload) {
      const mapped = maps.toGlyph.get(char);
      if (!mapped) {
        throw new Error("Ungültige Kodierung.");
      }
      out += mapped;
    }
    return out;
  }

  function decodeWithToBase64(payload, toBase64) {
    let base64Payload = "";
    for (const char of payload) {
      const mapped = toBase64.get(char);
      if (!mapped) {
        throw new Error("Ungültiger Emblem-Block.");
      }
      base64Payload += mapped;
    }
    return base64Payload;
  }

  function decodeAlphabetPayload(payload, formatId) {
    const maps = formatMaps[formatId];
    if (!maps) {
      throw new Error("Unbekanntes Textformat.");
    }

    // Primary alphabet first
    const mapsToTry = [maps.toBase64];
    if (formatId === "katakana" && maps.legacyToBase64List) {
      mapsToTry.push(...maps.legacyToBase64List);
    }

    let lastError = null;
    let firstFull = null;
    for (const toB of mapsToTry) {
      try {
        const b64 = decodeWithToBase64(payload, toB);
        if (!firstFull) {
          firstFull = b64;
        }
        // Prefer a mapping that yields a real crypto package
        if (isValidPayloadBase64(b64)) {
          return b64;
        }
      } catch (e) {
        lastError = e;
      }
    }
    if (firstFull) {
      return firstFull;
    }
    throw lastError || new Error("Ungültiger Emblem-Block.");
  }

  function zalgoMarkFor(char, index) {
    // Exactly one mark – keeps the glitch look without escaping the post box
    return ZALGO_MARKS[(char.charCodeAt(0) * 7 + index * 3) % ZALGO_MARKS.length];
  }

  function encodeZalgoPayload(base64Payload) {
    let out = "";
    for (let i = 0; i < base64Payload.length; i++) {
      const ch = base64Payload[i];
      out += ch + zalgoMarkFor(ch, i);
    }
    return out;
  }

  function decodeZalgoPayload(payload) {
    // Strip combining marks → pure Base64
    return payload.replace(/\p{M}+/gu, "");
  }

  /** Fullwidth Base64 — legacy 3nigm4 lane (still decoded). */
  function toFullwidthBase64Char(ch) {
    if (ch >= "A" && ch <= "Z") {
      return String.fromCharCode(0xff21 + (ch.charCodeAt(0) - 65));
    }
    if (ch >= "a" && ch <= "z") {
      return String.fromCharCode(0xff41 + (ch.charCodeAt(0) - 97));
    }
    if (ch >= "0" && ch <= "9") {
      return String.fromCharCode(0xff10 + (ch.charCodeAt(0) - 48));
    }
    if (ch === "+") return "＋";
    if (ch === "/") return "／";
    if (ch === "=") return "＝";
    return null;
  }

  function fromFullwidthBase64Char(ch) {
    const c = ch.codePointAt(0);
    if (c >= 0xff21 && c <= 0xff3a) {
      return String.fromCharCode(65 + (c - 0xff21));
    }
    if (c >= 0xff41 && c <= 0xff5a) {
      return String.fromCharCode(97 + (c - 0xff41));
    }
    if (c >= 0xff10 && c <= 0xff19) {
      return String.fromCharCode(48 + (c - 0xff10));
    }
    if (ch === "＋") return "+";
    if (ch === "／") return "/";
    if (ch === "＝") return "=";
    return null;
  }

  function toGlitchBase64Char(ch) {
    if (ch === "=") return MIXED_GLITCH.padding;
    const idx = BASE64_ALPHABET.indexOf(ch);
    if (idx < 0) return null;
    return MIXED_GLITCH.alphabet[idx];
  }

  function fromGlitchBase64Char(ch) {
    if (ch === MIXED_GLITCH.padding || ch === "ʔ") return "=";
    const idx = MIXED_GLITCH.alphabet.indexOf(ch);
    if (idx < 0) return null;
    return BASE64_ALPHABET[idx];
  }

  /**
   * Encode each Base64 char with a rotating visual lane:
   * 0=Matrix, 1=Runes, 2=Braille, 3=Glitch (alien single-codepoint “zalgo look”).
   */
  function encodeMixedPayload(base64Payload) {
    let out = "";
    for (let i = 0; i < base64Payload.length; i++) {
      const ch = base64Payload[i];
      const lane = MIXED_LANES[i % MIXED_LANES.length];
      if (lane === "glitch" || lane === "fullwidth" || lane === "zalgo") {
        const g = toGlitchBase64Char(ch);
        if (!g) {
          throw new Error("Ungültige Kodierung.");
        }
        out += g;
      } else {
        const maps = formatMaps[lane];
        const glyph = maps && maps.toGlyph.get(ch);
        if (!glyph) {
          throw new Error("Ungültige Kodierung.");
        }
        out += glyph;
      }
    }
    return out;
  }

  /**
   * Decode mixed visual stream → Base64.
   * Units: glitch | fullwidth | legacy Zalgo (ASCII+marks) | alphabets.
   */
  function decodeMixedPayload(payload) {
    if (typeof payload !== "string" || !payload) {
      throw new Error("Ungültiger Emblem-Block.");
    }

    let base64Payload = "";
    let i = 0;
    const len = payload.length;

    while (i < len) {
      const cp = payload.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;

      // Collect following combining marks (legacy Zalgo unit)
      let markStart = i;
      while (i < len) {
        const mcp = payload.codePointAt(i);
        const mch = String.fromCodePoint(mcp);
        if (!/\p{M}/u.test(mch)) {
          break;
        }
        i += mch.length;
      }
      const hasMarks = i > markStart;

      // Legacy 3nigm4: ASCII + combining mark
      if (hasMarks && /[A-Za-z0-9+/=]/.test(ch)) {
        base64Payload += ch;
        continue;
      }

      // Current 3nigm4 lane 4: glitch alphabet
      const gl = fromGlitchBase64Char(ch);
      if (gl != null) {
        base64Payload += gl;
        continue;
      }

      // Previous 3nigm4 lane: fullwidth Base64
      const fw = fromFullwidthBase64Char(ch);
      if (fw != null) {
        base64Payload += fw;
        continue;
      }

      // Alphabet lanes
      let mapped = null;
      for (const lane of ["runes", "braille", "katakana"]) {
        const maps = formatMaps[lane];
        if (maps && maps.toBase64.has(ch)) {
          mapped = maps.toBase64.get(ch);
          break;
        }
      }
      if (!mapped && formatMaps.katakana && formatMaps.katakana.legacyToBase64List) {
        for (const legMap of formatMaps.katakana.legacyToBase64List) {
          if (legMap.has(ch)) {
            mapped = legMap.get(ch);
            break;
          }
        }
      }

      // Bare ASCII after host stripped combining marks
      if (!mapped && /[A-Za-z0-9+/=]/.test(ch)) {
        mapped = ch;
      }

      if (!mapped) {
        throw new Error("Ungültiger Emblem-Block.");
      }
      base64Payload += mapped;
    }

    return base64Payload;
  }

  // Precompiled cheap probes for mixed / bare-cipher heuristics (avoid per-call recompiles)
  const RE_RUNES = /[\u16A0-\u16FF]/;
  const RE_BRAILLE = /[\u2800-\u28FF]/;
  const RE_ZALGO_MARK = /\p{M}/u;
  const RE_FULLWIDTH_B64 =
    /[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF0B\uFF0F\uFF1D]/;
  const RE_MATRIX_HW = /[\uFF66-\uFF9D]/;
  const RE_GLITCH = /[ȺȾȽɃɄɅɆɈɊɌɎɐ-ʄʔ]/;
  // Distinctive cipher scripts only. Do NOT include common punctuation/math
  // (| · 。 ± × ÷ ○ ●) — a single match used to trip findTokens on every news/YT page.
  const RE_CIPHER_GLYPH =
    /[\uFF66-\uFF9D\u16A0-\u16FF\u2800-\u28FF\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF0B\uFF0F\uFF1D\uFF0E※◇◆◈⎕⎔⌁]/;
  const RE_CIPHER_SCRIPT_RUN = /[\uFF66-\uFF9D\u16A0-\u16FF\u2800-\u28FF]{8,}/;
  const RE_FULLWIDTH_RUN = /[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]{8,}/;
  const RE_LONG_B64 = /[A-Za-z0-9+/]{48,}={0,3}/;
  const RE_COMPACT_B64 = /^[A-Za-z0-9+/]+=*$/;
  const RE_ZALGO_DENSE = /(?:[A-Za-z0-9+/=]\p{M}+){8,}/u;

  /**
   * Cheap O(n) gate: does this string *look* like it might contain a cipher?
   * Used before expensive findTokens / bare-payload recovery on every text node.
   * Must stay conservative: a single `|`, YouTube-ID, or Japanese `。` is not a cipher.
   */
  function mightContainCipher(text) {
    if (typeof text !== "string" || !text) return false;
    if (text.length < 8) return false;
    if (text.includes(PREFIX_V1) || text.includes(BRAND_PREFIX) || text.includes("⎔")) {
      return true;
    }

    const hasRunes = RE_RUNES.test(text);
    const hasBraille = RE_BRAILLE.test(text);
    const hasGlitch = RE_GLITCH.test(text);
    const hasHwKata = RE_MATRIX_HW.test(text);
    const hasFullwidth = RE_FULLWIDTH_B64.test(text);

    // Mixed / 3nigm4: two+ distinctive lanes. One IPA letter on Wikipedia must not trip this.
    let lanes = 0;
    if (hasRunes) lanes += 1;
    if (hasBraille) lanes += 1;
    if (hasGlitch) lanes += 1;
    if (hasHwKata) lanes += 1;
    if (hasFullwidth) lanes += 1;
    if (lanes >= 2) return true;

    // Pure Matrix / runes / braille / fullwidth: require a run, not one decorative glyph
    if (RE_CIPHER_SCRIPT_RUN.test(text) || RE_FULLWIDTH_RUN.test(text)) return true;

    // Zalgo-style combining marks over base64 body
    if (RE_ZALGO_DENSE.test(text) || (RE_ZALGO_MARK.test(text) && RE_LONG_B64.test(text))) {
      return true;
    }

    // Bare Base64 only when the string is essentially just a payload
    // (not a URL, JSON blob, or YouTube/X tracking id).
    if (text.length >= MIN_BARE_PAYLOAD_LEN && text.length <= 4096) {
      const compact = text.replace(/\s+/g, "");
      if (
        compact.length >= MIN_BARE_PAYLOAD_LEN &&
        compact.length >= text.length * 0.9 &&
        RE_COMPACT_B64.test(compact)
      ) {
        return true;
      }
    }
    return false;
  }

  function looksLikeMixedPayload(text) {
    if (!text || text.length < MIN_BARE_PAYLOAD_LEN) return false;
    const hasRunes = RE_RUNES.test(text);
    const hasBraille = RE_BRAILLE.test(text);
    const hasZalgo = RE_ZALGO_MARK.test(text);
    const hasFullwidth = RE_FULLWIDTH_B64.test(text);
    const hasGlitch = RE_GLITCH.test(text) || text.includes(MIXED_GLITCH.padding);
    // Prefer half-width matrix range; avoid spreading every codepoint into a Map lookup
    const hasMatrix =
      RE_MATRIX_HW.test(text) ||
      (formatMaps.katakana &&
        formatMaps.katakana.toBase64 &&
        RE_CIPHER_GLYPH.test(text) &&
        text.length <= 4096 &&
        [...text].some((c) => formatMaps.katakana.toBase64.has(c)));
    const n = [hasRunes, hasBraille, hasZalgo, hasFullwidth, hasGlitch, hasMatrix].filter(
      Boolean
    ).length;
    return n >= 2;
  }

  /**
   * How many chars of `body` (from startIndex) form a valid mixed payload prefix.
   * Returns length relative to startIndex (0 = none), same contract as before when startIndex=0.
   */
  function consumeMixedBodyLength(body, startIndex = 0) {
    if (!body) return 0;
    try {
      let i = startIndex | 0;
      const len = body.length;
      if (i < 0 || i >= len) return 0;
      let units = 0;
      const start = i;
      while (i < len) {
        const cp = body.codePointAt(i);
        const ch = String.fromCodePoint(cp);
        let next = i + ch.length;
        while (next < len) {
          const mcp = body.codePointAt(next);
          const mch = String.fromCodePoint(mcp);
          if (!RE_ZALGO_MARK.test(mch)) break;
          next += mch.length;
        }
        const hasMarks = next > i + ch.length;
        let ok = false;
        // Legacy zalgo unit: ASCII + combining marks only (never bare A–Z/0–9 —
        // that used to swallow trailing tweet text into the cipher).
        if (hasMarks && /[A-Za-z0-9+/=]/.test(ch)) {
          ok = true;
        } else if (fromGlitchBase64Char(ch) != null) {
          ok = true;
        } else if (fromFullwidthBase64Char(ch) != null) {
          ok = true;
        } else {
          for (const lane of ["runes", "braille", "katakana"]) {
            if (formatMaps[lane] && formatMaps[lane].toBase64.has(ch)) {
              ok = true;
              break;
            }
          }
          if (!ok && formatMaps.katakana && formatMaps.katakana.legacyToBase64List) {
            for (const legMap of formatMaps.katakana.legacyToBase64List) {
              if (legMap.has(ch)) {
                ok = true;
                break;
              }
            }
          }
        }
        if (!ok) break;
        i = next;
        units += 1;
      }
      return units > 0 ? i - start : 0;
    } catch (_e) {
      return 0;
    }
  }

  function encodePayload(base64Payload, formatId) {
    const fmt = getFormat(formatId);
    if (fmt.special === "zalgo") {
      return encodeZalgoPayload(base64Payload);
    }
    if (fmt.special === "mixed") {
      return encodeMixedPayload(base64Payload);
    }
    return encodeAlphabetPayload(base64Payload, fmt.id);
  }

  function decodePayload(payload, formatId) {
    const fmt = getFormat(formatId);
    if (fmt.special === "zalgo") {
      return decodeZalgoPayload(payload);
    }
    if (fmt.special === "mixed") {
      return decodeMixedPayload(payload);
    }
    return decodeAlphabetPayload(payload, fmt.id);
  }

  // --- Legacy helpers used by older call sites ---
  function encodeMatrixPayload(base64Payload) {
    return encodeAlphabetPayload(base64Payload, "katakana");
  }

  function decodeMatrixPayload(matrixPayload) {
    return decodeAlphabetPayload(matrixPayload, "katakana");
  }

  function stripBrandPrefix(text) {
    const trimmed = text.trim();
    for (const fmt of Object.values(FORMATS)) {
      if (trimmed.startsWith(`${BRAND_PREFIX}${fmt.prefix}`)) {
        return trimmed.slice(BRAND_PREFIX.length);
      }
      if (trimmed.startsWith(`${BRAND_PREFIX} ${fmt.prefix}`)) {
        return trimmed.slice(BRAND_PREFIX.length + 1);
      }
    }

    if (trimmed.startsWith(BRAND_PREFIX)) {
      return trimmed.slice(BRAND_PREFIX.length).trimStart();
    }

    return trimmed;
  }

  /** Pack salt+iv+ciphertext into compact binary → Base64 (encrypt path). */
  function packPayloadV2Base64(salt, iv, ciphertext) {
    const ct =
      ciphertext instanceof Uint8Array
        ? ciphertext
        : new Uint8Array(ciphertext);
    const out = new Uint8Array(PACK_V2_HEADER + ct.length);
    out[0] = PACK_V2_MAGIC;
    out.set(salt, 1);
    out.set(iv, 1 + PACK_V2_SALT_LEN);
    out.set(ct, PACK_V2_HEADER);
    return bytesToBase64(out);
  }

  /**
   * Unpack Base64 payload → { salt, iv, ciphertext }.
   * Supports compact v2 (new) and legacy JSON { s, i, c }.
   */
  function unpackPayloadBase64(base64Payload) {
    if (typeof base64Payload !== "string" || base64Payload.length < 16) {
      throw new Error("Kein gültiger verschlüsselter Text.");
    }

    // Compact v2 first
    try {
      const bytes = base64ToBytes(base64Payload);
      if (
        bytes.length >= PACK_V2_MIN_BYTES &&
        bytes[0] === PACK_V2_MAGIC
      ) {
        const salt = bytes.subarray(1, 1 + PACK_V2_SALT_LEN);
        const iv = bytes.subarray(
          1 + PACK_V2_SALT_LEN,
          PACK_V2_HEADER
        );
        const ciphertext = bytes.subarray(PACK_V2_HEADER);
        if (
          salt.length === PACK_V2_SALT_LEN &&
          iv.length === PACK_V2_IV_LEN &&
          ciphertext.length >= PACK_V2_MIN_CT
        ) {
          return { salt, iv, ciphertext };
        }
      }
    } catch (_e) {
      // fall through to legacy
    }

    // Legacy JSON { s, i, c } (each field Base64)
    try {
      const payload = JSON.parse(atob(base64Payload));
      if (!payload || typeof payload !== "object") {
        throw new Error("bad");
      }
      if (
        typeof payload.s !== "string" ||
        typeof payload.i !== "string" ||
        typeof payload.c !== "string"
      ) {
        throw new Error("bad");
      }
      const salt = base64ToBytes(payload.s);
      const iv = base64ToBytes(payload.i);
      const ciphertext = base64ToBytes(payload.c);
      if (
        salt.length !== PACK_V2_SALT_LEN ||
        iv.length !== PACK_V2_IV_LEN ||
        ciphertext.length < PACK_V2_MIN_CT
      ) {
        throw new Error("bad");
      }
      return { salt, iv, ciphertext };
    } catch (_e) {
      throw new Error("Kein gültiger verschlüsselter Text.");
    }
  }

  /** Validate Base64 package: compact v2 or legacy JSON {s,i,c}. */
  function isValidPayloadBase64(base64Payload) {
    if (typeof base64Payload !== "string" || base64Payload.length < 16) {
      return false;
    }
    try {
      unpackPayloadBase64(base64Payload);
      return true;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Detect bare (prefix-free) cipher: whole string is only the visual/base64 payload.
   * Prefer distinctive formats first to reduce ambiguity.
   */
  function detectBareFormat(normalized) {
    if (!normalized || normalized.length < MIN_BARE_PAYLOAD_LEN) {
      return null;
    }

    // Mixed (2+ visual styles interleaved) — try before pure zalgo/alphabets
    if (looksLikeMixedPayload(normalized)) {
      try {
        const b64 = decodeMixedPayload(normalized);
        if (isValidPayloadBase64(b64)) {
          return { kind: "format", formatId: "mixed", prefix: "", bare: true };
        }
      } catch (_e) {}
      if (shrinkVisualToValidBase64(normalized, "mixed")) {
        return { kind: "format", formatId: "mixed", prefix: "", bare: true };
      }
    }

    // Zalgo: Base64 body with combining marks
    if (/\p{M}/u.test(normalized)) {
      try {
        const b64 = decodeZalgoPayload(normalized);
        if (isValidPayloadBase64(b64)) {
          return { kind: "format", formatId: "zalgo", prefix: "", bare: true };
        }
      } catch (_e) {}
    }

    // Prefer runes/braille (rare in normal pages) before katakana
    const order = ["runes", "braille", "katakana"];
    for (const id of order) {
      try {
        const b64 = decodeAlphabetPayload(normalized, id);
        if (isValidPayloadBase64(b64)) {
          return { kind: "format", formatId: id, prefix: "", bare: true };
        }
      } catch (_e) {}
    }

    // Plain Base64 package without ENC:v1: (uncommon, but valid)
    if (/^[A-Za-z0-9+/]+=*$/.test(normalized) && isValidPayloadBase64(normalized)) {
      return { kind: "v1", formatId: null, prefix: "", bare: true };
    }

    return null;
  }

  function detectFormatFromNormalized(normalized) {
    if (normalized.startsWith(PREFIX_V1)) {
      return { kind: "v1", formatId: null, prefix: PREFIX_V1, bare: false };
    }
    for (const fmt of Object.values(FORMATS)) {
      if (normalized.startsWith(fmt.prefix)) {
        return { kind: "format", formatId: fmt.id, prefix: fmt.prefix, bare: false };
      }
    }
    return detectBareFormat(normalized);
  }

  /** Count mixed visual units (for recovering missing trailing pad). */
  function countMixedUnits(body) {
    let i = 0;
    let n = 0;
    const len = body.length;
    while (i < len) {
      const cp = body.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;
      while (i < len) {
        const mcp = body.codePointAt(i);
        const mch = String.fromCodePoint(mcp);
        if (!/\p{M}/u.test(mch)) break;
        i += mch.length;
      }
      n += 1;
    }
    return n;
  }

  function padUnitForMixedLane(lane, unitIndex) {
    if (lane === 0) return FORMATS.katakana.padding; // ※
    if (lane === 1) return FORMATS.runes.padding;
    if (lane === 2) return FORMATS.braille.padding;
    // Lane 3: glitch pad (X-safe single codepoint)
    return MIXED_GLITCH.padding;
  }

  /**
   * After visual→Base64, recover missing standard Base64 padding or one lost symbol.
   * (Cheaper than re-encoding every possible last visual glyph.)
   */
  function recoverValidBase64(b64) {
    if (typeof b64 !== "string" || b64.length < 16) {
      return null;
    }
    const candidates = [b64];
    candidates.push(b64.replace(/[.,;:=\s]+$/u, ""));
    for (const p of ["=", "==", "==="]) {
      candidates.push(b64 + p);
      candidates.push(b64.replace(/[.,;:=\s]+$/u, "") + p);
    }
    // one missing Base64 symbol (+ optional pad) — e.g. last visual `.` left unselected
    for (const c of BASE64_ALPHABET + "=") {
      candidates.push(b64 + c);
      candidates.push(b64 + c + "=");
      candidates.push(b64 + c + "==");
    }

    const seen = new Set();
    for (const t of candidates) {
      if (!t || seen.has(t)) continue;
      seen.add(t);
      if (isValidPayloadBase64(t)) {
        return t;
      }
    }
    return null;
  }

  /**
   * Cheap cipher variants: noise-strip, drop trailing punct, common pads.
   * @param {boolean} deep — also try every alphabet glyph as missing last unit
   */
  function expandCipherCandidates(encryptedText, deep = false) {
    const seen = new Set();
    const out = [];
    const add = (s) => {
      if (typeof s === "string" && s.length > 0 && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    };

    const raw = stripBrandPrefix(encryptedText);
    add(raw);
    const cleaned = normalizeCipherText(raw);
    add(cleaned);

    // Drop trailing sentence punctuation (over-selected OR lookalike end glyphs)
    const stripTrail = (s) =>
      s.replace(/[.,，、;:･·…。．※\uFF0E\u3002]+$/u, "");
    add(stripTrail(cleaned));
    add(stripTrail(raw));

    // drop last 1–2 code points (tiny end left unselected)
    for (const base of [cleaned, stripTrail(cleaned)]) {
      if (!base) continue;
      const chars = [...base];
      if (chars.length > MIN_BARE_PAYLOAD_LEN) {
        add(chars.slice(0, -1).join(""));
        add(chars.slice(0, -2).join(""));
      }
    }

    const bases = out.slice();
    const singlePads = [
      FORMATS.katakana.padding,
      "･",
      ".",
      ",",
      ":",
      FORMATS.runes.padding,
      FORMATS.braille.padding,
      "=",
      "*",
      "+",
      "-"
    ];

    for (const base of bases) {
      if (!base || base.length < MIN_BARE_PAYLOAD_LEN - 4) continue;

      for (const p of singlePads) {
        add(base + p);
      }
      for (const p of singlePads) {
        for (const q of singlePads) {
          add(base + p + q);
        }
      }

      // Zalgo pads
      for (let mi = 0; mi < ZALGO_MARKS.length; mi++) {
        add(base + "=" + ZALGO_MARKS[mi]);
      }

      // Mixed lane-aware pads
      try {
        const units = countMixedUnits(base);
        if (units >= MIN_BARE_PAYLOAD_LEN - 4) {
          const p1 = padUnitForMixedLane(units % 4, units);
          add(base + p1);
          add(base + p1 + padUnitForMixedLane((units + 1) % 4, units + 1));
        }
      } catch (_e) {}

      // Deep: one missing visual unit from each alphabet (bounded ~200, not 10k+)
      if (deep && base.length >= MIN_BARE_PAYLOAD_LEN - 2) {
        for (const id of ["katakana", "runes", "braille"]) {
          const fmt = FORMATS[id];
          for (const g of fmt.alphabet) {
            add(base + g);
          }
          add(base + fmt.padding);
        }
        for (const g of LEGACY_MATRIX_RAIN_GEO.alphabet) {
          add(base + g);
        }
        add(base + LEGACY_MATRIX_RAIN_GEO.padding);
        add(base + "･");
      }
    }

    return out;
  }

  function resolvePayloadBase64FromNormalized(normalized) {
    const detected = detectFormatFromNormalized(normalized);
    if (!detected) {
      return null;
    }

    let b64;
    let visual = normalized;
    if (detected.kind === "v1") {
      b64 = detected.bare ? normalized : normalized.slice(PREFIX_V1.length);
      return recoverValidBase64(b64);
    }
    if (detected.bare) {
      visual = normalized;
    } else {
      visual = normalized.slice(detected.prefix.length);
    }
    try {
      b64 = decodePayload(visual, detected.formatId);
    } catch (_e) {
      b64 = null;
    }
    const recovered = b64 ? recoverValidBase64(b64) : null;
    if (recovered) {
      return recovered;
    }
    if (detected.formatId === "mixed" || detected.formatId === "katakana") {
      return shrinkVisualToValidBase64(visual, detected.formatId);
    }
    return null;
  }

  /**
   * Drop up to 32 trailing visual units until the remainder is a real package.
   * Stops mixed/katakana scanners from treating leftover glyphs as payload.
   */
  function shrinkVisualToValidBase64(visual, formatId) {
    if (typeof visual !== "string" || !formatId || visual.length < MIN_BARE_PAYLOAD_LEN) {
      return null;
    }
    const units = [];
    for (const ch of visual) {
      units.push(ch);
    }
    const maxDrop = Math.min(32, units.length - MIN_BARE_PAYLOAD_LEN);
    if (maxDrop < 1) {
      return null;
    }
    for (let drop = 1; drop <= maxDrop; drop++) {
      const slice = units.slice(0, units.length - drop).join("");
      try {
        const b64 = decodePayload(slice, formatId);
        if (isValidPayloadBase64(b64)) {
          return b64;
        }
      } catch (_e) {}
    }
    return null;
  }

  /**
   * UTF-16 length of the longest prefix that unpacks as a crypto package.
   * 0 = none.
   */
  function validVisualPrefixLength(visual, formatId) {
    if (typeof visual !== "string" || !formatId) {
      return 0;
    }
    try {
      const b64 = decodePayload(visual, formatId);
      if (recoverValidBase64(b64)) {
        return visual.length;
      }
    } catch (_e) {}
    const units = [];
    for (const ch of visual) {
      units.push(ch);
    }
    const maxDrop = Math.min(32, units.length - MIN_BARE_PAYLOAD_LEN);
    for (let drop = 1; drop <= maxDrop; drop++) {
      const slice = units.slice(0, units.length - drop).join("");
      try {
        const b64 = decodePayload(slice, formatId);
        if (isValidPayloadBase64(b64)) {
          return slice.length;
        }
      } catch (_e) {}
    }
    return 0;
  }

  /**
   * Resolve payload Base64 from visual / tagged cipher.
   * Retries after stripping social-app noise, trailing punct, and missing end glyphs.
   */
  function getPayloadBase64(encryptedText) {
    let lastError = null;

    for (const deep of [false, true]) {
      const attempts = expandCipherCandidates(encryptedText, deep);
      for (const normalized of attempts) {
        try {
          const b64 = resolvePayloadBase64FromNormalized(normalized);
          if (b64) {
            return b64;
          }
          lastError = new Error("Kein gültiger verschlüsselter Text.");
        } catch (e) {
          lastError = e;
        }
      }
    }

    throw lastError || new Error("Kein gültiger verschlüsselter Text.");
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

  /**
   * @param {string} plaintext
   * @param {string} password
   * @param {string} [formatId] katakana | runes | braille | zalgo | mixed
   */
  async function encrypt(plaintext, password, formatId = DEFAULT_FORMAT) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(PACK_V2_SALT_LEN));
    const iv = crypto.getRandomValues(new Uint8Array(PACK_V2_IV_LEN));
    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plaintext)
    );

    // Compact binary package (shorter than legacy JSON+nested-Base64)
    const base64Payload = packPayloadV2Base64(
      salt,
      iv,
      new Uint8Array(ciphertext)
    );
    const fmt = getFormat(formatId);
    // New output: visual payload only (no "Enigma 2.0", no ⎔MX2: / ⎔RN2: / …)
    return encodePayload(base64Payload, fmt.id);
  }

  async function decrypt(encryptedText, password) {
    if (!isEncrypted(encryptedText)) {
      throw new Error("Kein gültiger verschlüsselter Text.");
    }

    const { salt, iv, ciphertext } = unpackPayloadBase64(
      getPayloadBase64(encryptedText)
    );
    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /** Cached lines from decoy-messages.txt (extension root). */
  let decoyLinesCache = null;
  let decoyLinesPromise = null;

  /**
   * Load user-editable decoy lines (one message per line).
   * # comments and blank lines are ignored.
   */
  async function loadDecoyLines() {
    if (Array.isArray(decoyLinesCache)) {
      return decoyLinesCache;
    }
    if (decoyLinesPromise) {
      return decoyLinesPromise;
    }
    decoyLinesPromise = (async () => {
      try {
        if (typeof browser !== "undefined" && browser.runtime && browser.runtime.getURL) {
          const url = browser.runtime.getURL("decoy-messages.txt");
          const res = await fetch(url);
          if (res && res.ok) {
            const text = await res.text();
            const lines = String(text || "")
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => line.length > 0 && !line.startsWith("#"));
            decoyLinesCache = lines;
            return lines;
          }
        }
      } catch (_e) {
        // file missing or not in extension context
      }
      decoyLinesCache = [];
      return decoyLinesCache;
    })();
    return decoyLinesPromise;
  }

  async function hashSeedBytes(encryptedText, password) {
    const enc = new TextEncoder();
    const seedInput = enc.encode(
      "enigma-decoy-v1|" + String(password || "") + "|" + String(encryptedText || "")
    );
    return new Uint8Array(await crypto.subtle.digest("SHA-256", seedInput));
  }

  /**
   * Deterministic fake plaintext when AES-GCM auth fails (wrong password / date salt).
   * Prefers lines from decoy-messages.txt; falls back to generated text.
   */
  async function makeDecoyPlaintext(encryptedText, password) {
    const lines = await loadDecoyLines();
    const seed = await hashSeedBytes(encryptedText, password);

    if (lines.length > 0) {
      // Stable pick: same wrong password + cipher → same line (fun + consistent)
      const idx = ((seed[0] << 8) | seed[1]) % lines.length;
      return lines[idx];
    }

    // Fallback generator if the file is empty/missing
    let state = seed;
    const cipherLen = String(encryptedText || "").length;
    const targetLen = Math.min(96, Math.max(18, Math.floor(cipherLen / 7) || 28));
    const letters = "etaoinshrdlcumwfgypbvkjxqz";
    const chars = [];
    let i = 0;

    const nextByte = async () => {
      if (i >= state.length) {
        state = new Uint8Array(await crypto.subtle.digest("SHA-256", state));
        i = 0;
      }
      return state[i++];
    };

    while (chars.length < targetLen) {
      const b = await nextByte();
      if (b % 8 === 0 && chars.length > 0 && chars[chars.length - 1] !== " ") {
        chars.push(" ");
        continue;
      }
      chars.push(letters[b % letters.length]);
    }

    let text = chars.join("").replace(/ +/g, " ").trim();
    if (!text) {
      text = "ok";
    }
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) {
      text += ".";
    }
    return text;
  }

  /**
   * Decrypt, or return decoy text on wrong password / salt (no throw for auth failures).
   * Still throws only if input is not a cipher at all.
   * @returns {Promise<{ plaintext: string, decoy: boolean }>}
   */
  async function decryptOrDecoy(encryptedText, password) {
    if (!isEncrypted(encryptedText)) {
      throw new Error("Kein gültiger verschlüsselter Text.");
    }
    try {
      const plaintext = await decrypt(encryptedText, password);
      return { plaintext, decoy: false };
    } catch (_e) {
      const plaintext = await makeDecoyPlaintext(encryptedText, password);
      return { plaintext, decoy: true };
    }
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function isCipherNoiseOnly(s) {
    if (!s) return true;
    return s.replace(CIPHER_NOISE_RE, "").length === 0;
  }

  /**
   * X.com timeline injects ZWSP/newlines between glyphs. Alphabet token
   * regex then sees several runs instead of one payload. Join same-format
   * runs when the gap is only noise, and extend a run across those gaps.
   */
  function mergeTokensSplitByNoise(text, tokens) {
    if (!tokens || tokens.length === 0 || typeof text !== "string") {
      return tokens;
    }
    const sorted = tokens.slice().sort((a, b) => a.start - b.start);

    for (const t of sorted) {
      const maps = t.formatId && formatMaps[t.formatId];
      if (!maps || !maps.tokenPattern) continue;
      let end = t.end;
      while (end < text.length) {
        let i = end;
        while (i < text.length && isCipherNoiseOnly(text[i])) {
          i += 1;
        }
        if (i === end) break;
        const rest = text.slice(i);
        const m = rest.match(maps.tokenPattern);
        if (!m || m.index !== 0) break;
        end = i + m[0].length;
      }
      if (end > t.end) {
        t.end = end;
        t.cipher = text.slice(t.start, end);
      }
    }

    const merged = [];
    for (const t of sorted) {
      const prev = merged[merged.length - 1];
      if (
        prev &&
        prev.formatId &&
        prev.formatId === t.formatId &&
        t.start >= prev.end &&
        isCipherNoiseOnly(text.slice(prev.end, t.start))
      ) {
        prev.end = Math.max(prev.end, t.end);
        prev.cipher = text.slice(prev.start, prev.end);
        continue;
      }
      merged.push({
        start: t.start,
        end: t.end,
        cipher: t.cipher,
        formatId: t.formatId
      });
    }
    return merged;
  }

  function isEncrypted(text) {
    if (typeof text !== "string") {
      return false;
    }

    // Cheap pass first, then deeper missing-glyph recovery
    for (const deep of [false, true]) {
      for (const candidate of expandCipherCandidates(text, deep)) {
        if (candidate.startsWith(PREFIX_V1)) return true;
        for (const fmt of Object.values(FORMATS)) {
          if (candidate.startsWith(fmt.prefix)) return true;
        }
        if (detectBareFormat(candidate) != null) {
          return true;
        }
        // Partial visual decode + Base64 pad recovery
        try {
          if (resolvePayloadBase64FromNormalized(candidate)) {
            return true;
          }
        } catch (_e) {}
      }
    }
    return false;
  }

  function hasEncryptedContent(text) {
    if (typeof text !== "string" || !text) return false;
    if (text.includes(PREFIX_V1)) return true;
    for (const fmt of Object.values(FORMATS)) {
      if (text.includes(fmt.prefix)) return true;
    }
    // Bare ciphers (no prefix): look for validated visual payloads
    if (normalizeCipherText(text).length < MIN_BARE_PAYLOAD_LEN && text.length < MIN_BARE_PAYLOAD_LEN) {
      return false;
    }
    // Skip expensive findTokens on ordinary page text (main page-load cost)
    const normalized = normalizeCipherText(text);
    if (!mightContainCipher(text) && !mightContainCipher(normalized)) {
      return false;
    }
    if (findTokens(text).length > 0) return true;
    // X.com timeline injects ZWSP/newlines between glyphs — tokens only match after strip
    return normalized !== text && findTokens(normalized).length > 0;
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

    // Legacy branded / tagged formats: Enigma 2.0 + ⎔XX2: + payload
    for (const fmt of Object.values(FORMATS)) {
      index = 0;
      while ((index = text.indexOf(fmt.prefix, index)) !== -1) {
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

        let end = index + fmt.prefix.length;
        const body = text.slice(end);

        if (fmt.special === "zalgo") {
          let i = 0;
          while (i < body.length) {
            const ch = body[i];
            if (/[A-Za-z0-9+/=]/.test(ch)) {
              i += 1;
              while (i < body.length && /\p{M}/u.test(body[i])) {
                i += 1;
              }
            } else {
              break;
            }
          }
          end += i;
        } else if (fmt.special === "mixed") {
          end += consumeMixedBodyLength(body);
        } else {
          const maps = formatMaps[fmt.id];
          const match = body.match(maps.tokenPattern);
          if (match) {
            end += match[0].length;
          }
        }

        tokens.push({
          start,
          end,
          cipher: text.slice(start, end)
        });

        index = end;
      }
    }

    // Bare (prefix-free) visual payloads – validate structure to avoid false positives.
    // Always store the ORIGINAL slice as cipher (never a recovered rewrite for display).
    function pushIfBare(start, end, formatId) {
      if (end - start < MIN_BARE_PAYLOAD_LEN) return;
      for (const t of tokens) {
        if (rangesOverlap(start, end, t.start, t.end)) return;
      }
      const original = text.slice(start, end);
      const candidates = [original];
      const cleaned = normalizeCipherText(original);
      if (cleaned && cleaned !== original && cleaned.length >= MIN_BARE_PAYLOAD_LEN) {
        candidates.push(cleaned);
      }
      for (const candidate of candidates) {
        try {
          const decoded = decodePayload(candidate, formatId);
          if (recoverValidBase64(decoded)) {
            tokens.push({ start, end, cipher: original, formatId });
            return;
          }
        } catch (_e) {
          // try next
        }
      }
      if (formatId === "mixed" || formatId === "katakana") {
        const prefixLen = validVisualPrefixLength(original, formatId);
        if (prefixLen >= MIN_BARE_PAYLOAD_LEN) {
          tokens.push({
            start,
            end: start + prefixLen,
            cipher: text.slice(start, start + prefixLen),
            formatId
          });
          return;
        }
      }
      // Full recovery path (missing pads / noise) without changing displayed text
      if (isEncrypted(original)) {
        tokens.push({
          start,
          end,
          cipher: original,
          formatId: formatId || peekFormatId(original)
        });
      }
    }

    // Mixed bare first (so 3nigm4 is not mis-read as pure Matrix).
    // Walk by index — avoid text.slice(i) per character (was O(n²) string allocs).
    {
      let i = 0;
      const len = text.length;
      while (i < len) {
        const n = consumeMixedBodyLength(text, i);
        if (n >= MIN_BARE_PAYLOAD_LEN) {
          const slice = text.slice(i, i + n);
          if (looksLikeMixedPayload(slice)) {
            pushIfBare(i, i + n, "mixed");
          }
          i += Math.max(1, n);
        } else {
          i += 1;
        }
      }
    }

    // Zalgo bare: Base64 char + combining mark runs
    {
      const zalgoRe = /(?:[A-Za-z0-9+/=]\p{M}*){48,}/gu;
      let m;
      while ((m = zalgoRe.exec(text)) !== null) {
        pushIfBare(m.index, m.index + m[0].length, "zalgo");
      }
    }

    for (const id of ["runes", "braille", "katakana"]) {
      const maps = formatMaps[id];
      if (!maps) continue;
      const re = new RegExp(maps.tokenPattern.source, "gu");
      let m;
      while ((m = re.exec(text)) !== null) {
        pushIfBare(m.index, m.index + m[0].length, id);
      }
    }

    // Fallback: whole string is a cipher after noise-strip / pad recovery.
    // Display cipher stays the original text — never a recovered rewrite.
    if (tokens.length === 0 && isEncrypted(text)) {
      tokens.push({
        start: 0,
        end: text.length,
        cipher: text,
        formatId: peekFormatId(text)
      });
    }

    return mergeTokensSplitByNoise(text, tokens).sort((a, b) => a.start - b.start);
  }

  /**
   * Best-effort format id for styling after page reload (no DOM attributes).
   */
  function peekFormatId(encryptedText) {
    if (typeof encryptedText !== "string" || !encryptedText) {
      return DEFAULT_FORMAT;
    }
    for (const deep of [false, true]) {
      for (const candidate of expandCipherCandidates(encryptedText, deep)) {
        const normalized = stripBrandPrefix(candidate);
        const detected = detectFormatFromNormalized(normalized);
        if (detected) {
          if (detected.kind === "v1") return "katakana";
          if (detected.formatId) return detected.formatId;
        }
        try {
          if (resolvePayloadBase64FromNormalized(normalized)) {
            // Resolve succeeded — re-detect for id
            const d2 = detectFormatFromNormalized(normalized);
            if (d2 && d2.formatId) return d2.formatId;
            if (looksLikeMixedPayload(normalized)) return "mixed";
          }
        } catch (_e) {}
      }
    }
    // Heuristic fallback (same idea as content detectCipherFormatFromText)
    if (looksLikeMixedPayload(encryptedText)) return "mixed";
    if (/\p{M}/u.test(encryptedText) && /[A-Za-z0-9+/=]/.test(encryptedText)) return "zalgo";
    if (/[\u16A0-\u16FF]/.test(encryptedText)) return "runes";
    if (/[\u2800-\u28FF]/.test(encryptedText)) return "braille";
    return DEFAULT_FORMAT;
  }

  function getSupportedFormats() {
    return Object.keys(FORMATS);
  }

  /** Weekday codes for password salt (stable English keys; UI may show localized labels). */
  const WEEKDAY_SALT_CODES = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

  /**
   * Optional date/weekday salt appended to the user password for encryption key material.
   * weekday: mon|tue|wed|thu|fri|sat|sun
   * day: 1–31, month: 1–12, year: 1901–2100 (empty/null = omit that part).
   * Empty salt parts → password unchanged (backward compatible).
   */
  function composePasswordWithDateSalt(password, day, month, year, weekday) {
    const base = typeof password === "string" ? password : String(password || "");
    if (!base) {
      return "";
    }
    const parts = [];
    const wd = typeof weekday === "string" ? weekday.trim().toLowerCase() : "";
    if (wd && WEEKDAY_SALT_CODES.has(wd)) {
      parts.push("w" + wd);
    }
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (Number.isFinite(d) && d >= 1 && d <= 31) {
      parts.push("d" + String(d).padStart(2, "0"));
    }
    if (Number.isFinite(m) && m >= 1 && m <= 12) {
      parts.push("m" + String(m).padStart(2, "0"));
    }
    if (Number.isFinite(y) && y >= 1901 && y <= 2100) {
      parts.push("y" + String(y));
    }
    if (parts.length === 0) {
      return base;
    }
    // Stable delimiter unlikely in casual passwords; must match encrypt + decrypt.
    return base + "|date:" + parts.join("");
  }

  return {
    encrypt,
    decrypt,
    decryptOrDecoy,
    makeDecoyPlaintext,
    isEncrypted,
    hasEncryptedContent,
    mightContainCipher,
    findTokens,
    getPayloadBase64,
    normalizeCipherText,
    peekFormatId,
    getSupportedFormats,
    getFormat,
    composePasswordWithDateSalt,
    DEFAULT_FORMAT,
    FORMATS,
    PREFIX,
    PREFIX_V1,
    BRAND_PREFIX,
    // legacy exports
    encodeMatrixPayload,
    decodeMatrixPayload
  };
})();
