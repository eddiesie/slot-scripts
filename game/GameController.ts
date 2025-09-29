import { _decorator, Component, Node, SpriteFrame, tween, Vec3, director } from 'cc';
import { Reel } from './Reel';
import { evaluateMiddleRowCount, MiddleRowCountWin } from './PayoutEvaluator';
import { PaytableConfig } from '../data/PaytableConfig';
const { ccclass, property } = _decorator;

type WinDetail = { symbol: number; count: number; payout: number } | null;

@ccclass('GameController')
export class GameController extends Component {
  @property(Node) reelsRoot: Node | null = null;
  @property([SpriteFrame]) symbolFrames: SpriteFrame[] = [];

  @property({ tooltip: '每條轉輪的基礎步數（越大轉越久）' })
  baseSteps = 22;

  @property({ tooltip: '向右每條多加的步數（形成依序停下）' })
  stepOffsetPerReel = 5;

  @property({ type: PaytableConfig, tooltip: '拖入 PaytableConfig；若留空會自動掃描場景取得' })
  paytable: PaytableConfig | null = null;

  private _reels: Reel[] = [];
  private _spinning = false;
  private _finishCallback?: (win: number, detail?: WinDetail) => void;

  onLoad() {
    if (!this.reelsRoot) {
      console.warn('[GameController] 請指定 reelsRoot');
      return;
    }
    this._reels = this.reelsRoot.children.map(n => n.getComponent(Reel)!).filter((r): r is Reel => !!r);
    this._ensurePaytable();
  }

  private _ensurePaytable() {
    if (this.paytable) return;
    const scene = director.getScene();
    if (!scene) return;
    const stack: Node[] = [scene];
    while (stack.length) {
      const n = stack.pop()!;
      const c = n.getComponent(PaytableConfig);
      if (c) { this.paytable = c; return; }
      for (const ch of n.children) stack.push(ch);
    }
  }

  public spin(
    betPerLine: number,
    started?: () => void,
    finished?: (win: number, detail?: WinDetail) => void
  ) {
    if (this._spinning) return;
    this._spinning = true;
    this._finishCallback = finished;

    this._ensurePaytable();

    if (!this.paytable) {
      console.warn('[GameController] 未設定 PaytableConfig，將使用等機率與 0 倍率。');
    }

    const gridIds = this._generateWeightedGrid();

    let stopped = 0;
    const totalSymbols = Math.max(1, this.symbolFrames.length);
    const randFrame = () => this.symbolFrames[Math.floor(Math.random() * totalSymbols)] ?? this.symbolFrames[0];

    for (let i = 0; i < this._reels.length; i++) {
      const reel = this._reels[i];
      const steps = this.baseSteps + i * this.stepOffsetPerReel + Math.floor(Math.random() * 3);

      const topId = gridIds[i][0];
      const midId = gridIds[i][1];
      const botId = gridIds[i][2];
      const topF = this.symbolFrames[topId] ?? this.symbolFrames[0];
      const midF = this.symbolFrames[midId] ?? this.symbolFrames[0];
      const botF = this.symbolFrames[botId] ?? this.symbolFrames[0];

      const fill = Math.max(0, steps - 3);
      const feed: SpriteFrame[] = [];
      for (let k = 0; k < fill; k++) feed.push(randFrame());
      feed.push(topF, midF, botF);

      reel.spin(steps, feed, [topF, midF, botF], () => {
        stopped++;
        if (stopped === this._reels.length) {
          const { totalWin, wins } = this.paytable
            ? evaluateMiddleRowCount(gridIds, betPerLine, this.paytable)
            : { totalWin: 0, wins: [] };

          const detail: WinDetail = wins.length ? {
            symbol: wins[0].symbol,
            count:  wins[0].count,
            payout: wins[0].payout,
          } : null;

          this._highlightMiddleRowPositions(wins, () => {
            this._spinning = false;
            this._finishCallback && this._finishCallback(totalWin, detail ?? undefined);
          });
        }
      });
    }

    started && started();
  }

  public quickStop() { for (const r of this._reels) r.quickStop(); }

  private _generateWeightedGrid(): number[][] {
    const REEL_COUNT = 5, ROW_COUNT = 3;
    const grid: number[][] = [];
    const n = this.symbolFrames.length;

    for (let col = 0; col < REEL_COUNT; col++) {
      const c: number[] = [];
      for (let row = 0; row < ROW_COUNT; row++) {
        if (this.paytable) c.push(this.paytable.pickWeighted(n));
        else c.push(Math.floor(Math.random() * n));
      }
      grid.push(c);
    }
    return grid;
  }

  private _highlightMiddleRowPositions(wins: MiddleRowCountWin[], done: () => void) {
    if (!wins || wins.length === 0) { done(); return; }
    const w = wins[0];
    const targets: Node[] = [];
    for (const col of w.positions) {
      const reel = this._reels[col];
      targets.push(reel.getVisibleNodeAtRow(1));
    }
    if (targets.length === 0) { done(); return; }

    let finished = 0;
    for (const n of targets) {
      const s0 = n.scale.clone();
      tween(n)
        .to(0.12, { scale: new Vec3(s0.x * 1.15, s0.y * 1.15, s0.z) })
        .to(0.12, { scale: s0 })
        .to(0.12, { scale: new Vec3(s0.x * 1.15, s0.y * 1.15, s0.z) })
        .to(0.12, { scale: s0 })
        .call(() => { finished++; if (finished === targets.length) done(); })
        .start();
    }
  }
}
