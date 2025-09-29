import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WinMessageConfig')
export class WinMessageConfig extends Component {
  @property({ type: [String] })
  symbolNames: string[] = ['blue','green','orange','purple','red','lollipop'];

  @property({ type: [String] })
  msg3: string[] = [
    '{symbol} x{count}！贏 {payout}',
    '{symbol} x{count}！贏 {payout}',
    '{symbol} x{count}！贏 {payout}',
    '{symbol} x{count}！贏 {payout}',
    '{symbol} x{count}！贏 {payout}',
    '棒棒糖 x{count}！超讚～贏 {payout}',
  ];

  @property({ type: [String] })
  msg4: string[] = [
    '{symbol} 四連！贏 {payout}',
    '{symbol} 四連！贏 {payout}',
    '{symbol} 四連！贏 {payout}',
    '{symbol} 四連！贏 {payout}',
    '{symbol} 四連！贏 {payout}',
    '棒棒糖 四連！贏 {payout}',
  ];

  @property({ type: [String] })
  msg5: string[] = [
    '{symbol} 五連！大贏 {payout}',
    '{symbol} 五連！大贏 {payout}',
    '{symbol} 五連！大贏 {payout}',
    '{symbol} 五連！大贏 {payout}',
    '{symbol} 五連！大贏 {payout}',
    '棒棒糖 五連！JACKPOT！{payout}',
  ];

  private _safe(arr: string[], i: number, fallback: string): string {
    return i >= 0 && i < arr.length && arr[i] ? arr[i] : fallback;
  }

  private _format(tpl: string, data: Record<string, string | number>): string {
    return tpl.replace(/\{(\w+)\}/g, (_m, key: string) => {
      const v = data[key];
      return v !== undefined && v !== null ? String(v) : _m;
    });
  }

  getMessage(symbolId: number, count: number, payout: number): string {
    const name = this._safe(this.symbolNames, symbolId, `symbol#${symbolId}`);
    let tpl: string;
    if (count === 5) tpl = this._safe(this.msg5, symbolId, '{symbol} x{count} 贏 {payout}');
    else if (count === 4) tpl = this._safe(this.msg4, symbolId, '{symbol} x{count} 贏 {payout}');
    else tpl = this._safe(this.msg3, symbolId, '{symbol} x{count} 贏 {payout}');
    return this._format(tpl, { symbol: name, count, payout });
  }
}
