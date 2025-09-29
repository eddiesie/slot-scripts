// assets/scripts/game/SymbolView.ts
import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SymbolView')
export class SymbolView extends Component {
  @property(Sprite) sprite: Sprite | null = null;

  setSymbol(frame: SpriteFrame) {
    if (this.sprite) this.sprite.spriteFrame = frame;
  }
}
