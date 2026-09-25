import { _decorator, Camera, Component, ResolutionPolicy, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
    @property(Camera)
    gameCamera: Camera | null = null;

    @property
    designWidth = 1280;

    @property
    designHeight = 720;

    private resizeObserver: ResizeObserver | null = null;

    onLoad(): void {
        const canvas = document.getElementById('GameCanvas');
        if (!this.gameCamera || !canvas) {
            throw new Error('ScreenAdapter requires a Camera and GameCanvas.');
        }

        view.resizeWithBrowserSize(true);
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.SHOW_ALL);

        this.resizeObserver = new ResizeObserver(() => {
            this.resizeGame(canvas.clientWidth, canvas.clientHeight);
        });
        this.resizeObserver.observe(canvas);

        this.resizeGame(canvas.clientWidth, canvas.clientHeight);
    }

    onDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    private resizeGame(width: number, height: number): void {
        if (!this.gameCamera || width <= 0 || height <= 0) return;

        const heightForWidth = this.designWidth * height / width;

        // 取较大的高度，让设计区域的宽和高都不会被裁切。
        // Cocos 的 orthoHeight 是视野高度的一半。
        this.gameCamera.orthoHeight = Math.max(this.designHeight, heightForWidth) / 2;
    }
}
