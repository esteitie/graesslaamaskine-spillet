# Græsslåmaskine Spillet – Niveau 2

*Version 3.0-plan · 1. september 2026 · bygger videre på spilplan.md v2.0*

> **Sådan bruges dokumentet:** Dette er en plan, ikke en byggeordre. Afsnit 2 er
> beslutninger der skal træffes af forældrene, før der bygges. Derefter bygges én
> fase ad gangen (afsnit 3–7) med prompts fra afsnit 10. Efter hver fase: 5 minutters
> test med børnene, og noter i spilplan.md afsnit 13.

## 1. Hvor vi står

**Virker:** Værkstedet (SVG, alle seks kategorier), fem baner med joystick/piletaster,
auto-knap, bakke, dam, terrasse, batteri, oplæser, konfetti, voksen-panel, PWA.
Tegnefasen er bygget men slået fra (`?draw=1`). Virker med mus, tastatur og finger.

**Mangler / gør ondt:**
- Banen slutter selv ved 95 % og kører selv hjem – barnet får ikke lov at gøre arbejdet færdigt.
- Alle baner giver 3 stjerner uanset hvad – stjernerne betyder ingenting.
- Værkstedet er fladt. Man kan ikke dreje maskinen, se den nedefra eller mærke at man *bygger* noget.
- Banerne er statiske – pæne, men døde.
- Lyden er tynd: bip og toner, ingen identitet, ingen musik.
- Ingen læring – og børnene er klar til begyndende skoleopgaver.
- `npm test` er aldrig afviklet (ingen Node på maskinen), og spillet er aldrig testet på en rigtig iPad.

## 2. Beslutninger (træffes før der bygges)

| # | Spørgsmål | Muligheder | Anbefaling |
|---|---|---|---|
| D1 | 3D-teknik til garagen | Three.js (lokal fil) · CSS-3D · egen WebGL | **Three.js lagt i `libs/`** (~650 KB). Ingen CDN, virker offline, intet build-step. Eneste realistiske vej til "livagtigt". |
| D2 | Banerne i 3D? | Fuld 3D · oppefra men levende ("2.5D") | **2.5D.** Oppefra-visning giver overblik og nem styring for en 5-årig; lavt 3D-kamera gør det svært at se hvor græsset mangler. Gør banerne *levende* i stedet. Én eksperimentel 3D-bane senere, hvis børnene savner det. |
| D3 | Hvad giver stjerner? | Tid · dækning · samleting | **1★ alt græs klippet · 2★ selv kørt hjem (uden auto) · 3★ banens tre sommerfugle fundet.** Ingen tid, ingen straf – alt kan nås i eget tempo. |
| D4 | Musik og lyd | Genereret i kode · lydfiler | **Start genereret** (WebAudio-sequencer, ingen filer, lille PWA). Skift til indlagte OGG-filer hvis det ikke bliver sejt nok. |
| D5 | Tegnefasen | Slet · behold bag flag · genbrug | **Behold bag `?draw=1` indtil niveau 2 er testet.** Oplagt genbrug: "Læg selv ledningen" som opgave i Skolehaven – det er formforståelse og planlægning. |
| D6 | Hvor bor læringen? | Eget område · vævet ind i banerne | **Begge dele:** Skolehaven som eget sted på kortet + små frivillige opgaver på de normale baner. Aldrig blokerende. |

## 3. Fase 4 – Kernen i mål *(omfang: S – byg først)*

Prototypen gøres færdig som spil, før noget gøres flottere.

**100 % klippet, ikke 95 %**
- Fremskridt = klippede celler / *klippelige* celler. En celle er klippelig, hvis
  klingen kan nå den med maskincentrum mindst 14 px inde i ledningen – beregnes ved
  baneload. Ellers kunne en urimelig celle gøre banen umulig ("man kan ikke tabe").
