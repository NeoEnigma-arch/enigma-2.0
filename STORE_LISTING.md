# Enigma 2.0 – Firefox Add-ons (AMO) Store-Texte

**Version:** 1.5.38  
Kontakt-E-Mail ist eingetragen. Datenschutz-URL vor dem Einreichen prüfen.

---

## Deutsch

### Name
Enigma 2.0

### Kurzbeschreibung (max. 250 Zeichen)
```
Verschlüsselt Text lokal als Matrix-, Runen- oder Braille-Optik. Bild-Scramble, QR, Modem, Rechtsklick – ohne Cloud, ohne Tracking.
```
*(ca. 130 Zeichen – unter dem Limit)*

### Vollständige Beschreibung

```
Enigma 2.0 verschlüsselt deinen Text direkt im Browser – stark, lokal und ohne Server. Ideal für private Nachrichten an öffentlichen Orten: Social Media (z. B. X/Twitter), Foren, Kommentare oder Notizen im Web.

Nur wer das Passwort kennt, kann den Inhalt wieder lesen. Für alle anderen bleibt nur unlesbarer Chiffre-Text sichtbar.


━━━ So geht’s in 3 Schritten ━━━

1. Addon öffnen und ein Passwort wählen
2. Text auf einer Webseite markieren
3. „Auswahl verschlüsseln“ – fertig

Empfänger mit demselben Passwort entschlüsseln über Addon, Rechtsklick oder Cipher-Eingabe.


━━━ Was du damit machen kannst ━━━

• Auswahl oder ganze Seite verschlüsseln und entschlüsseln
• Rechtsklick-Menü: direkt verschlüsseln, in ein Fenster legen, als QR zeigen oder als Modem-Audio öffnen
• Mehrere Textformate wählen:
  – Matrix / Katakana (klassischer grüner Look)
  – Runen
  – Braille
  – Zalgo (glitchiger Stil)
• Optional Auto-Entschlüsselung, sobald ein Sitzungs-Passwort aktiv ist
• Cipher manuell einfügen und im Popup entschlüsseln (z. B. aus einem QR-Link)
• QR-Code aus verschlüsseltem Text erzeugen – scannen öffnet die Entschlüsselungsseite
• Modem-Audio: Cipher als Töne abspielen / als WAV speichern
• Voice-Fenster: WAV laden oder Töne aufnehmen und wieder entschlüsseln
• Bild-Scramble: Foto mit Passwort verwürfeln und als PNG speichern – nur mit Passwort wieder lesbar
• Desktop (kompaktes Popup) und Firefox für Android (Vollbild-UI)


━━━ Sicherheit & Technik ━━━

• AES-256-GCM mit zufälligem Salt und IV bei jeder Verschlüsselung
• Schlüsselableitung: PBKDF2 (SHA-256, 250.000 Iterationen)
• Verschlüsselung läuft im Hintergrund der Extension – Webseiten erhalten dein Passwort nicht
• „Passwort merken“ speichert nur in der Browser-Sitzung (storage.session), nicht dauerhaft auf der Festplatte
• Keine Accounts, keine Cloud, keine Telemetrie


━━━ Datenschutz ━━━

• Keine Datenübertragung an Server
• Kein Tracking, keine Werbung, keine Analyse
• Text wird nur verändert, wenn du aktiv verschlüsselst/entschlüsselst oder Auto-Decrypt nutzt
• data_collection: none


━━━ Gut zu wissen ━━━

Verschlüsselter Text bleibt als Zeichenkette sichtbar (z. B. in einem Post) – er ist ohne Passwort aber nicht lesbar. Neuere Ausgaben zeigen nur den optischen Cipher (Matrix/Runen/…), ohne Markennamen davor. Ältere Prefixe und ENC:v1: (z. B. Audio) werden weiter entschlüsselt.

Nutze ein starkes, geteiltes Geheimnis mit deinen Gesprächspartnern. Bei vergessenem Passwort ist der Inhalt nicht wiederherstellbar.


Support: krayzen@gmx.de
Homepage: https://github.com/NeoEnigma-arch/enigma-2.0
Datenschutz: https://neoenigma-arch.github.io/enigma-2.0/privacy.html
```

### Suchbegriffe (Tags)
Verschlüsselung, Matrix, Privatsphäre, Sicherheit, Text, Passwort, Krypto, Enigma, Privacy, QR, AES, Bild

### Kategorie
Privacy & Security

### Lizenz
MPL-2.0

### Datenschutzrichtlinie (URL)
`https://neoenigma-arch.github.io/enigma-2.0/privacy.html`

