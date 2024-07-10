const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        checkCollision: {
          up: true,
          down: true,
          left: true,
          right: true
        }
      }
    },
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene, PauseScene]
  }
  
  const game = new Phaser.Game(config)
  