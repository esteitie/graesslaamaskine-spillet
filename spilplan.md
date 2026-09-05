# Græsslåmaskine Spillet – Plan

*Version 2.0 · 1. september 2026 · Klar til Claude Code*

> **Sådan bruges dokumentet:** Læg det i en tom mappe sammen med `CLAUDE.md` (afsnit 11). Start Claude Code i mappen og indsæt startprompten fra afsnit 12. Byg én fase ad gangen. Afsnit 1-8 er *hvad* og *hvorfor*; afsnit 9-12 er *hvordan* – med tal, formater og acceptkriterier, så intet skal gættes.

## 1. Idé i én sætning

Et browserspil for en 5-årig, hvor man først bygger sin egen robotgræsslåmaskine og derefter lægger kantledning rundt om græsplænen på fem baner og selv kører maskinen rundt og slår græsset.

## 2. Designprincipper for en 5-årig

- **Ingen tekst der skal læses.** Alt vises med ikoner, farver, animationer og en venlig dansk oplæser. Al tekst på skærmen er pynt, aldrig nødvendig.
- **Store touch-knapper.** Minimum 80×80 px. Virker lige godt på iPad med finger og på computer med mus.
- **Man kan ikke tabe.** Ingen "game over", ingen straf, ingen tid der løber ud. Går noget galt, får man venlig hjælp og prøver igen. Belønning er stjerner, konfetti og lyde.
- **Korte runder.** Hver bane kan klares på 1-3 minutter.
- **Aldrig fastlåst.** En hjælp-knap (lysende pære) viser med en animeret hånd, hvad man skal gøre. Efter 20 sekunder uden fremskridt kommer hjælpen af sig selv.
- **Barnet styrer selv.** Maskinen køres med et joystick, der opstår der hvor fingeren lander. En Auto-knap lader maskinen køre selv, hvis barnet vil holde pause.
- **Autosave.** Spillet husker maskinen og de klarede baner (localStorage), så man kan lukke iPad'en og fortsætte senere.

## 3. Del 1: Værkstedet (byg din maskine)

Maskinen står stort i midten (set skråt oppefra), og et bånd af kategorier ligger i bunden. Tryk på en kategori, og delene glider ind. Tryk på en del, og den "klikker" fast på maskinen med en lyd og et lille hop.

| Kategori | Valgmuligheder | Effekt i spillet |
|---|---|---|
| **Hjul** | Almindelige, Store terrænhjul, Larvefødder, Pigge-hjul | Fart og hvor godt den kører op ad bakke (bane 3) |
| **Klinge** | Lille rund, Stjerneklinge, Tredobbelt roterende, Laserklinge (sjov) | Hvor bredt et spor den slår = hvor hurtigt banen slås |
| **Skærm** | Lille lampe, Smiley-skærm, Regnbueskærm, Kattefjæs | Pynt – skærmen viser humør (glad når den klipper, søvnig når batteriet er lavt) |
| **Farve** | Orange, Grøn, Blå, Pink, Sølv, Regnbue | Pynt |
| **Ekstra** | Antenne med flag, Blinklys, Horn, Øjne, Solpanel, Klistermærker | Horn og blinklys får en knap under banerne (lyd/lys). Solpanel giver 50 % mere batteri (bane 5) |
| **Navn** | Zippy, Bob, Flip, Græs-Gunnar, Lotte, Max, Mimi, Turbo (hver med et ikon) | Oplæseren bruger navnet: "Godt gået, Zippy!" |

En stor grøn "Kør!"-knap sender maskinen ud af garagen til banekortet. Maskinen kan altid ændres igen via et skruenøgle-ikon på banekortet.

Maskinens udseende er vores eget design: en afrundet "bille"-form med en stor rød stop-knap på toppen, to store baghjul og et lille forhjul. Ikke en kopi af noget mærke.

## 4. Del 2: Banerne

### Banekortet
Et hyggeligt kort med fem haver forbundet af en sti. Klarede haver har stjerner over sig; den næste blinker; resten har et lille lås-ikon. Tryk på en have for at starte. Et lille tandhjul i hjørnet åbner "voksen-panelet": lyd til/fra og "start forfra" (hold knappen nede i 3 sekunder).

