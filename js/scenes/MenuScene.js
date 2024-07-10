class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  init(data) {
    this.skipToCountdown = data.skipToCountdown || false
  }

  create() {
    this.add.image(400, 300, 'background')
    const logo = this.add.image(400, 165, 'logo').setScale(0.65)

    const highestScore = this.getHighestScore()
    const highestScoreText = this.add.text(400, 570, `Highest Score: ${highestScore}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)

    const playButton = this.add.text(400, 350, 'Play', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5)
    playButton.setInteractive()
    playButton.on('pointerdown', () => {
      logo.setVisible(false)
      playButton.setVisible(false)
      highestScoreText.setVisible(false)
      this.startCountdown()
    })

    if (this.skipToCountdown) {
      logo.setVisible(false)
      playButton.setVisible(false)
      highestScoreText.setVisible(false)
      this.startCountdown()
    }
  }

  startCountdown() {
    let countdownText = this.add.text(400, 300, '3', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5)
    let countdown = 3

    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        countdown--
        if (countdown > 0) {
          countdownText.setText(countdown)
        } else {
          countdownText.setText('GO!')
          this.time.delayedCall(500, () => {
            this.scene.start('GameScene')
          })
        }
      }
    })
  }

  getHighestScore() {
    return localStorage.getItem('highestScore') || 0
  }
}
