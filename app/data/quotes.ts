// app/data/quotes.ts
// Alle tekstvarianten voor Knecht.
// Voeg gewoon nieuwe strings toe aan een array — de rest gaat vanzelf.

export const quotes = {
  subtitle: "Upload, check, rijd.",

  // ── Opener ────────────────────────────────────────────────────────────────
  // Gekozen op basis van afstand, hoogtemeters, temperatuur, wind, neerslag.
  opener: {
    easyFlat: [
      "Rustige start. Parijs is nog ver.",
      "Kort en vlak. Even de benen losmaken.",
      "Makkelijke dag. Geniet ervan, die komen er maar een paar per jaar.",
      "Licht rondje. Niks aan de hand.",
      "Gewoon draaien. Niks speciaals, niks mis.",
    ],
    easyWet: [
      "Kort rondje, maar fris en nat. Kleden op de eerste 30 minuten. Natte wegen, niet gaan linkeballen.",
      "Nat wegdek. Handen los, bochten ruim, veilig thuiskomen.",
      "Klein rondje in de regen. Je hebt het al eerder gedaan.",
      "Beetje regen is niks. Rustig de bochten door en klaar.",
    ],
    mediumFlat: [
      "Dit wordt geen koffieritje, maar ook geen oorlog. Gewoon slim rijden.",
      "Mooie dag voor een rondje. Maar onderschat 'm niet.",
      "Vlakke dag. Goed voor de benen, de kop mag bijveren.",
      "Geen bergen, maar kilometers tellen ook gewoon mee.",
      "Solide rit. Niet te hard weg, niet te vroeg leeg.",
    ],
    mediumHilly: [
      "Je hebt goede benen nodig vandaag. En een beetje verstand.",
      "Een paar hellingen. Niks dramatisch, maar je gaat ze voelen.",
      "Licht bergachtig. Het voelt licht, totdat het niet meer licht voelt.",
      "Dit wordt een mooie rit. Als je 'm slim aanpakt.",
      "Wat klimwerk op het menu. Verdeel je krachten.",
    ],
    mediumWind: [
      "Zo vlak als een biljartlaken, maar met die wind wordt het geen koffieritje. Spaar je krachten.",
      "Wind vandaag. Lekker schuilen in het wiel als het kan.",
      "Het waait. Slim rijden is de enige juiste tactiek vandaag.",
      "Wind doet meer dan hoogtemeters. Reken ermee.",
      "Tegenwind doet pijn. Maar het maakt je ook sterker. Zo mogen we het zien.",
    ],
    longFlat: [
      "Lang en vlak. Het wordt een wedstrijd tegen jezelf.",
      "Kop naar beneden en draaien. Zoals het hoort.",
      "Lange dag op het vlakke. Pacing is alles vandaag.",
      "Veel kilometers, weinig klimwerk. De echte vijand is verveling.",
      "Dit is een rit voor de benen, niet voor de kop.",
    ],
    longHilly: [
      "Bergen op het menu. Verdeel je krachten, niet je moraal.",
      "Dit is er eentje waar je jezelf kunt tegenkomen.",
      "Geen heroiek nodig, gewoon slim rijden.",
      "Dit is een grote rit. Respecteer de afstand.",
      "Lang en bergachtig. Hoe je de eerste helft rijdt, bepaalt de tweede.",
    ],
    longHard: [
      "Grote dag. Rustig beginnen of je betaalt het dubbel.",
      "Dit is geen rondje. Dit is een expeditie.",
      "Lang, zwaar, en het wordt laat. Goed voorbereid zijn is alles.",
      "De man met de hamer wacht ergens onderweg. Zorg dat je goed gevoed aankomt.",
    ],
    hot: [
      "Zonnetje erbij. Goed voor het moraal, minder voor je bidons. Extra drinken vandaag.",
      "Warm. Niet het moment voor heroiek. Drink voor je dorst hebt.",
      "Hitte vandaag. Benen gaan goed, hoofd moet het bijhouden.",
      "Het wordt zweten worden. Bidons vol en drinken blijven.",
    ],
    coldWet: [
      "Koud en nat. Kleden op de eerste 30 minuten. Natte wegen, niet linkeballen.",
      "Fris en kletsnat. Een knecht klaagt niet. Kleden en gaan.",
      "Slechte dag voor mooie kleding. Goede dag om toch te rijden.",
      "Regen en kou. Je gaat het overleven. Maar kleden op, alle lagen.",
    ],
  },

  // ── Hoogteprofiel ─────────────────────────────────────────────────────────
  profiel: {
    flat: [
      "Zo vlak als een biljartlaken. Tijd om tempo te maken.",
      "Pannenkoek-vlak. Lekker in het wiel kruipen en doordraaien.",
      "Geen bergen vandaag. Je gaat ze ook niet missen.",
      "Vlak profiel. De benen zijn de baas.",
      "Hoogtemeters? Geen. Kilometers? Genoeg.",
    ],
    rolling: [
      "Licht glooiend. Nooit echt zwaar, maar het stapelt wel op.",
      "Vals plat. Voelt makkelijk, maar sloopt je langzaam.",
      "Een paar hellingen. Niks wat je niet aankunt.",
      "Glooiend profiel. Ritmisch rijden is de sleutel.",
      "Op en neer, zo rolt het. Goed tempo vasthouden.",
    ],
    hilly: [
      "Dit is er eentje waar je jezelf kunt tegenkomen.",
      "Bergen op het menu. Verdeel je krachten, niet je moraal.",
      "Serieuze klimdag. Niet meteen a bloc op de eerste heuvel.",
      "Veel hoogtemeters. Beginnen met iets over, eindigen met niks meer.",
      "Bergachtig profiel. De benen gaan pijn doen. Dat hoort er gewoon bij.",
    ],
  },

  // ── Pittigste klim ────────────────────────────────────────────────────────
  hardestClimb: {
    moderate: [
      "Geen Alpe d'Huez, maar je gaat hem voelen.",
      "Pittige klim op het parcours. Tempo terug voor je er aankomt.",
      "Niet de zwaarste, maar ook niet gratis. Bewust aanrijden.",
    ],
    hard: [
      "Stevig stuk. Hier is het even doorbijten.",
      "De klim van vandaag is niet voor de zwakken. Verstandig starten.",
      "Dit is de plek waar de rit bepaald wordt. Reserveer wat voor hiervoor.",
      "Hier gaat het erom. Niet te vroeg volgas.",
    ],
    brutal: [
      "Dat is een muur. Stap uit het zadel als je moet.",
      "Meer dan 10%. Tempo eraf, kracht bewaren, doortrappen.",
      "Dit soort klimmen vergeet je niet. En je benen ook niet.",
      "Hier gaan de benen pijn doen. Dat is de prijs van het parcours.",
    ],
  },

  // ── Weersoverzicht ────────────────────────────────────────────────────────
  weer: {
    ideal: [
      "Ideale omstandigheden. Vandaag ligt het aan jou.",
      "Mooi weer. Je hebt geen excuses meer.",
      "Perfecte dag voor een rit. Geniet ervan.",
      "Zicht goed, benen moeten het doen.",
      "Geen klagen vandaag. Het weer doet zijn deel.",
    ],
    sunnyHot: [
      "Zonnetje erbij. Goed voor het moraal, minder voor je bidons.",
      "Warm en zonnig. Extra drinken. Dehydratie is geen bonificatie.",
      "Stralend, maar het gaat zweten worden. Bidons vol.",
      "Lekker weer, maar zorg dat je drinkt voor je dorst hebt.",
      "Zon genoeg. Drinken blijven, ook als je het niet wil.",
    ],
    sunnyWarm: [
      "Zon en aangenaam. Goede dag.",
      "Warm en droog. Benen goed, moraal beter.",
      "Fijn weer. Geniet ervan.",
      "Zonnige dag. Het fietsgoden zijn vandaag met je.",
      "Mooi, warm, droog. Wat wil je nog meer.",
    ],
    cold: [
      "Fris bij de start. Je gaat blij zijn met laagjes.",
      "Koud genoeg voor kledingkeuzes. Kleden op de ochtend.",
      "Frisse dag. De benen hebben een paar kilometer nodig om warm te worden.",
      "Koude start. Goed aanpakken de eerste 20 minuten.",
      "Fris. Niks aan de hand, maar je voelt het wel.",
    ],
    veryCold: [
      "Koud. Overschoenen geen overbodige luxe vandaag.",
      "Winterweer. Alle lagen mee. Geen held zijn met de kleding.",
      "IJzig. Goed kleden is vandaag het halve werk.",
      "Echt koud. Niet beginnen te rijden voordat alles goed zit.",
    ],
    rain: [
      "Nat vandaag. Rustig door de bochten.",
      "Het gaat regenen. Natte remmen, glad asfalt. Speling houden.",
      "Regenweer. Zichtbaarheid omlaag, remafstand omhoog.",
      "Kans op een nat pak vandaag. Kleden en doorgaan.",
      "Regen verwacht. Niet gaan linkeballen op nat wegdek.",
    ],
    chanceRain: [
      "Kans op regen. Natte wegen, dus niet gaan linkeballen.",
      "Regenjack in de achterzak. Het kan.",
      "Wisselvallig weer. Neem iets mee voor als het omslaat.",
      "Buiige dag. Kans is er. Bereid je voor.",
      "Kans op buien. Niet de grote held uithangen als het omslaat.",
    ],
    coldRain: [
      "Koud en nat. De meest karaktervormende combinatie.",
      "Regen en kou. Alle lagen, langzaam warm worden, niet te vroeg uitdoen.",
      "Kletsnat en fris. Niet linkeballen op nat wegdek.",
      "Koud met regen. Meer kleding dan je denkt, minder ego dan normaal.",
    ],
    wind: [
      "Veel wind vandaag. Lekker in het wiel zitten als het kan.",
      "Wind op het parcours. Slim rijden is de enige juiste tactiek.",
      "Het waait. Pacing aanpassen aan de wind, niet aan je gevoel.",
      "Wind doet meer dan hoogtemeters. Rekening houden.",
      "Vandaag regent het wind. Slim rijden.",
    ],
    strongWind: [
      "Dit kan zomaar waaierwerk worden. Blijf scherp.",
      "Harde wind. Niet in de val trappen op het gemakkelijke deel.",
      "Stevige wind. Hier verlies je meer energie dan op een klim.",
      "Veel wind vandaag. Waakzaam zijn bij koerswijzigingen.",
      "Zijwind of tegenwind: dit gaat energie kosten. Budgetteren.",
    ],
    windAndRain: [
      "Wind én regen. Geen mooie dag, maar je gaat het overleven.",
      "Nat en winderig. Alle lagen mee, niet de held uithangen.",
      "Regen met wind erbij. Rustig rijden, veilig thuiskomen.",
      "Rotweer eigenlijk. Maar goed — een knecht klaagt niet.",
    ],
    overcast: [
      "Bewolkt maar droog. Prima rijweer.",
      "Grijs maar goed. Je hebt ergere dagen gehad.",
      "Bewolkt, geen regen. Dat doet het.",
      "Grijze lucht, maar de weg is droog. Prima.",
      "Niet lekker, niet slecht. Gewoon rijden.",
    ],
  },

  // ── Kit check ─────────────────────────────────────────────────────────────
  kit: {
    veryCold: [
      "Winterhandschoenen. Je tenen zullen je dankbaar zijn bij km 60.",
      "Overschoenen geen overbodige luxe vandaag.",
      "Alle lagen. Niet stoer doen met de kleding.",
      "Koud. Kleden op de eerste 30 minuten, niet op het midden van de rit.",
      "Winters. Liever te warm dan te koud vandaag.",
    ],
    cold: [
      "Armstukken erin. Je gaat ze gebruiken.",
      "Lange mouwen en een gilet. Je start fris.",
      "Kleden op de eerste 30 minuten, niet op het midden van de rit.",
      "Fris vertrek. Liever even warm worden dan het hele eind te koud zijn.",
      "Gilet in de achterzak als je hem uitdoet. Niet weggooien.",
    ],
    mild: [
      "Aangenaam. Korte mouwen of lichte lagen. Keuze aan jou.",
      "Mild weer. Licht kleden, iets extra in de achterzak.",
      "Prettige temperatuur. Gewoon rijden.",
      "Niet te warm, niet te koud. De ideale kledingdag.",
      "Kort-kort kan, maar neem wat mee voor het geval.",
    ],
    warm: [
      "Licht kleden. Maar vergeet je zonnebrand niet.",
      "Warm genoeg voor korte mouwen. Meer hoef je niet.",
      "Zomers. Luchtig aandoen en drinken niet vergeten.",
      "Warm. Lichtste kit vandaag. En bidons vol.",
    ],
    hotSun: [
      "Zon en warmte. Zonnebrand is geen optioneel item.",
      "Heet en zonnig. Licht kleden en drinken, veel drinken.",
      "Warm. Witte kit als je die hebt. En smeer in.",
      "Stralend. Zonnebrand op de neus, bidon in het oog.",
    ],
    coldRain: [
      "Natte wegen en kou. Regenjack aan, overschoenen op.",
      "Koud en nat. Meer lagen dan je denkt nodig te hebben.",
      "Regenjack is geen optie vandaag. Het is een verplichting.",
      "Alles erop en eraan. Nat en koud is de slechtste combinatie.",
    ],
    warmRain: [
      "Warm maar kans op regen. Regenjack in de achterzak.",
      "Buiig. Niet te veel aantrekken, maar neem het jack mee.",
      "Wisselvallig. Kort-kort kan, maar iets mee voor onderweg.",
      "Kans op regen. Klein en licht jack in de achterzak, meer niet.",
    ],
  },

  // ── Achterzakken / Voeding ────────────────────────────────────────────────
  voeding: {
    short: [
      "Kort rondje. Een bidon en een reep, meer hoeft niet.",
      "Korte rit. Goed ontbijt en je bent klaar.",
      "Minder dan anderhalf uur. Gewoon rijden.",
      "Kort. Een bidon water en je bent er doorheen.",
    ],
    medium: [
      "Drinken niet vergeten. Ook niet als het lekker loopt.",
      "Bordje leeg eten mag pas op het eind.",
      "Halverwege iets naar binnen. Niet wachten tot je het nodig hebt.",
      "Elke 30 minuten iets drinken. Ook als je niet wil.",
      "Niet wachten op honger. Je bent dan al te laat.",
    ],
    long: [
      "Blijven eten. De man met de hamer wacht op je.",
      "Dit is geen rit voor een hongerklop.",
      "Elke 30 minuten iets naar binnen. Niet gokken.",
      "Vroeg eten, lang profijt. Wacht niet tot je leeg bent.",
      "Op lange ritten verlies je het niet op de klim, maar op de honger.",
    ],
    veryLong: [
      "Dit is een expeditie. Tanken, blijven tanken.",
      "Grote dag. Regelmatig eten is geen optie, het is de strategie.",
      "Hongerklop ligt op de loer bij dit soort ritten. Begin vroeg.",
      "Eten als je niet honger hebt is de kunst van de lange rit.",
      "Knecht tankt als hij kan, niet als hij moet.",
    ],
    hot: [
      "Extra drinken vandaag. Dehydratie is geen bonificatie.",
      "Het is warm. Drinken voor je dorst hebt.",
      "Vocht is brandstof vandaag. Bidons bijvullen als je kan.",
      "Warm weer vraagt om meer drinken dan je denkt nodig te hebben.",
    ],
  },

  // ── Pacing tip (alleen bij ritten langer dan 2 uur) ───────────────────────
  pacing: {
    longFlat: [
      "Rustig beginnen. Je wint 'm later.",
      "Eerste uur is investeren, niet incasseren.",
      "Hou iets achter de hand voor het slot.",
      "Vandaag is het een spel van geduld.",
      "Niet te hard weg. De vlakte vergeeft niet.",
    ],
    longHilly: [
      "Niet meteen a bloc op de eerste heuvel.",
      "Verdeel je krachten. De laatste klim is altijd de langste.",
      "Begin conservatief. De tweede helft beslist de rit.",
      "Kalm de eerste klim. Je hebt ze nog nodig, die benen.",
      "Geduld op de heuvels. Je betaalt later als je nu te vroeg alles geeft.",
    ],
    longHard: [
      "Dit is een grote dag. Te langzaam beginnen bestaat bijna niet.",
      "Geduld is je sterkste wapen vandaag.",
      "Begin op 80%. Je eindigt op 100% als het goed zit.",
      "Bewust conservatief beginnen. Er komt nog genoeg.",
    ],
  },

  // ── Herstel ───────────────────────────────────────────────────────────────
  herstel: {
    kort: [
      'Goed gereden. Even bijvullen.',
      'Lekker gedaan. Kwark erbij en je bent er weer.',
      'Werk gedaan. Nu tanken.',
    ],
    lang: [
      'Werk is gedaan. Nu tanken.',
      'Je lichaam bedankt je morgen als je nu goed herstelt.',
      'Benen zijn leeg. Bord moet vol.',
      'Ritje zit erop. Nu begint het echte werk.',
    ],
    zwaar: [
      'Geen heldendaden meer vandaag. Bank en bord pasta.',
      'Zwaar werk. Nu serieus herstellen.',
      'Dit soort dagen vragen om een serieus herstelmoment. Bank, bord, slaap.',
      'Je hebt er alles uitgehaald. Stop er nu alles in.',
    ],
  },

  // ── Bandenspanning ────────────────────────────────────────────────────────
  banden: {
    standaard: [
      'Je banden zijn het enige contact met de weg. Doe er niet moeilijk over, maar doe het wel goed.',
      'Goed opgepompt is half gewonnen. Check het elke rit.',
      'Bandenspanning is het goedkoopste wattage dat er is.',
      'Twee minuten werk, de rest van de rit profijt.',
    ],
    nat: [
      'Iets minder lucht. Je banden zullen je dankbaar zijn in de bochten.',
      'Nat wegdek vraagt om meer contact. Minder druk, meer grip.',
      'Natte wegen. Iets minder spanning voor meer grip.',
    ],
    afdalingen: [
      'Veel afdalingen vandaag. Iets minder druk geeft meer controle.',
      'Klim- en afdaaldag. Iets minder spanning voor meer gevoel op de descente.',
    ],
    koud: [
      'Kou maakt rubber harder. Iets minder compenseren.',
      'Koude dag, harder rubber. Compenseer met iets minder druk.',
    ],
  },

  // ── Checklist ─────────────────────────────────────────────────────────────
  checklist: [
    "Niet linkeballen. Even checken voor je vertrekt.",
    "Laatste check. Dan kan niemand je iets verwijten.",
    "Even alles nalopen. Platte band bij km 5 is zonde.",
    "Checken. Twee keer is veiliger dan één keer.",
    "Voor je vertrekt. Neem een minuut.",
  ],

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: [
    "Kop naar beneden en draaien.",
    "Knechtenwerk. Maar iemand moet het doen.",
    "Geen heroiek nodig.",
    "Altijd klaar. Altijd paraat.",
    "De knecht zorgt. Jij rijdt.",
  ],
}

