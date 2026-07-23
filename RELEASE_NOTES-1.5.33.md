# Enigma 2.0 – 1.5.33

## Sicherheit: Passwort nur Session + Krypto im Background

### Passwort-Speicher
- Passwort wird **nur** noch in `browser.storage.session` abgelegt (wenn „Passwort merken“ aktiv).
- **Kein** Fallback mehr auf `storage.local` (keine dauerhafte Klartext-Ablage auf Disk).
- Beim Start/Update wird ein eventuelles altes `password` aus `local` entfernt.
- Ohne „Merken“: Passwort nur kurz im Background-Speicher (ephemeral) für die laufende Aktion.

### Krypto im Background
- AES-GCM / PBKDF2 laufen ausschließlich im **Background-Script**.
- Content-Scripts und Tabs erhalten **kein** Passwort mehr über `sendMessage`.
- Popup / `ui.html` steuern Aktionen über `run-content-action` und `crypto-decrypt` / `crypto-encrypt`.
- Content-Script behält nur Erkennung/DOM (`isEncrypted`, `findTokens`, Matrix-Styling).

### Betroffene Dateien
- `background.js`, `manifest.json`
- `content/content.js`
- `popup/popup.js`, `popup/popup.html`
- `ui.js`, `ui.html`
- `voice-window.js`, `voice-window.html`
- `decrypt/decrypt.js`

### Manuell testen
1. Addon in `about:debugging` neu laden (`v1.5.33`).
2. Passwort eingeben **ohne** „Merken“ → Auswahl verschlüsseln → muss funktionieren; nach Schließen des Browsers ist nichts gespeichert.
3. Mit „Merken“ → Auto-Decrypt → Cipher auf einer Seite muss ohne erneute Eingabe entschlüsseln.
4. Rechtsklick-Menü: Verschlüsseln / Entschlüsseln / Fenster.
5. Cipher im Popup einfügen und entschlüsseln.
6. In den Entwicklertools: Content-Script-Messages enthalten kein `password`-Feld.