- Ingen automatisk overtagelse ved 95 %. Bjælken går til 100 % og får guldkant.
- Barnet skal *selv opdage* de sidste pletter: hjælpe-pæren viser nærmeste uklippede
  plet, men automatisk hjælp kommer først efter 45 sek. stilstand (før: 20).

**Kør selv hjem**
- Ved 100 %: stationen pulserer, replik `drive.allCut`, styringen beholdes.
- Ankomst inden for 40 px af stationen → fejring, stjerner, konfetti.
- Auto-knappen må gerne bruges, men 2. stjerne kræver at man selv kørte hjem.
- Batteri-tomt på bane 5 beholder automatisk hjemkørsel – det er historien
  (maskinen er træt), ikke en genvej.

**Stjerner med mening (D3)**
- Tre sommerfugle pr. bane. De sidder i græsset, flagrer op med stjernestøv og lyd,
  når maskinen kommer tæt på. Aldrig noget der kommer til skade.
- Kortet viser stjernerne pr. bane som nu; gamle gemmer opgraderes (version 2 i save).

**Teknisk oprydning i samme fase**
- Installér Node. Kør `npm test` til grøn i Chromium + WebKit. GitHub Actions ved push.
- Test på rigtig iPad og notér alt der føles forkert.
- Split `level.js` (~1.400 linjer) i `wire.js` / `drive.js` / `render.js` før fase 5 gør den større.

**Acceptkriterier**
- [ ] Bjælken når kun 100 %, når alle klippelige celler er klippet; ingen bane kan gå i stå.
- [ ] Maskinen kører aldrig selv hjem ved færdigt græs; fejringen kræver egen ankomst.
- [ ] 1/2/3 stjerner efter D3-reglerne, gemt og vist på kortet.
- [ ] Sommerfugle på alle fem baner; `drive.butterfly` afspilles.
- [ ] `npm test` grøn lokalt og i CI. iPad-testnoter skrevet i afsnit 13.

## 4. Fase 5 – Garagen i 3D + lyden bliver sej *(omfang: L)*

Værkstedet erstattes af en 3D-garage. Tænk Need for Speed for 5-årige: man skal få
lyst til bare at *stå der* og dreje maskinen.

**Kamera og interaktion**
- Åbning: kameraet glider ind i garagen, lyset tænder væg for væg, maskinen står i lyskeglen.
- Træk med finger/mus = drej maskinen 360°. Pinch/scroll = zoom (begrænset). Inerti, så den snurrer videre.
- **Liften:** stor knap → trykluft-lyd, maskinen hæves, kameraet glider ned, og man
  ser undersiden med den roterende klinge. Sådan ser man "under den" – som på et
  rigtigt værksted, uden at kameraet skal under gulvet.
- Tre kamera-knapper: oppefra · i øjenhøjde · helt tæt.

**Maskinen**
- Samme datamodel som i dag – hver del bliver sin egen 3D-form (bille-kroppen som
  drejet/afrundet form, dæk med mønster, blank lak, metal-aksler, rød stopknap).
- En del klikker på med pop-animation, partikler og skraldenøgle-lyd.
- Rev-tryk: tryk på maskinen → den revver, hopper og blinker med lygterne.
- "KØR!": porten ruller op, 3-2-1 med lys, maskinen kører ud → banekortet.

**Broen til banerne** – banerne forbliver 2D-canvas: 3D-maskinen renderes én gang
til billeder fra 12 vinkler (render-to-texture), som banen tegner. Banekoden ændres
ikke, og maskinen ser ens ud begge steder.

**Lydunivers**
- Garage-musik: dybt, roligt loop (WebAudio-sequencer, D4) – bas, hi-hat, filter-sweep når man skifter kategori.
- Motor i lag: tomgang, rev, forskellig karakter pr. hjultype. Spraylyd ved farvevalg.
- Alle UI-lyde redesignes som én familie (samme "instrument").
- Mixer i voksen-panelet: musik / effekter / tale hver for sig.

