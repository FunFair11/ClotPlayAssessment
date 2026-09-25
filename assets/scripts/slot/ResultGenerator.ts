import { MAX_VISIBLE_SYMBOLS, MIN_VISIBLE_SYMBOLS, PAYING_SYMBOLS, PAYTABLE, REEL_COUNT, REEL_SYMBOLS, SpinResult, SymbolId } from './GameData';

/** Generates a result, evaluates it, then sends it to the caller. */
export class ResultGenerator {
    constructor(
        private readonly random: () => number = Math.random,
        private readonly reelSymbols: readonly (readonly SymbolId[])[] = REEL_SYMBOLS,
    ) {
        if (reelSymbols.length !== REEL_COUNT || reelSymbols.some(reel => reel.length < MAX_VISIBLE_SYMBOLS)) {
            throw new Error(`Provide ${REEL_COUNT} reel arrays with at least ${MAX_VISIBLE_SYMBOLS} entries each.`);
        }
        if (reelSymbols.some(reel => reel.some(symbol =>
            !Number.isInteger(symbol) || symbol < SymbolId.Wild || symbol > SymbolId.Ten))) {
            throw new Error('Reel arrays contain an unknown symbol ID.');
        }
    }

    generate(bet: number, onResult: (result: SpinResult) => void): void {
        const heights = this.createReelHeights();
        const reels = heights.map((height, reelIndex) => {
            const available = [...this.reelSymbols[reelIndex]];
            const symbols: SymbolId[] = [];

            for (let row = 0; row < height; row++) {
                const index = Math.floor(this.random() * available.length);
                symbols.push(available[index]);
                available.splice(index, 1);
            }

            return symbols;
        });

        onResult(evaluateResult(reels, bet));
    }

    private createReelHeights(): number[] {
        const heights: number[] = [];
        const possibleHeights = MAX_VISIBLE_SYMBOLS - MIN_VISIBLE_SYMBOLS + 1;

        for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex++) {
            const height = MIN_VISIBLE_SYMBOLS + Math.floor(this.random() * possibleHeights);
            heights.push(height);
        }

        return heights;
    }
}

/** Public so a fixed or server-provided result can use the same payout rules. */
export function evaluateResult(slotResult: readonly (readonly SymbolId[])[], bet = 1): SpinResult {
    if (!Number.isFinite(bet) || bet <= 0) {
        throw new Error('Bet must be a positive number.');
    }

    if (slotResult.length !== REEL_COUNT) {
        throw new Error(`Expected ${REEL_COUNT} reels.`);
    }

    for (const reel of slotResult) {
        if (reel.length < MIN_VISIBLE_SYMBOLS || reel.length > MAX_VISIBLE_SYMBOLS) {
            throw new Error(`Each reel must have ${MIN_VISIBLE_SYMBOLS} to ${MAX_VISIBLE_SYMBOLS} symbols.`);
        }
        for (const symbol of reel) {
            if (!Number.isInteger(symbol) || symbol < SymbolId.Wild || symbol > SymbolId.Ten) {
                throw new Error(`Unknown symbol ID: ${symbol}.`);
            }
        }
    }

    const winPositions = Array.from({ length: REEL_COUNT }, () => new Set<number>());
    const scatterPositions = slotResult.map(reel => {
        const positions: number[] = [];
        reel.forEach((symbol, row) => {
            if (symbol === SymbolId.Scatter) positions.push(row);
        });
        return positions;
    });
    const scatterCount = scatterPositions.reduce((total, positions) => total + positions.length, 0);
    let totalPay = 0;

    for (const symbol of PAYING_SYMBOLS) {
        const matches: number[][] = [];
        const naturalCounts: number[] = [];
        let ways = 1;
        let wildOnlyWays = 1;

        for (const reel of slotResult) {
            const positions: number[] = [];
            let naturalCount = 0;
            let wildCount = 0;

            reel.forEach((reelSymbol, row) => {
                if (reelSymbol === symbol) {
                    positions.push(row);
                    naturalCount++;
                } else if (reelSymbol === SymbolId.Wild) {
                    positions.push(row);
                    wildCount++;
                }
            });

            if (positions.length === 0) break;
            matches.push(positions);
            naturalCounts.push(naturalCount);
            ways *= positions.length;
            wildOnlyWays *= wildCount;
        }

        if (matches.length < 3) continue;

        // Wild has no paytable. Exclude physical ways made only of Wilds.
        const payingWays = ways - wildOnlyWays;
        if (payingWays === 0) continue;

        totalPay += payingWays * PAYTABLE[symbol][matches.length - 3] * bet;

        matches.forEach((positions, reelIndex) => {
            const naturalOnAnotherReel = naturalCounts.some((count, index) =>
                index !== reelIndex && count > 0,
            );

            for (const row of positions) {
                if (slotResult[reelIndex][row] === symbol || naturalOnAnotherReel) {
                    winPositions[reelIndex].add(row);
                }
            }
        });
    }

    // Scatter can appear on any reel or row; three or more award a free game.
    if (scatterCount >= 3) {
        scatterPositions.forEach((positions, reelIndex) => {
            positions.forEach(row => winPositions[reelIndex].add(row));
        });
    }

    return {
        slotResult: slotResult.map(reel => [...reel]),
        winPos: winPositions.map(positions => Array.from(positions).sort((a, b) => a - b)),
        totalPayAmount: Math.round((totalPay + Number.EPSILON) * 100) / 100,
        scatterCount,
    };
}
