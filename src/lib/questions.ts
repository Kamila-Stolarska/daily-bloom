// Kwestionariusz dnia — 6 osi (skala 1–5) + 2 tagi tak/nie.
// Mikrocopy zgodne z PRD / SESSION_HANDOFF.

import { Axis } from './flower/types';

export type AxisQuestion = {
  axis: Axis;
  prompt: string;
  micro?: string;
  labels: [string, string, string, string, string]; // 1..5
};

export const AXIS_QUESTIONS: AxisQuestion[] = [
  {
    axis: 'day',
    prompt: 'Jak dziś było?',
    labels: ['Ciężko', 'Trudno', 'Zwyczajnie', 'Dobrze', 'Wyjątkowo'],
  },
  {
    axis: 'emotions',
    prompt: 'Jak się dziś czujesz?',
    micro: 'To, co czujesz w środku — niezależnie od tego, jaki był dzień.',
    labels: ['Smutno', 'Słabo', 'Spokojnie', 'Dobrze', 'Radośnie'],
  },
  {
    axis: 'energy',
    prompt: 'Ile miałaś dziś w sobie energii?',
    micro: 'Twój wewnętrzny zasób — do działania, do bycia, do reagowania.',
    labels: ['Puste baki', 'Ledwo ledwo', 'Wystarczająco', 'Z zapasem', 'Buzowała w żyłach'],
  },
  {
    axis: 'body',
    prompt: 'Jak czuło się dziś Twoje ciało?',
    micro: 'Sen, oddech, napięcia, ruch — na ile było Ci ze sobą dobrze fizycznie.',
    labels: ['Protestowało', 'Zmęczone', 'Spokojne', 'Lekkie', 'Rozkwitłe'],
  },
  {
    axis: 'delight',
    prompt: 'Ile drobnych momentów Cię dziś urzekło?',
    micro: 'Małe rzeczy, które na chwilę Cię zatrzymały — uśmiech, zapach, światło.',
    labels: ['Żadnego', 'Ledwo jeden', 'Parę drobnych', 'Sporo', 'Cały dzień'],
  },
  {
    axis: 'meaning',
    prompt: 'Czy to, co robiłaś dziś, było dla Ciebie ważne?',
    micro: 'Coś zgodnego z Tobą — praca nad czymś istotnym, rozmowa, drobna decyzja po swojemu.',
    labels: ['Wcale', 'Ledwo', 'Trochę', 'Mocno', 'W pełni'],
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