**Teknik og sikkerhedsnet**
- `libs/three.module.js` lokalt, ingen CDN. Mål: 60 fps på iPad, < 100k trekanter,
  én lyskilde med bløde skygger + fast skyggeplet under maskinen.
- `?flat=1` beholder det gamle SVG-værksted som reserve til svage enheder.
- PWA-cachen versioneres og får `libs/` med.

**Acceptkriterier**
- [ ] Maskinen kan drejes frit, zoomes og ses nedefra via liften – med finger og mus.
- [ ] Alle delevalg opdaterer 3D-modellen øjeblikkeligt; maskinen på banen matcher garagen.
- [ ] 60 fps på familiens iPad; `?flat=1` virker som fallback.
- [ ] Musik-loop i garagen, motor-lag, mixer i voksen-panelet. Al lyd kan slås fra.

## 5. Fase 6 – Levende baner *(omfang: M)*

Oppefra-visningen beholdes (D2), men banerne skal føles som haver, ikke som tegninger.

- **Græsset:** synlige strå, klippede striber i mønster, spor der lyser kort efter klipperen, afklip der sprøjter.
- **Lys:** solretning med lange bløde skygger fra træer og maskine. Dagslys pr. bane:
  morgen i bane 1 → gylden eftermiddag → solnedgang i bane 5.
- **Liv:** sommerfuglene (fase 4), pindsvin og fugle der hopper væk (fra v2 afsnit 5),
  mariehøns, blade og græs der bøjer sig i vinden.
- **Vand:** dammen får krusninger, siv og en frø der hopper i, når man kommer tæt på.
- **Ambient lyd pr. bane:** fugle, vind, bier ved blomsterbedet, vand ved dammen –
  klippelyden ændrer sig mellem græs og bakke.

**Acceptkriterier**
- [ ] Hver bane har sit eget lys og sin egen lyd; man kan se forskel på et skærmbillede.
- [ ] Mindst tre slags dyr/liv i spillet; ingen kan komme til skade.
- [ ] Stadig 60 fps på iPad; `prefers-reduced-motion` dæmper alt løst liv.

## 6. Fase 7 – Skolehaven *(omfang: L)*

Nyt sted på kortet (skolebygning ved siden af haverne). Principper: **oplæseren er
læreren** (intet læsekrav – bogstaver og tal siges højt), alt er frivilligt, forkerte
svar giver venlig hjælp og et nyt forsøg, en session er 2–3 minutter, og belønninger
flyder tilbage til garagen.

**Idékatalog** *(★ = byg først)*

1. ★ **Regne-porte:** porte med tal står på plænen. "Kør hen til 2 + 3!" – rigtig port
   åbner med fanfare, og en græsstribe klippes som belønning. Forkert port vipper venligt.
2. ★ **Tælle-bedet:** "Hvor mange røde blomster er der?" – svar med store talknapper 1–10.
3. ★ **Bogstav-plæner:** det uklippede græs former et bogstav eller kort ord; når det
   er klippet frem, siger oplæseren lyden og ordet: "M! M for motor!"
4. ★ **Labyrint-haverne:** bane 6–8 er hække-labyrinter med græslommer – de
   "indviklede baner": planlægning og motorik, stigende sværhedsgrad, ingen hjælpelinjer.
5. **Stave-værkstedet:** nye dele og farver låses op ved at stave korte lydrette ord
   (SOL, BIL, IS, KO) med store bogstavknapper – oplæseren siger hvert bogstavs *lyd*.
6. **Regne-ladestationen:** frivilligt plus-stykke mens der lades → fuld opladning med det samme.
7. **Mønster-garagen:** "hvilken del mangler i rækken?" – begyndende logik.
8. **Taljagt:** tallene 1–10 gemt rundt på banen; kør dem over i rækkefølge.
9. **Læg selv ledningen:** tegnefasen genopstår som opgave (D5) – tegn rundt om
   plænen, formforståelse og planlægning.
10. **Butiksleg:** køb klistermærker for optjente stjerner – begyndende regning med "penge".