// ─── Selectie-helpers ─────────────────────────────────────────────────────────
// Voeg nieuwe strings toe aan de arrays hierboven — deze functies hoef je nooit aan te raken.

/** Kies een willekeurig item uit een array. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Opener boven alle secties, afgestemd op rit + condities. */
export function getOpenerQuote(
  distanceKm: number,
  elevationGain: number,
  avgTemp: number,
  maxPrecip: number,
  maxWind: number,
): string {
  const isLong    = distanceKm >= 130
  const isMedium  = distanceKm >= 70
  const isHilly   = elevationGain >= 600
  const isWet     = maxPrecip >= 60
  const isWindy   = maxWind >= 25
  const isVeryHot = avgTemp >= 28
  const isColdWet = avgTemp < 10 && isWet

  if (isVeryHot) return pick(quotes.opener.hot)
  if (isColdWet) return pick(quotes.opener.coldWet)
  if (isLong && isHilly && (distanceKm >= 160 || elevationGain >= 2000)) return pick(quotes.opener.longHard)
  if (isLong && isHilly) return pick(quotes.opener.longHilly)
  if (isLong)            return pick(quotes.opener.longFlat)
  if (isMedium && isWindy) return pick(quotes.opener.mediumWind)
  if (isMedium && isHilly) return pick(quotes.opener.mediumHilly)
  if (isMedium)          return pick(quotes.opener.mediumFlat)
  if (isWet)             return pick(quotes.opener.easyWet)
  return pick(quotes.opener.easyFlat)
}

