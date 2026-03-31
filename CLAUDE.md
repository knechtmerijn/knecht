# Knecht

## Wat is dit
Knecht is een web-app voor wielrenners. Je uploadt een GPX-route
en krijgt in één overzicht alles wat je moet weten voordat je
op de fiets stapt: weer, kledingadvies, voedingsadvies, hoogte-
profiel, en een packing checklist.

De naam "Knecht" komt uit het wielrennen: de knecht is de renner
die de kopman ondersteunt. Deze app is jouw digitale knecht.

## Tech stack
- Next.js (App Router) met TypeScript
- Tailwind CSS voor styling
- Open-Meteo API voor weer (gratis, geen key nodig)
- Leaflet.js voor kaartweergave
- Recharts voor hoogteprofiel
- gpxparser voor GPX-bestanden parsen
- Alles client-side, geen backend of database nodig

## Design-principes
- Clean, sportief, Rapha-achtige esthetiek. Geen poespas.
- Donkere header (#1a1a2e), warm oranje accent (#f97316)
- Warme witte achtergrond (#fafaf9)
- Groene kleur voor positieve elementen (#22c55e)
- Font: Sora voor headings, DM Sans voor body
- Elke pixel heeft een functie. Geen overbodige UI-elementen.
- Toon: Nederlands, nuchter, af en toe een knipoog

## App-structuur
Eén pagina, geen routing. Van boven naar beneden:
1. Header met naam "Knecht" en subtitel
2. GPX upload (drag and drop)
3. Datum- en tijdkiezer + snelheidsslider
4. Routekaart
5. Hoogteprofiel
6. Weersoverzicht per uur
7. Kledingadvies
8. Voedingsadvies
9. Packing checklist
10. Footer
