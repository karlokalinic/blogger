export const BOARD_SIZE = 16;
export const MAX_ITEM_LEVEL = 8;
export const SAVE_VERSION = 1;

export type CharacterId = "ruza" | "mara" | "davor" | "karlytta" | "deni";
export type RelationId =
  | "mara-davor"
  | "ruza-davor"
  | "ruza-karlytta"
  | "karlytta-mara"
  | "deni-mara"
  | "deni-davor"
  | "deni-karlytta"
  | "karlytta-davor";
export type UpgradeId = "betterBag" | "familyBook" | "longTable" | "oldRadio";
export type ServiceStep = 0 | 1 | 2 | 3;

export type MergeTile = {
  id: string;
  level: number;
};

export type RelationScore = {
  warmth: number;
  friction: number;
};

export type UpgradeLevels = Record<UpgradeId, number>;

export type PrudinaMergeState = {
  version: typeof SAVE_VERSION;
  coins: number;
  stories: number;
  totalMerges: number;
  mergesSinceScene: number;
  highestLevel: number;
  board: Array<MergeTile | null>;
  selectedIndex: number | null;
  upgrades: UpgradeLevels;
  relations: Record<RelationId, RelationScore>;
  sceneIndex: number;
  sceneReady: boolean;
  serviceIndex: number;
  serviceStep: ServiceStep;
  servicesCompleted: number;
  lastMessage: string;
  serial: number;
};

export type ServiceRequest = {
  id: string;
  code: string;
  title: string;
  resident: string;
  request: string;
  location: string;
  duration: string;
  load: string;
  cost: number;
  physicalPlan: [string, string, string];
  stopCondition: string;
  proof: string;
};

export type SceneChoice = {
  label: string;
  result: string;
  warmth: number;
  friction: number;
  coins: number;
  stories: number;
};

export type FamilyScene = {
  id: string;
  relation: RelationId;
  people: [CharacterId, CharacterId];
  kicker: string;
  title: string;
  body: string;
  choices: [SceneChoice, SceneChoice];
};

export const serviceRequests: ServiceRequest[] = [
  {
    id: "water",
    code: "IZV-01-044",
    title: "Dostava pitke vode",
    resident: "Mara / kućanstvo 044",
    request: "Voda iz slavine ponovno ima miris. Donesite dovoljno do sutra ujutro.",
    location: "kuhinja i ulaz u stan",
    duration: "22 min",
    load: "12 kg / dvije zatvorene posude",
    cost: 18,
    physicalPlan: [
      "Provjeriti javnu obavijest o vodi i prohodnost ulaza.",
      "Preuzeti 12 litara u neoštećenim, tvornički zatvorenim posudama.",
      "Predati na pragu; bez ulaska u dom ako stanovnica to izričito ne zatraži.",
    ],
    stopCondition: "Prekinuti ako je prolaz zaleđen, posuda oštećena ili osoba prijavljuje akutne simptome; tada pozvati hitnu službu.",
    proof: "vrijeme predaje, fotografija pečata posude i potvrda stanovnice bez snimanja unutrašnjosti doma",
  },
  {
    id: "window",
    code: "IZV-02-118",
    title: "Privremeno brtvljenje prozora",
    resident: "Ruža / kućanstvo 118",
    request: "Noću puše kraj kreveta. Ne mijenjajte prozor; samo neka izdrži do pregleda.",
    location: "spavaća soba / vanjski prozor",
    duration: "35 min",
    load: "2,4 kg / folija, traka, termometar",
    cost: 22,
    physicalPlan: [
      "Izmjeriti temperaturu i pregledati staklo bez pomicanja namještaja stanovnice.",
      "Postaviti uklonjivu unutarnju brtvu; ne bušiti okvir i ne zatvarati ventilacijski otvor.",
      "Ponovno izmjeriti propuh i ostaviti pisanu uputu za uklanjanje.",
    ],
    stopCondition: "Ne dirati nosivi okvir, električne vodove ni plinsku instalaciju. Napuklo staklo zahtijeva ljudskog tehničara.",
    proof: "dvije temperature, fotografija samo prozora i Ružina usmena potvrda da prolaz ostaje slobodan",
  },
  {
    id: "medicine",
    code: "IZV-03-207",
    title: "Preuzimanje propisane terapije",
    resident: "Deni / nalog za Ružu",
    request: "Terapija je izdana i čeka u ljekarni. Preuzeti zatvoren paket, bez tumačenja doze.",
    location: "ljekarna — kućni prag",
    duration: "28 min",
    load: "0,3 kg / zapečaćeni paket",
    cost: 26,
    physicalPlan: [
      "Provjeriti šifru naloga i podudaranje imena bez prikaza zdravstvenih podataka trećima.",
      "Preuzeti zatvoreni paket; ne otvarati, ne brojiti tablete i ne davati medicinski savjet.",
      "Predati ovlaštenoj osobi i pročitati samo upozorenje ljekarnika priloženo uz paket.",
    ],
    stopCondition: "Svako nepodudaranje imena, oštećen pečat ili pitanje o doziranju vraća predmet ljekarniku ili liječniku.",
    proof: "šifra predaje, cjelovitost pečata i potvrda primitka bez pohrane dijagnoze",
  },
  {
    id: "moisture",
    code: "IZV-04-311",
    title: "Mjerenje vlage iza ormara",
    resident: "Mara i Davor / kućanstvo 044",
    request: "Zid je mokar iza ormara. Izmjerite i zabilježite; nemojte sami rušiti ni čistiti.",
    location: "dnevna soba / sjeverni zid",
    duration: "31 min",
    load: "1,8 kg / mjerač, svjetlo, zaštitna maska",
    cost: 20,
    physicalPlan: [
      "Isključiti obližnju utičnicu samo ako je dostupna bez rastavljanja i osigurati prolaz.",
      "Pomaknuti ormar najviše 20 cm uz pristanak i izmjeriti tri točke bez struganja površine.",
      "Vratiti namještaj u stabilan položaj i označiti hitnost za ljudski građevinski pregled.",
    ],
    stopCondition: "Prekinuti kod vidljivog kabela, nestabilnog ormara, opsežne plijesni ili otežanog disanja.",
    proof: "tri očitanja, tri uske fotografije zida i evidentirana uputa o provjetravanju",
  },
];

