// Typy sekcji Insights — kształty danych do wykresów/porównań/kart w /garden.
// Wartości osi zawsze number | null: null = brak wpisu tego dnia, nigdy 0.

import type { Axis } from '../flower/types';

export type DailyInsightPoint = {
  date: string;
  day: number | null;
  emotions: number | null;
  energy: number | null;
  body: number | null;
  delight: number | null;
  meaning: number | null;
  dailyBalance: number | null;
  hasGoodMoment: boolean;
  hasDifficultMoment: boolean;
  hasNote: boolean;
  hasPhotos: boolean;
};

export type PeriodSummary = {
  startDate: string;
  endDate: string;
  entriesCount: number;
  possibleDaysCount: number;
  completionRate: number;
  averages: {
    day: number | null;
    emotions: number | null;
    energy: number | null;
    body: number | null;
    delight: number | null;
    meaning: number | null;
    dailyBalance: number | null;
  };
  goodMomentsCount: number;
  difficultMomentsCount: number;
  mixedMomentsCount: number;
};

export type MetricComparison = {
  metric: Axis;
  currentAverage: number | null;
  previousAverage: number | null;
  difference: number | null;
  direction: 'higher' | 'similar' | 'lower' | 'insufficient_data';
};

export type MomentGroupKey = 'onlyGood' | 'onlyHard' | 'both' | 'neither';

export type MomentGroup = {
  key: MomentGroupKey;
  count: number;
  averages: {
    day: number | null;
    emotions: number | null;
    energy: number | null;
    body: number | null;
    delight: number | null;
    meaning: number | null;
  };
  dailyBalance: number | null;
};
