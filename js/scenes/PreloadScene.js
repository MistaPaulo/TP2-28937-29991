class PreloadScene extends Phaser.Scene {
    constructor() {
      super({ key: 'PreloadScene' })
    }
  
    preload() {
      this.load.image('player', 'assets/player.png')
      this.load.image('bullet', 'assets/bullet.png')
      this.load.image('enemyBullet1', 'assets/enemyBullet1.png')
      this.load.image('enemyBullet2', 'assets/enemyBullet2.png')
      this.load.image('background', 'assets/background.png')
      this.load.image('cursor', 'assets/cursor.png')
      this.load.image('enemy1', 'assets/enemy1.png')
      this.load.image('enemy2', 'assets/enemy2.png')
      this.load.image('shield', 'assets/shield.png')
      this.load.image('healthBooster', 'assets/healthBooster.png')
      this.load.image('logo', 'assets/logo.png')
      this.load.spritesheet('enemyExplosion1', 'assets/enemyExplosion1.png', { frameWidth: 64, frameHeight: 64 })
    }
  
    create() {
      this.scene.start('MenuScene')
    }
  }
  