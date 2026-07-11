# Enigma 2.0 – Release Notes 1.5.3

## Deutsch

### Behoben
- **Auswahl-Verschlüsselung / Entschlüsselung** – Deutlich stabilere Handhabung in contenteditable-Bereichen (z. B. X/Twitter Composer) und bei stark fragmentierten DOM-Strukturen.
- **Teilweises Ersetzen von Text** – Problem behoben, bei dem bei gemischtsprachigem Inhalt (Deutsch + Englisch) nur ein Teil ersetzt wurde und Originaltext + verschlüsselter Matrix-Text gleichzeitig sichtbar blieben.
- **Matrix-Span-Wrapper** – Der styled `<span data-text-chiffrierer>` wird beim Entschlüsseln jetzt vollständig entfernt (nicht nur der Inhalt ersetzt).
- **Rechtsklick vs. Popup** – Konsistentes Verhalten zwischen Kontextmenü (Rechtsklick) und Buttons im Addon-Popup.
- **Race Conditions bei asynchroner Verschlüsselung** – Der Originaltext wird jetzt sofort aus der Selection entfernt, bevor die PBKDF2-Verschlüsselung abgeschlossen ist.
- **Wieder-Verschlüsseln nach Entschlüsseln** – Funktioniert jetzt zuverlässig, auch nach vorherigen Operationen auf komplexen Seiten wie X.

### Verbessert
- Sofortiges Löschen der Auswahl + temporärer Marker für zuverlässige Ersetzungen.
- Bessere Erkennung und vollständiges Ersetzen von alten Matrix-Wrappern.
- Erweiterte Schutzlogik (`isExtensionNode`) für temporäre Marker und Matrix-Elemente.
- Verbesserte Range-Handhabung beim Ersetzen in contenteditable-Editoren.

### Hinweis
Diese Version konzentriert sich auf Stabilität bei der Arbeit mit Auswahlen auf modernen Webseiten (insbesondere X.com mit Übersetzungstool und gemischten Sprachen).

### Kurzversion für AMO
```
Stabile Auswahl-Verschlüsselung/Entschlüsselung auf X und contenteditable-Seiten. Problem mit teilweisem Ersetzen bei gemischtsprachigem Text behoben. Matrix-Wrapper werden jetzt sauber entfernt. Bessere Kompatibilität zwischen Popup und Kontextmenü.
```

---

## English

### Fixed
- **Encrypt / Decrypt selection** – Much more reliable handling inside contenteditable areas (e.g. X/Twitter composer) and heavily fragmented DOM structures.
- **Partial text replacement** – Fixed bug where mixed-language text (German + English) would only partially be replaced, leaving original text and encrypted matrix text visible at the same time.
- **Matrix span wrapper** – The styled `<span data-text-chiffrierer>` is now fully removed on decryption instead of only replacing its content.
- **Context menu vs Popup** – Consistent behavior between right-click context menu and popup buttons.
- **Race conditions during async crypto** – Original selected text is now removed immediately before the (slow) PBKDF2 encryption completes.
- **Re-encrypt after decrypt** – Now works reliably even after previous operations on complex sites like X.

### Improved
- Immediate deletion of selection + temporary marker technique for stable replacements.
- Better detection and complete replacement of leftover matrix wrapper spans.
- Extended protection logic (`isExtensionNode`) for temp markers and matrix elements.
- Improved range handling when replacing inside contenteditable editors.

### Note
This release focuses on stability when working with selections on modern websites (especially X.com with its translation tool and mixed-language content).

### Short version for AMO
```
Stable encrypt/decrypt selection on X and contenteditable sites. Fixed partial replacement bug with mixed-language text. Matrix wrappers are now cleanly removed. Better compatibility between popup and context menu.
```