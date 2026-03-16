declare module 'leader-line-new' {
  interface LeaderLineOptions {
    color?: string;
    size?: number;
    dash?: boolean | { animation?: boolean };
    path?: 'straight' | 'arc' | 'fluid' | 'magnet' | 'grid';
    startPlug?: string;
    endPlug?: string;
    zIndex?: number;
  }

  class LeaderLine {
    constructor(start: Element, end: Element, options?: LeaderLineOptions);
    remove(): void;
    position(): void;
  }

  export = LeaderLine;
}
