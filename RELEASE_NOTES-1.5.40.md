# Enigma 2.0 – 1.5.40

## Performance (Seitenaufbau)

Content-Script war auf vielen Seiten spürbar langsam. Diese Version senkt die Last deutlich:

### Cipher-Erkennung
- Neuer günstiger Vorfilter `mightContainCipher` vor teurem `findTokens`
- Bare-Mixed-Scan: O(n) per Index statt O(n²) `text.slice(i)` pro Zeichen
- Schnellere Mixed-Heuristik (weniger per-Zeichen Map-Lookups)

### Content-Script
- EnigmaRain-Font nur noch lazy (erster Matrix-Span), nicht mehr auf jeder Seite
- Kein Full-DOM-Walk ohne Cipher-Verdacht; auf X.com nur Tweet/Composer-Container
- MutationObserver: scoped Roots statt immer `document.body`, Batch-Limits
- Settings-Cache (~2 s), Debounce 450 ms
- Boot per `requestIdleCallback`, damit die Host-Seite zuerst painten kann

### Sonstiges
- Verhalten (Encrypt/Decrypt/Auto-Style) unverändert, nur weniger Arbeit ohne Cipher
