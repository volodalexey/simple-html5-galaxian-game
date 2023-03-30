import { Sprite, type Texture } from 'pixi.js'
import { logPlayerMove } from './logger'

export interface IPlayerOptions {
  shipTexture: Texture
}

export enum PlayerState {
  idle = 'idle',
  skewLeft = 'skewLeft',
  skewRight = 'skewRight',
}

export class Player extends Sprite {
  public pointerXDown: number | null = null
  public pointerYDown: number | null = null
  public options = {
    scale: 0.15,
    angle: 1,
    moveSpeed: 8,
    bulletSpeed: -10
  }

  public velocity = {
    vx: 0,
    vy: 0
  }

  public shootReloadMax = 10
  public shootReload = 0

  public state!: PlayerState
  constructor ({ shipTexture }: IPlayerOptions) {
    super(shipTexture)
    this.scale.set(this.options.scale)
    this.anchor.set(0.5, 0.5)
  }

  shoot (): boolean {
    if (this.shootReload <= 0) {
      this.shootReload = this.shootReloadMax
      return true
    }
    return false
  }

  switchState (state: PlayerState): void {
    switch (state) {
      case PlayerState.idle:
        this.rotation = 0
        break
      case PlayerState.skewLeft:
        this.rotation = -this.options.angle
        break
      case PlayerState.skewRight:
        this.rotation = this.options.angle
        break
    }
    this.state = state
  }

  isPointerDown (): boolean {
    return this.pointerXDown !== null && this.pointerYDown !== null
  }

  applyTopDirection (pressed: boolean): void {
    this.pointerYDown = pressed ? -1 : null
  }

  applyLeftDirection (pressed: boolean): void {
    this.pointerXDown = pressed
      ? -1
      : (this.pointerXDown === -1 ? null : this.pointerXDown)
  }

  applyRightDirection (pressed: boolean): void {
    this.pointerXDown = pressed
      ? 1
      : (this.pointerXDown === 1 ? null : this.pointerXDown)
  }

  getCenter (): { centerX: number, centerY: number } {
    return {
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    }
  }

  handleMove (pressed: boolean | undefined, x: number, y: number): void {
    const { centerX } = this.getCenter()
    if (pressed === true) {
      this.pointerXDown = x - centerX
      this.pointerYDown = y - this.y
    } else if (pressed === false) {
      this.pointerXDown = null
      this.pointerYDown = null
    } else {
      if (this.isPointerDown()) {
        logPlayerMove(`x=${x} (cx=${centerX}) y=${x}`)
        this.pointerXDown = x - centerX
        this.pointerYDown = y - this.y
      }
    }
  }

  updateVelocity (): void {
    this.shootReload--
    const { pointerXDown, pointerYDown, velocity, options: { moveSpeed } } = this
    if (typeof pointerYDown === 'number' && pointerYDown < 0) {
      velocity.vy = 1
    } else {
      velocity.vy = 0
    }
    if (typeof pointerXDown === 'number') {
      if (pointerXDown < 0) {
        velocity.vx = -moveSpeed
      } else if (pointerXDown > 0) {
        velocity.vx = moveSpeed
      }
    } else {
      velocity.vx = 0
    }
  }
}