### Sådan spilles en bane (samme opbygning hver gang)

1. **Se haven.** Haven vises, og oplæseren siger fx "Her er Bedstemors have. Kan du vise Zippy, hvor græsset er?" Ladestationen står allerede i kanten af plænen og blinker.
2. **Læg kantledning.** Barnet trækker fingeren fra ladestationen rundt om plænen og tilbage. Der tegnes en tyk **orange** ledning (tydelig mod det grønne) med små pløkke undervejs. Når stregen når tilbage til stationen, lukkes den med et *klik*, og ledningen "retter sig ud" (snapper til plænekanten).
   - Stregen behøver ikke være præcis – se snapregler i 9.4.
   - Ledningen må ikke gå gennem blomsterbed, dam eller terrasse. Gør den det, bliver stykket rødt, oplæseren siger hvorfor, og stykket forsvinder, så man tegner det igen.
   - Bane 1-2 har stiplede hjælpelinjer, man bare følger. Bane 3-5 har dem ikke (men hjælp-knappen viser dem).
3. **Beskyt øer (kun baner med blomsterbed).** Oplæseren siger "Nu skal blomsterne beskyttes!" og bedet blinker. Barnet tegner en lille ring rundt om bedet (start hvor som helst tæt på bedet, slut hvor man startede). Ringen snapper til bedets kant. Maskinen kan nu ikke køre ind i bedet.
4. **Kør!** En stor grøn knap dukker op. Derefter styrer barnet selv med joystick (eller piletaster). Ledningen holder maskinen inde: kører man mod den, stopper maskinen blødt og siger "bip". Græsset klippes i et lysere grønt spor. Auto-knappen (robot-ikon) får maskinen til at køre selv som en rigtig robot; rører man joysticket, tager man over igen.
5. **Færdig!** Ved 95 % klippet kører maskinen selv hjem til ladestationen, der kommer konfetti og stjerner, og næste have låses op.

### De fem baner

| # | Have | Nyt element | Plænens form |
|---|---|---|---|
| 1 | **Den lille have** | Kun græs. Hjælpelinjer. Lærer: tegn rundt, kør, klip. | Rektangel |
| 2 | **Bedstemors have** | Blomsterbed midt på plænen – skal beskyttes med en ring (ø). Hjælpelinjer. | Rektangel med rundt bed |
| 3 | **Bakkehaven** | Skrå bakke på halvdelen af plænen. Almindelige hjul er tydeligt langsomme op ad bakken; terrænhjul og larvefødder er hurtige. Ingen hjælpelinjer. | L-form |
| 4 | **Haven med dammen** | Terrassen skærer et hjørne af plænen (ledningen skal udenom). Dammen ligger *inde* på plænen uden ledning – barnet skal selv styre udenom. Kører man i: "Plask!", maskinen ryster sig og hopper tilbage på græsset. Ingen straf. | Uregelmæssig |
| 5 | **Den store parkhave** | To plæner forbundet af en smal sti (én stor ledning rundt om det hele). Batteri der løber tør: skærmen bliver søvnig, maskinen kører selv hjem ad en stiplet guidelinje, lader 5 sekunder og er klar igen. Solpanel = mere batteri. Klinge-valget gør stor forskel. | Håndvægt-form |

Efter bane 5: "Du er græsmester!" – pokal, konfetti og maskinen i regnbue-glimmer. Alle baner kan spilles igen fra kortet.

## 5. Version 2-idéer (efter test med barnet)

Pindsvin og fugle der hopper væk når maskinen kommer (aldrig noget der kommer til skade). Vejr: regn gør græsset længere næste gang. Fotoknap der gemmer et billede af maskinen. Frit legetøjs-mode: en have uden mål, hvor man bare kører rundt og trykker på hornet. Flere maskiner i garagen (byg en til lillesøster). Tap-to-go: tryk et sted på plænen, og maskinen kører derhen.

