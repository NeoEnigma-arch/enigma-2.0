# Enigma 2.0 – Release Notes 1.5.14

## Deutsch

### Behoben (kritisch)
- **QR öffnete Google-Suche statt einer Seite** – Ursache: `web+enigma:` wird am Smartphone nicht als Link erkannt, Firefox sucht den Text bei Google.
- QR enthält wieder eine echte **`https://`-URL** zur GitHub-Pages-Seite (wie `privacy.html`, die bereits online ist).
- **Passwortfeld** auf der Entschlüsselungsseite: groß, tippbar, Anzeigen/Verbergen.
- **Popup:** Bereich „Cipher entschlüsseln“ – Cipher/QR-Text einfügen und lokal entschlüsseln (auch ohne Scan-Seite).

### Einmalig nötig (GitHub Pages)
`privacy.html` **neu hochladen** (ersetzt die alte Datei, enthält jetzt Entschlüsselung bei `#c=…`):

Ordner: `github-pages/privacy.html`  
URL: `https://neoenigma-arch.github.io/enigma-2.0/privacy.html`  
Assistent: `github-pages/GITHUB-PAGES-STARTEN.bat`

### Kurzversion für AMO
```
Fix: QR nutzt https-Link (kein Google-Search mehr). Entschlüsselungsseite mit Passwortfeld. Popup: Cipher einfügen und entschlüsseln. Einmal privacy.html auf GitHub Pages aktualisieren.
```

---

## English

### Fixed (critical)
- **QR triggered Google search** – `web+enigma:` is not treated as a URL on phones; Firefox searched for it.
- QR again uses a real **https://** GitHub Pages URL.
- Decrypt page password field improved; popup can paste/decrypt cipher text.

### One-time setup
Re-upload `github-pages/privacy.html` to GitHub Pages (adds decrypt UI when `#c=` is present).