**Belønning:** klistermærkebog – hver løst opgavetype giver klistermærker, som kan
sættes på maskinen i garagen (ny kategori i værkstedet).

**Voksen-panelet udvides:** sværhedsgrad (tælle → plus/minus til 10 → til 20; bogstavlyde
→ hele ord), emnevalg, og dagens overblik: "I dag: 7 plusstykker, 3 ord, 2 labyrinter."

**Acceptkriterier**
- [ ] Skolehaven kan nås fra kortet; de fire ★-opgaver virker med tale, uden læsekrav.
- [ ] Forkert svar giver aldrig straf – kun venlig hjælp og nyt forsøg.
- [ ] Sværhedsgrad kan stilles i voksen-panelet og huskes pr. barn.
- [ ] Klistermærker optjenes og kan sættes på maskinen.

## 7. Fase 8 – To i garagen + Version 2 *(omfang: M)*

- **To gemmepladser:** hver sit barn, egen maskine, egne stjerner og egen sværhedsgrad
  i Skolehaven. Vælges med maskinens navneskilt på introskærmen.
- Derefter resten af v2 afsnit 5, prioriteret efter børnene: fotoknap, frit
  legetøjs-mode, vejr, tap-to-go.

## 8. Nye replikker (tilføjes spilplan.md afsnit 10)

| Nøgle | Replik |
|---|---|
| drive.allCut | "Alt græsset er slået! Kør {navn} hjem til den blinkende ladestation." |
| drive.butterfly | "En sommerfugl! Flot fundet." |
| garage.lift | "Op med maskinen! Se, klingen sidder under bunden." |
| school.welcome | "Velkommen til Skolehaven! Skal vi lege?" |
| school.right | "Rigtigt! Flot klaret." |
| school.tryAgain | "Næsten! Prøv igen." |
| school.done | "Sikke en klog græsmester!" |

Skolehavens opgavetekster (tal, bogstaver, ord) genereres fra **skabeloner i
`voice-lines.js`** – CLAUDE.md-reglen ændres fra "kun afsnit 10" til "kun replikker
og skabeloner i voice-lines.js".

## 9. Vurdering – hvad der bør gøres bedre

**Teknisk gæld**
- `npm test` er aldrig afviklet – testene er skrevet, men ubevist. Første handling i fase 4.
- Aldrig testet på rigtig iPad. Indfør fast ritual: hver fase afsluttes på enheden.
- `level.js` er for stor (~1.400 linjer) – splittes i fase 4, før 3D og liv gør alt større.
- Oplæseren afhænger af enhedens danske stemme. Plan B (og hyggelig feature): forældre
  kan indtale replikkerne i voksen-panelet, og spillet bruger optagelserne.
- PWA-cachen skal versioneres, når `libs/` og evt. lydfiler kommer til.

**Spilfølelse**
- Stjernerne betyder ingenting i dag → D3/fase 4.
- Lyden er tynd og uden identitet → fase 5.
- Værkstedet er fladt, banerne er statiske → fase 5 + 6.
- Der er ingen grund til at spille en klaret bane igen → stjerner, sommerfugle og
  Skolehavens opgaver giver grundene.

## 10. Prompts pr. fase (klar til Claude Code)

**Fase 4:** *"Læs spilplan.md, spilplan-niveau-2.md og CLAUDE.md. Byg fase 4 (Kernen i
mål): 100 % klip med klippelige celler, manuel hjemkørsel, stjerner og sommerfugle
efter beslutning D3, nye replikker fra afsnit 8, split af level.js. Kør npm test til
grøn og opdatér testene til de nye regler."*

**Fase 5:** *"Byg fase 5 (Garagen i 3D + lyd) efter spilplan-niveau-2.md afsnit 4.
Three.js lægges lokalt i libs/. Behold ?flat=1 som fallback. Skriv Playwright-tests
for delevalg, lift og fallback."*