/** Pacing-tip voor ritten langer dan 2 uur, anders null. */
export function getPacingQuote(durationHours: number, elevationGain: number): string | null {
  if (durationHours < 2) return null
  const isVeryHard = durationHours >= 5 || elevationGain >= 2000
  const isHilly    = elevationGain >= 600
  if (isVeryHard) return pick(quotes.pacing.longHard)
  if (isHilly)    return pick(quotes.pacing.longHilly)
  return pick(quotes.pacing.longFlat)
}

/** Profielomschrijving op basis van hoogtemeters. */
export function getProfielQuote(elevationGain: number): string {
  if (elevationGain >= 600) return pick(quotes.profiel.hilly)
  if (elevationGain >= 200) return pick(quotes.profiel.rolling)
  return pick(quotes.profiel.flat)
}

/** Omschrijving van de pittigste klim op basis van gemiddeld stijgingspercentage. */
export function getHardestClimbQuote(avgGradient: number): string {
  if (avgGradient >= 10) return pick(quotes.hardestClimb.brutal)
  if (avgGradient >= 7)  return pick(quotes.hardestClimb.hard)
  return pick(quotes.hardestClimb.moderate)
}

/** Samenvatting van het weer op basis van temp, wind en neerslag. */
export function getWeerQuote(avgTemp: number, maxWind: number, maxPrecip: number): string {
  const isVeryCold  = avgTemp < 5
  const isCold      = avgTemp < 12
  const isWarm      = avgTemp >= 20 && avgTemp < 26
  const isHot       = avgTemp >= 26
  const isRainy     = maxPrecip >= 60
  const isMaybeRain = maxPrecip >= 30 && maxPrecip < 60
  const isVeryWindy = maxWind >= 40
  const isWindy     = maxWind >= 30

  if (isVeryWindy && isRainy) return pick(quotes.weer.windAndRain)
  if (isVeryWindy)  return pick(quotes.weer.strongWind)
  if (isWindy)      return pick(quotes.weer.wind)
  if (isVeryCold && isRainy) return pick(quotes.weer.coldRain)
  if (isRainy)      return pick(quotes.weer.rain)
  if (isMaybeRain)  return pick(quotes.weer.chanceRain)
  if (isVeryCold)   return pick(quotes.weer.veryCold)
  if (isCold)       return pick(quotes.weer.cold)
  if (isHot)        return pick(quotes.weer.sunnyHot)
  if (isWarm)       return pick(quotes.weer.sunnyWarm)
  return pick(quotes.weer.ideal)
}

