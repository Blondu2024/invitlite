import type { EventKind, MusicId, TemplateId } from './types';

/**
 * Every occasion INVITLITE knows, grouped the way a host thinks about them.
 * The six original kinds each have an entrance scene of their own; the others
 * borrow the scene that suits them best (an engagement opens like a wedding,
 * a reunion is signed into the register, a New Year's party pops balloons),
 * with their own photograph, words and labels.
 */

export type SceneKind = 'nunta' | 'botez' | 'cununie' | 'aniversare' | 'copii' | 'film';
export type CategoryId = 'iubire' | 'familie' | 'aniversari' | 'sarbatori' | 'cariera';

export interface KindDef {
  /** Heading on the invitation: "Logodna". */
  label: string;
  /** Lower case, for running text: "confirmare pentru logodna ...". */
  noun: string;
  /** Word between the noun and the hosts, when one is needed: "masa de Crăciun de la Familia Popescu". */
  of?: string;
  /** Short name on buttons. */
  chip: string;
  cat: CategoryId;
  /** Which entrance scene (and drawings) it uses. */
  scene: SceneKind;
  /** The editor's name field: its label and its placeholder. */
  who: string;
  hint: string;
  intro: string;
  message: string;
  /** Title and time of each starter moment. */
  moments: [string, string][];
  askKids: boolean;
  askMenu: boolean;
  music: MusicId;
  /** Whether the editor offers the parents and godparents. */
  family: boolean;
  /** The example: its style, its hosts when not `hint`, and a place per moment. */
  template: TemplateId;
  sample?: string;
  places: [string, string][];
  /** Scene words. Register kinds: the ring around the stamp and the stamp itself. */
  ring?: string;
  stamp?: string;
  /** Party kinds: the line once the balloons or candles are done. */
  wish?: string;
}

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'iubire', label: 'Nuntă și iubire' },
  { id: 'familie', label: 'Copii și familie' },
  { id: 'aniversari', label: 'Aniversări' },
  { id: 'sarbatori', label: 'Sărbători și prieteni' },
  { id: 'cariera', label: 'Școală și carieră' },
];

const GALATI: [string, string] = ['Restaurantul de la malul Dunării', 'Faleza Dunării, Galați'];
const HOME: [string, string] = ['La noi acasă', 'Strada Brăilei 12, Galați'];