## 6. Teknik (overblik)

- **Ren HTML + CSS + JavaScript** som ES-moduler. Ingen frameworks, ingen bundler, ingen build-step. Kræver en statisk webserver (ES-moduler virker ikke fra `file://`): `npx serve .` lokalt, GitHub Pages til deling.
- **Canvas 2D** til haverne. Logisk lærred 960×600, skaleret til skærmen med letterbox. Knapper og joystick ligger som DOM-elementer ovenpå (nemmere at gøre store og tilgængelige).
- **Maskinen tegnes som SVG** i `machine.js` ud fra datamodellen. I banerne konverteres SVG'en én gang til et `Image` (blob-URL) og tegnes roteret på canvas.
- **Lyd:** Web Audio API-lyde genereret i kode (ingen filer) + `speechSynthesis` med `da-DK`. Alt lyd kan slås fra.
- **Gem:** `localStorage` med versionsnummer.
- **Input:** Pointer Events overalt, så finger og mus behandles ens.
- **Offline og "som en app":** PWA med manifest + service worker (fase 3), så spillet kan lægges på iPad'ens hjemmeskærm og virker uden internet.
- Ingen reklamer, ingen konti, ingen data sendes nogen steder.

## 7. Udviklingsfaser

| Fase | Indhold | Resultat |
|---|---|---|
| **0. Prototype** | Bane 1: tegn ledning, joystick, auto-knap, klip græs, færdig-skærm. Simpel orange firkantet maskine, ingen værksted. | Beviser at kernemekanikken er sjov og forståelig. **Test med barnet!** |
| **1. Værkstedet** | Hjul, klinge, skærm, farve, ekstra, navn. Maskinen som SVG. Gem/indlæs. Intro-skærm. | Man bygger sin maskine og ser den køre i bane 1. |
| **2. Fem baner** | Banekort, bane 2-5, øer, bakke, dam, batteri. Stjerner, oplåsning, græsmester-skærm. | Hele spillet kan spilles igennem. |
| **3. Polish** | Oplæser-replikker, hjælp-hånd, konfetti, animationer, horn/blinklys, voksen-panel, PWA/offline, GitHub Pages. | Klar til at give til barnet og dele. |
| **4. Version 2** | Afsnit 5, prioriteret efter hvad barnet synes er sjovest. | |

Efter hver fase: prøv det med barnet i 5 minutter og skriv ned, hvad der var svært, kedeligt eller sjovt, i afsnit 13. Det styrer næste fase.

## 8. Beslutninger

1. Barnet styrer selv (joystick/piletaster) med Auto-knap som pause-mulighed.
2. Voksen-lås på "start forfra": hold i 3 sekunder.
3. Navn: **Græsslåmaskine Spillet**.
4. Maskinens design er vores eget (bille-form, rød stop-knap).
5. Ledningen er orange, ikke grøn (synlighed).
6. Øer (blomsterbed) tegnes som en separat lille ring – ikke som en "sløjfe" på hovedledningen, som rigtige robotter gør. Det er for svært for en 5-årig.
7. Dammen i bane 4 har bevidst ingen ledning: den lærer barnet at styre, og "plask" er sjovt, ikke en straf.

## 9. Teknisk spec til Claude Code

### 9.1 Projektstruktur

```
graesslaamaskine-spillet/
  CLAUDE.md              ← regler (afsnit 11)
  spilplan.md            ← dette dokument
  package.json           ← devDependencies: serve, @playwright/test
  index.html             ← eneste side; <script type="module" src="src/main.js">
  manifest.webmanifest   ← fase 3
  sw.js                  ← service worker, fase 3
  src/
    main.js              ← opstart, skærmskift: intro → værksted → banekort → bane
    audio.js             ← Web Audio-lyde + oplæser (speechSynthesis, "da-DK")
    save.js              ← localStorage-læs/skriv med version
    machine.js           ← datamodel, effekt-tabel, SVG-tegning, toImage()
    workshop.js          ← værkstedsskærmen
    map.js               ← banekortet + voksen-panel
    level.js             ← én bane: tegn → øer → kør → færdig
    geometry.js          ← pointInPolygon, distToSegment, polygonLength, snap
    input.js             ← Pointer Events, flydende joystick, piletaster
    confetti.js
    voice-lines.js       ← alle replikker (afsnit 10)
    levels/level1.json … level5.json
  tests/                 ← Playwright
```

