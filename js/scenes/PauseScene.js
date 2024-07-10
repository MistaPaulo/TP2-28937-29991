class PauseScene extends Phaser.Scene {
    constructor() {
      super({ key: 'PauseScene' })
    }
  
    create() {
      this.input.setDefaultCursor('default')
      this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5)
      this.add.text(400, 200, 'Paused', { fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5)
  
      const resumeButton = this.add.text(400, 275, 'Resume', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      resumeButton.setInteractive()
      resumeButton.on('pointerdown', () => {
        this.scene.resume('GameScene')
        this.scene.stop()
        this.input.setDefaultCursor('none') // Hide cursor when resuming the game
      })
  
      const menuButton = this.add.text(400, 325, 'Exit to Menu', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      menuButton.setInteractive()
      menuButton.on('pointerdown', () => {
        this.scene.stop('GameScene')
        this.scene.start('MenuScene', { skipToCountdown: false }) // Start MenuScene without skipping countdown
      })
    }
  }
  