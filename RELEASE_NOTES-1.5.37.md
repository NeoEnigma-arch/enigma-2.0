# Enigma 2.0 – 1.5.37

## Fix: Rechtsklick-Menü Sprache

### Problem
Die Einträge im Kontextmenü (Rechtsklick → Enigma) blieben oft in der **Browser-Sprache** (z. B. Französisch), auch wenn im Addon-Menü eine andere Sprache gewählt war.

### Ursache
Der Background-Script-I18n-Cache wurde beim Sprachwechsel nicht neu geladen (`I18n.init()` läuft nur einmal pro Session).

### Lösung
Vor dem Aufbau der Context-Menüs wird die gespeicherte Addon-Sprache (`uiLocale`) erneut gelesen und angewendet. Beim Umschalten im Popup werden die Menütitel sofort neu gesetzt.

### Testen
1. Addon neu laden (`v1.5.37`)
2. Im Popup z. B. **Deutsch** wählen
3. Text markieren → Rechtsklick → Enigma-Einträge sollten auf Deutsch sein
4. Auf **English** umstellen → Menüeinträge wechseln mit (ohne Browser-Neustart)