export const characters: Array<{
  id: CharacterId;
  name: string;
  genitive: string;
  shortRole: string;
  role: string;
  truth: string;
}> = [
  { id: "ruza", name: "Ruža", genitive: "Ruže", shortRole: "STUP KUĆE", role: "baka, kuharica i neslužbeni sud", truth: "Hrani obje strane, a pamti tko je prvi ustao od stola." },
  { id: "mara", name: "Mara", genitive: "Mare", shortRole: "BLAGAJNICA", role: "sestra koja vodi račune", truth: "Traži malo, zapisuje sve i nikad ne zaboravlja ton kojim je nešto rečeno." },
  { id: "davor", name: "Davor", genitive: "Davora", shortRole: "MAJSTOR", role: "brat koji popravlja prije isprike", truth: "Dođe kad pukne cijev, ode prije hvala i uvredu ostavi kao račun." },
  { id: "karlytta", name: "Karlytta", genitive: "Karlytte", shortRole: "ZVIJEZDA", role: "unuka koju Prudina prisvaja", truth: "Javno reže ljude na pola; privatno plaća dug koji nikad neće priznati." },
  { id: "deni", name: "Deni", genitive: "Denija", shortRole: "DOKTOR", role: "mladi liječnik bez sigurne strane", truth: "Svi od njega traže istinu, ali samo ako potvrđuje onu koju već imaju." },
];

