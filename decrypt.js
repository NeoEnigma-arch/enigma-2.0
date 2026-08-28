(function () {
  "use strict";

  const PREFIX_V1 = "ENC:v1:";
  const PREFIX = "⎔MX2:";

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    const el = $("status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  function setBadge(text, warn) {
    const el = $("badge");
    if (!el) return;
    el.textContent = text;
    el.className = "badge" + (warn ? " warn" : "");
  }

  function extractCipher() {
    const params = new URLSearchParams(window.location.search);
    let raw = params.get("d") || params.get("c") || params.get("payload") || "";

    if (!raw && window.location.hash) {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("c=")) raw = hash.slice(2);
      else if (hash.startsWith("d=")) raw = hash.slice(2);
      else raw = hash;
    }

    try {
      raw = decodeURIComponent(raw);
    } catch (_) {}

    // Protocol handler may pass full "web+enigma:..." 
    raw = String(raw || "").replace(/^web\+enigma:\/*/i, "");
    raw = raw.trim().replace(/^["']|["']$/g, "");

    // Nested URL with #c=
    if (raw.indexOf("decrypt.html") !== -1 || /^https?:/i.test(raw)) {
      try {
        const u = new URL(raw);
        const h = u.hash.replace(/^#/, "");
        if (h.startsWith("c=")) raw = decodeURIComponent(h.slice(2));
        else if (u.searchParams.get("c")) raw = u.searchParams.get("c");
        else if (u.searchParams.get("d")) raw = u.searchParams.get("d");
      } catch (_) {}
    }

    return raw.trim();
  }

  function looksEncrypted(text) {
    if (!text) return false;
    if (typeof TextCrypto !== "undefined" && TextCrypto.isEncrypted) {
      return TextCrypto.isEncrypted(text);
    }
    return text.indexOf(PREFIX_V1) !== -1 || text.indexOf(PREFIX) !== -1;
  }

  async function getSessionPassword() {
    try {
      if (typeof browser !== "undefined" && browser.storage && browser.storage.session) {
        const data = await browser.storage.session.get("password");
        return (data && data.password) || "";
      }
    } catch (_) {}
    return "";
  }

  function currentCipher() {
    const fromField = ($("cipher") && $("cipher").value.trim()) || "";
    return fromField || extractCipher();
  }

  async function decryptWith(password) {
    const cipher = currentCipher();
    if (!cipher) {
      setStatus("Kein Cipher. Bitte aus dem QR übernehmen oder hier einfügen.", "err");
      return false;
    }
    if (!password) {
      setStatus("Bitte Passwort eintippen (Feld oben).", "err");
      const pw = $("password");
      if (pw) pw.focus();
      return false;
    }
    if (typeof TextCrypto === "undefined" || !TextCrypto.decrypt) {
      setStatus("Crypto-Bibliothek nicht geladen. Extension neu laden.", "err");
      return false;
    }

    setStatus("Entschlüssele …");
    const btn = $("btn-decrypt");
    if (btn) btn.disabled = true;

    try {
      const plain = await TextCrypto.decrypt(cipher, password);
      const result = $("result");
      if (result) result.textContent = plain;
      setStatus("Entschlüsselung erfolgreich.", "ok");
      setBadge("Entschlüsselt", false);
      return true;
    } catch (err) {
      console.error(err);
      setStatus("Fehlgeschlagen – Passwort prüfen oder Cipher beschädigt.", "err");
      setBadge("Fehler", true);
      return false;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function copyResult() {
    const text = ($("result") && $("result").textContent) || "";
    if (!text || text === "—") {
      setStatus("Noch kein Ergebnis zum Kopieren.", "err");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Kopiert.", "ok");
    } catch (_) {
      setStatus("Kopieren nicht möglich.", "err");
    }
  }

  async function init() {
    const cipher = extractCipher();
    const cipherEl = $("cipher");
    if (cipherEl && cipher) {
      cipherEl.value = cipher;
    }

    if (!cipher) {
      setBadge("Cipher einfügen", true);
      setStatus("Kein Cipher im Link. Cipher unten einfügen oder QR erneut in Firefox öffnen.", "err");
    } else if (!looksEncrypted(cipher)) {
      setBadge("Format prüfen", true);
      setStatus("Unbekanntes Format – Cipher prüfen.", "err");
    } else {
      setBadge("Cipher geladen", true);
      setStatus("Passwort eintippen und „Entschlüsseln“ tippen.");
    }

    // Password starts as visible text (mobile keyboards work more reliably).
    // Toggle switches between text / password masking.
    let masked = false;
    const pwInput = $("password");
    const toggleBtn = $("btn-toggle-pw");
    if (toggleBtn && pwInput) {
      toggleBtn.addEventListener("click", () => {
        masked = !masked;
        pwInput.type = masked ? "password" : "text";
        toggleBtn.textContent = masked ? "Anzeigen" : "Verbergen";
        pwInput.focus();
      });
    }

    const btn = $("btn-decrypt");
    if (btn) {
      btn.addEventListener("click", () => {
        const pw = (pwInput && pwInput.value) || "";
        decryptWith(pw);
      });
    }

    if (pwInput) {
      pwInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          decryptWith(pwInput.value);
        }
      });
      // Always allow typing – never leave disabled/readonly
      pwInput.removeAttribute("readonly");
      pwInput.removeAttribute("disabled");
      setTimeout(() => {
        try {
          pwInput.focus();
          pwInput.click();
        } catch (_) {}
      }, 100);
    }

    const copyBtn = $("btn-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", copyResult);
    }

    // Auto-decrypt only if session password exists (desktop/extension page)
    if (cipher && looksEncrypted(cipher)) {
      const sessionPw = await getSessionPassword();
      if (sessionPw) {
        if (pwInput) {
          pwInput.value = sessionPw;
          pwInput.type = "password";
          masked = true;
          if (toggleBtn) toggleBtn.textContent = "Anzeigen";
        }
        setStatus("Passwort aus Addon-Sitzung – entschlüssele …");
        await decryptWith(sessionPw);
      }
    }

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.type !== "ENIGMA_DECRYPT_RESULT") return;
      if (data.ok && data.plaintext != null) {
        const result = $("result");
        if (result) result.textContent = data.plaintext;
        setStatus("Automatisch mit Enigma-Addon entschlüsselt.", "ok");
        setBadge("Entschlüsselt (Addon)", false);
      } else if (data.error) {
        setStatus(data.error, "err");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
