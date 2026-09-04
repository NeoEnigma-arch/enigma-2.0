# Enigma 2.0 – 1.5.109

Auto-decrypt now runs on YouTube comments the same way it does on X.com.

## English (AMO)

- **Fix:** YouTube comments load late and stamp empty Polymer hosts first. Auto-decrypt was waiting for cipher text on the added node, which never came, so nothing was decoded.
- **Fix:** Visible comments are scanned after they appear, after scrolling the comment section, and after expanding “Read more”. Failed truncated stubs are not permanently skipped.
- Same AES-256-GCM / PBKDF2. No data collection.

## Deutsch (AMO)

- **Fix:** YouTube-Kommentare laden spät und kommen zuerst als leere Polymer-Hosts. Auto-Decrypt hat auf Cipher-Text im hinzugefügten Knoten gewartet — der war noch nicht da, also passierte nichts.
- **Fix:** Sichtbare Kommentare werden entschlüsselt, sobald sie da sind, nach dem Scrollen im Kommentarfeld und nach „Mehr anzeigen“. Abgeschnittene Stubs werden nicht dauerhaft übersprungen.
- Gleiche AES-256-GCM / PBKDF2. Keine Datenerfassung.

## Short paste (AMO version notes, EN)

Auto-decrypt works on YouTube comments, including late-loaded and truncated ones. Same AES-256-GCM, no data collection.

## Kurz (AMO Versionshinweise, DE)

Auto-Decrypt greift auf YouTube-Kommentaren, auch wenn sie spät laden oder gekürzt sind. Gleiche AES-256-GCM, keine Datenerfassung.
