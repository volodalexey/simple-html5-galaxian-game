import { Container, type FederatedPointerEvent, Graphics, ParticleContainer, type Application, type Texture } from 'pixi.js'
import { ScoreBar } from './ScoreBar'
import { Player } from './Player'
import { logGrid, logInvader, logKeydown, logKeyup, logLayout, logParticle, logPlayerBounds, logPointerEvent, logProjectile } from './logger'
import { type IScene } from './SceneManager'
import { Projectile } from './Projectile'
import { Grid } from './Grid'
import { Particle } from './Particle'
import { StartModal } from './StartModal'
import { type Invader } from './Invader'
import { Collision } from './Collision'
import { Stars } from './Stars'

interface IShootingSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  shipTexture: Texture
  invaderTexture: Texture
}

export class ShootingScene extends Container implements IScene {
  public gameEnded = false
  public elapsedSpawnFrames = 0
  public elapsedShootFrames = 0
  public spawnFrame = Math.floor(Math.random() * 500 + 500)
  public invaderShootFrame = Math.floor(Math.random() * 150 + 50)
  public ids = 0
  public app!: Application
  public background!: Graphics

  public backgroundSettings = {
    color: 0x000000
  }

  public player!: Player
  public projectilesContainer!: ParticleContainer
  public invadersContainer!: ParticleContainer
  public particlesContainer!: ParticleContainer
  public stars!: Stars
  public scoreBar!: ScoreBar
  public startModal!: StartModal
  public grids: Grid[] = []
  public invaderTexture!: Texture

  constructor (options: IShootingSceneOptions) {
    super()
    this.app = options.app
    this.invaderTexture = options.invaderTexture
    this.setup(options)
    this.draw(options)
    this.addEventLesteners()

    setTimeout(() => { this.spawnInvadersGrid() })
  }

