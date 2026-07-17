# Enigma 2.0 – 1.5.29

## Fix: Firefox for Android (Smartphone)

### Was war kaputt?

1. **Leere Addon-Einstellungen**  
   Es gab keine `options_ui`-Seite. Unter *Add-ons → Enigma* sah man auf Android nur An/Aus und Berechtigungen – Passwort, Voice, Formate usw. stecken im **Popup** (über das Browser-Menü → Erweiterungen → Enigma) bzw. jetzt auch unter **Einstellungen**.

2. **Background-Script stürzte still ab**  
   `contextMenus` gibt es auf Firefox Android **nicht**. Der Background rief trotzdem `browser.contextMenus…` auf und konnte die API-Initialisierung abbrechen.

3. **Fenster (Voice / QR / Audio / Text)**  
   `browser.windows.create` fehlt auf Android. Ohne Fallback öffneten sich Modem-/Voice-Seiten nicht. Jetzt: **neuer Tab**.

### Änderungen

- `contextMenus` nur noch, wenn die API vorhanden ist (Desktop)
- `openPopupWindow` → Fallback `tabs.create` auf Android
- Voice-Button: gleiches Fenster/Tab-Verhalten
- `options_ui` → Popup-UI als Einstellungsseite (`open_in_tab: true`)
- Mobile Viewport + fluid CSS für Overlay/Tab

### Nutzung auf dem Smartphone

1. Firefox-Menü (⋮) → **Erweiterungen** → **Enigma 2.0** tippen (öffnet das Overlay), **oder**
2. Add-ons verwalten → Enigma → **Einstellungen** (volle UI im Tab)
3. Passwort setzen, dann Verschlüsseln / Voice-Modem

### Addon deinstallieren (Android)

1. Firefox-Menü → **Add-ons** / **Erweiterungen**
2. **Enigma 2.0** antippen
3. Drei-Punkte-Menü (⋮) oder Schalter → **Entfernen** / **Remove**

Falls „Entfernen“ fehlt: Extension war ggf. per Debug/ADB temporär installiert → Firefox-App-Daten löschen oder Extension in *about:debugging* (Desktop + USB) entfernen.

### Desktop

Unverändert: Rechtsklick-Menüs, Popup-Fenster, Voice-Fenster.