### 9.2 Skærmflow

`intro` (stor grøn play-knap – det første tryk låser lyd op på iOS) → hvis ingen maskine gemt: `workshop`, ellers `map` → `level` → tilbage til `map`.

URL-parametre til test og forældre: `?level=3` åbner bane 3 direkte, `?skipIntro=1` springer intro over, `?mute=1`. Eksponér `window.__game = { screen, level: { phase, progress, wireClosed }, machine, save }` så Playwright kan læse tilstanden (canvas kan ikke aflæses på anden måde).

### 9.3 Datamodel

```js
// machine
{ name: "Zippy", color: "orange", wheels: "standard", blade: "small",
  screen: "lamp", extras: ["horn","flag"] }
// color:  orange|green|blue|pink|silver|rainbow
// wheels: standard|terrain|tracks|spikes
// blade:  small|star|triple|laser
// screen: lamp|smiley|rainbow|cat
// extras: horn|flag|lights|eyes|solar|stickers

// save (localStorage "graesslaamaskine-spillet")
{ version: 1, machine: {...} | null, stars: [0,0,0,0,0], muted: false }
```

Effekt-tabel (i `machine.js`, bruges af `level.js`):

| Del | Værdi | Effekt |
|---|---|---|
| wheels | standard | fart 1.0 · op ad bakke 0.4 |
| wheels | terrain | fart 1.0 · op ad bakke 0.9 |
| wheels | tracks | fart 0.85 · op ad bakke 1.0 |
| wheels | spikes | fart 1.15 · op ad bakke 0.7 |
| blade | small / star / triple / laser | klipperadius 20 / 26 / 32 / 40 px |
| extras | solar | batteri ×1.5 |

Grundfart: 140 px/s manuelt, 110 px/s i auto.

### 9.4 Baneformat (JSON, koordinater i det logiske 960×600-lærred)

```json
{
  "id": 2,
  "name": "Bedstemors have",
  "station": { "x": 160, "y": 315 },
  "lawn": [[160,110],[820,110],[820,520],[160,520]],
  "islands": [ { "type": "flowerbed", "shape": "circle", "x": 490, "y": 315, "r": 70 } ],
  "hazards": [],
  "blocked": [],
  "hill": null,
  "battery": null,
  "guideLines": true
}
```

- `lawn`: ét polygon (bane 5 er ét håndvægt-formet polygon – ikke to).
- `islands`: forhindringer barnet skal beskytte med en ring (bane 2). Cirkel eller polygon.
- `hazards`: forhindringer uden ledning, fx `{ "type": "pond", "shape": "circle", ... }` (bane 4). Maskinen kan køre i → "plask".
- `blocked`: områder ledningen ikke må krydse, fx terrasse `{ "type": "patio", "shape": "rect", "x","y","w","h" }` (bane 4). Ligger uden for `lawn`.
- `hill`: `{ "polygon": [...], "uphill": [0,-1] }` – enhedsvektor der peger op ad bakken (bane 3).
- `battery`: `{ "seconds": 60, "guidePath": [[x,y],...] }` – guidePath er en liste af punkter fra plænens fjerneste ende hjem til stationen (bane 5).
- **Cellegitter:** 12 px celler (80×50). En celle er græs, hvis dens centrum ligger i `lawn` og uden for alle `islands`.

### 9.5 Kernelogik i `level.js`

