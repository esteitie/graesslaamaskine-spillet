# Græsslåmaskine Spillet

Et browserspil for en 5-årig: byg din egen robotgræsslåmaskine i værkstedet, læg
kantledning rundt om plænen i fem haver, og kør selv maskinen rundt og slå græsset.

Ingen tekst skal læses, ingen "game over", ingen timer. Alt er ikoner, farver, lyd og
en dansk oplæser. Bygget efter `spilplan.md` – ren HTML, CSS og JavaScript som
ES-moduler, ingen frameworks og ingen build-step.

Virker ens med finger på iPad og med mus eller piletaster på computer.

> **Tegnefasen er slået fra.** Banerne starter direkte med at slå græs: kantledningen
> ligger klar rundt om plænen, og blomsterbedet i bane 2 er allerede beskyttet.
> Koden til at tegne ledningen er der stadig og kan tændes med `?draw=1`.

Niveau 2 er bygget (`spilplan-niveau-2.md` fase 4–8): hele plænen skal klippes og
maskinen køres selv hjem, garagen er i 3D med lift, haverne lever, og **Skolehaven**
er kommet til med regning, tal, bogstaver og labyrinter. To børn kan have hver sin
maskine.

---

## Kom i gang

Spillet skal serveres over HTTP (ES-moduler virker ikke fra `file://`).

**Har du Node installeret:**

```bash
npm install && npm start
```

**Har du ikke Node** (macOS har altid Python 3):

```bash
python3 serve.py
```

Begge starter på <http://localhost:8080>.

> **Ikke port 5000.** macOS' AirPlay-modtager (Kontrolcenter) sidder på port 5000 og
> svarer 403 på alt. `serve.py` prøver 8080, 8000, 5173 og 4321 i den rækkefølge og
> skriver selv hvilken den fik. Vil du have en bestemt: `python3 serve.py 9000`.

## Spil på iPad'en

1. Start serveren på computeren som ovenfor. `serve.py` skriver selv adressen:

   ```
   Denne computer : http://localhost:8080
   iPad paa wifi  : http://192.168.x.x:8080
   ```

   Bruger du `npm start`, finder du adressen med:

   ```bash
   ipconfig getifaddr en0
   ```

2. iPad og computer skal være på **samme wifi**.
3. Åbn adressen i Safari på iPad'en, og vend den på **langs**. Holder du den på
   højkant, beder spillet dig venligt om at dreje den.
4. Computeren skal være tændt og serveren køre, så længe I spiller.

## Læg spillet på hjemmeskærmen (virker uden internet)

Service workeren registreres kun over https – altså når spillet ligger på GitHub
Pages, ikke fra den lokale server. Sådan gør du:

1. Læg mappen i et GitHub-repo:

   ```bash
   git init && git add -A && git commit -m "Graesslaamaskine Spillet"
   git branch -M main
   git remote add origin git@github.com:DIT-BRUGERNAVN/graesslaamaskine-spillet.git
   git push -u origin main
   ```

2. På GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. Efter et minut ligger spillet på
   `https://DIT-BRUGERNAVN.github.io/graesslaamaskine-spillet/`.
4. Åbn linket i Safari på iPad'en → **Del → Føj til hjemmeskærm**. Nu starter det
   i fuld skærm som en app og virker også uden internet.

Vil du teste offline-delen lokalt, kan du tvinge service workeren til med
`?sw=1`.

## Test

```bash
npm install
npx playwright install     # første gang: henter browserne
npm test
```

Playwright starter selv serveren og kører i både Chromium og WebKit (Safaris motor).
Testene ligger i `tests/` og dækker acceptkriterierne i `spilplan.md` afsnit 12.

## URL-parametre

| Parameter | Betydning |
|---|---|
| `?level=3` | åbner bane 3 direkte |
| `?skipIntro=1` | springer introskærmen over |
| `?mute=1` | slår al lyd fra |
| `?draw=1` | tænder tegnefasen igen: læg selv kantledningen før du kører |
| `?turbo=8` | kører spiltiden 8 gange hurtigere (kun til test) |
| `?flat=1` | bruger det gamle flade værksted i stedet for 3D-garagen |
| `?screen=school` | åbner Skolehaven (også `gates`, `count`, `map`, `workshop`) |
| `?bane=maze1` | åbner en af Skolehavens baner: `maze1-6`, `letterI/L/T/H/U/F/E/M/N/Z` |
| `?sw=1` / `?sw=0` | tvinger service worker til eller fra |

## Filoversigt

```
index.html             eneste side
styles.css             layout, letterboxing, store knapper
serve.py               statisk server uden Node (skriver iPad-adressen)
src/
  main.js              opstart, skærmskift, intro- og græsmesterskærm, spilløkke
  workshop.js          værkstedet: hjul, klinge, skærm, farve, ekstra, navn
  map.js               banekortet og voksen-panelet
  level.js             én bane: kør, klip alt græsset, og kør selv hjem
  grid.js              cellegitteret: hvad er græs, hvad kan nås, hvad er klippet
  render.js            banens tegnefunktioner, dagslys pr. bane
  garage3d.js          3D-garagen (Three.js): drej, zoom, lift
  school.js            Skolehaven: regne-porte og tælle-bedet
  critters.js          pindsvin, fugle og mariehøns der hopper væk
  guide.js             Gro, gartneren: taleboble, poser, peger og jubler
  machine.js           datamodel, effekt-tabel, SVG-tegning af maskinen
  geometry.js          polygoner, afstande, snap
  input.js             Pointer Events, flydende joystick, piletaster
  audio.js             Web Audio-lyde i kode + dansk oplæser
  save.js              localStorage med versionsnummer
  confetti.js          konfetti
  ui.js                fælles DOM-hjælpere og ikoner
  voice-lines.js       alle replikker (spilplan afsnit 10)
  levels/level1-5.json banedata i det logiske 960×600-lærred
  levels/maze1-3.json  Skolehavens labyrinter
  levels/letter*.json  bogstavplæner
libs/
  three.module.js      Three.js r169, lagt lokalt - ingen CDN, virker offline
tools/
  make-icons.py        genererer app-ikonerne (kræver kun Python)
  testkit.js           hjælpere der styrer spillet inde i browseren (kun til test)
tests/                 Playwright
```

