export const REEL_COUNT = 6;
export const MIN_VISIBLE_SYMBOLS = 2;
export const MAX_VISIBLE_SYMBOLS = 7;
export const REEL_HEIGHT = 482;
export const SYMBOL_WIDTH = 128;
export const CELL_GAP = 12;
export const SYMBOL_CELL_HEIGHTS = [
    68.85714285714286,
    80.33333333333333,
    96.4,
    120.5,
    160.66666666666666,
    241,
] as const;
export const SYMBOL_SIZE_COUNT = SYMBOL_CELL_HEIGHTS.length;

// The numeric IDs are part of the result format. Keep this order stable.
export enum SymbolId {
    Wild = 0,
    Scatter = 1,
    Dog1 = 2,
    Dog2 = 3,
    Dog3 = 4,
    Dog4 = 5,
    Collar = 6,
    Bone = 7,
    A = 8,
    K = 9,
    Q = 10,
    J = 11,
    Ten = 12,
}

export interface SpinResult {
    slotResult: SymbolId[][];  // [reel][row], top to bottom
    winPos: number[][];        // [reel] contains winning row indexes
    totalPayAmount: number;
    scatterCount: number;
}

export const GameData: { currentResult: SpinResult | null } = {
    currentResult: null,
};

export const PAYING_SYMBOLS = [
    SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog4,
    SymbolId.Collar, SymbolId.Bone, SymbolId.A, SymbolId.K,
    SymbolId.Q, SymbolId.J, SymbolId.Ten,
] as const;
export type PayingSymbol = typeof PAYING_SYMBOLS[number];

// Rates are for 3, 4, 5, and 6 consecutive reels, in that order.
export const PAYTABLE: Record<PayingSymbol, readonly [number, number, number, number]> = {
    [SymbolId.Dog1]:    [2.25, 6, 9, 22.5],
    [SymbolId.Dog2]:    [1.5, 3, 4.5, 9],
    [SymbolId.Dog3]:    [1.05, 2.25, 3, 6],
    [SymbolId.Dog4]:    [0.6, 1.5, 2.25, 4.5],
    [SymbolId.Collar]:  [0.45, 1.2, 1.5, 4.5],
    [SymbolId.Bone]:    [0.45, 1.2, 1.5, 4.5],
    [SymbolId.A]:       [0.3, 0.6, 0.9, 3],
    [SymbolId.K]:       [0.3, 0.6, 0.9, 3],
    [SymbolId.Q]:       [0.3, 0.6, 0.9, 3],
    [SymbolId.J]:       [0.15, 0.3, 0.6, 1.5],
    [SymbolId.Ten]:     [0.15, 0.3, 0.6, 1.5],
};

/** Duplicate IDs increase their chance and can each be drawn once per spin. */
export const REEL_SYMBOLS: readonly (readonly SymbolId[])[] = [
    // Reel 1
    [   SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
    // Reel 2
    [   SymbolId.Wild, SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
    // Reel 3
    [   SymbolId.Wild, SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
    // Reel 4
    [   SymbolId.Wild, SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
    // Reel 5
    [   SymbolId.Wild, SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
    // Reel 6
    [   SymbolId.Scatter, 
        SymbolId.Dog1, SymbolId.Dog1, SymbolId.Dog2, SymbolId.Dog2, SymbolId.Dog3, SymbolId.Dog3,
        SymbolId.Dog4, SymbolId.Dog4, SymbolId.Collar, SymbolId.Collar, SymbolId.Bone, SymbolId.Bone,
        SymbolId.A, SymbolId.A, SymbolId.A,
        SymbolId.K, SymbolId.K, SymbolId.K,
        SymbolId.Q, SymbolId.Q, SymbolId.Q,
        SymbolId.J, SymbolId.J, SymbolId.J,
        SymbolId.Ten, SymbolId.Ten, SymbolId.Ten],
];
