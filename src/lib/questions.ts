// Kwestionariusz dnia — 6 osi (skala 1–5) + 2 tagi tak/nie.
// Mikrocopy zgodne z PRD / SESSION_HANDOFF.

import { Axis } from './flower/types';

export type AxisQuestion = {
  axis: Axis;
  prompt: string;
  micro?: string;
  labels: [string, string, string, string, string]; // 1..5
};

// Etykieta osi po polsku — zgodna z legendą kwiatka (FlowerChrome) i statystykami (garden.tsx).
export const AXIS_LABELS: Record<Axis, string> = {
  day: 'DZIEŃ',
  emotions: 'EMOCJE',
  energy: 'ENERGIA',
  body: 'CIAŁO',
  delight: 'ZACHWYT',
  meaning: 'SENS',
};

export const AXIS_QUESTIONS: AxisQuestion[] = [
  {
    axis: 'day',
    prompt: 'Jak oceniasz dzisiejszy dzień?',
    labels: ['Bardzo źle', 'Raczej źle', 'Zwyczajnie', 'Dobrze', 'Wyjątkowo dobrze'],
  },
  {
    axis: 'emotions',
    prompt: 'Jak się dziś czujesz?',
    micro: 'Pomyśl o tym, co czujesz w środku — niezależnie od tego, jak minął Twój dzień.',
    labels: ['Bardzo smutno', 'Trochę smutno', 'Spokojnie', 'Dobrze', 'Bardzo radośnie'],
  },
  {
    axis: 'energy',
    prompt: 'Ile miałaś dziś energii?',
    micro: 'Pomyśl o swoim wewnętrznym zasobie — do działania, bycia z innymi i reagowania na to, co się wydarzało.',
    labels: ['Puste baki', 'Ledwo, ledwo', 'Wystarczająco', 'Z zapasem', 'Energia buzowała mi w żyłach'],
  },
  {
    axis: 'body',
    prompt: 'Jak czuło się dziś Twoje ciało?',
    micro: 'Pomyśl o śnie, oddechu, napięciach i ruchu — na ile dobrze czułaś się dziś fizycznie.',
    labels: ['Protestowało', 'Było zmęczone', 'Było spokojne', 'Było lekkie', 'Było pełne życia'],
  },
  {
    axis: 'delight',
    prompt: 'Ile drobnych momentów zachwyciło Cię dzisiaj?',
    micro: 'Pomyśl o małych rzeczach, które choć na chwilę Cię zatrzymały — uśmiechu, zapachu, świetle.',
    labels: ['Ani jeden', 'Jeden mały moment', 'Kilka drobnych', 'Całkiem sporo', 'Cały dzień był ich pełen'],
  },
  {
    axis: 'meaning',
    prompt: 'Na ile to, co dziś robiłaś, było dla Ciebie ważne?',
    micro: 'Pomyśl o tym, co było zgodne z Tobą — pracy nad czymś istotnym, ważnej rozmowie albo drobnej decyzji podjętej po swojemu.',
    labels: ['Wcale', 'Tylko odrobinę', 'Trochę', 'W dużym stopniu', 'W pełni'],
  },
];

export const TAG_QUESTIONS = [
  { key: 'somethingGood' as const, prompt: 'Czy spotkało Cię dziś coś dobrego?' },
  { key: 'somethingHard' as const, prompt: 'Czy spotkało Cię dziś coś trudnego?' },
];

export const NOTE_PROMPTS = [
  'Zapisz dziś coś dla siebie.',
  'Co chcesz zapamiętać z dzisiaj?',
  'Co siedzi w Tobie po dzisiejszym dniu?',
  'Jedno zdanie, jedno słowo — cokolwiek.',
];
