import { _decorator, Component, Node, AudioSource, AudioClip, director, randomRangeInt } from 'cc';
const { ccclass, property } = _decorator;

export enum BGMType {
    NORMAL,
    FREE,
    BIGWIN,
    FREESPIN_COUNTING,
    FREESPIN_SELECTION,
}

//这里是sfx的名字

export enum SFXType {
    REEL_STOP,
    SYMBOL_WIN,
    SPINNING,
    FAST_STOP,
    SCATTER_WIN,
}

export enum SFXUIType{
}

export enum LoopSFXType {
}

@ccclass('AudioController')
export class AudioController extends Component {
    @property({ tooltip: 'Set true if have slider' })
    volumeSlider: boolean = false;

    private audioSources: AudioSource[] = [];

    @property([AudioClip])
    bgmList: AudioClip[] = [];
    @property([AudioClip])
    sfxList: AudioClip[] = [];
    @property([AudioClip])
    sfxUIList: AudioClip[] = [];
    @property([AudioClip])
    loopSfxList: AudioClip[] = [];

    private gameName: string = 'galaxypirate';

    private bgm_vol_str: string = '_bgm_vol';
    private sfx_vol_str: string = '_sfx_vol';

    private bgm_toggle_str: string = '_bgm_toggle';
    private sfx_toggle_str: string = '_sfx_toggle';

    public bgmVolume: number = 1;
    public sfxVolume: number = 1;

    public bgmToggle: number = 1;
    public sfxToggle: number = 1;

    public static instance: AudioController = null;

    onLoad() {
        if (AudioController.instance === null) {
            AudioController.instance = this;
            director.addPersistRootNode(this.node);
        }
        else 
        {
            this.destroy();
            return;
        }
    }

    public initSetting() {
        const _bgm = localStorage.getItem(this.gameName + this.bgm_vol_str);
        const _sfx = localStorage.getItem(this.gameName + this.sfx_vol_str);

        if (_bgm) {
            let _bgmvol: number = Number(_bgm);
            this.bgmVolume = _bgmvol;
            this.setBGMVolume(_bgmvol);
        }
        else {
            localStorage.setItem(this.gameName + this.bgm_vol_str, '1');
        }

        if (_sfx) {
            let _sfxvol: number = Number(_sfx);
            this.sfxVolume = _sfxvol;
              this.setSFXVolume(_sfxvol);
        }
        else {
            localStorage.setItem(this.gameName + this.sfx_vol_str, '1');
        }

        // const _bgmToggle = localStorage.getItem(this.gameName + this.bgm_toggle_str);
        // const _sfxToggle = localStorage.getItem(this.gameName + this.sfx_toggle_str);

        // if (_bgmToggle) {
        //     let _bgOnOff: number = Number(_bgmToggle);
        //     this.bgmToggle = _bgOnOff > 0 ? 1 : 0;
        //     //  this.setBGMVolume(_bgOnOff);
        // }
        // else {
        //     localStorage.setItem(this.gameName + this.bgm_toggle_str, this.bgmToggle.toString());
        // }

        // if (_sfxToggle) {
        //     let _sfxOnOff: number = Number(_sfxToggle);
        //     this.sfxToggle = _sfxOnOff > 0 ? 1 : 0;
        //     // this.setSFXVolume(_sfxOnOff);
        // }
        // else {
        //     localStorage.setItem(this.gameName + this.sfx_toggle_str, this.sfxToggle.toString());
        // }

        //console.error("vol");
        //console.warn(_bgm);
        //console.warn(_sfx);

        //console.error("on off");
        //console.warn(_bgmToggle);
        //console.warn(_sfxToggle);
    }