**Tegn-fase (ydre ledning)**
1. Pointerdown inden for 60 px af stationen starter ledningen. Nyt punkt for hver 6 px bevægelse.
2. Slippes fingeren, bliver ledningen stående; pointerdown inden for 60 px af sidste punkt fortsætter. Pointerdown andre steder gør ingenting (ingen straf, men hjælp-hånden peger på ledningens ende efter 5 sek.).
3. Krydser et nyt segment et `blocked`-område eller en `island`, farves segmentet rødt i 1 sek., replikken afspilles, og punkter fjernes tilbage til det sidste punkt uden for området.
4. Ledningen lukkes, når den er > 400 px lang og et nyt punkt er inden for 50 px af stationen.
5. **Snap:** Hvis ≥ 80 % af punkterne ligger inden for 60 px af plænekanten, erstattes hele ledningen af `lawn`-polygonet med en 0,5 sek. animation ("ledningen retter sig ud"). Ellers beholdes barnets polygon som det er.
6. **Godkendelse:** Ledningspolygonet skal indeholde ≥ 60 % af græscellerne. Ellers: replik "Prøv at tegne rundt om hele græsset" og ledningen slettes.
7. Stjerner ud fra andel af græsceller inde i ledningen: ≥ 95 % = 3, ≥ 80 % = 2, ellers 1.

**Ø-fase (kun hvis `islands` findes)**
Samme regler, men start hvor som helst inden for 60 px af øens kant, luk når stregen er > 100 px og inden for 40 px af startpunktet. Snap: hvis ≥ 70 % af punkterne er inden for 40 px af øens kant, erstattes ringen af øens kontur. Én ring pr. ø, i rækkefølge.

**Kør-fase**
1. Joystick: opstår der hvor fingeren lander (uden for knapper), dødzone 8 px, maks. 60 px. Retningsvektoren styrer bevægelsen direkte (ikke bil-styring); fart = grundfart × længde/60 × hjulfaktor. Næsen drejer blødt mod bevægelsesretningen (maks. 540°/s). Piletaster giver samme vektor.
2. Før hvert skridt testes 5 punkter (centrum + 4 punkter på radius 14 px) mod ledningspolygonet (skal være inde) og mod alle ø-ringe (skal være ude). Fejler ét, flyttes maskinen ikke, og "bip" afspilles (højst hvert 0,5 sek.).
3. Bakke: hvis bevægelsesvektorens prikprodukt med `uphill` > 0 og maskinen er i `hill.polygon`, ganges farten med hjulets bakkefaktor. Ned ad bakke: ×1.2.
4. Dam (`hazards`): kommer centrum ind i dammen → "plask"-lyd, 0,8 sek. rysteanimation, maskinen sættes tilbage til sidste tørre position. Auto-mode behandler dammen som en væg.
5. Auto: kør ligeud; ved kant/ø/dam vælg en ny tilfældig retning 90-270° væk. Enhver joystick-/tastaturinput slår auto fra.
6. Batteri (bane 5): tæller ned kun mens maskinen bevæger sig. Ved 0: skærmen viser søvnigt ansigt, styring låses, maskinen kører til nærmeste punkt på `guidePath` og følger den hjem, lader i 5 sek. (batteri-animation), styringen gives tilbage. Solpanel: ×1.5 sekunder.

**Klip og færdig**
1. Hver frame: celler med centrum inden for klipperadius sættes til klippet og tegnes i lysere grøn med en diagonal stribe. Fremskridt = klippede celler / græsceller inde i ledningen. Vises som en bjælke øverst med et græs-ikon.
2. Ved ≥ 95 %: styring låses, maskinen kører hjem (samme metode som batteri, ellers lige mod stationen), konfetti, stjerner vises én ad gangen med lyd, replik "Godt gået, {navn}!". Stjerner gemmes (kun hvis flere end før), næste bane låses op. Stor knap: videre til kortet.

### 9.6 Rendering

- Baggrund (jord, sti, blomster uden for plænen, hjælpelinjer) tegnes én gang til et offscreen-canvas.
- Græs-laget er et offscreen-canvas, der opdateres celle for celle, når der klippes.
- Hver frame: baggrund → græs → dam/bed/terrasse → ledning (orange, 8 px, pløk hver 40 px) → station → maskine → evt. plask/konfetti.
- Maskinen: `machine.toImage()` returnerer et `Image` fra SVG'en (cache pr. maskine). Tegnes roteret om sit centrum, størrelse 56×48 px. Under klipning roterer klingen (tegnes separat under maskinen som en halvgennemsigtig cirkel).
- Fase 0 må bruge en simpel orange afrundet firkant med to hjul i stedet for SVG.

