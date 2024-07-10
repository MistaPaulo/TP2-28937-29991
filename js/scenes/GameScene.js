class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.player
    this.cursors
    this.bullets
    this.customCursor
    this.mouseX = 0
    this.mouseY = 0
    this.enemies
    this.enemyBullets
    this.isFiring = false
    this.enemySpawnTime = 0
    this.shield
    this.shieldActive = false
    this.shieldPercentage = 100
    this.healthPercentage = 100
    this.shieldCooldown = false
    this.score = 0
    this.enemySpawnCount = 0 // Counter for enemy spawns
    this.spawnCooldown = false // Cooldown flag for enemy spawns
    this.shieldCooldownThreshold = 30 // Minimum percentage the shield needs to have to activate after getting to 0%
    this.maxEnemies = 10 // Set max enemies limit to 10
    this.enemySpawnInterval = 1000 // Enemy spawn interval
    this.playerBulletDamage = 25 // Damage dealt by player bullets
    this.enemyBullet1Damage = 5 // Damage dealt by enemy1 bullets
    this.enemyBullet2Damage = 10 // Damage dealt by enemy2 bullets
    this.enemy1Health = 25 // Health of enemy1
    this.enemy2Health = 500 // Health of enemy2
    this.shieldRegenerationRate = 5 // Regeneration rate for the shield
    this.enemy1ShootCooldown = 1250 // Cooldown period for enemy1 shooting
    this.enemy2ShootCooldown = 2500 // Cooldown period for enemy2 shooting
    this.enemy2SprayDuration = 1250 // Duration for enemy2 spraying bullets
    this.enemy2SprayInterval = 75 // Interval between each bullet in spray mode (lower rate)
    this.enemy1MoveSpeed = 100 // Speed for enemy1
    this.enemy2MoveSpeed = 25 // Speed for enemy2
    this.enemyShootStartDelay = 500 // Delay before enemies can start shooting after spawn
    this.healthBoosterDuration = 5000 // Time before health booster disappears
    this.lastFired = 0
  }

  create() {
    // Reset score when a new game starts
    this.score = 0
  
    // Add background
    this.add.image(400, 300, 'background')
  
    // Create player
    this.player = this.physics.add
      .sprite(400, 300, 'player')
      .setOrigin(0.5, 0.5)
      .setScale(0.25)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(1) // Ensure player is above bullets
  
    // Create shield
    this.shield = this.physics.add.sprite(400, 300, 'shield').setOrigin(0.5, 0.5).setScale(0.3)
    this.shield.setVisible(false)
    this.shield.setAlpha(0.5)
    this.shield.body.setAllowGravity(false)
    this.shield.body.setCircle(this.shield.width / 2)
  
    // Create custom cursor
    this.customCursor = this.add
      .image(400, 300, 'cursor')
      .setOrigin(0.5, 0.5)
      .setScale(0.15)
    this.input.setDefaultCursor('none')
  
    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  
    // Group of player bullets
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    })
  
    // Group of enemy bullets
    this.enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      runChildUpdate: true
    })
  
    // Group of health boosters
    this.healthBoosters = this.physics.add.group()
  
    // Create enemies group
    this.enemies = this.physics.add.group({
      maxSize: this.maxEnemies,
      createCallback: (enemy) => {
        if (enemy.texture.key === 'enemy1') {
          enemy.health = this.enemy1Health
        } else if (enemy.texture.key === 'enemy2') {
          enemy.health = this.enemy2Health
          enemy.sprayCooldownTime = 0
          enemy.sprayActive = false
          enemy.sprayEndTime = 0
          enemy.sprayTimer = null
          enemy.healthText = this.add.text(enemy.x, enemy.y - 40, Math.floor(enemy.health / this.enemy2Health * 100) + '%', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5)
          enemy.healthText.setDepth(2) // Set depth to ensure health indicator text is on top of enemy2
        }
        enemy.shootStartTime = this.time.now + this.enemyShootStartDelay
      },
      removeCallback: (enemy) => {
        if (enemy.healthText) enemy.healthText.destroy()
      }
    })
  
    // Add HUD
    this.healthText = this.add.text(15, 570, 'Health: 100%', { fontSize: '20px', fill: '#fff' })
    this.shieldText = this.add.text(652, 570, 'Shield: 100%', { fontSize: '20px', fill: '#fff' })
    this.scoreText = this.add.text(400, 10, 'Score: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5, 0)
  
    // Create explosion animation if it doesn't already exist
    if (!this.anims.exists('explode1')) {
      this.anims.create({
        key: 'explode1',
        frames: this.anims.generateFrameNumbers('enemyExplosion1', { start: 0, end: 15 }),
        frameRate: 16,
        repeat: 0,
        hideOnComplete: true
      })
    }
  
    // Update custom cursor position and store mouse coordinates
    this.input.on(
      'pointermove',
      function (pointer) {
        this.mouseX = pointer.x
        this.mouseY = pointer.y
  
        // Rotate player to face the cursor
        this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y) + Phaser.Math.DegToRad(90)
      },
      this
    )
  
    // Shooting on left mouse click
    this.input.on(
      'pointerdown',
      function (pointer) {
        if (pointer.leftButtonDown() && !this.shieldActive) {
          this.isFiring = true
        }
      },
      this
    )
  
    // Stop firing when mouse button is released
    this.input.on(
      'pointerup',
      function (pointer) {
        if (!pointer.leftButtonDown()) {
          this.isFiring = false
        }
      },
      this
    )
  
    // Collision between player and enemy bullets
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => playerHit(player, bullet, this), null, this)
    this.physics.add.overlap(this.enemies, this.bullets, (enemy, bullet) => enemyHit(enemy, bullet, this), null, this)
    this.physics.add.overlap(this.player, this.healthBoosters, (player, booster) => collectHealthBooster(player, booster, this), null, this)
  
    // Remove bullets that go out of bounds
    this.physics.world.on('worldbounds', function (body) {
      if (body.gameObject) {
        body.gameObject.setActive(false)
        body.gameObject.setVisible(false)
      }
    })
  
    // ESC key to pause the game
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.launch('PauseScene')
      this.scene.pause()
    })
  
    // Ensure the cursor is hidden again when resuming
    this.events.on('resume', () => {
      this.input.setDefaultCursor('none')
    })
  }

  update(time, delta) {
    // Reset player velocity
    this.player.setVelocity(0)

    let speed = 350
    let velocityX = 0
    let velocityY = 0

    // Player movement
    if (this.wKey.isDown) {
      velocityY = -speed
    } else if (this.sKey.isDown) {
      velocityY = speed
    }

    if (this.aKey.isDown) {
      velocityX = -speed
    } else if (this.dKey.isDown) {
      velocityX = speed
    }

    // Normalize velocity to ensure consistent speed in all directions
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2
      velocityY *= Math.SQRT1_2
    }

    this.player.setVelocityX(velocityX)
    this.player.setVelocityY(velocityY)

    // Rotate player to face the cursor if moving
    if (velocityX !== 0 || velocityY !== 0) {
      this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.mouseX, this.mouseY) + Phaser.Math.DegToRad(90)
    }

    // Update shield position and visibility
    this.shield.setPosition(this.player.x, this.player.y)
    if (this.shieldActive) {
      this.shield.setVisible(true)
      this.shield.body.enable = true
    } else {
      this.shield.setVisible(false)
      this.shield.body.enable = false
    }

    // Continuous firing when mouse button is held down
    if (this.isFiring && time > this.lastFired) {
      let bullet = this.bullets.get()
      if (bullet) {
        bullet.fire(this.player.x, this.player.y, this.player.rotation)
        this.lastFired = time + 100
      }
    }

    // Shield mechanics
    if (this.spaceKey.isDown && !this.shieldCooldown && this.shieldPercentage > 0) {
      this.shieldActive = true
      this.isFiring = false // Disable firing when shield is active
    } else {
      this.shieldActive = false
    }

    if (!this.shieldActive && this.shieldPercentage < 100) {
      this.shieldPercentage += (this.shieldRegenerationRate * delta) / 1000
      if (this.shieldPercentage > 100) {
        this.shieldPercentage = 100
      }
      updateShieldText(this)
    }

    if (this.shieldPercentage <= 0) {
      this.shieldCooldown = true
      this.shieldActive = false
    }

    if (this.shieldCooldown && this.shieldPercentage >= this.shieldCooldownThreshold) {
      this.shieldCooldown = false
    }

    // Update enemies
    this.enemies.children.iterate(function (enemy) {
      if (enemy.active) {
        // Rotate enemy to face the player
        enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + Phaser.Math.DegToRad(90)

        // Update enemy2 health text position and value
        if (enemy.texture.key === 'enemy2' && enemy.healthText) {
          enemy.healthText.setPosition(enemy.x, enemy.y - 40)
          enemy.healthText.setText(Math.floor(enemy.health / this.enemy2Health * 100) + '%')
        }

        // Shoot at the player
        if (time > enemy.shootStartTime) { // Check if enemy can start shooting
          if (enemy.texture.key === 'enemy1' && time > enemy.lastShotTime + this.enemy1ShootCooldown) {
            let bullet = this.enemyBullets.get()
            if (bullet) {
              bullet.fire(enemy.x, enemy.y, enemy.rotation, 'enemyBullet1')
              enemy.lastShotTime = time
            }
          } else if (enemy.texture.key === 'enemy2') {
            if (enemy.sprayActive) {
              if (time > enemy.sprayEndTime) {
                enemy.sprayActive = false
              } else {
                // Fire spray bullets with interval
                if (time > enemy.lastShotTime) {
                  fireSingleShot(enemy, this)
                  enemy.lastShotTime = time + this.enemy2SprayInterval
                }
              }
            } else {
              if (time > enemy.lastShotTime + this.enemy2ShootCooldown) {
                if (Phaser.Math.Between(1, 5) === 1) { // 20% chance to start spraying
                  enemy.sprayActive = true
                  enemy.sprayEndTime = time + this.enemy2SprayDuration
                  enemy.lastShotTime = time + this.enemy2SprayInterval
                } else {
                  fireSingleShot(enemy, this)
                  enemy.lastShotTime = time
                }
              }
            }
          }
        }
      }
    }, this)

    // Gradually spawn enemies
    if (time > this.enemySpawnTime && this.enemies.countActive(true) < this.maxEnemies) {
      if (!this.spawnCooldown) {
        let enemiesToSpawn = Phaser.Math.Between(1, 3) // Spawn between 1 and 3 enemies at a time
        for (let i = 0; i < enemiesToSpawn; i++) {
          spawnEnemy(this)
        }
        this.enemySpawnTime = time + this.enemySpawnInterval
      }
    }

    // Ensure cursor is on top
    this.customCursor.x = this.mouseX
    this.customCursor.y = this.mouseY
    this.customCursor.setDepth(2)

    // Check for game over
    if (this.healthPercentage <= 0) {
      this.scene.launch('GameOverScene', { score: this.score })
      this.scene.pause()
      this.healthPercentage = 100
    }
  }
}

