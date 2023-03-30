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
  static options = {
    scale: 0.15,
    angle: 0.3,
    moveSpeed: 8,
    bulletSpeed: -10
  }

  public velocity = {
    vx: 0,
    vy: 0
  }

  public heatingMax = 200
  public heating = 0
  public isAlive = true

  public state!: PlayerState
  constructor ({ shipTexture }: IPlayerOptions) {
    super(shipTexture)
    this.scale.set(Player.options.scale)
    this.anchor.set(0.5, 0.5)

    this.switchState(PlayerState.idle)
  }

  shoot (): boolean {
    if (!this.isAlive) {
      return false
    }
    if (this.heating < this.heatingMax) {
      this.heating += 15
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
        this.rotation = -Player.options.angle
        break
      case PlayerState.skewRight:
        this.rotation = Player.options.angle
        break
    }
    this.state = state
  }

  isPointerDown (): boolean {
    return this.pointerXDown !== null && this.pointerYDown !== null
  }

  applyTopDirection (pressed: boolean): void {
    if (!this.isAlive) {
      return
    }
    this.pointerYDown = pressed ? -1 : null
  }

  applyLeftDirection (pressed: boolean): void {
    if (!this.isAlive) {
      return
    }
    this.pointerXDown = pressed
      ? -1
      : (this.pointerXDown === -1 ? null : this.pointerXDown)
  }

  applyRightDirection (pressed: boolean): void {
    if (!this.isAlive) {
      return
    }
    this.pointerXDown = pressed
      ? 1
      : (this.pointerXDown === 1 ? null : this.pointerXDown)
  }

  handleMove (pressed: boolean | undefined, x: number, y: number): void {
    if (!this.isAlive) {
      return
    }
    if (pressed === true) {
      this.pointerXDown = x - this.x
      this.pointerYDown = y - this.y
    } else if (pressed === false) {
      this.pointerXDown = null
      this.pointerYDown = null
    } else {
      if (this.isPointerDown()) {
        logPlayerMove(`x=${x} (cx=${this.x}) y=${x}`)
        this.pointerXDown = x - this.x
        this.pointerYDown = y - this.y
      }
    }
  }

  updateVelocity (): void {
    if (!this.isAlive) {
      return
    }
    if (this.heating > 0) {
      this.heating--
    }
    const { options: { moveSpeed } } = Player
    const { pointerXDown, pointerYDown, velocity } = this
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

  updateState (): void {
    if (!this.isAlive) {
      return
    }
    if (this.velocity.vx > 0) {
      this.switchState(PlayerState.skewRight)
    } else if (this.velocity.vx < 0) {
      this.switchState(PlayerState.skewLeft)
    } else {
      this.switchState(PlayerState.idle)
    }
  }

  setKilled (): void {
    this.isAlive = false
    this.pointerXDown = null
    this.pointerYDown = null
    this.velocity.vx = 0
    this.velocity.vy = 0
    this.heating = 0
  }
}