export const relations: Array<{
  id: RelationId;
  people: [CharacterId, CharacterId];
  label: string;
  detail: string;
}> = [
  { id: "mara-davor", people: ["mara", "davor"], label: "Brani je / ponižava je", detail: "Ona drži račune; on drži rezervni ključ. Nijedno ne zna živjeti bez drugoga, ali oboje žele da selo misli suprotno." },
  { id: "ruza-davor", people: ["ruza", "davor"], label: "Hrani ga / sudi mu", detail: "Ruža mu uvijek ostavi tanjur. Mjesto za stolom koristi kao nagradu, kaznu i dokaz da je još njezin." },
  { id: "ruza-karlytta", people: ["ruza", "karlytta"], label: "Obožava je / ne oprašta sramotu", detail: "Na televiziji je brani od svih. U kuhinji joj govori ono što se ne smije ponoviti ni u pjesmi." },
  { id: "karlytta-mara", people: ["karlytta", "mara"], label: "Plaća joj / krade joj priču", detail: "Karlytta šalje kuverte bez potpisa, zatim na pozornici pretvori Marin život u stih koji svi pjevaju." },
  { id: "deni-mara", people: ["deni", "mara"], label: "Vjeruje mu / ispituje ga", detail: "Mara mu nosi stare nalaze i nove glasine. Vjeruje njegovim rukama više nego njegovoj instituciji." },
  { id: "deni-davor", people: ["deni", "davor"], label: "Liječi ga / ne sluša ga", detail: "Davor dolazi tek kad više ne može raditi. Svaki savjet čuje kao napad, svaku pomoć kao osobni dug." },
  { id: "deni-karlytta", people: ["deni", "karlytta"], label: "Čuva tajnu / boji se moći", detail: "On zna što piše u nalazu. Ona zna koliko ljudi može uvjeriti da nalaz nikad nije postojao." },
  { id: "karlytta-davor", people: ["karlytta", "davor"], label: "Ratuju javno / trebaju isti narod", detail: "On je naziva prodanom. Ona njega izvodi na pozornicu kad treba izgledati kao da nije napustila svoje." },
];

