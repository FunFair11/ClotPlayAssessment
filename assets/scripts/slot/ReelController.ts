import { _decorator, Color, Component, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { CELL_GAP, GameData, MAX_VISIBLE_SYMBOLS, MIN_VISIBLE_SYMBOLS, REEL_COUNT, REEL_HEIGHT, REEL_SYMBOLS, SYMBOL_CELL_HEIGHTS, SYMBOL_SIZE_COUNT, SYMBOL_WIDTH, SpinResult, SymbolId } from './GameData';
import { AudioController, SFXType } from './AudioController';

const { ccclass, property } = _decorator;
const HALF_REEL_HEIGHT = REEL_HEIGHT / 2;
const NORMAL_COLOR = new Color(255, 255, 255, 255);
const DIM_COLOR = new Color(45, 45, 45, 255);
const OVERSHOOT_TIME = 0.08;
const BOUNCE_BACK_TIME = 0.24;

interface SymbolCell {
    node: Node;
    sprite: Sprite;
    transform: UITransform;
    y: number;
    size: number;
}

interface ReelMotion {
    targetSymbolCount: number;
    landingStart: number;        // time before the reel starts to land result
    active: SymbolCell[];
    available: SymbolCell[];
    nextResultRowIndex: number;
    finalTop: SymbolCell | null;
    landing: boolean;
    bouncing: boolean;
    bounceElapsed: number;
    bounceDistance: number;
    bounceStartY: number[];
    stopped: boolean;
}

@ccclass('ReelController')
export class ReelController extends Component {
    @property([Node])
    columns: Node[] = [];

    @property([SpriteFrame])
    symbolFrames: SpriteFrame[] = [];

    @property({ tooltip: '卷轴每秒移动的距离。' })
    spinSpeed = 650;

    @property({ tooltip: '第一个卷轴开始停止前的转动秒数。' })
    stopTime = 1.4;

    @property({ tooltip: '相邻卷轴开始停止的时间间隔（秒）。' })
    stopInterval = 0.3;

    private cells: SymbolCell[][] = [];
    private reelMotions: ReelMotion[] = [];
    private isSpinning = false;
    private elapsed = 0;
    private isFastStop = false;
    onSpinComplete: ((result: SpinResult) => void) | null = null;
    onReelLanded: ((reelIndex: number, height: number) => void) | null = null;

    onLoad(): void {
        this.cells = this.columns.map(column => column.children.map(node => {
            const sprite = node.getComponent(Sprite);
            const transform = node.getComponent(UITransform);
            if (!sprite || !transform) {
                throw new Error(`Symbol node ${node.name} is incomplete.`);
            }

            return { node, sprite, transform, y: node.position.y, size: 0 };
        }));

        this.cells.forEach((cells, reelIndex) => {
            const visibleCells = cells.filter(cell => cell.node.active);
            const initialSymbols = visibleCells.map(cell => this.symbolFromFrame(cell.sprite.spriteFrame));
            this.renderReel(reelIndex, initialSymbols);
        });
    }

    update(deltaTime: number): void {
        if (!this.isSpinning) return;

        this.elapsed += deltaTime;
        this.updateReels(deltaTime);
    }

    private updateReels(deltaTime: number): void {
        for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex++) {
            const reelMotion = this.reelMotions[reelIndex];
            if (reelMotion.stopped) continue;
            if (reelMotion.bouncing) {
                this.updateStopBounce(reelIndex, deltaTime);
                continue;
            }

            if (reelMotion.targetSymbolCount > 0 && this.elapsed >= reelMotion.landingStart) {
                reelMotion.landing = true;
            }
            this.updateMoveReel(reelIndex, Math.min(deltaTime * this.spinSpeed, REEL_HEIGHT));
        }
    }

    private updateStopBounce(reelIndex: number, deltaTime: number): void {
        const reelMotion = this.reelMotions[reelIndex];
        reelMotion.bounceElapsed += deltaTime;

        let offset: number;
        if (reelMotion.bounceElapsed < OVERSHOOT_TIME) {
            // 第一段：稍微向下冲过停止位置。
            const progress = reelMotion.bounceElapsed / OVERSHOOT_TIME;
            offset = -reelMotion.bounceDistance * progress * progress * (3 - 2 * progress);
        } else {
            // 第二段：逐渐弹回原位，幅度随着时间减小。
            const progress = Math.min(1,
                (reelMotion.bounceElapsed - OVERSHOOT_TIME) / BOUNCE_BACK_TIME,
            );
            offset = -reelMotion.bounceDistance * (1 - progress) ** 2
                * Math.cos(progress * Math.PI * 1.5);
        }

        reelMotion.active.slice(0, reelMotion.targetSymbolCount).forEach((cell, row) => {
            cell.y = reelMotion.bounceStartY[row] + offset;
            cell.node.setPosition(0, cell.y);
        });

        if (reelMotion.bounceElapsed >= OVERSHOOT_TIME + BOUNCE_BACK_TIME) {
            this.stopReel(reelIndex);
        }
    }

    private updateMoveReel(reelIndex: number, distance: number): void {
        const reelMotion = this.reelMotions[reelIndex];

        // calculate remaining distance if it's final symbol
        if (reelMotion.finalTop && reelMotion.nextResultRowIndex < 0) {
            const remaining = reelMotion.finalTop.y + reelMotion.finalTop.size / 2 - HALF_REEL_HEIGHT;
            distance = Math.min(distance, Math.max(0, remaining));
        }

        reelMotion.active.forEach(cell => {
            cell.y -= distance;
            cell.node.setPosition(0, cell.y);
        });

        this.recycleBottomCells(reelMotion);
        this.fillTopCells(reelIndex, reelMotion);

        if (reelMotion.finalTop && reelMotion.nextResultRowIndex < 0
            && reelMotion.finalTop.y + reelMotion.finalTop.size / 2 <= HALF_REEL_HEIGHT + 1e-6) {
            this.startStopBounce(reelIndex);
        }
    }

    startSpin(): void {
        if (this.isSpinning) {
            throw new Error('Reel animation is already running.');
        }
        if (!Number.isFinite(this.spinSpeed) || this.spinSpeed <= 0
            || !Number.isFinite(this.stopTime) || this.stopTime < 0
            || !Number.isFinite(this.stopInterval) || this.stopInterval < 0) {
            throw new Error('Spin speed must be positive; stop times cannot be negative.');
        }

        this.isSpinning = true;
        this.isFastStop = false;
        this.elapsed = 0;

        this.reelMotions = this.cells.map((cells, reelIndex) => {
            const currentSymbolCount = cells.filter(cell => cell.node.active).length;
            const oldSize = this.symbolHeight(currentSymbolCount);
            const buffer = cells[currentSymbolCount];

            cells.forEach(cell => {
                cell.sprite.color = NORMAL_COLOR;
            });
            cells.slice(0, currentSymbolCount).forEach(cell => {
                cell.y = cell.node.position.y;
                cell.size = oldSize;
            });
            buffer.node.active = true;
            this.setCellSymbol(buffer, this.samplePreviewSymbol(reelIndex), currentSymbolCount);
            buffer.size = oldSize;
            buffer.y = HALF_REEL_HEIGHT + oldSize / 2;
            this.sizeCell(buffer);
            buffer.node.setPosition(0, buffer.y);

            return {
                targetSymbolCount: 0,
                landingStart: Math.max(0, this.stopTime + reelIndex * this.stopInterval
                    - REEL_HEIGHT / this.spinSpeed),
                active: [buffer, ...cells.slice(0, currentSymbolCount)],
                available: cells.slice(currentSymbolCount + 1),
                nextResultRowIndex: -1, finalTop: null,
                landing: false, bouncing: false, bounceElapsed: 0,
                bounceDistance: 0, bounceStartY: [], stopped: false,
            };
        });
    }

    onResultReady(): void {
        if (!this.isSpinning) return;
        const result = GameData.currentResult!;

        this.reelMotions.forEach((reelMotion, reelIndex) => {
            reelMotion.targetSymbolCount = result.slotResult[reelIndex].length;
            reelMotion.nextResultRowIndex = reelMotion.targetSymbolCount - 1;
        });
    }

    fastStop(): void {
        const result = GameData.currentResult;
        if (!result || this.reelMotions.some(reelMotion => reelMotion.targetSymbolCount === 0)) return;

        this.isFastStop = true;
        AudioController.instance.playSFX(SFXType.FAST_STOP);
        this.reelMotions.forEach((reelMotion, reelIndex) => {
            if (reelMotion.stopped || reelMotion.bouncing) return;
            const reel = result.slotResult[reelIndex];
            this.renderReel(reelIndex, reel);
            reelMotion.active = this.cells[reelIndex].slice(0, reel.length);
            this.startStopBounce(reelIndex);
        });
    }

    private recycleBottomCells(reelMotion: ReelMotion): void {
        while (reelMotion.active.length > 0) {
            const bottom = reelMotion.active[reelMotion.active.length - 1];
            if (bottom.y + bottom.size / 2 > -HALF_REEL_HEIGHT + 1e-6) break;
            reelMotion.active.pop();
            bottom.node.active = false;
            reelMotion.available.push(bottom);
        }
    }

    private fillTopCells(reelIndex: number, reelMotion: ReelMotion): void {
        while (reelMotion.active[0].y + reelMotion.active[0].size / 2 < HALF_REEL_HEIGHT - 1e-6) {
            if (reelMotion.nextResultRowIndex < 0 && reelMotion.finalTop) break;
            const cell = reelMotion.available.pop();
            if (!cell) throw new Error(`Reel ${reelIndex + 1} ran out of symbol cells.`);
            const top = reelMotion.active[0];
            const visibleHeight = reelMotion.landing
                ? reelMotion.targetSymbolCount
                : MIN_VISIBLE_SYMBOLS + Math.floor(Math.random() * SYMBOL_SIZE_COUNT);
            cell.size = this.symbolHeight(visibleHeight);
            cell.y = top.y + top.size / 2 + cell.size / 2;
            this.sizeCell(cell);
            cell.node.setPosition(0, cell.y);
            cell.node.active = true;

            if (reelMotion.landing) {
                const symbol = GameData.currentResult!.slotResult[reelIndex][reelMotion.nextResultRowIndex--];
                this.setCellSymbol(cell, symbol, reelMotion.targetSymbolCount);
                reelMotion.finalTop = cell;
            } else {
                this.setCellSymbol(cell, this.samplePreviewSymbol(reelIndex), visibleHeight);
            }
            reelMotion.active.unshift(cell);
        }
    }

    private startStopBounce(reelIndex: number): void {
        const reelMotion = this.reelMotions[reelIndex];
        const visibleCells = reelMotion.active.slice(0, reelMotion.targetSymbolCount);

        this.onReelLanded?.(reelIndex, reelMotion.targetSymbolCount);
        reelMotion.bouncing = true;
        reelMotion.bounceElapsed = 0;
        reelMotion.bounceDistance = Math.min(18, visibleCells[0].size * 0.22);
        reelMotion.bounceStartY = visibleCells.map(cell => cell.y);
        if(!this.isFastStop)
            AudioController.instance.playSFX(SFXType.REEL_STOP);
    }

    private sizeCell(cell: SymbolCell): void {
        const contentHeight = cell.size - CELL_GAP;
        cell.transform.setContentSize(SYMBOL_WIDTH, contentHeight);
    }

    private symbolHeight(visibleHeight: number): number {
        return SYMBOL_CELL_HEIGHTS[MAX_VISIBLE_SYMBOLS - visibleHeight];
    }

    // pick a random symbol for spinning
    private samplePreviewSymbol(reelIndex: number): SymbolId {
        const reel = REEL_SYMBOLS[reelIndex];
        return reel[Math.floor(Math.random() * reel.length)];
    }

    private setCellSymbol(cell: SymbolCell, symbol: SymbolId, visibleHeight: number): void {
        const sizeIndex = MAX_VISIBLE_SYMBOLS - visibleHeight;
        cell.sprite.spriteFrame = this.symbolFrames[symbol * SYMBOL_SIZE_COUNT + sizeIndex];
    }

    // simply use to get symbol id from the scene setup
    private symbolFromFrame(frame: SpriteFrame | null): SymbolId {
        const frameIndex = frame ? this.symbolFrames.indexOf(frame) : -1;
        if (frameIndex < 0) throw new Error('An initial symbol is missing from symbolFrames.');
        return Math.floor(frameIndex / SYMBOL_SIZE_COUNT) as SymbolId;
    }

    private stopReel(reelIndex: number): void {
        const reelMotion = this.reelMotions[reelIndex];
        const visible = reelMotion.active.slice(0, reelMotion.targetSymbolCount);
        const hidden = this.cells[reelIndex].filter(cell => visible.indexOf(cell) < 0);
        hidden.forEach(cell => { cell.node.active = false; });
        this.cells[reelIndex] = [...visible, ...hidden];
        reelMotion.stopped = true;
        this.renderReel(reelIndex, GameData.currentResult!.slotResult[reelIndex]);

        if (this.reelMotions.every(reelMotion => reelMotion.stopped)) {
            this.finishAnimation(GameData.currentResult!);
        }
    }

    /** 初始显示、快速停止或单轴停下时，按结果排列符号。 */
    private renderReel(reelIndex: number, reel: readonly SymbolId[]): void {
        const cellHeight = this.symbolHeight(reel.length);

        this.cells[reelIndex].forEach((cell, row) => {
            cell.node.active = row < reel.length;
            if (!cell.node.active) return;

            cell.y = HALF_REEL_HEIGHT - (row + 0.5) * cellHeight;
            cell.size = cellHeight;
            cell.node.setPosition(0, cell.y);
            this.sizeCell(cell);
            this.setCellSymbol(cell, reel[row], reel.length);
            cell.sprite.color = NORMAL_COLOR;
        });
    }

    // dim non winning symbol and callback maincontroller
    private finishAnimation(result: SpinResult): void {
        if (result.totalPayAmount > 0 || result.scatterCount >= 3) {
            this.dimNonWinningSymbols(result);
            AudioController.instance.playSFX(SFXType.SYMBOL_WIN);
        }

        this.isSpinning = false;
        this.onSpinComplete?.(result);
    }

    private dimNonWinningSymbols(result: SpinResult): void {
        result.winPos.forEach((winningRows, reelIndex) => {
            const visibleCells = this.cells[reelIndex].slice(0, result.slotResult[reelIndex].length);
            visibleCells.forEach((cell, row) => {
                if (winningRows.indexOf(row) < 0) cell.sprite.color = DIM_COLOR;
            });
        });
    }
}
