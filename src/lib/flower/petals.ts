// Daily Bloom — archetypy płatków jako parametryczne ścieżki SVG.
// 3 archetypy MVP (kropla, owal, łopatka), później docelowo 8.
//
// Konwencja: płatek rysowany od (0,0) "w górę" (ujemne Y),
// szczyt płatka w (0, -length). Szerokość: width.
// Krzywizna 0..1 — jak bardzo bezier wybrzusza się na boki.
// Asymetria 0..0.3 — lekka różnica między lewą a prawą stroną.

export type Archetype = 0 | 1 | 2;

export function petalPath(
  archetype: Archetype,
  length: number,
  width: number,
  curvature: number,
  asymmetry: number,
): string {
  const L = length;
  const w = width;
  const c = curvature;
  const aL = w * (1 + asymmetry);
  const aR = w * (1 - asymmetry);

  switch (archetype) {
    case 0: {
      // Kropla — szeroka u dołu, zwężająca się ku szczytowi.
      const cp1y = -L * 0.25;
      const cp2y = -L * 0.85;
      return [
        `M 0 0`,
        `C ${-aL * c} ${cp1y}, ${-aL * c} ${cp2y}, 0 ${-L}`,
        `C ${aR * c} ${cp2y}, ${aR * c} ${cp1y}, 0 0`,
        `Z`,
      ].join(' ');
    }
    case 1: {
      // Owal — najszerszy w środku, symetrycznie zwężony.
      const cp1y = -L * 0.15;
      const cp2y = -L * 0.85;
      const mw = w * 1.15;
      return [
        `M 0 0`,
        `C ${-aL * c * 0.4} ${cp1y}, ${-mw} ${-L * 0.5}, 0 ${-L}`,
        `C ${mw} ${-L * 0.5}, ${aR * c * 0.4} ${cp1y}, 0 0`,
        `Z`,
      ].join(' ');
    }
    case 2:
    default: {
      // Łopatka — wąska u podstawy, rozszerzająca się ku szczytowi (zaokrąglony top).
      const baseY = -L * 0.3;
      const topW = w * 1.35;
      return [
        `M 0 0`,
        `C ${-aL * 0.3} ${baseY}, ${-topW * c} ${-L * 0.7}, ${-topW * 0.4} ${-L}`,
        `C ${-topW * 0.15} ${-L * 1.05}, ${topW * 0.15} ${-L * 1.05}, ${topW * 0.4} ${-L}`,
        `C ${topW * c} ${-L * 0.7}, ${aR * 0.3} ${baseY}, 0 0`,
        `Z`,
      ].join(' ');
    }
  }
}
