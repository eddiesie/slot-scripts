import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PaytableConfig')
export class PaytableConfig extends Component {
  @property({ type: [String] })
  symbolNames: string[] = [];

  @property({ type: [Number] })
  weights: number[] = [];

  @property({ type: [Number] })
  mult3: number[] = [];

  @property({ type: [Number] })
  mult4: number[] = [];

  @property({ type: [Number] })
  mult5: number[] = [];

  pickWeighted(totalSymbols: number): number {
    if (!this.weights || this.weights.length < totalSymbols) {
      return Math.floor(Math.random() * totalSymbols);
    }
    const sum = this.weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) return Math.floor(Math.random() * totalSymbols);
    let r = Math.random() * sum;
    for (let i = 0; i < totalSymbols; i++) {
      r -= this.weights[i];
      if (r < 0) return i;
    }
    return totalSymbols - 1;
  }

  getMultiplier(symbolId: number, count: number): number {
    if (count === 3) return this.mult3[symbolId] ?? 0;
    if (count === 4) return this.mult4[symbolId] ?? 0;
    if (count === 5) return this.mult5[symbolId] ?? 0;
    return 0;
  }
}