export const familyScenes: FamilyScene[] = [
  {
    id: "boiler",
    relation: "mara-davor",
    people: ["mara", "davor"],
    kicker: "PREDMET ODN-01 / KUHINJA / 19:40",
    title: "Neformalni popravak bojlera",
    body: "Davor pred susjedima kaže da Mara ‘ne zna s novcem’. Iste večeri bez poziva donese ventil i ostane dok voda ponovno ne poteče.",
    choices: [
      { label: "Evidentiraj Marin javni odgovor", result: "Mara mu vraća svaku riječ. Davor ipak dovrši posao. Bliskost boli, zamjeranje pamti.", warmth: 3, friction: 10, coins: 28, stories: 1 },
      { label: "Evidentiraj ostanak bez isprike", result: "Nitko ne kaže hvala. Nitko ga ne tjera. Popravak postaje njihov najbliži oblik isprike.", warmth: 9, friction: 5, coins: 20, stories: 2 },
    ],
  },
  {
    id: "sunday-table",
    relation: "ruza-karlytta",
    people: ["ruza", "karlytta"],
    kicker: "PREDMET ODN-02 / NEDJELJNI OBROK",
    title: "Raspored sjedenja i pripadnost",
    body: "Ruža Karlytti servira najbolji komad mesa, pa pred svima pita kada će se ‘opet ponašati kao naša’. Nitko ne dira pribor.",
    choices: [
      { label: "Evidentiraj obranu humorom", result: "Šala spasi ručak i uništi tišinu. Ruža je ponosna na oštrinu koju javno osuđuje.", warmth: 7, friction: 8, coins: 24, stories: 2 },
      { label: "Evidentiraj skrb bez odgovora", result: "Ruža prekida raspravu još jednom žlicom. Hrana glumi oprost, ali pitanje ostaje na stolu.", warmth: 11, friction: 3, coins: 18, stories: 2 },
    ],
  },
  {
    id: "work-certificate",
    relation: "deni-davor",
    people: ["deni", "davor"],
    kicker: "PREDMET ODN-03 / AMBULANTA",
    title: "Odbijanje zdravstvenog ograničenja",
    body: "Deni kaže da Davor mjesec dana ne smije na gradilište. Davor čuje da ga je dječak proglasio slabim i traži papir samo da ga može poderati.",
    choices: [
      { label: "Zadrži izdano ograničenje", result: "Deni ostaje miran. Davor zalupi vratima, ali papir ipak odnese kući u unutarnjem džepu.", warmth: 4, friction: 11, coins: 30, stories: 2 },
      { label: "Evidentiraj prilagođeni rad", result: "Dogovore lakši posao koji obojica nazivaju privremenim. Ponos preživi, tijelo možda također.", warmth: 10, friction: 5, coins: 20, stories: 2 },
    ],
  },
  {
    id: "radio-call",
    relation: "karlytta-davor",
    people: ["karlytta", "davor"],
    kicker: "PREDMET ODN-04 / RADIO PRUDINA",
    title: "Javni sukob i dodjela posla",
    body: "Davor se uključi u emisiju i nazove Karlyttu izdajicom. Ona prepozna glas, ali ga ne imenuje; pozove baš njegovu brigadu da popravi pozornicu.",
    choices: [
      { label: "Evidentiraj javno odbijanje", result: "Prudina dobije dobar radio. Davor dobije posao. Oboje tvrde da je onaj drugi izgubio.", warmth: 5, friction: 12, coins: 36, stories: 2 },
      { label: "Evidentiraj prihvaćeni nalog", result: "Na pozornici rade leđima jedno prema drugome. To je njihov najduži mir u godinama.", warmth: 11, friction: 6, coins: 28, stories: 2 },
    ],
  },
  {
    id: "envelope",
    relation: "karlytta-mara",
    people: ["karlytta", "mara"],
    kicker: "PREDMET ODN-05 / NEPOTPISANA UPLATA",
    title: "Neformalna financijska pomoć",
    body: "Mara prepozna Karlyttin rukopis na kuverti s novcem. Iste noći na radiju čuje vlastitu rečenicu pretvorenu u refren.",
    choices: [
      { label: "Evidentiraj povrat sredstava", result: "Novac se vrati, rečenica ne može. Karlytta prvi put shvati da pomoć može zvučati kao krađa.", warmth: 4, friction: 12, coins: 32, stories: 3 },
      { label: "Evidentiraj plaćeno grijanje", result: "Mara potroši svaki euro i nikome ne kaže hvala. Karlytta nikome ne kaže da je čekala.", warmth: 12, friction: 6, coins: 20, stories: 3 },
    ],
  },
  {
    id: "old-results",
    relation: "deni-mara",
    people: ["deni", "mara"],
    kicker: "PREDMET ODN-06 / ARHIV 1998.",
    title: "Naknadno dostavljena dokumentacija",
    body: "Mara donese fascikl koji nitko nije tražio. Deni u njemu pronađe obrazac koji ruši službenu priču, ali i dokaz da mu Mara mjesecima nije rekla sve.",
    choices: [
      { label: "Zatraži potpunu dokumentaciju", result: "Mara se uvrijedi jer joj ne vjeruje. Zatim mu donese još dvije kutije dokumenata.", warmth: 8, friction: 8, coins: 28, stories: 3 },
      { label: "Prihvati djelomično izuzeće", result: "Deni dobije dovoljno da djeluje, ne dovoljno da razumije. Ona ga štiti i kontrolira istom gestom.", warmth: 10, friction: 10, coins: 24, stories: 3 },
    ],
  },
  {
    id: "empty-chair",
    relation: "ruza-davor",
    people: ["ruza", "davor"],
    kicker: "PREDMET ODN-07 / BLAGDANSKI OBROK",
    title: "Povratak bez izrečene pomirbe",
    body: "Ruža postavi Davorov tanjur iako je rekla da ga više neće zvati. Kad se pojavi, kažnjava ga tako da mu servira kao da se ništa nije dogodilo.",
    choices: [
      { label: "Evidentiraj povratak bez izjave", result: "Oprost nitko ne izgovori. Stol ga svejedno provede kao službeni dokument.", warmth: 13, friction: 5, coins: 20, stories: 3 },
      { label: "Evidentiraj pitanje pred obitelji", result: "Jedno kratko pitanje otvori cijelu godinu. Večera preživi, a obitelj dobije novu verziju iste svađe.", warmth: 7, friction: 13, coins: 34, stories: 3 },
    ],
  },
  {
    id: "missing-minute",
    relation: "deni-karlytta",
    people: ["deni", "karlytta"],
    kicker: "PREDMET ODN-08 / NEDOSTAJUĆI ZAPIS",
    title: "Jedanaest minuta bez snimke",
    body: "Deni vidi što se dogodilo između dvije snimke. Karlytta ga ne moli da šuti; samo nabroji ljude koji će pasti ako progovori.",
    choices: [
      { label: "Pohrani neovisnu kopiju", result: "Njoj ne obeća ništa. Upravo zato mu vjeruje više nego ljudima koji su se zakleli.", warmth: 9, friction: 12, coins: 36, stories: 4 },
      { label: "Evidentiraj djelomičnu izjavu", result: "Istina izađe dovoljno da povrijedi, premalo da oslobodi. Oboje postaju suučesnici u mjeri.", warmth: 12, friction: 10, coins: 30, stories: 4 },
    ],
  },
];