**Fase 6:** *"Byg fase 6 (Levende baner) efter spilplan-niveau-2.md afsnit 5.
60 fps på iPad og prefers-reduced-motion skal overholdes."*

**Fase 7:** *"Byg fase 7 (Skolehaven) efter spilplan-niveau-2.md afsnit 6: de fire
★-opgaver, klistermærkebogen og voksen-panelets sværhedsgrader."*

**Fase 8:** *"Byg fase 8 (To i garagen) efter spilplan-niveau-2.md afsnit 7."*

## Status

Fase 4–8 er bygget og verificeret i browseren 1. september 2026. Beslutningerne blev:
D1 Three.js lokalt · D2 levende 2.5D (banerne blev ikke 3D) · D3 klip/hjem/sommerfugle
· D4 lyd genereret i kode · D5 tegnefasen gemt bag `?draw=1` · D6 læring både i
Skolehaven og på banerne.

Tilbage af planen: Skolehavens idéer 5–10 og resten af version 2-idéerne.

## 11. Vurdering som 5-årig (2. september 2026)

Spillet igennem med et barns øjne – ærligt, det gode og det der gik i stå:

**Det virker:** Joysticket under fingeren forstås med det samme. Striberne når man
klipper er det sjoveste i spillet – man vil bare klippe mere. Garagen: at dreje
maskinen og køre den op på liften er en leg i sig selv. Sommerfuglene er hyggelige.
Bogstavplænerne er den bedste skoleidé: man *tegner* bogstavet med klipperen.

**Det gik i stå:**
- *De sidste pletter.* Ved 96 % er de sidste celler små og mørke i hjørner og langs
  hække. Barnet kører rundt uden at finde dem, kører aldrig stille (så den automatiske
  hjælp kom ikke), og hjælpe-pæren pegede på en sommerfugl i stedet for græsset.
  Oplevelsen var: "banen kan ikke gøres færdig". Det var det, der blev meldt som fejl.
- *Sommerfuglene som point.* De tog opmærksomheden fra græsset og gjorde tredje
  stjerne til et pres med tid på – det eneste sted i spillet med et ur.
- *Skolehaven var flad.* Samme mark hver gang, samme sværhedsgrad, ingen fornemmelse
  af hvor mange opgaver der var tilbage, og et forkert svar gav bare "prøv igen" uden
  at hjælpe barnet videre. Rigtigt svar gav gnister, men verden ændrede sig ikke.
- *Skolehuset* på kortet var lille og lignede pynt.

## 12. Fase 9 – Skolehaven løftes, sommerfugle uden point *(omfang: M – bygget)*

**Sommerfugle er pynt, ikke point.** Stjernerne måler i stedet hvor meget barnet
gjorde selv: ★ alt klippet · ★★ selv kørt hjem · ★★★ hele banen uden robot-knappen.
Ingen tid, ingen tæller i HUD'en; sommerfuglene flagrer og flyver som før.

**De sidste pletter findes.** Fra 90 % lyser alle uklippede celler gult og pulserer.
Hjælpen kommer også når barnet *kører uden at klippe* i 25 sek. – ikke kun ved
stilstand. Når alt er klippet, viser hånden ruten hjem af sig selv (også i labyrinter).

