import { Sprite, type Texture } from 'pixi.js'
import { type Grid } from './Grid'

export interface IInvaderOptions {
  grid: Grid
  texture: Texture
}

export class Invader extends Sprite {
  public bulletSpeed = 5
  public parentGrid!: Grid
  constructor ({ texture, grid }: IInvaderOptions) {
    super(texture)
    this.parentGrid = grid
  }

  update ({ vx, vy }: { vx: number, vy: number }): void {
    this.x += vx
    this.y += vy
  }

  isOutOfViewport ({ left, top, right, bottom }: { left: number, top: number, right: number, bottom: number }): boolean {
    const pLeft = this.x
    const pTop = this.y
    const pRight = this.x + this.width
    const pBottom = this.y + this.height
    if (pRight < left) {
      return true
    }
    if (pLeft > right) {
      return true
    }
    if (pBottom < top) {
      return true
    }
    if (pTop > bottom) {
      return true
    }
    return false
  }

  removeGromGrid (): void {
    const idx = this.parentGrid.invaders.indexOf(this)
    if (idx > -1) {
      this.parentGrid.invaders.splice(idx, 1)
    }
    this.parentGrid.updateBounds()
  }
}