/** Kledingadvies-intro op basis van temperatuur en neerslagkans. */
export function getKitQuote(avgTemp: number, maxPrecip: number): string {
  const isRainy = maxPrecip >= 50
  if (avgTemp < 5)  return pick(isRainy ? quotes.kit.coldRain  : quotes.kit.veryCold)
  if (avgTemp < 12) return pick(isRainy ? quotes.kit.coldRain  : quotes.kit.cold)
  if (avgTemp < 18) return pick(isRainy ? quotes.kit.warmRain  : quotes.kit.mild)
  if (avgTemp < 24) return pick(isRainy ? quotes.kit.warmRain  : quotes.kit.warm)
  return pick(isRainy ? quotes.kit.warmRain : quotes.kit.hotSun)
}

/** Voedingsadvies-intro op basis van ritduur en temperatuur. */
export function getVoedingQuote(durationHours: number, maxTemp: number): string {
  if (maxTemp >= 25)       return pick(quotes.voeding.hot)
  if (durationHours >= 5)  return pick(quotes.voeding.veryLong)
  if (durationHours >= 3)  return pick(quotes.voeding.long)
  if (durationHours >= 1.5) return pick(quotes.voeding.medium)
  return pick(quotes.voeding.short)
}

/** Bandenspanning-intro op basis van condities. */
export function getBandenQuote(maxPrecip: number, elevationGain: number, minTemp: number): string {
  if (maxPrecip >= 50) return pick(quotes.banden.nat)
  if (elevationGain >= 1000) return pick(quotes.banden.afdalingen)
  if (minTemp < 5) return pick(quotes.banden.koud)
  return pick(quotes.banden.standaard)
}

/** Hersteladvies-intro op basis van ritduur en zwaarte. */
export function getHerstelQuote(durationHours: number, elevationGain: number): string {
  if (durationHours >= 4 || elevationGain >= 1500) return pick(quotes.herstel.zwaar)
  if (durationHours >= 2) return pick(quotes.herstel.lang)
  return pick(quotes.herstel.kort)
}

/** Intro-zin voor de packing checklist. */
export function getChecklistQuote(): string {
  return pick(quotes.checklist)
}

/** Footertekst — willekeurig per sessie. */
export function getFooterQuote(): string {
  return pick(quotes.footer)
}
