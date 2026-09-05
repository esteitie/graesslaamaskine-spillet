# Græsslåmaskine Spillet
Browserspil til en 5-årig. Læs spilplan.md før du gør noget – afsnit 9 er specifikationen.
Niveau 2 planlægges i spilplan-niveau-2.md – byg intet derfra, før beslutningerne i
dens afsnit 2 er truffet af forældrene.

Regler:
- Ren HTML/CSS/JS som ES-moduler. Ingen frameworks, ingen bundler, ingen TypeScript.
- Byg én fase ad gangen (spilplan.md afsnit 7). Meld først en fase færdig, når alle
  acceptkriterier i afsnit 12 er opfyldt og `npm test` er grøn.
- Alt UI uden læsetekst: ikoner + dansk oplæser. Brug KUN replikkerne i afsnit 10.
- Alle knapper min. 80x80 px. Pointer Events overalt. Følg iPad-reglerne i 9.7.
- Ingen "game over", ingen straf, ingen timer der løber ud.
- Tekster og replikker på dansk; kode, variable og commits på engelsk.
- Eksponér window.__game til tests. Understøt ?level= ?skipIntro=1 ?mute=1.
- Spørg, hvis noget i planen er uklart – gæt ikke.

## Niveau 2 er bygget

Fase 4–8 fra `spilplan-niveau-2.md` står i koden: 100 % klip + egen hjemkørsel,
stjerner efter klip/hjem/sommerfugle, 3D-garage (Three.js i `libs/`, `?flat=1` som
reserve), levende baner, Skolehaven (`school.js` + `maze*`/`letter*`-baner) og to
gemmepladser. Gem-formatet er version 3; version 1 og 2 migreres til spiller 1.

Regler der er kommet til:
- En bane er først slut, når barnet **selv** har kørt hjem. Maskinen kører kun selv
  hjem, når batteriet er tomt – det er historien, ikke en genvej.
- `computeMowable()` i `grid.js` afgør hvad der overhovedet kan klippes. Bruges som
  nævner i fremskridtet, så 100 % altid kan nås. Rør den ikke uden at tjekke bane 4
  (dammen) og labyrinterne.
- Skolehavens baner har et navn i stedet for et nummer (`maze1`, `letterM`). De giver
  klistermærker, ikke stjerner i banekortet.

## Gro, gartneren

`app.guide` (fra `src/guide.js`) lever oven på alle skærme. Skærme taler til barnet
gennem hende: `app.guide.say(nøgle, vars, { icon, side, top, sticky })`. Boblen får kun
ikoner (`bubble.letter/sum/emoji/svg/dots`), aldrig læsetekst. `go()` skjuler hende ved
skærmskift; en skærm der vil have hende stående, sætter `sticky: true`.

## Tegnefasen er slået fra

Banerne starter direkte i køre-fasen: `prelayWire()` i `level.js` lægger ledningen
langs plænen og en ring om hvert bed, og kalder `startDrive()`. `?draw=1` sætter
`app.drawingEnabled` og giver tegnefasen tilbage – hele koden til afsnit 9.5 står
urørt, og `tests/drawing.spec.js` holder den i live.

Alt UI ligger i `#ui`, som er `pointer-events: none`; kun knapper og paneler tager
imod tryk. Resten skal falde igennem til canvasset, ellers kan man hverken tegne
eller sætte joysticket.

## Sådan kører du spillet

Spillet skal serveres over HTTP (ES-moduler virker ikke fra `file://`).

```
npm start          # node/npx findes -> serve . paa 8080
python3 serve.py   # ingen node -> samme sag, foerste ledige port fra 8080
```

Brug ikke port 5000: macOS' AirPlay-modtager sidder der og svarer 403 paa alt.

Ekstra URL-parametre ud over dem i planen:
- `?turbo=N` skruer tiden op N gange (kun til Playwright-tests, så en hel bane kan slås
  på få sekunder).
- `?sw=1` / `?sw=0` tvinger service worker til/fra. Den registreres normalt kun over
  https (GitHub Pages), så en lokal http-server ikke ligger og cacher under udvikling.

## Ud over spilplanens filliste

- `src/ui.js` – fælles DOM-hjælpere (`el`, `iconButton`, `holdButton`, `starRow`) og
  alle ikoner. Tilføjet for ikke at gentage det samme i workshop.js, map.js og level.js.
- `tools/testkit.js` – hjælpere der styrer spillet inde i browseren (tegn ledning,
  hold piletaster, klip hele plænen). Bruges kun af Playwright og af hånden i konsollen.
- `tools/make-icons.py` – genererer app-ikonerne. Kræver kun Python.
- `serve.py` – statisk server når Node ikke er installeret.

## Testkroge i window.__game

Ud over `screen`, `level`, `machine` og `save`:

- `level` har også `stars`, `position`, `wirePoints`, `grassCells`, `insideCells`,
  `cutCells`, `islandsDone`, `islandsTotal`, `battery` og `nearestUncut`.
- `go(navn, opts)` skifter skærm.
- `step(sekunder)` simulerer spiltid uden at vente på requestAnimationFrame, så en
  hel bane kan spilles igennem i en test på få sekunder.