const initialRelations: Record<RelationId, RelationScore> = {
  "mara-davor": { warmth: 68, friction: 74 },
  "ruza-davor": { warmth: 82, friction: 49 },
  "ruza-karlytta": { warmth: 88, friction: 61 },
  "karlytta-mara": { warmth: 59, friction: 77 },
  "deni-mara": { warmth: 47, friction: 38 },
  "deni-davor": { warmth: 31, friction: 69 },
  "deni-karlytta": { warmth: 42, friction: 58 },
  "karlytta-davor": { warmth: 36, friction: 91 },
};

function makeTile(id: number, level: number): MergeTile {
  return { id: `predmet-${id}`, level };
}

export function starterPrudinaMergeState(): PrudinaMergeState {
  const board: Array<MergeTile | null> = Array.from({ length: BOARD_SIZE }, () => null);
  board[0] = makeTile(1, 1);
  board[1] = makeTile(2, 1);
  board[4] = makeTile(3, 2);
  board[5] = makeTile(4, 2);

  return {
    version: SAVE_VERSION,
    coins: 48,
    stories: 0,
    totalMerges: 0,
    mergesSinceScene: 0,
    highestLevel: 2,
    board,
    selectedIndex: null,
    upgrades: { betterBag: 0, familyBook: 0, longTable: 0, oldRadio: 0 },
    relations: structuredClone(initialRelations),
    sceneIndex: 0,
    sceneReady: true,
    serviceIndex: 0,
    serviceStep: 0,
    servicesCompleted: 0,
    lastMessage: "Odaberite dvije jednake prijave. Sustav će ih objediniti u višu razinu mjere.",
    serial: 5,
  };
}

export function sceneForState(state: PrudinaMergeState): FamilyScene {
  return familyScenes[state.sceneIndex % familyScenes.length];
}

export function mergesNeeded(state: PrudinaMergeState): number {
  return Math.max(1, 3 - state.upgrades.oldRadio);
}

export function serviceForState(state: PrudinaMergeState): ServiceRequest {
  return serviceRequests[state.serviceIndex % serviceRequests.length];
}

export function programMetrics(state: PrudinaMergeState): {
  reasonToExist: number;
  householdStability: number;
  verifiedCoverage: number;
} {
  return {
    reasonToExist: clamp(90 - state.servicesCompleted * 4 + (state.sceneReady ? 5 : 0), 24, 97),
    householdStability: clamp(28 + state.servicesCompleted * 11 + state.highestLevel * 3, 0, 100),
    verifiedCoverage: clamp(18 + state.servicesCompleted * 14 + state.stories * 2, 0, 100),
  };
}

export function advanceService(state: PrudinaMergeState): PrudinaMergeState {
  const request = serviceForState(state);
  if (state.serviceStep === 0) {
    return {
      ...state,
      serviceStep: 1,
      lastMessage: `Zahtjev ${request.code} prošao je sigurnosnu provjeru. Fizička radnja još nije odobrena.`,
    };
  }
  if (state.serviceStep === 1) {
    if (state.coins < request.cost) {
      return {
        ...state,
        lastMessage: `Za izvršenje nedostaje još ${request.cost - state.coins} jedinica raspoloživih sredstava. Potreba ostaje evidentirana.`,
      };
    }
    return {
      ...state,
      coins: state.coins - request.cost,
      serviceStep: 2,
      lastMessage: `${request.cost} jedinica rezervirano je za nalog ${request.code}. Jedinica P-1 smije krenuti.`,
    };
  }
  if (state.serviceStep === 2) {
    return {
      ...state,
      serviceStep: 3,
      lastMessage: `Fizička radnja “${request.title}” izvršena je unutar dopuštenih granica. Potreban je završni dokaz.`,
    };
  }

  const reimbursement = request.cost + 8;
  return {
    ...state,
    coins: state.coins + reimbursement,
    stories: state.stories + 2,
    serviceIndex: (state.serviceIndex + 1) % serviceRequests.length,
    serviceStep: 0,
    servicesCompleted: state.servicesCompleted + 1,
    lastMessage: `Dokaz je prihvaćen. Refundirano je ${reimbursement} jedinica. Riješen slučaj smanjuje potrebu, ali otvara sljedeći nalog.`,
  };
}

