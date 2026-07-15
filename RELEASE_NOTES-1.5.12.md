# Enigma 2.0 – Release Notes 1.5.12

## Deutsch

### Neu
- **QR-Code öffnet Entschlüsselungsseite** – Beim Scannen mit dem Smartphone öffnet sich ein Link zur Enigma-Entschlüsselungsseite (nicht nur roher Cipher-Text).
- Auf der Seite dasselbe Passwort wie im Addon eingeben → Klartext wird lokal angezeigt.
- **Mit installiertem Enigma-Addon in Firefox** und gespeichertem Sitzungs-Passwort kann die Entschlüsselung **automatisch** erfolgen.
- Protocol-Handler `web+enigma:` für Desktop-Firefox (Addon-Entschlüsselungsseite).

### Wichtig (GitHub Pages)
Damit der QR auf dem Smartphone funktioniert, muss die Seite online sein:

`https://neoenigma-arch.github.io/enigma-2.0/decrypt.html`

Dateien hochladen (Ordner `github-pages/`):
- `decrypt.html`, `decrypt.js`, `crypto.js` (und optional `privacy.html`)

Assistent: `github-pages/GITHUB-PAGES-STARTEN.bat`

### Kurzversion für AMO
```
Neu: QR-Codes öffnen eine Entschlüsselungsseite im Browser. Passwort eingeben (oder automatische Entschlüsselung mit installiertem Enigma-Addon in Firefox). Smartphone-Scan nutzbar.
```

### Update-Text (kurz)
```
Version 1.5.12 – QR-Scan fürs Smartphone

• QR enthält jetzt einen Link zur Entschlüsselungsseite
• Smartphone öffnet Browser/Firefox → Passwort eingeben → Klartext
• Mit Enigma-Addon + gespeichertem Passwort in Firefox ggf. automatisch
• GitHub-Pages-Dateien für decrypt.html müssen online sein
```

---

## English

### New
- **QR opens decrypt page** – Scanning on a phone opens the Enigma decrypt page (not raw cipher text alone).
- Enter the same password as in the add-on → plaintext is shown locally.
- **With Enigma installed in Firefox** and a saved session password, decryption can happen **automatically**.
- Protocol handler `web+enigma:` for desktop Firefox.

### Important (GitHub Pages)
The decrypt page must be published at:

`https://neoenigma-arch.github.io/enigma-2.0/decrypt.html`

Upload from `github-pages/`: `decrypt.html`, `decrypt.js`, `crypto.js`

### Short version for AMO
```
New: QR codes open a browser decrypt page. Enter password (or auto-decrypt with Enigma in Firefox). Usable when scanning on a phone.
```
