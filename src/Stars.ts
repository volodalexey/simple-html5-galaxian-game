import { type Application, Sprite, Graphics, ParticleContainer, type Texture } from 'pixi.js'

interface IStarOptions {
  app: Application
  fillColor: number
}

class Star extends Sprite {
  static textureCache: Texture
  public app!: Application
  public fillColor!: number

  constructor (options: IStarOptions) {
    super()
    this.app = options.app
    this.setup(options)
    this.tint = options.fillColor
  }

  setup (options: IStarOptions): void {
    let texture = Star.textureCache
    if (texture == null) {
      const star = new Graphics()
      star.beginFill(0xffffff)
      star.drawPolygon([55, 10,
        57, 15,
        63, 15,
        58, 19,
        60, 25,
        55, 22,
        50, 25,
        51, 19,
        47, 15,
        53, 15
      ])
      star.endFill()
      star.alpha = 0.2
      star.width = 2
      star.cacheAsBitmap = true
      texture = options.app.renderer.generateTexture(star)
      Star.textureCache = texture
    }
    this.texture = texture
    this.scale.set(0.5)
  }
}

interface IStarsOptions {
  app: Application
  levelLeft: number
  levelRight: number
  levelTop: number
  levelBottom: number
}

export class Stars extends ParticleContainer {
  static velocity = 1
  static count = 100
  static colors = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffc78e, 0xffa651]
  constructor (options: IStarsOptions) {
    super(Stars.count + 1, { position: true, tint: true })
    this.setup(options)
  }

  setup ({ app, levelLeft, levelRight, levelTop, levelBottom }: IStarsOptions): void {
    for (let i = 0; i < Stars.count; i++) {
      const star = new Star({
        app,
        fillColor: Stars.colors[Math.floor(Math.random() * Stars.colors.length)]
      })
      const x = Math.floor(Math.random() * levelRight - levelLeft)
      const y = Math.floor(Math.random() * levelBottom - levelTop)
      star.position.set(x, y)
      this.addChild(star)
    }
  }

  update ({ levelTop, levelBottom }: { levelTop: number, levelBottom: number }): void {
    this.children.forEach(star => {
      star.position.y += Stars.velocity
      if (star.position.y > levelBottom) {
        star.position.y = levelTop
      }
    })
  }
}
