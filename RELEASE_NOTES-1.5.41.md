# Enigma 2.0 – 1.5.41

## Format-Farben (fest)

Verschlüsselter Text hat feste Farben pro Format – keine manuelle Farbwahl mehr:

| Format | Farbe |
|--------|--------|
| Matrix c0d3 | Grün |
| Runen | Blau |
| Braille | Schwarz (mit Glow) |
| Zalgo | Silber (mit Glow) |
| 3nigm4 | Gold |

- Farbauswahl im Popup und in den Optionen entfernt
- Zalgo nutzt denselben Glow wie die anderen Formate

## QR-Fenster

- Cipher und Original in getrennten Feldern (einzeln markier- und kopierbar)
- QR-Link / Privacy-URL-Feld entfernt
- Kein Select-All mehr beim Klick auf die Textfelder
- Fenster öffnet mit **680 × 416**, Layout Querformat (QR links, Text rechts)

## Bild-Scramble

- Hinweistext: Beim Auswählen wird verschlüsselt/entschlüsselt; Datei landet im Download-Ordner

## Performance (aus 1.5.40)

- Günstiger Cipher-Vorfilter, lazy Font, scoped DOM-Scans
