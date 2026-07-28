// Typy sekcji "Dobre i trudne dni" na /garden.

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