function fireSingleShot(enemy, scene) {
  let bullet = scene.enemyBullets.get()
  if (bullet) {
    bullet.fire(enemy.x, enemy.y, enemy.rotation, 'enemyBullet2') // Use enemyBullet2 for enemy2
  }
}

function spawnEnemy(scene) {
  let x, y
  let edge = Phaser.Math.Between(0, 3)
  if (edge === 0) {
    x = Phaser.Math.Between(0, 800)
    y = -50
  } else if (edge === 1) {
    x = Phaser.Math.Between(0, 800)
    y = 650
  } else if (edge === 2) {
    x = -50
    y = Phaser.Math.Between(0, 600)
  } else {
    x = 850
    y = Phaser.Math.Between(0, 600)
  }

  let enemyType = Phaser.Math.Between(1, 20) <= 19 ? 'enemy1' : 'enemy2' // 95% probability for enemy1 to be spawned and 5% probability for enemy2 to be spawned
  let enemy = scene.enemies.create(x, y, enemyType)
  if (!enemy) return // Ensure enemy is created successfully

  enemy.setOrigin(0.5, 0.5)

  if (enemyType === 'enemy1') {
    enemy.setScale(0.35)
    enemy.health = scene.enemy1Health
  } else {
    enemy.setScale(0.25)
    enemy.health = scene.enemy2Health
    enemy.sprayCooldownTime = 0
    enemy.sprayActive = false
    enemy.sprayEndTime = 0
    enemy.sprayTimer = null
    enemy.healthText = scene.add.text(enemy.x, enemy.y - 40, Math.floor(enemy.health / scene.enemy2Health * 100) + '%', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5)
    enemy.healthText.setDepth(2) // Set depth to ensure health indicator text is on top of enemy2
  }

  enemy.setCollideWorldBounds(true)
  enemy.setBounce(1)
  enemy.setDepth(1)
  enemy.lastShotTime = 0

  let angle = Phaser.Math.Angle.Between(x, y, 400, 300)
  let speed = enemyType === 'enemy1' ? scene.enemy1MoveSpeed : scene.enemy2MoveSpeed
  enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

  enemy.shootStartTime = scene.time.now + scene.enemyShootStartDelay // Set the start shooting time

  scene.enemySpawnCount++

  if (scene.enemySpawnCount % 50 === 0) {
    scene.spawnCooldown = true
    scene.time.addEvent({
      delay: 2000,
      callback: () => {
        scene.spawnCooldown = false

        // Increase enemy attributes to make the game more difficult
        scene.enemyBullet1Damage *= 1.05
        scene.enemyBullet2Damage *= 1.05
        scene.enemy1MoveSpeed *= 1.05
        scene.enemy2MoveSpeed *= 1.05
        scene.enemy2Health *= 1.05
      }
    })
  }
}

