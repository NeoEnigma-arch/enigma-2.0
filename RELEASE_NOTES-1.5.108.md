# Enigma 2.0 – 1.5.108

Decrypted YouTube comments use the normal comment font size again.

## English (AMO)

- **Fix:** Decrypting a YouTube comment no longer drops the inner `.yt-core-attributed-string` span (that is where YouTube puts 14px / 1.4rem). Plaintext is written back into that span so it matches neighboring comments.
- Same AES-256-GCM / PBKDF2. No data collection.

## Deutsch (AMO)

- **Fix:** Entschlüsselte YouTube-Kommentare behalten den inneren `.yt-core-attributed-string`-Span (dort liegt die 14px / 1,4rem). Der Klartext hat wieder die normale Kommentargröße.
- Gleiche AES-256-GCM / PBKDF2. Keine Datenerfassung.

## Short paste (AMO version notes, EN)

Decrypted YouTube comments match the normal 14px comment size again. Same AES-256-GCM, no data collection.

## Kurz (AMO Versionshinweise, DE)

Entschlüsselte YouTube-Kommentare haben wieder die normale 14px-Kommentargröße. Gleiche AES-256-GCM, keine Datenerfassung.