### 9.7 iPad-fælder (skal overholdes)

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">` og `touch-action: none` på spilfladen, så Safari ikke zoomer eller scroller.
- `<meta name="apple-mobile-web-app-capable" content="yes">` + `apple-touch-icon`, så det kan lægges på hjemmeskærmen i fuld skærm.
- Web Audio og speechSynthesis starter først efter et brugertryk: opret `AudioContext` og kald `speechSynthesis.speak(new SpeechSynthesisUtterance(""))` i play-knappens click-handler.
- Vælg stemme med `lang` der starter med `da`; findes ingen, kør stille (spillet må aldrig afhænge af tale). Kald `speechSynthesis.cancel()` før hver ny replik.
- Portrættilstand: vis et billede af en iPad der drejes; spillet fortsætter når den vendes. Landskab er det eneste understøttede format.
- Brug `pointercancel` og `setPointerCapture`; iOS sender pointercancel, når fingeren glider ud af elementet.
- `devicePixelRatio` bruges til canvas-opløsning, ellers bliver det uskarpt på Retina.
- Ingen `alert`/`confirm`.

### 9.8 Test (Playwright)

`package.json`: `"test": "playwright test"`, `"start": "serve ."`. Playwright-config starter `serve` selv (`webServer`). Tests bruger `?skipIntro=1&mute=1&level=N` og læser `window.__game`. Der laves hjælpefunktioner `drawWire(page, points)` (pointer-sekvens) og `drive(page, dx, dy, ms)` (piletaster).

## 10. Alle replikker (dansk, korte, venlige)

| Nøgle | Replik |
|---|---|
| intro | "Hej! Velkommen til Græsslåmaskine Spillet!" |
| workshop.start | "Byg din egen græsslåmaskine! Tryk på delene." |
| workshop.part | "Klik! Flot!" (hver 3. gang, ellers kun lyd) |
| workshop.done | "Sikke en flot maskine, {navn}! Nu skal vi ud og slå græs." |
| map.next | "Tryk på haven, der blinker." |
| level.intro.1 | "Her er den lille have. Tegn en streg rundt om græsset. Start ved den blinkende ladestation." |
| level.intro.2 | "Her er Bedstemors have. Tegn rundt om græsset – og pas på blomsterne!" |
| level.intro.3 | "Bakkehaven! Her går det op og ned. Tegn rundt om græsset." |
| level.intro.4 | "Haven med dammen. Tegn rundt om græsset – ledningen skal udenom terrassen." |
| level.intro.5 | "Den store parkhave! Det er den største af dem alle. Tegn rundt om det hele." |
| wire.blocked | "Ups! Ledningen må ikke gå der. Prøv udenom." |
| wire.tooSmall | "Prøv at tegne rundt om hele græsset." |
| wire.closed | "Sådan! Ledningen er sat op." |
| island.start | "Nu skal blomsterne beskyttes. Tegn en ring rundt om bedet." |
| island.done | "Flot! Nu er blomsterne i sikkerhed." |
| drive.start | "Tryk på den grønne knap, og kør {navn} rundt på græsset!" |
| drive.stuck | "Brug fingeren til at styre. Prøv at køre den vej." *(hjælp-hånd viser)* |
| drive.auto | "{navn} kører selv nu. Rør skærmen, når du vil styre igen." |
| drive.pond | "Plask! Det var vådt! Op på græsset igen." |
| drive.batteryLow | "{navn} er træt og kører hjem for at lade op." |
| drive.charged | "Fuld af energi! Kør videre!" |
| drive.half | "Halvvejs! Godt kørt." |
| done | "Godt gået, {navn}! Hele plænen er slået!" |
| master | "Du er græsmester! Tillykke!" |
| reset.hold | "Hold knappen nede, hvis du vil starte helt forfra." |