function playerHit(player, bullet, scene) {
  if (bullet.active) {
    bullet.setActive(false)
    bullet.setVisible(false)

    if (scene.shieldActive) {
      // If shield is active, subtract from shield health
      scene.shieldPercentage -= bullet.texture.key === 'enemyBullet1' ? scene.enemyBullet1Damage : scene.enemyBullet2Damage // Decrease shield percentage based on bullet type
      if (scene.shieldPercentage < 0) {
        scene.shieldPercentage = 0
      }
      updateShieldText(scene)

      // Restart shield hit animation
      scene.shield.setAlpha(0.3)
      if (scene.shield.alphaTween) {
        scene.shield.alphaTween.remove()
      }
      scene.shield.alphaTween = scene.tweens.add({
        targets: scene.shield,
        alpha: 0.5,
        duration: 100,
        ease: 'Linear'
      })

      if (scene.shieldPercentage <= 0) {
        scene.shieldActive = false
        scene.shieldCooldown = true
      }
    } else {
      // If shield is not active, subtract from player health
      scene.healthPercentage -= bullet.texture.key === 'enemyBullet1' ? scene.enemyBullet1Damage : scene.enemyBullet2Damage // Decrease health based on bullet type
      scene.cameras.main.shake(50, 0.01)
      if (scene.healthPercentage < 0) {
        scene.healthPercentage = 0
      }
      updateHealthText(scene)
    }
  }
}