export function addParcel(state: PrudinaMergeState, randomValue = Math.random(), preferredIndex?: number): PrudinaMergeState {
  const preferredIsEmpty = Number.isInteger(preferredIndex)
    && preferredIndex! >= 0
    && preferredIndex! < BOARD_SIZE
    && state.board[preferredIndex!] === null;
  const emptyIndex = preferredIsEmpty ? preferredIndex! : state.board.findIndex((tile) => tile === null);
  if (emptyIndex < 0) return { ...state, selectedIndex: null, lastMessage: "Registar je popunjen. Objedinite dvije jednake prijave prije novog unosa." };

  const betterChance = Math.min(0.5, 0.06 + state.upgrades.betterBag * 0.11);
  const level = randomValue < betterChance ? 2 : 1;
  const board = [...state.board];
  board[emptyIndex] = makeTile(state.serial, level);

  return {
    ...state,
    board,
    serial: state.serial + 1,
    highestLevel: Math.max(state.highestLevel, level),
    lastMessage: level === 2 ? "Ubrzana klasifikacija otvorila je prijavu razine 2." : "Nova prijava unesena je u registar. Pronađite joj jednaku razinu.",
  };
}

export function selectOrMergeTile(state: PrudinaMergeState, index: number): PrudinaMergeState {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) {
    return { ...state, selectedIndex: null, lastMessage: "To registarsko mjesto ne postoji. Odaberite vidljivu prijavu." };
  }
  const tile = state.board[index];
  if (!tile) return { ...state, selectedIndex: null, lastMessage: "Prazno registarsko mjesto. Unesite novu prijavu." };
  if (state.selectedIndex === index) return { ...state, selectedIndex: null, lastMessage: "Odabir je poništen." };
  if (state.selectedIndex === null) return { ...state, selectedIndex: index, lastMessage: `Odabrana je prijava razine ${tile.level}. Sada odaberite još jednu iste razine.` };

  const firstTile = state.board[state.selectedIndex];
  if (!firstTile) return { ...state, selectedIndex: index };
  if (firstTile.level !== tile.level) {
    return { ...state, selectedIndex: index, lastMessage: "Razine se ne podudaraju. Druga prijava ostaje odabrana." };
  }
  if (tile.level >= MAX_ITEM_LEVEL) {
    return { ...state, selectedIndex: null, lastMessage: "Kućanstvo je službeno stabilno. Daljnje objedinjavanje nije dopušteno." };
  }

  const nextLevel = tile.level + 1;
  const board = [...state.board];
  board[state.selectedIndex] = null;
  board[index] = makeTile(state.serial, nextLevel);
  const rewardMultiplier = 1 + state.upgrades.familyBook * 0.2;
  const reward = Math.round((8 + nextLevel * nextLevel * 3) * rewardMultiplier);
  const nextMergesSinceScene = state.mergesSinceScene + 1;
  const unlockScene = !state.sceneReady && nextMergesSinceScene >= mergesNeeded(state);

  return {
    ...state,
    board,
    serial: state.serial + 1,
    selectedIndex: null,
    coins: state.coins + reward,
    stories: state.stories + (nextLevel >= 4 ? 1 : 0),
    totalMerges: state.totalMerges + 1,
    mergesSinceScene: unlockScene ? mergesNeeded(state) : nextMergesSinceScene,
    highestLevel: Math.max(state.highestLevel, nextLevel),
    sceneReady: state.sceneReady || unlockScene,
    lastMessage: unlockScene ? "Prijave su objedinjene. Otvorena je nova procjena međuovisnosti kućanstva." : `Mjera je podignuta na razinu ${nextLevel}. Dodijeljeno je ${reward} jedinica sredstava.`,
  };
}

export function chooseFamilyScene(state: PrudinaMergeState, choiceIndex: 0 | 1): PrudinaMergeState {
  if (!state.sceneReady) return state;
  const scene = sceneForState(state);
  const choice = scene.choices[choiceIndex];
  const score = state.relations[scene.relation];
  const storyBonus = state.upgrades.familyBook;

  return {
    ...state,
    coins: state.coins + choice.coins,
    stories: state.stories + choice.stories + storyBonus,
    relations: {
      ...state.relations,
      [scene.relation]: {
        warmth: clamp(score.warmth + choice.warmth, 0, 100),
        friction: clamp(score.friction + choice.friction, 0, 100),
      },
    },
    sceneIndex: (state.sceneIndex + 1) % familyScenes.length,
    sceneReady: false,
    mergesSinceScene: 0,
    lastMessage: choice.result,
  };
}

export function upgradeCost(id: UpgradeId, level: number): number {
  const base: Record<UpgradeId, number> = { betterBag: 60, familyBook: 95, longTable: 130, oldRadio: 110 };
  return Math.round(base[id] * Math.pow(1.72, level));
}

