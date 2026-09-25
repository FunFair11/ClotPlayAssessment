import { _decorator, Button, Component, Label } from 'cc';
import { ReelController } from './ReelController';
import { GameData, REEL_COUNT, SpinResult } from './GameData';
import { ResultGenerator } from './ResultGenerator';
import { AudioController, SFXType } from './AudioController';

const { ccclass, property } = _decorator;
const BET_PER_SPIN = 1;

enum GameState {
    Idle = 'Idle',
    Spinning = 'Spinning',
    Result = 'Result',
}

const ALLOWED_TRANSITIONS: Record<GameState, readonly GameState[]> = {
    [GameState.Idle]: [GameState.Spinning],
    [GameState.Spinning]: [GameState.Result],
    [GameState.Result]: [GameState.Idle],
};

@ccclass('MainController')
export class MainController extends Component {
    @property(ReelController)
    reelController: ReelController | null = null;

    @property(Button)
    spinButton: Button | null = null;

    @property(Label)
    waysLabel: Label | null = null;

    @property(Label)
    payLabel: Label | null = null;

    @property(Label)
    freeGameLabel: Label | null = null;

    private readonly resultGenerator = new ResultGenerator();
    private state = GameState.Idle;
    private stoppedReelHeights: (number | null)[] = [];
    private spinButtonLabel: Label | null = null;

    onLoad(): void {
        if (!this.reelController || !this.spinButton || !this.waysLabel
            || !this.payLabel || !this.freeGameLabel) {
            throw new Error('MainController scene references are incomplete.');
        }

        this.spinButtonLabel = this.spinButton.node.getComponentInChildren(Label);
        if (!this.spinButtonLabel) throw new Error('Spin button text is missing.');

        this.freeGameLabel.node.active = false;
    }

    onEnable(): void {
        this.spinButton?.node.on(Button.EventType.CLICK, this.handleSpinButton, this);
        if (this.reelController) {
            this.reelController.onSpinComplete = result => this.showResult(result);
            this.reelController.onReelLanded = (reelIndex, height) =>
                this.updatePossibleWays(reelIndex, height);
        }
    }

    onDisable(): void {
        this.spinButton?.node.off(Button.EventType.CLICK, this.handleSpinButton, this);
        if (this.reelController) {
            this.reelController.onSpinComplete = null;
            this.reelController.onReelLanded = null;
        }
    }

    private handleSpinButton(): void {
        if (this.state === GameState.Spinning) {
            this.reelController!.fastStop();
        } else if (this.state === GameState.Idle) {
            this.startSpin();
        }
    }

    private startSpin(): void {
        if (this.state !== GameState.Idle) return;

        GameData.currentResult = null;
        this.stoppedReelHeights = Array(REEL_COUNT).fill(null);
        this.waysLabel!.string = '-';
        this.changeState(GameState.Spinning);
        this.payLabel!.string = 'SPINNING...';
        this.freeGameLabel!.node.active = false;
        this.reelController!.startSpin();
        this.spinButtonLabel!.string = 'STOP';
        AudioController.instance.playSFX(SFXType.SPINNING);
        this.scheduleOnce(this.requestSpinResult, 0);
    }

    private requestSpinResult(): void {
        this.resultGenerator.generate(BET_PER_SPIN, result => this.receiveSpinResult(result));
    }

    private receiveSpinResult(result: SpinResult): void {
        if (this.state !== GameState.Spinning) return;

        GameData.currentResult = result;
        this.reelController!.onResultReady();
    }

    private updatePossibleWays(reelIndex: number, height: number): void {
        this.stoppedReelHeights[reelIndex] = height;
        this.refreshPossibleWays();
    }

    private refreshPossibleWays(): void {
        let ways = 1;
        let hasStoppedReel = false;

        for (const height of this.stoppedReelHeights) {
            if (height === null) continue;

            ways *= height;
            hasStoppedReel = true;
        }

        if (!hasStoppedReel) {
            this.waysLabel!.string = '-';
            return;
        }

        this.waysLabel!.string = `${ways.toLocaleString('en-US')} WAYS`;
    }

    private showResult(result: SpinResult): void {
        if (this.state !== GameState.Spinning) return;

        this.refreshPossibleWays();
        this.payLabel!.string = `WIN  ${result.totalPayAmount.toFixed(2)}`;
        this.freeGameLabel!.string = `FREE GAME WON!\n${result.scatterCount} Scatters`;
        if(result.scatterCount >= 3)
            AudioController.instance.playSFX(SFXType.SCATTER_WIN);
        this.freeGameLabel!.node.active = result.scatterCount >= 3;
        this.spinButtonLabel!.string = 'SPIN';
        this.spinButton!.interactable = false;
        this.changeState(GameState.Result);
        this.scheduleOnce(this.finishResult, 0);
    }

    private finishResult(): void {
        this.changeState(GameState.Idle);
        this.spinButton!.interactable = true;
    }

    private changeState(nextState: GameState): void {
        if (!ALLOWED_TRANSITIONS[this.state].some(state => state === nextState)) {
            throw new Error(`Invalid game state transition: ${this.state} -> ${nextState}.`);
        }

        this.state = nextState;
    }
}