  setup ({ viewWidth, viewHeight, shipTexture }: IShootingSceneOptions): void {
    this.background = new Graphics()
    this.addChild(this.background)

    this.stars = new Stars({
      app: this.app,
      levelLeft: this.x,
      levelRight: viewWidth,
      levelTop: this.y,
      levelBottom: viewHeight
    })
    this.addChild(this.stars)

    this.invadersContainer = new ParticleContainer(500, { position: true })
    this.addChild(this.invadersContainer)

    this.projectilesContainer = new ParticleContainer(500, { position: true, tint: true })
    this.addChild(this.projectilesContainer)

    this.particlesContainer = new ParticleContainer(1000, { position: true, tint: true })
    this.addChild(this.particlesContainer)

    this.scoreBar = new ScoreBar()
    this.addChild(this.scoreBar)

    this.player = new Player({
      shipTexture
    })
    this.addChild(this.player)

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)
  }

  draw ({ viewWidth, viewHeight }: IShootingSceneOptions): void {
    this.background.beginFill(this.backgroundSettings.color)
    this.background.drawRect(0, 0, viewWidth, viewHeight)
    this.background.endFill()
  }

  handleResize (options: { viewWidth: number, viewHeight: number }): void {
    this.centerPlayer(options)
    this.resizeBackground(options)
    this.centerModal(options)
  }

  centerPlayer ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    this.player.position.set(viewWidth / 2, viewHeight - this.player.height)
  }

  centerModal ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    this.startModal.position.set(viewWidth / 2 - this.startModal.boxOptions.width / 2, viewHeight / 2 - this.startModal.boxOptions.height / 2)
  }

  resizeBackground ({ viewWidth, viewHeight }: { viewWidth: number, viewHeight: number }): void {
    logLayout(`bgw=${this.background.width} bgh=${this.background.height} vw=${viewWidth} vh=${viewHeight}`)
    this.background.width = viewWidth
    this.background.height = viewHeight
  }

  spawnParticles ({ count, posX, posY, fillColor }: {
    count: number
    posX: number
    posY: number
    fillColor: number
  }): void {
    for (let index = 0; index < count; index++) {
      const vx = (Math.random() - 0.5) * 10
      const vy = (Math.random() - 0.5) * 10
      const particle = new Particle({
        app: this.app,
        radius: 2,
        vx,
        vy,
        fillColor
      })
      particle.position.set(posX, posY)
      this.particlesContainer.addChild(particle)
    }
  }

  handleUpdate (): void {
    if (this.gameEnded) {
      return
    }
    const levelLeft = this.background.x
    const levelRight = this.background.width
    const levelTop = this.background.y
    const levelBottom = this.background.y + this.background.height
    this.stars.update({ levelTop, levelBottom })
    this.player.updateVelocity()
    const { velocity, position } = this.player
    if (velocity.vy > 0) {
      this.playerShoot()
    }
    const playerBounds = this.player.getBounds()
    logPlayerBounds(`pl=${playerBounds.left} pr=${playerBounds.right} pw=${playerBounds.width} ph=${playerBounds.height}`)
    if (playerBounds.left + velocity.vx < this.background.x) {
      velocity.vx = 0
      position.x = this.background.x + playerBounds.width / 2
    } else if (playerBounds.right + velocity.vx > this.background.width) {
      velocity.vx = 0
      position.x = this.background.width - playerBounds.width / 2
    } else {
      position.x += velocity.vx
    }
    this.player.updateState()

    const { x, y, width, height } = this
    const left = x
    const top = y
    const right = x + width
    const bottom = y + height
    for (const child of this.particlesContainer.children) {
      const particle: Particle = child as Particle
      particle.update()
      if (particle.alpha <= 0) {
        particle.removeFromParent()
        logParticle(`Removed particle alpha (${this.particlesContainer.children.length})`)
      } else if (particle.isOutOfViewport({ left, top, right, bottom })) {
        particle.removeFromParent()
        logParticle(`Removed particle out of viewport (${this.particlesContainer.children.length})`)
      }
    }
    for (const grid of this.grids) {
      grid.update({ levelLeft, levelRight })
    }
    for (const child of this.invadersContainer.children) {
      const invader: Invader = child as Invader
      if (invader.isOutOfViewport({ left, top, right, bottom })) {
        invader.removeFromParent()
        invader.removeGromGrid()
        logInvader(`Removed invader out of viewport (${this.invadersContainer.children.length})`)
      }
    }
    for (const child of this.projectilesContainer.children) {
      const projectile: Projectile = child as Projectile
      projectile.update()
      if (projectile.isOutOfViewport({ left, top, right, bottom })) {
        projectile.removeFromParent()
        logProjectile(`Removed projectile out of viewport (${this.projectilesContainer.children.length})`)
      }
    }
    for (const child of this.invadersContainer.children) {
      // detect invader collision with player
      const invader: Invader = child as Invader
      const invaderBounds = invader.getBounds()
      if (Collision.checkCollision(playerBounds, invaderBounds) > 0) {
        invader.removeFromParent()
        invader.removeGromGrid()
        this.beginEndGame()
        break
      }
      // detect invader collision with projectile
      for (const _child of this.projectilesContainer.children) {
        const projectile: Projectile = _child as Projectile
        const projectileBounds = projectile.getBounds()
        if (Collision.checkCollision(invaderBounds, projectileBounds) > 0.1) {
          projectile.removeFromParent()
          logProjectile(`Removed projectile hit invader (${this.projectilesContainer.children.length})`)
          // update score
          this.scoreBar.addScore(100)

          this.spawnParticles({
            count: Grid.cell,
            posX: invader.x,
            posY: invader.y,
            fillColor: 0xBAA0DE
          })
          invader.removeFromParent()
          invader.removeGromGrid()
          logInvader(`Removed invader killed (${this.invadersContainer.children.length})`)
        } else if (Collision.checkCollision(playerBounds, projectileBounds) > 0.1) {
          projectile.removeFromParent()
          logProjectile(`Removed projectile hit player (${this.projectilesContainer.children.length})`)
          this.beginEndGame()
        }
      }
    }
    const gridsCountBefore = this.grids.length
    this.grids = this.grids.filter(grid => grid.invaders.length)
    if (gridsCountBefore !== this.grids.length) {
      logGrid(`Grids count changed ${this.grids.length}`)
    }
    // invader shoot back
    if (this.elapsedShootFrames === this.invaderShootFrame && this.grids.length > 0) {
      let grid: Grid | undefined
      this.grids.forEach(g => {
        if (grid == null) {
          grid = g
        } else if (g.bounds.bottom > grid.bounds.bottom) {
          grid = g
        }
      })
      if (grid != null) {
        const bottomInvaders = grid.getBottomInvaders()
        if (bottomInvaders.length > 0) {
          const invader = bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)]
          const projectile = new Projectile({
            id: ++this.ids,
            app: this.app,
            radius: 3,
            fillColor: 0xBFA0DF,
            vx: 0,
            vy: invader.bulletSpeed
          })
          projectile.position.set(invader.x, invader.y + invader.height)
          this.projectilesContainer.addChild(projectile)
        }
      }
      this.invaderShootFrame = Math.floor(Math.random() * 150 + 50)
      this.elapsedShootFrames = 0
    }
    if (this.elapsedSpawnFrames === this.spawnFrame) {
      this.spawnInvadersGrid()
      this.spawnFrame = Math.floor(Math.random() * 500 + 500)
      this.elapsedSpawnFrames = 0
    } else if (this.grids.length === 0) {
      this.spawnInvadersGrid()
    }
    this.elapsedShootFrames += 1
    this.elapsedSpawnFrames += 1
  }

  addEventLesteners (): void {
    this.interactive = true
    this.on('pointerdown', this.handlePlayerStartMove)
    this.on('pointermove', this.handlePlayerKeepMove)
    this.on('pointerup', this.handlePlayerStopMove)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.startModal.on('click', this.startGame)
  }

  handlePlayerMove (pressed: boolean | undefined, e: FederatedPointerEvent): void {
    const point = this.toLocal(e.global)
    logPointerEvent(`${e.type} px=${point.x} py=${point.y}`)
    this.player.handleMove(pressed, point.x, point.y)
  }

  handlePlayerStartMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(true, e)
  }

  handlePlayerKeepMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(undefined, e)
  }

  handlePlayerStopMove = (e: FederatedPointerEvent): void => {
    this.handlePlayerMove(false, e)
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    logKeydown(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': case 'Space': case 'ShiftLeft':
        this.player.applyTopDirection(true)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.applyLeftDirection(true)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.applyRightDirection(true)
        break
    }
  }

  handleKeyUp = (e: KeyboardEvent): void => {
    logKeyup(`${e.code} ${e.key}`)
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': case 'Space': case 'ShiftLeft':
        this.player.applyTopDirection(false)
        break
      case 'KeyA': case 'ArrowLeft':
        this.player.applyLeftDirection(false)
        break
      case 'KeyD':case 'ArrowRight':
        this.player.applyRightDirection(false)
        break
    }
  }

  playerShoot (): void {
    if (this.gameEnded) {
      return
    }
    if (this.player.shoot()) {
      this.scoreBar.subScore()
      const projectile = new Projectile({
        id: ++this.ids,
        app: this.app,
        radius: 4,
        fillColor: 0xffffff,
        vx: 0,
        vy: Player.options.bulletSpeed
      })
      projectile.position.set(this.player.x, this.player.y - this.player.height / 2 - projectile.height)
      this.projectilesContainer.addChild(projectile)
      logProjectile(`Added (${this.projectilesContainer.children.length})`)
    }
  }

  spawnInvadersGrid (): void {
    const grid = new Grid({
      invaderTexture: this.invaderTexture,
      initX: this.background.x,
      initY: this.background.y + this.scoreBar.height + this.scoreBar.scoreOptions.padding,
      maxCols: Math.min(Math.floor(this.background.width / Grid.cell) - 4, 10)
    })
    if (this.grids.every(g => g.bounds.top > grid.bounds.bottom)) {
      this.grids.push(grid)
      logGrid(`Spawned +1 grid ${this.grids.length}`)
      for (const invader of grid.invaders) {
        this.invadersContainer.addChild(invader)
      }
    } else {
      logGrid(`Skip spawn grid ${grid.bounds.bottom}`)
    }
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.scoreBar.clearScore()
    while (this.projectilesContainer.children[0] != null) {
      this.projectilesContainer.children[0].removeFromParent()
    }
    while (this.invadersContainer.children[0] != null) {
      const invader = this.invadersContainer.children[0] as Invader
      invader.removeFromParent()
      invader.removeGromGrid()
    }
    while (this.particlesContainer.children[0] != null) {
      this.particlesContainer.children[0].removeFromParent()
    }
    this.grids = []
    this.gameEnded = false
    this.player.isAlive = true
    setTimeout(() => { this.spawnInvadersGrid() })
    this.elapsedShootFrames = 0
    this.elapsedSpawnFrames = 0
  }

  endGame (): void {
    this.gameEnded = true
    this.startModal.scoreText.text = this.scoreBar.score
    this.startModal.visible = true
  }

  beginEndGame (): void {
    this.spawnParticles({
      count: this.player.width,
      posX: this.player.x,
      posY: this.player.y,
      fillColor: 0xFFFFFF
    })
    this.player.setKilled()

    setTimeout(() => {
      this.endGame()
    }, 2000)
  }
}
