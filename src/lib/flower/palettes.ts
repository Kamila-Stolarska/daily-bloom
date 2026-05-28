// Daily Bloom — palety bazowe (start: 5, docelowo ~40).
// Inspiracja: Federica Fragapane + akwarele. Kremowe tło + 6 płatków (po jednym kolorze na oś).
// Mapowanie indeksu kolorów na osie: [day, emotions, energy, body, delight, meaning].

export type Palette = {
  name: string;
  bg: string;          // tło (kremowe — wariant)
  aura: string;        // złota aura "coś dobrego"
  shadow: string;      // ciemny ślad "coś trudnego"
  pestil: string;      // środek
  petals: [string, string, string, string, string, string];
};

export const PALETTES: readonly Palette[] = [
  {
    // Inspirowana referencją użytkownika: korale, róż, pomarańcz + chłodny turkus/lila.
    name: 'Akwarela',
    bg: '#F5EFE4',
    aura: '#E8B85C',
    shadow: '#3A1F1A',
    pestil: '#7A2E3B',
    petals: ['#E8523C', '#F08A6B', '#D63D5A', '#F2B07A', '#7BA9A3', '#B58AC0'],
  },
  {
    name: 'Świt',
    bg: '#F5EFE4',
    aura: '#E8B85C',
    shadow: '#2C1F14',
    pestil: '#8B5A2B',
    petals: ['#C97B5C', '#D9A05B', '#A35D43', '#E8B85C', '#7A3F2E', '#B26A4B'],
  },
  {
    name: 'Mgła',
    bg: '#F1ECE2',
    aura: '#D4A85E',
    shadow: '#1F2A2A',
    pestil: '#3A4A48',
    petals: ['#6B8A87', '#9BB5A8', '#4F6A66', '#A8BFB6', '#3D5450', '#7DA197'],
  },
  {
    name: 'Glina',
    bg: '#EFE5D3',
    aura: '#C99750',
    shadow: '#2A1A0F',
    pestil: '#6B3F22',
    petals: ['#A86A3D', '#CC8A57', '#7E4623', '#D9A269', '#5A2F18', '#B57A48'],
  },
  {
    name: 'Bez',
    bg: '#F3EDDF',
    aura: '#D4B26A',
    shadow: '#231832',
    pestil: '#4A3552',
    petals: ['#8A6E92', '#B79CC0', '#5F4A6A', '#C6AEC9', '#473256', '#9D7FA8'],
  },
  {
    name: 'Łąka',
    bg: '#F2EEDF',
    aura: '#CFA94A',
    shadow: '#1F2410',
    pestil: '#4B5A29',
    petals: ['#8AA259', '#B5C078', '#5E7635', '#C7D38A', '#3F4E1F', '#9CAE63'],
  },
];