    public toggleBGMOnOff() {
        this.bgmToggle = this.bgmToggle > 0 ? 0 : 1;

        if (this.bgmVolume == 0) this.setBGMVolume(1);
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].name.split('_');
            if (name[0] == 'bgm') this.audioSources[index].volume = this.bgmToggle <= 0 ? 0 : this.bgmVolume;
        }
        this.updateLocalCache();
    }

    public toggleSFXOnOff() {
        this.sfxToggle = this.sfxToggle > 0 ? 0 : 1;

        if (this.sfxVolume == 0) this.setSFXVolume(1);
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].name.split('_');
            if (name[0] == 'sfx') this.audioSources[index].volume = this.sfxToggle <= 0 ? 0 : this.sfxVolume;
        }
        this.updateLocalCache();
    }

    public setBGMVolume(_vol: number) {
        this.bgmVolume = _vol;
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].name.split('_');
            if (name[0] == 'bgm') this.audioSources[index].volume = this.bgmVolume;
        }

        this.bgmToggle = this.bgmVolume > 0 ? 1 : 0;
        this.updateLocalCache();
    }

    public setSFXVolume(_vol: number) {
        this.sfxVolume = _vol;
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].name.split('_');
            if (name[0] == 'sfx') this.audioSources[index].volume = this.sfxVolume;
        }

        this.sfxToggle = this.sfxVolume > 0 ? 1 : 0;
        this.updateLocalCache();
    }

    public updateLocalCache() {
        localStorage.setItem(this.gameName + this.bgm_vol_str, this.bgmVolume.toString());
        localStorage.setItem(this.gameName + this.bgm_toggle_str, this.bgmToggle.toString());

        localStorage.setItem(this.gameName + this.sfx_vol_str, this.sfxVolume.toString());
        localStorage.setItem(this.gameName + this.sfx_toggle_str, this.sfxToggle.toString());
    }

    public playBGM(_type: BGMType) {
        let bgmPlayer: AudioSource = this.CheckAvailableAudioSource('bgm');
        bgmPlayer.volume = this.bgmToggle > 0 ? this.bgmVolume : 0;

        if (_type == BGMType.NORMAL) {
            bgmPlayer.clip = this.bgmList[0];
        } else if (_type == BGMType.FREE) {
            bgmPlayer.clip = this.bgmList[1];
        } else if (_type == BGMType.BIGWIN) {
            bgmPlayer.clip = this.bgmList[2];
        } else if (_type == BGMType.FREESPIN_COUNTING) {
            bgmPlayer.clip = this.bgmList[3];
        } else if (_type == BGMType.FREESPIN_SELECTION) {
            bgmPlayer.clip = this.bgmList[4];
        }

        bgmPlayer.loop = true;
        bgmPlayer.play();
    }

    public stopBGM() {
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].name.split('_');
            if (name[0] == 'bgm' && this.audioSources[index].node.active) {
                this.audioSources[index].stop();
                this.audioSources[index].node.active = false;
            }
        }
    }

    public playUISFX(_type: SFXUIType) {
        let sfxPlayer: AudioSource = this.CheckAvailableAudioSource('sfx');
        sfxPlayer.volume = this.sfxToggle > 0 ? this.sfxVolume : 0;

        switch (_type) {

        }

        this.queueSfxList.unshift(sfxPlayer.clip);
        // sfxPlayer.play();
    }

    //这里是sfx的list

    public playSFX(_type: SFXType) {
        let sfxPlayer: AudioSource = this.CheckAvailableAudioSource('sfx');
        sfxPlayer.volume = this.sfxToggle > 0 ? this.sfxVolume : 0;

        switch (_type) {
            case SFXType.REEL_STOP:
                sfxPlayer.clip = this.sfxList[0];
                break;    
            case SFXType.SYMBOL_WIN:
                sfxPlayer.clip = this.sfxList[1];
                break;
            case SFXType.SPINNING:
                sfxPlayer.clip = this.sfxList[2];
                break;   
            case SFXType.FAST_STOP:
                sfxPlayer.clip = this.sfxList[3];
                break;  
            case SFXType.SCATTER_WIN:
                sfxPlayer.clip = this.sfxList[4];
                break;                    
        }
        this.queueSfxList.unshift(sfxPlayer.clip);
        // sfxPlayer.play();
    }

    public stopAllSFX() {
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].node.name.split('_');
            if (name[0] == 'sfx' && this.audioSources[index].node.active) {
                this.audioSources[index].stop();
                this.audioSources[index].node.active = false;
            }
        }
    }

    public playLoopSfx(_type: LoopSFXType) {
        let sfxPlayer: AudioSource = this.CheckAvailableAudioSource('loop');
        sfxPlayer.name = sfxPlayer.name + "_" + _type;
        sfxPlayer.volume = this.sfxToggle > 0 ? this.sfxVolume : 0;

        switch (_type) {

        }

        sfxPlayer.loop = true;
        sfxPlayer.play();
    }

    public stopLoopSfx(_type: LoopSFXType) {
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].node.name.split('_');
            if (name[0] == 'loop' && name[2] == _type.toString() && this.audioSources[index].node.active) {
                this.audioSources[index].stop();
                this.audioSources[index].node.active = false;
            }
        }
    }

    public stopAllLoopSfx() {
        for (let index = 0; index < this.audioSources.length; index++) {
            let name = this.audioSources[index].node.name.split('_');
            if (name[0] == 'loop' && this.audioSources[index].node.active) {
                this.audioSources[index].stop();
                this.audioSources[index].node.active = false;
            }
        }
    }

    private CheckAvailableAudioSource(channel: string) {
        let index = 1;
        for (let i = 0; i < this.audioSources.length; i++) {
            let name = this.audioSources[i].node.name.split('_');
            if (name[0] == channel) {
                if (this.audioSources[i].node.active && !this.audioSources[i].playing) {
                    this.audioSources[i].node.active = false;
                }
            }
        }
        for (let i = 0; i < this.audioSources.length; i++) {
            let name = this.audioSources[i].node.name.split('_');
            if (name[0] == channel) {
                if (this.audioSources[i].node.active) index++;
                if (!this.audioSources[i].node.active) {
                    this.audioSources[i].node.active = true;
                    return this.audioSources[i];
                }
            }
        }

        let a: AudioSource = this.NewAudioSource(channel + '_' + index);
        a.volume = channel == 'bgm' ? this.bgmVolume : this.sfxVolume;
        return a;
    }

    private NewAudioSource(n: string) {
        let g: Node = new Node();
        g.name = n;
        g.setParent(AudioController.instance.node);
        g.addComponent(AudioSource);
        let a: AudioSource = g.getComponent(AudioSource);
        a.playOnAwake = false;
        this.audioSources.push(a);
        return a;
    }

    @property([AudioClip])
    queueSfxList: AudioClip[] = [];
    protected lateUpdate(dt: number): void {
        if(this.queueSfxList.length <= 0)
            return;

        let sfxPlayer: AudioSource = this.CheckAvailableAudioSource('sfx');
        sfxPlayer.volume = this.sfxToggle > 0 ? this.sfxVolume : 0;
        sfxPlayer.clip = this.queueSfxList.pop();
        sfxPlayer.play();
    }
}