## 11. CLAUDE.md (læg i projektets rod)

```
# Græsslåmaskine Spillet
Browserspil til en 5-årig. Læs spilplan.md før du gør noget – afsnit 9 er specifikationen.

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
```

## 12. Acceptkriterier og prompts pr. fase

**Fase 0 – Prototype.** Prompt: *"Læs spilplan.md og CLAUDE.md. Opsæt projektet (package.json, Playwright) og byg fase 0: bane 1 med tegn-fase, snap, flydende joystick, piletaster, auto-knap, klip og færdig-skærm med konfetti. Simpel orange firkantet maskine. Skriv Playwright-tests for kriterierne. Vis mig til sidst, hvordan jeg åbner spillet på min iPad på samme netværk."*
- [ ] `npm start` + åbn i Chromium og Safari uden konsolfejl.
- [ ] Bane 1 kan tegnes med mus og finger; ledningen lukker og snapper til plænen.
- [ ] Maskinen kan køres med joystick (opstår under fingeren) og piletaster; ledningen stopper den med "bip".
- [ ] Græs klippes, bjælken fylder, ≥ 95 % giver hjemkørsel + konfetti.
- [ ] Playwright: tegn firkant → `wireClosed === true`; kør i zigzag → `phase === "done"`.

**Fase 1 – Værkstedet.** Prompt: *"Byg fase 1 (værkstedet) efter spilplan.md afsnit 3, 9.3 og 9.6."*
- [ ] Alle seks kategorier kan vælges; SVG-maskinen opdateres øjeblikkeligt med hop og lyd.
- [ ] Maskinen gemmes og indlæses efter genstart; intro → værksted første gang, ellers → kort.
- [ ] Den byggede maskine tegnes identisk i bane 1, og klinge/hjul påvirker klipperadius og fart.

**Fase 2 – Fem baner.** Prompt: *"Byg fase 2 (banekort + bane 2-5) efter spilplan.md afsnit 4, 9.4 og 9.5."*
- [ ] Banekort med lås/stjerner; kun klarede + næste bane kan åbnes; stjerner gemmes.
- [ ] Bane 2: ø-ring skal tegnes; ledning gennem bedet afvises. Bane 3: standardhjul er tydeligt langsomme op ad bakken. Bane 4: terrasse blokerer ledningen; dam giver plask uden straf. Bane 5: batteri løber tør → hjem ad guidePath → lader → fortsætter.
- [ ] Græsmester-skærm efter bane 5. Alle baner kan spilles igen.
- [ ] Playwright gennemfører alle fem baner via `?level=N`.

**Fase 3 – Polish.** Prompt: *"Byg fase 3 (polish, PWA, deling) efter spilplan.md afsnit 7, 9.7 og 10."*
- [ ] Alle replikker fra afsnit 10 er i brug; ingen tale → spillet virker stadig.
- [ ] Hjælp-hånd efter 20 sek. uden fremskridt og ved tryk på pæren.
- [ ] Horn/blinklys-knapper hvis valgt. Voksen-panel med lyd og 3-sekunders "start forfra".
- [ ] `prefers-reduced-motion` giver mindre konfetti/animation.
- [ ] PWA: kan lægges på iPad-hjemmeskærm og starter uden internet.
- [ ] Udgivet på GitHub Pages; link virker på iPad.

## 13. Observationer fra test med barnet

*(udfyldes efter hver fase: hvad var svært, kedeligt, sjovt?)*

## Ændringslog

- **2.0** – Ryddet op efter gennemgang: én-fil vs. moduler afklaret (moduler + server), ledning ændret til orange, ø-mekanik gjort 5-års-venlig (separat ring), bane 4 og 5 præciseret, iPad-fælder, replik-liste, testkroge (`window.__game`, URL-parametre), rendering, deling via GitHub Pages/PWA, prompts pr. fase.
- **1.2** – Teknisk spec til Claude Code tilføjet.
- **1.1** – Beslutninger: barnet styrer selv, voksen-lås, navn, eget design.
- **1.0** – Første plan.