export const KINDS: Record<EventKind, KindDef> = {
  nunta: {
    label: 'Nunta', noun: 'nunta', chip: 'Nuntă', cat: 'iubire', scene: 'nunta',
    who: 'Numele mirilor', hint: 'Ana & Mihai',
    intro: 'Cu bucurie în suflet, vă invităm să fiți alături de noi în ziua în care ne unim destinele.',
    message: 'Dragostea nu constă în a ne privi unul pe altul, ci în a privi împreună în aceeași direcție.',
    moments: [['Cununia religioasă', '15:00'], ['Petrecerea', '19:00']],
    askKids: true, askMenu: true, music: 'vals', family: true,
    template: 'clasic', places: [['Biserica Sf. Nicolae', 'Strada Domnească, Galați'], GALATI],
  },
  cununie: {
    label: 'Cununia civilă', noun: 'cununia civilă', chip: 'Cununie civilă', cat: 'iubire', scene: 'cununie',
    who: 'Numele mirilor', hint: 'Ana & Mihai',
    intro: 'Ne spunem „da" în fața ofițerului de stare civilă și vrem să fiți acolo.',
    message: '',
    moments: [['Cununia civilă', '13:00'], ['Masa în familie', '15:00']],
    askKids: false, askMenu: false, music: 'pian', family: true,
    template: 'clasic', places: [['Primăria Galați', 'Strada Domnească 38, Galați']],
    ring: 'CUNUNIA CIVILĂ', stamp: 'DA',
  },
  logodna: {
    label: 'Logodna', noun: 'logodna', chip: 'Logodnă', cat: 'iubire', scene: 'nunta',
    who: 'Numele logodnicilor', hint: 'Ioana & Andrei',
    intro: 'Ne-am spus „da" doar noi doi. Acum vrem să sărbătorim cu voi, cei care ne-ați fost aproape.',
    message: '',
    moments: [['Petrecerea de logodnă', '19:00']],
    askKids: false, askMenu: true, music: 'pian', family: true,
    template: 'botanic', places: [['Terasa din parc', 'Grădina Publică, Galați']],
  },
  casatorie: {
    label: 'Aniversarea căsătoriei', noun: 'aniversarea căsătoriei', chip: 'Ani de căsătorie', cat: 'iubire', scene: 'nunta',
    who: 'Sărbătoriții', hint: 'Elena & Gheorghe',
    intro: 'Au trecut 25 de ani de când ne-am spus „da". Vrem să-i sărbătorim cu oamenii care au fost lângă noi.',
    message: 'Tot ce-a fost greu am dus împreună. Tot ce-a fost frumos, la fel.',
    moments: [['Masa festivă', '18:00']],
    askKids: true, askMenu: true, music: 'vals', family: false,
    template: 'seara', places: [GALATI],
  },
  burlaci: {
    label: 'Petrecerea burlacilor', noun: 'petrecerea burlacilor', chip: 'Burlaci', cat: 'iubire', scene: 'copii',
    who: 'Viitorul mire', hint: 'Mihai',
    intro: 'Mihai se însoară. Până atunci, o ultimă seară de burlac, cu prietenii lui cei mai buni.',
    message: '',
    moments: [['Ne strângem', '20:00']],
    askKids: false, askMenu: false, music: 'petrecere', family: false,
    template: 'seara', places: [['Terasa de pe faleză', 'Faleza Dunării, Galați']],
    wish: 'Să fie o seară de povestit!',
  },
  burlacite: {
    label: 'Petrecerea burlăcițelor', noun: 'petrecerea burlăcițelor', chip: 'Burlăcițe', cat: 'iubire', scene: 'copii',
    who: 'Viitoarea mireasă', hint: 'Ana',
    intro: 'Ana se mărită. Până atunci, o seară doar a fetelor: râsete, dans și povești.',
    message: '',
    moments: [['Ne strângem', '19:00']],
    askKids: false, askMenu: false, music: 'petrecere', family: false,
    template: 'clasic', places: [HOME],
    wish: 'Te așteptăm, fată dragă!',
  },

  botez: {
    label: 'Botezul', noun: 'botezul', chip: 'Botez', cat: 'familie', scene: 'botez',
    who: 'Numele copilului', hint: 'Sofia Maria',
    intro: 'Pentru că cele mai frumoase momente se trăiesc alături de cei dragi, vă invităm la botezul nostru.',
    message: 'Am venit pe lume de curând și vreau să vă cunosc pe toți.',
    moments: [['Taina Sfântului Botez', '12:00'], ['Masa festivă', '14:00']],
    askKids: true, askMenu: false, music: 'cutie', family: true,
    template: 'botanic', places: [['Biserica Sf. Nicolae', 'Strada Domnească, Galați'], GALATI],
  },
  copii: {
    label: 'Petrecere de copii', noun: 'petrecerea', chip: 'Petrecere de copii', cat: 'familie', scene: 'copii',
    who: 'Sărbătoritul', hint: 'Matei, 5 ani', sample: 'Matei, 4 ani',
    intro: 'Facem o petrecere cu baloane, tort și multă joacă. Ne-ar bucura tare să fiți și voi acolo!',
    message: '',
    moments: [['Petrecerea', '16:00']],
    askKids: true, askMenu: false, music: 'petrecere', family: true,
    template: 'clasic', places: [['Locul de joacă Arca', 'Galați']],
  },
  mot: {
    label: 'Tăierea moțului', noun: 'tăierea moțului', chip: 'Tăierea moțului', cat: 'familie', scene: 'aniversare',
    who: 'Numele copilului', hint: 'Matei, 1 an',
    intro: 'Am împlinit un an! Ne strângem cu cei dragi să-mi tăiem moțul și să vedem ce aleg de pe tavă.',
    message: '',
    moments: [['Tăierea moțului', '13:00'], ['Masa festivă', '14:00']],
    askKids: true, askMenu: false, music: 'cutie', family: true,
    template: 'botanic', places: [GALATI],
  },
  bebe: {
    label: 'Baby shower', noun: 'petrecerea de baby shower', of: 'pentru', chip: 'Baby shower', cat: 'familie', scene: 'copii',
    who: 'Viitoarea mămică', hint: 'Ioana',
    intro: 'Bebelușul e pe drum! Hai să-l sărbătorim împreună, cu prăjituri, jocuri și multă dragoste, înainte să vină pe lume.',
    message: '',
    moments: [['Petrecerea', '16:00']],
    askKids: true, askMenu: false, music: 'cutie', family: false,
    template: 'clasic', places: [HOME],
    wish: 'Abia așteptăm să-l cunoaștem!',
  },
  genul: {
    label: 'Băiat sau fată?', noun: 'petrecerea „Băiat sau fată?"', of: 'de la', chip: 'Băiat sau fată?', cat: 'familie', scene: 'copii',
    who: 'Viitorii părinți', hint: 'Ioana & Radu',
    intro: 'Nici noi nu știm încă! Aflăm împreună cu voi dacă vine un băiețel sau o fetiță.',
    message: '',
    moments: [['Marea dezvăluire', '17:00']],
    askKids: true, askMenu: false, music: 'cutie', family: false,
    template: 'clasic', places: [HOME],
    wish: 'Restul îl aflăm împreună!',
  },

  aniversare: {
    label: 'Aniversarea', noun: 'aniversarea', chip: 'Aniversare', cat: 'aniversari', scene: 'aniversare',
    who: 'Sărbătoritul', hint: 'Bunicul Ion, 70 de ani',
    intro: 'Facem o petrecere și locul tău e la masa noastră.',
    message: '',
    moments: [['Petrecerea', '19:00']],
    askKids: false, askMenu: false, music: 'petrecere', family: true,
    template: 'seara', places: [GALATI],
  },
  majorat: {
    label: 'Majoratul', noun: 'majoratul', chip: 'Majorat', cat: 'aniversari', scene: 'aniversare',
    who: 'Sărbătoritul', hint: 'Andreea, 18 ani',
    intro: 'Fac 18 ani și vreau să-i sărbătoresc cu toți cei dragi. Muzică, dans și tort până dimineața.',
    message: '',
    moments: [['Petrecerea', '20:00']],
    askKids: false, askMenu: true, music: 'petrecere', family: false,
    template: 'seara', places: [GALATI],
  },
  onomastica: {
    label: 'Ziua numelui', noun: 'ziua numelui', chip: 'Ziua numelui', cat: 'aniversari', scene: 'aniversare',
    who: 'Sărbătoritul', hint: 'Ion',
    intro: 'E ziua mea de nume și ușa e deschisă. Veniți să ciocnim un pahar și să stăm la povești.',
    message: '',
    moments: [['Masa', '18:00']],
    askKids: true, askMenu: false, music: 'petrecere', family: false,
    template: 'clasic', places: [HOME],
  },

  craciun: {
    label: 'Masa de Crăciun', noun: 'masa de Crăciun', of: 'de la', chip: 'Crăciun', cat: 'sarbatori', scene: 'botez',
    who: 'Gazdele', hint: 'Familia Popescu',
    intro: 'Bradul e împodobit, cozonacul e la cuptor. Vă așteptăm la masa de Crăciun, toți la un loc.',
    message: '',
    moments: [['Masa de Crăciun', '14:00']],
    askKids: true, askMenu: false, music: 'cutie', family: false,
    template: 'clasic', places: [HOME],
  },
  paste: {
    label: 'Masa de Paște', noun: 'masa de Paște', of: 'de la', chip: 'Paște', cat: 'sarbatori', scene: 'botez',
    who: 'Gazdele', hint: 'Familia Popescu',
    intro: 'Hristos a înviat! Ne strângem la masa de Paște, cu ouă roșii, cozonac și cei dragi aproape.',
    message: '',
    moments: [['Masa de Paște', '13:00']],
    askKids: true, askMenu: false, music: 'pian', family: false,
    template: 'botanic', places: [HOME],
  },
  revelion: {
    label: 'Revelionul', noun: 'revelionul', of: 'de la', chip: 'Revelion', cat: 'sarbatori', scene: 'copii',
    who: 'Gazdele', hint: 'Ioana și Radu',
    intro: 'Încheiem anul împreună. Muzică, mâncare bună și artificii la miezul nopții.',
    message: '',
    moments: [['Ne strângem', '21:00'], ['Artificiile', '00:00']],
    askKids: false, askMenu: true, music: 'jazz', family: false,
    template: 'seara', places: [HOME, ['Pe faleză', 'Faleza Dunării, Galați']],
    wish: 'La mulți ani!',
  },
  casa: {
    label: 'Casă nouă', noun: 'petrecerea de casă nouă', of: 'de la', chip: 'Casă nouă', cat: 'sarbatori', scene: 'copii',
    who: 'Gazdele', hint: 'Ana & Mihai',
    intro: 'Ne-am mutat! Veniți să vedeți casa nouă, să ciocnim un pahar și să-i aducem noroc.',
    message: '',
    moments: [['Ușa e deschisă', '17:00']],
    askKids: true, askMenu: false, music: 'jazz', family: false,
    template: 'botanic', places: [['Casa nouă', 'Strada Brăilei 12, Galați']],
    wish: 'Bine ați venit!',
  },
  gratar: {
    label: 'Grătar cu prietenii', noun: 'grătarul', of: 'de la', chip: 'Grătar', cat: 'sarbatori', scene: 'copii',
    who: 'Gazdele', hint: 'Radu și Ioana',
    intro: 'Aprindem grătarul, punem mici la foc și răcim băuturile. Voi aduceți pofta și voia bună.',
    message: '',
    moments: [['Aprindem focul', '14:00']],
    askKids: true, askMenu: false, music: 'petrecere', family: false,
    template: 'botanic', places: [['În curte la noi', 'Strada Brăilei 12, Galați']],
    wish: 'Pune-ți pofta la loc sigur!',
  },
  film: {
    label: 'Seara de film', noun: 'seara de film', chip: 'Seară de film', cat: 'sarbatori', scene: 'film',
    who: 'Gazdele', hint: 'Ioana și Radu',
    intro: 'Stingem lumina, facem popcorn și ne strângem pe canapea. Locul tău e păstrat.',
    message: '',
    moments: [['Începe filmul', '20:00']],
    askKids: false, askMenu: false, music: 'jazz', family: false,
    template: 'seara', places: [['Sufrageria noastră', 'Strada Brăilei 12, Galați']],
  },

  absolvire: {
    label: 'Absolvirea', noun: 'absolvirea', chip: 'Absolvire', cat: 'cariera', scene: 'copii',
    who: 'Absolventul', hint: 'Andrei',
    intro: 'Am terminat! După ani de învățat, vreau să sărbătoresc cu cei care m-au susținut tot drumul.',
    message: '',
    moments: [['Festivitatea', '11:00'], ['Petrecerea', '19:00']],
    askKids: false, askMenu: true, music: 'petrecere', family: false,
    template: 'clasic', places: [['Aula universității', 'Strada Domnească 47, Galați'], GALATI],
    wish: 'Felicitări, absolvente!',
  },
  banchet: {
    label: 'Balul de absolvire', noun: 'balul de absolvire', chip: 'Bal de absolvire', cat: 'cariera', scene: 'copii',
    who: 'Promoția', hint: 'Clasa a XII-a B',
    intro: 'Ultimul clopoțel a sunat. Ne vedem la bal, la ținută, pentru o seară pe care n-o s-o uităm.',
    message: '',
    moments: [['Balul', '19:00']],
    askKids: false, askMenu: true, music: 'jazz', family: false,
    template: 'seara', places: [GALATI],
    wish: 'Ne vedem pe ringul de dans!',
  },
  promotie: {
    label: 'Întâlnirea de promoție', noun: 'întâlnirea de promoție', chip: 'Întâlnire de promoție', cat: 'cariera', scene: 'cununie',
    who: 'Promoția', hint: 'Promoția 2006',
    intro: 'Au trecut 20 de ani de la ultimul clopoțel. Ne strângem din nou, să vedem ce-am mai făcut și să râdem de cine eram.',
    message: '',
    moments: [['Ora de dirigenție', '17:00'], ['Cina', '19:00']],
    askKids: false, askMenu: true, music: 'pian', family: false,
    template: 'clasic', places: [['Liceul nostru, sala 12', 'Strada Domnească, Galați'], GALATI],
    ring: 'PROMOȚIA', stamp: 'PREZENT',
  },
  pensie: {
    label: 'Pensionarea', noun: 'pensionarea', chip: 'Pensionare', cat: 'cariera', scene: 'aniversare',
    who: 'Sărbătoritul', hint: 'Doamna Maria Ionescu',
    intro: 'După o viață de muncă, a venit vremea odihnei. Vă aștept să sărbătorim împreună acest nou început.',
    message: '',
    moments: [['Masa festivă', '18:00']],
    askKids: false, askMenu: true, music: 'pian', family: false,
    template: 'clasic', places: [GALATI],
    wish: 'Felicitări!',
  },
  deschidere: {
    label: 'Deschiderea oficială', noun: 'deschiderea oficială', chip: 'Deschidere', cat: 'cariera', scene: 'cununie',
    who: 'Numele afacerii', hint: 'Cafeneaua Colț de Rai',
    intro: 'Ne deschidem ușile! Veniți la tăierea panglicii, la un pahar de șampanie și la prima cafea din casă.',
    message: '',
    moments: [['Tăierea panglicii', '11:00']],
    askKids: false, askMenu: false, music: 'jazz', family: false,
    template: 'seara', places: [['Cafeneaua', 'Strada Brăilei 3, Galați']],
    ring: 'DESCHIDEREA', stamp: 'DESCHIS',
  },
};

/** "nunta Ana & Mihai", "masa de Crăciun de la Familia Popescu", or just the noun. */
export function eventName(k: EventKind, hosts: string): string {
  const d = KINDS[k];
  const h = hosts.trim();
  return h ? [d.noun, d.of, h].filter(Boolean).join(' ') : d.noun;
}

export const sceneOf =(k: EventKind): SceneKind => KINDS[k].scene;

export const kindsIn = (c: CategoryId): EventKind[] =>
  (Object.keys(KINDS) as EventKind[]).filter((k) => KINDS[k].cat === c);