**Skolehaven – man bliver bedre:**
- *Trin 1–8 pr. aktivitet.* Efter en runde på fem: højst én fejl → et trin op ("Du
  bliver bedre og bedre!"); fire fejl → et trin ned. Forældrenes sværhedsgrad er gulvet.
  Trinnene vises som en lille trappe under hver aktivitet i skolegården.
- *Fem prikker* øverst viser hvor langt runden er. Oplæseren siger "der er 2 tilbage".
- *Regne-porte:* den rigtige port svinger op, og maskinen klipper en stribe højt græs
  bag den – belønningen er selve spillet. Første fejl → tallene vises som prikker man
  kan tælle (minus: overstregede prikker). Anden fejl → den rigtige port lyser.
  Trin: 2 porte og sum til 4 → 4 porte, minus, sum til 20.
- *Tælle-bedet:* man **trykker på tingene og tæller dem** – oplæseren siger "en, to,
  tre…" med. Blomster, sommerfugle, mariehøns, æbler; fra trin 5 er der andre ting i
  bedet, som ikke skal tælles med. Anden fejl → tingene hopper én ad gangen mens der
  tælles højt.
- *Bogstavplæner:* ti bogstaver (I L T H U F E M N Z). Når bogstavet er klippet frem,
  vises ordet stort med et billede, og oplæseren staver det.
- *Labyrinter:* seks stykker, genereret som slanger med åbninger i enderne eller i
  midten – alle med hver eneste celle nåelig.
- *Klistermærker* gives hver gang en runde regning/tælling er klaret (det er dem man
  bliver bedre af at gentage), og første gang for hvert bogstav og hver labyrint.
- *Voksen-panelet* viser dagens overblik: "I dag: 7 regnestykker · 3 tælleopgaver …".

**Rettet undervejs:** ladestationen på bogstav M og N lå uden for plænen, så de baner
kunne aldrig afsluttes. Alle stationer er nu sat med hånden.

## 13. Fase 10 – Gro, gartneren, og gennemgangen *(omfang: L – bygget)*

Meldingen var: skolehaverne virker, men *noget mangler* – man fatter ikke at bogstavspillet
er bogstaver; der er ingen der fortæller; garagen er dårlig. Gennemgangen bekræftede det
for hele spillet, ikke kun skolen: ingen skærm *siger* hvad den er.

**Gro, gartneren** (`src/guide.js`). En figur der lever oven på alle skærme: stråhat,
grønne overalls, rive. Hun dukker op i hjørnet, siger sin replik med en taleboble og
går igen. Boblen viser aldrig læsetekst – kun et ikon, et bogstav, et regnestykke eller
prikker. Hun blinker, ånder, bevæger munden mens hun taler, peger (og vender sig om,
hvis målet er bag hende) og jubler med armene i vejret.
- Introen: "Hej! Jeg hedder Gro, og jeg er gartner. Kom, jeg viser dig haverne."
- Garagen: hvad det er, og at man kan dreje maskinen. Kortet: peger på haven der blinker.
- Hver have: navn + hvad man skal; efter 5 sek. et tip om det særlige (blomsterne,
  bakken, dammen, batteriet). Alt klippet: peger mod stationen. Færdig: jubler.
- Bogstavplæner: bogstavet står **kæmpestort** over plænen i fire sekunder, mens Gro
  siger "Se! Plænen har form som bogstavet M. Klip M'et frem, så viser jeg dig et ord."
- Skolehaven: forklarer hver leg først, og stiller så opgaven med regnestykket eller
  tingen i boblen. Alle vink og stilladser går gennem hende.

**Garagen bygget om.** Lyst showroom med egetræsgulv og en grøn bort på væggen i stedet
for den mørke hule. Maskinen er rundere (flere segmenter i kanten), hjulene er rigtige
dæk med nav og eger, skærmen lyser. Kategorierne står i en kolonne til venstre, delene
i en kolonne til højre, og maskinen har hele midten. Liftens stolper er væk, indtil man
løfter – så kommer de op af gulvet.

## Ændringslog

- **3.2** – Fase 10: Gro, gartneren; bogstavet vises stort; garagen lys, rund og med
  sidekolonner; alle skærme forklarer sig selv.

- **3.1** – Fase 9: vurdering som 5-årig, sommerfugle uden point, de sidste pletter
  lyser, Skolehaven med trin, prikker, stilladser, ti bogstaver og seks labyrinter.

- **3.0-plan** – Niveau 2: kernen i mål (100 % + selv hjem), 3D-garage med lift og
  lydunivers, levende baner, Skolehaven (læring), to gemmepladser. Beslutninger D1–D6.