export function buyUpgrade(state: PrudinaMergeState, id: UpgradeId): PrudinaMergeState {
  const level = state.upgrades[id];
  const cost = upgradeCost(id, level);
  if (level >= 5) return { ...state, lastMessage: "Ta je mjera kapaciteta već u cijelosti aktivirana." };
  if (state.coins < cost) return { ...state, lastMessage: `Za aktivaciju nedostaje još ${cost - state.coins} jedinica sredstava.` };

  return {
    ...state,
    coins: state.coins - cost,
    upgrades: { ...state.upgrades, [id]: level + 1 },
    lastMessage: "Mjera kapaciteta aktivirana je i primjenjuje se odmah.",
  };
}

export function collectTableIncome(state: PrudinaMergeState): PrudinaMergeState {
  if (state.upgrades.longTable <= 0) return state;
  return { ...state, coins: state.coins + 2 + state.upgrades.longTable * 3 };
}

export function restorePrudinaMergeState(value: unknown): PrudinaMergeState {
  const fallback = starterPrudinaMergeState();
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<PrudinaMergeState>;
  if (candidate.version !== SAVE_VERSION || !Array.isArray(candidate.board) || candidate.board.length !== BOARD_SIZE) return fallback;

  const board = candidate.board.map((tile) => {
    if (!tile || typeof tile !== "object") return null;
    const parsed = tile as Partial<MergeTile>;
    if (typeof parsed.id !== "string" || parsed.id.length > 80 || typeof parsed.level !== "number" || !Number.isFinite(parsed.level)) return null;
    return { id: parsed.id, level: clamp(Math.round(parsed.level), 1, MAX_ITEM_LEVEL) };
  });

  const upgrades = Object.fromEntries(
    (Object.keys(fallback.upgrades) as UpgradeId[]).map((id) => [id, safeInteger(candidate.upgrades?.[id], 0, 0, 5)]),
  ) as UpgradeLevels;
  const restoredRelations = Object.fromEntries(
    relations.map(({ id }) => {
      const saved = candidate.relations?.[id];
      const base = fallback.relations[id];
      return [id, {
        warmth: safeInteger(saved?.warmth, base.warmth, 0, 100),
        friction: safeInteger(saved?.friction, base.friction, 0, 100),
      }];
    }),
  ) as Record<RelationId, RelationScore>;
  const highestBoardLevel = board.reduce<number>((highest, tile) => Math.max(highest, tile?.level ?? 0), 1);
  const sceneIndex = safeInteger(candidate.sceneIndex, 0, 0, familyScenes.length - 1);
  const maxSerialOnBoard = board.reduce<number>((highest, tile) => {
    const match = tile?.id.match(/^predmet-(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);

  return {
    ...fallback,
    version: SAVE_VERSION,
    coins: safeInteger(candidate.coins, fallback.coins, 0, 999_999_999),
    stories: safeInteger(candidate.stories, fallback.stories, 0, 9_999_999),
    totalMerges: safeInteger(candidate.totalMerges, 0, 0, 999_999_999),
    mergesSinceScene: safeInteger(candidate.mergesSinceScene, 0, 0, mergesNeeded({ ...fallback, upgrades })),
    highestLevel: Math.max(highestBoardLevel, safeInteger(candidate.highestLevel, highestBoardLevel, 1, MAX_ITEM_LEVEL)),
    board,
    selectedIndex: null,
    upgrades,
    relations: restoredRelations,
    sceneIndex,
    sceneReady: typeof candidate.sceneReady === "boolean" ? candidate.sceneReady : fallback.sceneReady,
    serviceIndex: safeInteger(candidate.serviceIndex, fallback.serviceIndex, 0, serviceRequests.length - 1),
    serviceStep: safeInteger(candidate.serviceStep, fallback.serviceStep, 0, 3) as ServiceStep,
    servicesCompleted: safeInteger(candidate.servicesCompleted, fallback.servicesCompleted, 0, 999_999),
    lastMessage: typeof candidate.lastMessage === "string" && candidate.lastMessage.length <= 240 ? candidate.lastMessage : fallback.lastMessage,
    serial: Math.max(maxSerialOnBoard + 1, safeInteger(candidate.serial, fallback.serial, 1, 999_999_999)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeInteger(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(Math.round(value), min, max)
    : fallback;
}