`ui.js` og `tools/testkit.js` står ikke i spilplanens filliste – de er tilføjet for
at undgå at gentage de samme DOM- og testhjælpere i tre moduler.

## Testkroge

`window.__game` giver adgang til tilstanden, fordi et canvas ikke kan aflæses:

```js
window.__game.screen          // 'intro' | 'workshop' | 'map' | 'level' | 'master'
window.__game.level           // { phase, progress, wireClosed, stars, position, ... }
window.__game.machine
window.__game.save
window.__game.go(navn, opts)
window.__game.step(sekunder)  // simulerer tid uden at vente på requestAnimationFrame
```

## Gro, gartneren

Gro dukker op i hjørnet på hver skærm og fortæller, hvad man skal – med stemme og en
taleboble med et ikon, et bogstav eller et regnestykke, aldrig læsetekst. Hun peger på
haven der blinker, på ladestationen når alt er klippet, og på den rigtige port, hvis
man har gættet forkert to gange. Alt hun siger står i `src/voice-lines.js`.

## Sådan spiller man

Vælg spiller på forsiden (der er plads til to), byg din maskine, og vælg en have på
kortet. Maskinen er straks klar på plænen ved ladestationen.

- **iPad:** sæt fingeren på plænen – der dukker et joystick op, hvor fingeren lander.
- **Computer:** hold venstre museknap nede og træk, eller brug piletasterne (WASD virker også).
- Robot-knappen lader maskinen køre selv; rør joysticket eller en tast for at tage over.
- **Alt græsset skal klippes** – bjælken går til 100 % og får guldkant.
- Så kører du **selv** maskinen hjem til den blinkende ladestation. Først dér er banen slut.

### Stjerner

| ★ | Alt græsset er klippet |
|---|---|
| ★★ | Du kørte selv hjem uden at bruge robot-knappen |
| ★★★ | Hele banen uden robot-knappen – du gjorde det hele selv |

Sommerfuglene er pynt: kør tæt på, så flagrer de op. De giver ikke point. Fra 90 %
lyser de sidste uklippede pletter gult, så de er til at finde.

### Garagen

Kategorierne står til venstre, delene til højre, og maskinen står midt i et lyst
showroom. Træk for at dreje den 360°, rul for at zoome, og tryk på den for at give den
gas. Lift-knappen løfter den op, så du kan se klingen under bunden. Kamera-knappen
skifter mellem tre vinkler.

### Skolehaven

Skolehuset på kortet gemmer fire slags opgaver. Oplæseren er læreren – intet skal
læses, og et forkert svar giver kun et venligt nyt forsøg.

- **Regne-porte** – "Kør hen til 2 + 3!" Kør ind i den rigtige port, så svinger den
  op, og maskinen klipper en stribe højt græs bag den. Fejl → tallene vises som prikker
  man kan tælle; anden fejl → den rigtige port lyser.
- **Tælle-bedet** – tryk på tingene én ad gangen, og oplæseren tæller med. Tryk så på
  tallet. Blomster, sommerfugle, mariehøns og æbler – senere med drillere imellem.
- **Bogstav-plæner** – ti plæner formet som I, L, T, H, U, F, E, M, N og Z. Klip
  bogstavet frem, så vises ordet med et billede, og oplæseren staver det.
- **Labyrinter** – seks hækkelabyrinter, der bliver sværere.

Man bliver bedre: regning og tælling har otte trin. En runde er fem opgaver (prikkerne
øverst); højst én fejl giver et trin op. Sværhedsgraden i voksen-panelet (tandhjulet
på kortet) sætter, hvor man starter: let, mellem eller svær. Panelet viser også dagens
overblik. Hver klaret runde giver et klistermærke til bogen.

## Hvad er bygget

Fase 0-3 fra `spilplan.md` afsnit 7: prototypen, værkstedet, alle fem baner og
polish (oplæser, hjælpehånd, konfetti, horn/blinklys, voksen-panel, PWA).
Tegnefasen fra afsnit 9.5 er bygget færdig, men slået fra – se `?draw=1`.
Derefter niveau 2 fase 4–8: kernen i mål, 3D-garagen, levende baner, Skolehaven og
to spillere.

Ikke bygget endnu: vejr, fotoknap, frit legetøjs-mode og tap-to-go fra spilplanens
afsnit 5, samt Skolehavens idéer 5–10 (stave-værkstedet, regne-ladestationen,
mønster-garagen, taljagt, læg-selv-ledningen og butikslegen).

Skriv ned i `spilplan.md` afsnit 13, hvad der var svært, kedeligt og sjovt.
