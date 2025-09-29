import { _decorator, Component, Label, Button, tween, UIOpacity } from 'cc';
import { GameController } from '../game/GameController';
import { WinMessageConfig } from '../data/WinMessageConfig';
const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {
  @property({ type: Label, tooltip: '餘額顯示 Label' })
  balanceLabel: Label | null = null;

  @property({ type: Label, tooltip: '押注顯示 Label' })
  betLabel: Label | null = null;

  @property({ type: Label, tooltip: '贏分顯示 Label（單一 Label）' })
  winLabel: Label | null = null;

  @property({ type: Button }) spinButton: Button | null = null;
  @property({ type: Button }) stopButton: Button | null = null;
  @property({ type: Button }) betMinus: Button | null = null;
  @property({ type: Button }) betPlus: Button | null = null;
  @property({ type: Button }) maxBet: Button | null = null;
  @property({ type: Button }) autoBtn: Button | null = null;

  @property({ type: GameController, tooltip: '拖入 GameController 節點' })
  game: GameController | null = null;

  @property({ type: WinMessageConfig, tooltip: '拖入 WinMessageConfig 節點（可選）' })
  messageConfig: WinMessageConfig | null = null;

  @property({ type: Label, tooltip: '吐司訊息 Label（UI/WinToast/Label）' })
  winToastLabel: Label | null = null;

  @property({ tooltip: '吐司顯示秒數' })
  toastSeconds = 1.6;

  @property({ tooltip: 'WinLabel 的前綴文字' })
  winPrefix = '贏分：';

  private _balance = 1000;
  private _bet = 10;
  private _spinning = false;
  private _autoMode = false;

  onLoad() {
    this._refreshStaticTexts();
    this._setWinLabel(0);
    this._setupToastOpacity();
    this._toggleButtons(false);
  }

  public onSpin() {
    if (this._spinning || !this.game) return;
    if (this._balance < this._bet) { this._showToast('餘額不足'); return; }

    this._spinning = true;
    this._balance -= this._bet;
    this._refreshStaticTexts();
    this._setWinLabel(0);
    this._toggleButtons(true);

    this.game.spin(
      this._bet,
      () => {},
      (win, detail) => {
        if (win > 0) {
          this._balance += win;
          this._showWinMessage(detail?.symbol ?? -1, detail?.count ?? 0, win);
        } else {
          this._showToast('未中獎');
        }
        this._setWinLabel(win);

        this._spinning = false;
        this._toggleButtons(false);
        this._refreshStaticTexts();

        if (this._autoMode) {
          setTimeout(() => this.onSpin(), 150);
        }
      }
    );
  }

  public onStop() {
    if (this._spinning) this.game?.quickStop();
  }

  public onBetMinus() {
    if (this._spinning) return;
    this._bet = Math.max(1, this._bet - 1);
    this._refreshStaticTexts();
  }

  public onBetPlus() {
    if (this._spinning) return;
    this._bet += 1;
    this._refreshStaticTexts();
  }

  public onMaxBet() {
    if (this._spinning) return;
    this._bet = 50;
    this._refreshStaticTexts();
  }

  public onAuto() {
    this._autoMode = !this._autoMode;
    this._showToast(this._autoMode ? '自動開始' : '自動停止');
    if (this._autoMode && !this._spinning) this.onSpin();
  }

  private _refreshStaticTexts() {
    if (this.balanceLabel) this.balanceLabel.string = `餘額：${this._balance}`;
    if (this.betLabel) this.betLabel.string = `押注：${this._bet}`;
  }

  private _setWinLabel(value: number) {
    if (this.winLabel) this.winLabel.string = `${this.winPrefix}${value}`;
  }

  private _toggleButtons(spinning: boolean) {
    if (this.spinButton) this.spinButton.interactable = !spinning;
    if (this.stopButton) this.stopButton.interactable = spinning;
    if (this.betMinus) this.betMinus.interactable = !spinning;
    if (this.betPlus) this.betPlus.interactable = !spinning;
    if (this.maxBet) this.maxBet.interactable = !spinning;
    if (this.autoBtn) this.autoBtn.interactable = true;
  }

  private _setupToastOpacity() {
    if (!this.winToastLabel) return;
    const node = this.winToastLabel.node;
    let uiop = node.getComponent(UIOpacity);
    if (!uiop) uiop = node.addComponent(UIOpacity);
    uiop.opacity = 0;
  }

  private _showWinMessage(symbolId: number, count: number, payout: number) {
    if (this.messageConfig && symbolId >= 0 && count >= 3) {
      const msg = this.messageConfig.getMessage(symbolId, count, payout);
      this._showToast(msg);
    } else {
      this._showToast(`${this.winPrefix}${payout}`);
    }
  }

  private _showToast(text: string) {
    if (!this.winToastLabel) return;
    this.winToastLabel.string = text;

    const node = this.winToastLabel.node;
    let uiop = node.getComponent(UIOpacity);
    if (!uiop) uiop = node.addComponent(UIOpacity);
    uiop.opacity = 0;

    tween(uiop)
      .to(0.12, { opacity: 255 })
      .delay(this.toastSeconds)
      .to(0.18, { opacity: 0 })
      .start();
  }
}
  