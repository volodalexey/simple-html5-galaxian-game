import { type Texture } from 'pixi.js'
import { Invader } from './Invader'

export interface IGridOptions {
  invaderTexture: Texture
  initX?: number
  initY?: number
  minCols?: number
  maxCols?: number
  minRows?: number
  maxRows?: number
}

export class Grid {
  static cell = 40
  public bounds = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }

  public velocity = {
    vx: 1,
    vy: 0
  }

  public invaders: Invader[] = []

  constructor ({ invaderTexture, initX = 0, initY = 0, minCols = 5, maxCols = 10, minRows = 2, maxRows = 5 }: IGridOptions) {
    const columns = Math.floor(Math.random() * maxCols + minCols)
    const rows = Math.floor(Math.random() * maxRows + minRows)

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const invader = new Invader({
          grid: this,
          texture: invaderTexture
        })
        // invader.anchor.set(0.5, 0.5)
        invader.position.set(initX + x * Grid.cell, initY + y * Grid.cell)
        this.invaders.push(
          invader
        )
      }
    }

    this.updateBounds()
  }

  update ({ levelLeft, levelRight }: { levelLeft: number, levelRight: number }): void {
    const { bounds } = this
    bounds.left += this.velocity.vx
    bounds.right += this.velocity.vx
    bounds.top += this.velocity.vy
    bounds.bottom += this.velocity.vy

    for (const invader of this.invaders) {
      invader.update(this.velocity)
    }

    this.velocity.vy = 0

    if (bounds.right >= levelRight || bounds.left <= levelLeft) {
      this.velocity.vx = -this.velocity.vx * 1.15
      this.velocity.vy = Grid.cell
    }
  }

  updateBounds (): void {
    const { bounds } = this
    bounds.top = 9999
    bounds.right = 0
    bounds.bottom = 0
    bounds.left = 9999
    this.invaders.forEach(inv => {
      const invBounds = inv.getBounds()
      if (invBounds.top < bounds.top) {
        bounds.top = invBounds.top
      }
      if (invBounds.right > bounds.right) {
        bounds.right = invBounds.right
      }
      if (invBounds.bottom > bounds.bottom) {
        bounds.bottom = invBounds.bottom
      }
      if (invBounds.left < bounds.left) {
        bounds.left = invBounds.left
      }
    })
  }

  getBottomInvaders (): Invader[] {
    this.updateBounds()
    return this.invaders.filter(inv => inv.y + inv.height === this.bounds.bottom)
  }
}
