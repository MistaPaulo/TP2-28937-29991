class GameOverScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameOverScene' })
    }
  
    init(data) {
      this.finalScore = data.score
    }
  
    create() {
      this.input.setDefaultCursor('default')
      this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5)
      this.add.text(400, 150, 'Game Over!', { fontSize: '60px', fill: '#ff0000' }).setOrigin(0.5)
      this.add.text(400, 200, `Final Score: ${this.finalScore}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
      this.add.text(400, 235, `Highest Score: ${this.getHighestScore()}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
  
      const playAgainButton = this.add.text(400, 300, 'Play Again', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      playAgainButton.setInteractive()
      playAgainButton.on('pointerdown', () => {
        this.scene.stop('GameScene')
        this.scene.start('MenuScene', { skipToCountdown: true }) // Start MenuScene with skipToCountdown
      })
  
      const menuButton = this.add.text(400, 350, 'Return to Menu', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
      menuButton.setInteractive()
      menuButton.on('pointerdown', () => {
        this.scene.stop('GameScene')
        this.scene.start('MenuScene', { skipToCountdown: false }) // Start MenuScene without skipping countdown
      })
    }
  
    getHighestScore() {
      let highestScore = localStorage.getItem('highestScore') || 0
      if (this.finalScore > highestScore) {
        highestScore = this.finalScore
        localStorage.setItem('highestScore', highestScore)
      }
      return highestScore
    }
  }
  