// Alle replikker (spilplan afsnit 10). Kun disse maa siges.

export const LINES = {
  intro: 'Hej! Velkommen til Græsslåmaskine Spillet!',
  'workshop.start': 'Byg din egen græsslåmaskine! Tryk på delene.',
  'workshop.part': 'Klik! Flot!',
  'garage.lift': 'Op med maskinen! Se, klingen sidder under bunden.',
  'workshop.done': 'Sikke en flot maskine, {navn}! Nu skal vi ud og slå græs.',
  'map.next': 'Tryk på haven, der blinker.',
  'level.intro.1': 'Her er den lille have. Tegn en streg rundt om græsset. Start ved den blinkende ladestation.',
  'level.intro.2': 'Her er Bedstemors have. Tegn rundt om græsset – og pas på blomsterne!',
  'level.intro.3': 'Bakkehaven! Her går det op og ned. Tegn rundt om græsset.',
  'level.intro.4': 'Haven med dammen. Tegn rundt om græsset – ledningen skal udenom terrassen.',
  'level.intro.5': 'Den store parkhave! Det er den største af dem alle. Tegn rundt om det hele.',
  'wire.blocked': 'Ups! Ledningen må ikke gå der. Prøv udenom.',
  'wire.tooSmall': 'Prøv at tegne rundt om hele græsset.',
  'wire.closed': 'Sådan! Ledningen er sat op.',
  'island.start': 'Nu skal blomsterne beskyttes. Tegn en ring rundt om bedet.',
  'island.done': 'Flot! Nu er blomsterne i sikkerhed.',
  'drive.start': 'Tryk på den grønne knap, og kør {navn} rundt på græsset!',
  'drive.stuck': 'Brug fingeren til at styre. Prøv at køre den vej.',
  'drive.auto': '{navn} kører selv nu. Rør skærmen, når du vil styre igen.',
  'drive.pond': 'Plask! Det var vådt! Op på græsset igen.',
  'drive.batteryLow': '{navn} er træt og kører hjem for at lade op.',
  'drive.charged': 'Fuld af energi! Kør videre!',
  'drive.half': 'Halvvejs! Godt kørt.',
  'drive.allCut': 'Alt græsset er slået! Kør {navn} hjem til den blinkende ladestation.',
  'drive.butterfly': 'En sommerfugl! Flot fundet.',
  done: 'Godt gået, {navn}! Hele plænen er slået!',
  master: 'Du er græsmester! Tillykke!',
  'school.welcome': 'Velkommen til Skolehaven! Skal vi lege?',
  'school.right': 'Rigtigt! Flot klaret.',
  'school.tryAgain': 'Næsten! Prøv igen.',
  'school.done': 'Sikke en klog græsmester!',
  'school.letter': '{bogstav}! {bogstav} som i {ord}.',
  'school.maze': 'Find vej gennem labyrinten, og slå alt græsset.',
  'school.count': 'Hvor mange {ting} kan du tælle?',
  'school.gate': 'Kør hen til {stykke}!',
  'school.sticker': 'Et klistermærke til din bog!',
  'school.gateHint': 'Tæl prikkerne. Så finder du tallet.',
  'school.gateShow': 'Se, den port lyser. Kør derhen.',
  'school.countHint': 'Prøv at tælle dem én ad gangen. Tryk på dem.',
  'school.countAll': 'Nu har du talt dem alle. Tryk på tallet.',
  'school.levelUp': 'Du bliver bedre og bedre! Nu bliver det lidt sværere.',
  'school.roundsLeft': 'Flot! Der er {antal} tilbage.',
  'reset.hold': 'Hold knappen nede, hvis du vil starte helt forfra.',

  // Gro, gartneren - hun fortaeller hvad hver skaerm er, og hvad man skal
  'guide.hello': 'Hej! Jeg hedder Gro, og jeg er gartner. Kom, jeg viser dig haverne.',
  'guide.garage': 'Det her er din garage. Byg din egen græsslåmaskine – tryk på delene, og drej den rundt med fingeren.',
  'guide.map': 'Her er haverne. Tryk på den, der blinker, så kører vi!',
  'guide.level': 'Her er {have}. Slå alt græsset, og kør så hjem til ladestationen.',
  'guide.tip.2': 'Pas på blomsterne i midten – kør udenom dem.',
  'guide.tip.3': 'Op ad bakken går det langsomt. Prøv at mærke det!',
  'guide.tip.4': 'Der er en dam på plænen. Kører du i, får du en plasker!',
  'guide.tip.5': 'Den her have er stor. Bliver maskinen træt, kører den selv hjem og lader op.',
  'guide.allCut': 'Alt græsset er slået! Nu skal du selv køre hjem til ladestationen – den blinker.',
  'guide.stars': 'Sikke flot! Se dine stjerner.',
  'guide.school': 'Velkommen til Skolehaven! Her øver vi os. Vælg en opgave.',
  'guide.letter': 'Se! Plænen har form som bogstavet {bogstav}. Klip {bogstav}\'et frem, så viser jeg dig et ord.',
  'guide.maze': 'En labyrint! Find vej mellem hækkene, og slå alt græsset.',
  'guide.gates': 'Regne-porte! Jeg siger et regnestykke – du kører ind i porten med det rigtige tal.',
  'guide.count': 'Tælle-bedet! Tryk på tingene, så tæller vi dem sammen. Tryk så på tallet.'
}

export function line (key, vars = {}) {
  const raw = LINES[key]
  if (!raw) return ''
  return raw.replace(/\{(\w+)\}/g, (m, name) => (vars[name] != null ? vars[name] : m))
}

/**
 * Foerste saetning af en replik. Bruges naar tegnefasen er slaaet fra:
 * saa siger oplaeseren kun havens navn og ikke resten om at tegne.
 */
export function firstSentence (key, vars = {}) {
  const text = line(key, vars)
  const match = text.match(/^[^.!?]*[.!?]/)
  return match ? match[0] : text
}
