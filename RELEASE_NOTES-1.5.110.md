# Enigma 2.0 – 1.5.110

Decrypt/encrypt selection now works on pages that put the text in a separate iframe (e.g. eBay listings), not only in X/YouTube chats.

## English (AMO)

- **Fix:** Selected ciphertext on sites like eBay lives in a description iframe. The addon only looked at the top frame (and only at X/YouTube text hosts), so it reported “no text selected” even though the same cipher decrypted in the desktop app.
- **Fix:** Context-menu decrypt is sent to the iframe that actually has the selection. If the page cannot be rewritten, plaintext opens in the result window.
- Auto-decrypt remains X.com and YouTube only. Same AES-256-GCM / PBKDF2. No data collection. No new permissions.

## Deutsch (AMO)

- **Fix:** Verschlüsselter Text auf Seiten wie eBay sitzt in einem Beschreibungs-iframe. Das Addon hat nur den Hauptframe geprüft (und nur X/YouTube-Textfelder), deshalb kam „kein Text markiert“, obwohl dieselbe Chiffre in der .exe lesbar war.
- **Fix:** Rechtsklick-Entschlüsseln geht an den iframe mit der Markierung. Wenn die Seite den Text nicht ersetzen lässt, erscheint der Klartext im Ergebnis-Fenster.
- Auto-Decrypt bleibt auf X.com und YouTube. Gleiche AES-256-GCM / PBKDF2. Keine Datenerfassung. Keine neuen Berechtigungen.

## Short paste (AMO version notes, EN)

Decrypt works on iframe pages such as eBay listings, not only X/YouTube. Same AES-256-GCM, no data collection.

## Kurz (AMO Versionshinweise, DE)

Entschlüsseln funktioniert auch in iframes (z. B. eBay-Angebote), nicht nur auf X/YouTube. Gleiche AES-256-GCM, keine Datenerfassung.