### Support / Homepage (URL)
`https://github.com/NeoEnigma-arch/enigma-2.0`

### E-Mail für Nutzeranfragen
`krayzen@gmx.de`

---

## English

### Name
Enigma 2.0

### Summary (max. 250 characters)
```
Encrypt text locally into Matrix, runes or braille style. Image scramble, QR, modem, right-click — no cloud, no tracking.
```

### Full description

```
Enigma 2.0 encrypts your text right in the browser — strong, local, and without any server. Perfect for private messages in public places: social networks (e.g. X/Twitter), forums, comments, or notes on the web.

Only people who know the password can read the content again. Everyone else just sees unreadable cipher text.


━━━ How it works ━━━

1. Open the add-on and set a password
2. Select text on any web page
3. Click Encrypt selection — done

Recipients with the same password decrypt via the add-on, context menu, or cipher paste.


━━━ What you can do ━━━

• Encrypt and decrypt a selection or an entire page
• Right-click menu: encrypt in place, open in a window, show as QR, or open as modem audio
• Choose visual text formats:
  – Matrix / Katakana (classic green look)
  – Runes
  – Braille
  – Zalgo (glitch style)
• Optional auto-decrypt when a session password is active
• Paste a cipher in the popup and decrypt it (e.g. from a QR link)
• Generate a QR code from encrypted text — scanning opens the decrypt page
• Modem audio: play the cipher as tones or save a WAV
• Voice window: load a WAV or record tones and decrypt again
• Image scramble: scramble a photo with your password and save as PNG — only recoverable with the password
• Desktop (compact popup) and Firefox for Android (full-tab UI)


━━━ Security ━━━

• AES-256-GCM with a fresh salt and IV on every encryption
• Key derivation: PBKDF2 (SHA-256, 250,000 iterations)
• Crypto runs in the extension background — web pages never receive your password
• “Remember password” uses session storage only (not permanent disk storage)
• No accounts, no cloud, no telemetry


━━━ Privacy ━━━

• No data is sent to remote servers
• No tracking, ads, or analytics
• Text is changed only when you encrypt/decrypt or enable auto-decrypt
• data_collection: none


━━━ Good to know ━━━

Encrypted text stays visible as characters (e.g. in a post) but is unreadable without the password. Newer output is the visual cipher only (no brand name prefix). Older tagged formats and ENC:v1: (e.g. audio) still decrypt.

Use a strong shared secret with your contacts. If the password is lost, the content cannot be recovered.


Support: krayzen@gmx.de
Homepage: https://github.com/NeoEnigma-arch/enigma-2.0
Privacy: https://neoenigma-arch.github.io/enigma-2.0/privacy.html
```

### Tags
encryption, matrix, privacy, security, text, password, crypto, enigma, QR, AES, image

### Category
Privacy & Security

### License
MPL-2.0

### Privacy policy URL
`https://neoenigma-arch.github.io/enigma-2.0/privacy.html`

### Support / Homepage URL
`https://github.com/NeoEnigma-arch/enigma-2.0`

### Support email
`krayzen@gmx.de`

---

## Screenshots

Siehe `publish/SCREENSHOTS.md` – 4–5 empfohlene Aufnahmen für AMO.

---

## Text für Mozilla-Prüfer (Review Notes)

```
Enigma 2.0 encrypts and decrypts user-selected text locally in the browser (AES-256-GCM + PBKDF2). Optional image scramble (block shuffle + keystream, password-derived) produces a downloadable PNG.

Permissions:
- activeTab: read/modify text on the active page after user action
- contextMenus: encrypt/decrypt, QR, modem audio
- storage: UI settings in local; optional password only in storage.session
- scripting: reinject content script if needed after extension reload
- notifications: local reminder when password is missing
- host/content script <all_urls>: encrypt/decrypt on sites the user visits (e.g. social networks). Transforms text only after explicit user action or optional auto-decrypt with a session password. No remote data collection.

Security notes (1.5.33+):
- Password is never sent to content scripts
- Encryption/decryption runs in the background script
- Password is not stored in storage.local

Privacy:
- No remote servers, analytics, or telemetry
- data_collection_permissions.required = ["none"]

Source is readable JavaScript (no minification).

Contact: krayzen@gmx.de
```

---

## Copy-Paste: Nur DE-Langtext (AMO-Feld)

Den Block unter „Vollständige Beschreibung“ (Deutsch) 1:1 ins AMO-Feld **Beschreibung** kopieren.  
Kurzbeschreibung ins Feld **Zusammenfassung**.
