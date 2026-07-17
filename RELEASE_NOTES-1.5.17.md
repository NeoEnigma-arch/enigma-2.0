# Enigma 2.0 – Release Notes 1.5.17

## Deutsch

### Neu
- **Popup-Design:** schwarzer Hintergrund mit animiertem Matrix-Regen.
- **Textformat-Auswahl** im Popup (über der Farbe):
  - Katakana (Matrix) – Standard, abwärtskompatibel (`⎔MX2:`)
  - Runen (`⎔RN2:`)
  - Braille (`⎔BR2:`)
  - Zalgo (`⎔ZL2:`)
- Crypto unverändert: **AES-256-GCM** + **PBKDF2** (250 000 Iterationen).

### Verbessert / Behoben
- **Zalgo im Composer:** bleibt im Post-Fenster (weniger Combining Marks, Containment-CSS).
- **Zalgo-Farbe:** gewählte Schriftfarbe greift auch auf X.com (`-webkit-text-fill-color`).
- **i18n:** Labels für Textformat, Farbe, Cipher-Bereich und Statusmeldungen folgen dem Sprachwechsel (alle Locales).
- QR-Fenster unterstützt alle Emblem-Formate beim Komprimieren nach `ENC:v1:`.

### Kurzversion für AMO
```
Neu: Matrix-Popup (schwarz + Regen), Textformate Katakana/Runen/Braille/Zalgo, Zalgo bleibt im Post und übernimmt die Farbe; i18n für Format- und Farb-Labels.
```

---

## English

### New
- **Popup design:** pure black background with animated Matrix rain.
- **Text format selector** in the popup (above color):
  - Katakana (Matrix) – default, backward compatible (`⎔MX2:`)
  - Runes (`⎔RN2:`)
  - Braille (`⎔BR2:`)
  - Zalgo (`⎔ZL2:`)
- Crypto unchanged: **AES-256-GCM** + **PBKDF2** (250,000 iterations).

### Improved / Fixed
- **Zalgo in composers:** stays inside the post box (milder marks + containment CSS).
- **Zalgo color:** selected color applies on X.com (`-webkit-text-fill-color`).
- **i18n:** format, color, cipher-panel labels and status strings follow language switch (all locales).
- QR window supports all emblem formats when compacting to `ENC:v1:`.

### Short version for AMO
```
New: black Matrix popup rain, text formats Katakana/Runes/Braille/Zalgo, Zalgo stays in posts and keeps color; i18n for format/color labels.
```
