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
  public position = {
    x: 0,
    y: 0
  }

  public velocity = {
    vx: 1,
    vy: 0
  }

  public invaders: Invader[] = []

  public width = 0

  constructor ({ invaderTexture, initX = 0, initY = 0, minCols = 5, maxCols = 10, minRows = 2, maxRows = 5 }: IGridOptions) {
    this.position.x = initX
    this.position.y = initY
    const columns = Math.floor(Math.random() * maxCols + minCols)
    const rows = Math.floor(Math.random() * maxRows + minRows)

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const invader = new Invader({
          grid: this,
          texture: invaderTexture
        })
        // invader.anchor.set(0.5, 0.5)
        invader.position.set(this.position.x + x * Grid.cell, this.position.y + y * Grid.cell)
        this.invaders.push(
          invader
        )
      }
    }

    this.updateBounds()
  }

  update ({ levelLeft, levelRight }: { levelLeft: number, levelRight: number }): void {
    this.position.x += this.velocity.vx
    this.position.y += this.velocity.vy

    for (const invader of this.invaders) {
      invader.update(this.velocity)
    }

    this.velocity.vy = 0

    if (this.position.x + this.width >= levelRight || this.position.x <= levelLeft) {
      this.velocity.vx = -this.velocity.vx * 1.15
      this.velocity.vy = Grid.cell
    }
  }

  updateBounds (): void {
    const minX = Math.min(...this.invaders.map(i => i.x))
    const maxX = Math.max(...this.invaders.map(i => i.x + i.width))
    this.position.x = minX
    this.width = maxX - minX
  }
}
