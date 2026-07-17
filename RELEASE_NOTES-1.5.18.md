# Enigma 2.0 – Release Notes 1.5.18

## Deutsch

### Neu: Modem-Voice
- **Rechtsklick** auf markierten (verschlüsselten) Text → **„Als Modem-Audio öffnen“**
- Fenster: **Abspielen**, **Stop**, **WAV herunterladen**, Cipher kopieren
- Cipher wird fürs Audio als kompaktes `ENC:v1:` kodiert (kürzer, robuster)
- **Popup:** „Voice-Nachricht (aufnehmen)“ – Mikrofon hört Modem-Töne, dekodiert Cipher, entschlüsselt mit Passwort
- **WAV laden** im Popup (zuverlässigste Variante am Smartphone)

### Technik
- FSK-Modem: 1200/2200 Hz, 40 Baud, Frame `EN2A` + Länge + Payload + CRC32
- Klingt absichtlich zerhackt/modemartig

### Kurzversion für AMO
```
Neu: Modem-Voice – Cipher als FSK-Töne abspielen/downloaden; am Handy aufnehmen oder WAV laden und mit Passwort entschlüsseln.
```

---

## English

### New: modem voice
- **Right-click** selection → **“Open as modem audio”**
- Window: **Play**, **Stop**, **Download WAV**, copy cipher
- Payload compacted to `ENC:v1:` for shorter/more robust audio
- **Popup:** “Voice message (record)” – mic listens for tones, decodes cipher, decrypts with password
- **Load WAV** in popup (most reliable on phones)

### Technical
- FSK modem: 1200/2200 Hz, 40 baud, frame `EN2A` + length + payload + CRC32

### Short version for AMO
```
New: modem voice – play/download cipher as FSK tones; on phone record or load WAV and decrypt with password.
```
