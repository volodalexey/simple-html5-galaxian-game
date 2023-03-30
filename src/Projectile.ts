import { Sprite, Graphics, type Application, type Texture } from 'pixi.js'

export interface IProjectileOptions {
  id: number
  app: Application
  radius: number
  fillColor: number
  vx: number
  vy: number
}

export class Projectile extends Sprite {
  static textureCache: Texture
  public id!: number
  public app!: Application
  public radius!: number
  public vx!: number
  public vy!: number
  public fillColor!: number

  constructor (options: IProjectileOptions) {
    super()
    this.id = options.id
    this.app = options.app
    this.radius = options.radius
    this.vx = options.vx
    this.vy = options.vy
    this.fillColor = options.fillColor
    this.setup(options)
  }

  setup (options: IProjectileOptions): void {
    let texture = Projectile.textureCache
    if (texture == null) {
      const circle = new Graphics()
      circle.beginFill(this.fillColor)
      circle.drawCircle(0, 0, this.radius)
      circle.endFill()
      circle.cacheAsBitmap = true
      texture = options.app.renderer.generateTexture(circle)
      Projectile.textureCache = texture
    }
    this.texture = texture
  }

  update (): void {
    this.x = this.x + this.vx
    this.y = this.y + this.vy
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
