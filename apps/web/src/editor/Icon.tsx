import type { IconName } from '../catalog/roles';

type Glyph = IconName | 'brand' | 'blank' | 'example' | 'open' | 'download' | 'connect' | 'reverse' | 'trash' | 'pointer' | 'plus' | 'check' | 'minus' | 'fit';
const paths: Record<Glyph, string> = {
  brand: 'M2 7l5-3 5 3-5 3z M2 7v6l5 3 5-3V7 M7 10v6 M12 14l5-3 5 3-5 3z M12 14v5l5 3 5-3v-5 M17 17v5 M12 7h5v4',
  block: 'M3 7l9-5 9 5-9 5z M3 7v10l9 5 9-5V7 M12 12v10',
  client: 'M3 4h18v13H3z M8 21h8 M12 17v4',
  balance: 'M10 2h4v4h-4z M12 6v5 M5 16v-5h14v5 M2 16h6v5H2z M16 16h6v5h-6z',
  gateway: 'M4 21V4h16v17 M8 21V8h8v13 M2 21h7 M15 21h7',
  server: 'M3 4h18v6H3z M3 14h18v6H3z M6 7h1 M6 17h1 M11 7h6 M11 17h6',
  host: 'M5 5h14v14H5z M9 9h6v6H9z M9 2v3 M15 2v3 M9 19v3 M15 19v3 M2 9h3 M2 15h3 M19 9h3 M19 15h3',
  database: 'M4 6c0-5 16-5 16 0s-16 5-16 0z M4 6v12c0 5 16 5 16 0V6 M4 12c0 5 16 5 16 0',
  cache: 'M14 2L4 14h7l-1 8 10-13h-7z',
  queue: 'M2 7h5v10H2z M10 7h5v10h-5z M18 7h4v10h-4z',
  file: 'M5 2h9l5 5v15H5z M14 2v6h5 M8 12h8 M8 16h8',
  collector: 'M3 3h18l-7 9v6l-4 3v-9z',
  store: 'M3 4h18v5H3z M5 9v11h14V9 M9 13h6',
  metrics: 'M2 18h4l4-12 4 14 3-8h5',
  blank: 'M5 3h10l4 4v14H5z M14 3v5h5 M9 14h6 M12 11v6',
  example: 'M3 3h6v6H3z M15 3h6v6h-6z M15 15h6v6h-6z M9 6h6 M6 9v9h9',
  open: 'M2 18V5h7l2 2h8v3 M3 19l3-9h16l-3 9z',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  connect: 'M2 15h6v6H2z M16 3h6v6h-6z M8 18h4V6h4',
  reverse: 'M3 8h17l-4-4 M21 16H4l4 4',
  trash: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  pointer: 'M4 3l15 9-7 2-3 7z',
  plus: 'M12 5v14 M5 12h14', minus: 'M5 12h14',
  fit: 'M3 9V3h6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',
  check: 'M4 12l5 5L20 6',
};
export default function Icon({ name, size = 18 }: { name: Glyph; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
