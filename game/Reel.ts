import { _decorator, Component, Node, Vec3, tween, SpriteFrame } from 'cc';
import { SymbolView } from './SymbolView';
const { ccclass, property } = _decorator;

@ccclass('Reel')
export class Reel extends Component {
  @property({ tooltip: '每格高度（需與三格之間的 Y 間距一致）' })
  symbolHeight: number = 160;

  @property({ tooltip: '每一步往下滾的時間（秒）' })
  stepDuration: number = 0.06;

  private _cells: Node[] = [];
  private _stepsLeft = 0;
  private _isSpinning = false;
  private _onStop?: () => void;

  private _feed: SpriteFrame[] = [];
  private _resultTop?: SpriteFrame;
  private _resultMid?: SpriteFrame;
  private _resultBot?: SpriteFrame;

  onLoad() {
    const top = this.node.getChildByName('CellTop');
    const mid = this.node.getChildByName('CellMid');
    const bot = this.node.getChildByName('CellBot');
    this._cells = top && mid && bot ? [top, mid, bot] : [...this.node.children];
  }

  public getVisibleNodeAtRow(rowIndex: 0 | 1 | 2): Node {
    const sorted = [...this._cells].sort((a, b) => b.position.y - a.position.y);
    return sorted[rowIndex];
  }

  spin(
    totalSteps: number,
    feed: SpriteFrame[],
    resultTopMidBot: [SpriteFrame, SpriteFrame, SpriteFrame],
    onStop?: () => void
  ) {
    if (this._isSpinning) return;
    this._isSpinning = true;
    this._stepsLeft = Math.max(3, totalSteps);
    this._feed = feed.slice();
    [this._resultTop, this._resultMid, this._resultBot] = resultTopMidBot;
    this._onStop = onStop;

    this._step();
  }

  quickStop() {
    if (!this._isSpinning) return;
    const r = Math.min(this._stepsLeft, 3);
    this._stepsLeft = r;
    if (r <= 0 || !this._resultTop || !this._resultMid || !this._resultBot) return;
    const seq: SpriteFrame[] = [this._resultTop, this._resultMid, this._resultBot];
    this._feed = seq.slice(3 - r);
  }

  get isSpinning() { return this._isSpinning; }

  private _step() {
    if (this._stepsLeft <= 0) {
      this._isSpinning = false;
      const bounce = 10;
      const p0 = this.node.position.clone();
      tween(this.node)
        .to(0.05, { position: new Vec3(p0.x, p0.y - bounce, p0.z) })
        .to(0.05, { position: new Vec3(p0.x, p0.y, p0.z) })
        .call(() => this._onStop && this._onStop())
        .start();
      return;
    }

    this._stepsLeft--;

    let bottomIdx = 0;
    for (let i = 1; i < this._cells.length; i++) {
      if (this._cells[i].position.y < this._cells[bottomIdx].position.y) bottomIdx = i;
    }
    const bottom = this._cells[bottomIdx];
    const maxY = Math.max(...this._cells.map(c => c.position.y));
    bottom.setPosition(new Vec3(0, maxY + this.symbolHeight, 0));

    const nextFrame = this._feed.length > 0 ? this._feed.shift()! : (this._feed[this._feed.length - 1] ?? null);
    if (nextFrame) bottom.getComponent(SymbolView)?.setSymbol(nextFrame);

    let finished = 0;
    for (const cell of this._cells) {
      const from = cell.position.clone();
      const to = new Vec3(from.x, from.y - this.symbolHeight, from.z);
      tween(cell)
        .to(this.stepDuration, { position: to })
        .call(() => {
          finished++;
          if (finished === this._cells.length) {
            this._step();
          }
        })
        .start();
    }
  }
}
