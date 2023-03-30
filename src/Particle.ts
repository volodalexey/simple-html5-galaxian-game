import { Sprite, Graphics, type Application, type Texture } from 'pixi.js'

export interface IParticleOptions {
  app: Application
  radius: number
  vx: number
  vy: number
  fillColor: number
}

export class Particle extends Sprite {
  static textureCache: Texture
  public isProjectile = true
  public app!: Application
  public radius!: number
  public vx!: number
  public vy!: number

  constructor (options: IParticleOptions) {
    super()
    this.app = options.app
    this.radius = options.radius
    this.vx = options.vx
    this.vy = options.vy
    this.setup(options)
  }

  setup (options: IParticleOptions): void {
    let texture = Particle.textureCache
    if (texture == null) {
      const circle = new Graphics()
      circle.beginFill(0xffffff)
      circle.drawCircle(0, 0, this.radius)
      circle.endFill()
      circle.cacheAsBitmap = true
      texture = options.app.renderer.generateTexture(circle)
      Particle.textureCache = texture
    }
    this.texture = texture
    this.scale.set(options.radius * 2 / texture.width, options.radius * 2 / texture.height)
    this.tint = options.fillColor
  }

  update (): void {
    this.x = this.x + this.vx
    this.y = this.y + this.vy
    this.alpha = this.alpha - 0.01
    if (this.alpha < 0) {
      this.alpha = 0
    }
  }

  isOutOfViewport ({ left, top, right, bottom }: { left: number, top: number, right: number, bottom: number }): boolean {
    const pLeft = this.x - this.radius
    const pTop = this.y - this.radius
    const pRight = this.x + this.radius
    const pBottom = this.y + this.radius
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
}