function enemyHit(enemy, bullet, scene) {
  if (bullet.active && enemy.active) {
    bullet.setActive(false)
    bullet.setVisible(false)

    enemy.health -= scene.playerBulletDamage
    if (enemy.health <= 0) {
      let explosion = scene.add.sprite(enemy.x, enemy.y, 'enemyExplosion1').setScale(enemy.texture.key === 'enemy2' ? 3.0 : 1.2)
      explosion.play('explode1')
      explosion.on('animationcomplete', () => {
        explosion.destroy()
      })

      if (enemy.healthText) enemy.healthText.destroy()

      enemy.setActive(false)
      enemy.setVisible(false)
      enemy.destroy() // Ensure enemy is completely removed

      if (enemy.sprayTimer) {
        clearInterval(enemy.sprayTimer)
      }

      // Increase score
      scene.score += Math.round(enemy.texture.key === 'enemy2' ? scene.enemy2Health : scene.playerBulletDamage)
      scene.scoreText.setText('Score: ' + scene.score)

      // Spawn health booster with 50% chance
      if (enemy.texture.key === 'enemy2' && Phaser.Math.Between(0, 1) === 0) {
        spawnHealthBooster(scene, enemy.x, enemy.y)
      }
    } else {
      // Increase score when hitting the enemy
      scene.score += Math.round(scene.playerBulletDamage)
      scene.scoreText.setText('Score: ' + scene.score)
    }
  }
}

function updateHealthText(scene) {
  scene.healthText.setText('Health: ' + scene.healthPercentage.toFixed(0) + '%')
}

function updateShieldText(scene) {
  scene.shieldText.setText('Shield: ' + scene.shieldPercentage.toFixed(0) + '%')
}

function spawnHealthBooster(scene, x, y) {
  let healthBooster = scene.healthBoosters.create(x, y, 'healthBooster')
  if (healthBooster) {
    healthBooster.setOrigin(0.5, 0.5)
    healthBooster.setScale(0.5) // Scale down the health booster
    healthBooster.setDepth(1)
    scene.time.addEvent({
      delay: scene.healthBoosterDuration,
      callback: () => {
        if (healthBooster.active) {
          healthBooster.setActive(false)
          healthBooster.setVisible(false)
        }
      }
    })
  }
}

function collectHealthBooster(player, booster, scene) {
  if (booster.active) {
    booster.setActive(false)
    booster.setVisible(false)
    scene.healthPercentage = 100
    updateHealthText(scene)
  }
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet')
  }

  fire(x, y, rotation) {
    this.body.reset(x, y)
    this.setActive(true)
    this.setVisible(true)
    this.setRotation(rotation)
    this.setDepth(0) // Ensure bullets are behind the player
    this.body.onWorldBounds = true
    this.body.setCollideWorldBounds(true)
    this.body.velocity.x = Math.cos(rotation - Phaser.Math.DegToRad(90)) * 600
    this.body.velocity.y = Math.sin(rotation - Phaser.Math.DegToRad(90)) * 600
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
}

class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemyBullet1')
  }

  fire(x, y, rotation, textureKey) {
    this.body.reset(x, y)
    this.setTexture(textureKey) // Set the texture based on the enemy type
    this.setActive(true)
    this.setVisible(true)
    this.setRotation(rotation)
    this.setDepth(0) // Ensure bullets are spawned behind enemies
    this.body.onWorldBounds = true
    this.body.setCollideWorldBounds(true)
    this.body.velocity.x = Math.cos(rotation - Phaser.Math.DegToRad(90)) * 300
    this.body.velocity.y = Math.sin(rotation - Phaser.Math.DegToRad(90)) * 300
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)

    if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
}
