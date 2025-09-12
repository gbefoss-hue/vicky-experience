// --- CONSTANTES Y TEXTOS CLAVE ---
// Ya no necesitamos un número de WhatsApp específico.
const EMOJI_LIST = ['🍟', '🍷', '🍸', '✈️', '⛱️', '🪩', '👠', '🍣', '💜', '🐣', '🐶', '🌙', '☃️', '🥑', '🌎', '🌭'];

// --- TEXTO DE INICIO MODIFICADO ---
const START_MESSAGE = '¿Pensabas que zafabas??? Te inventaste un casorio para irte antes?\n\nLas Siniestras te informan que tu experiencia está por llegar...\nVolvé a la infancia con este juego y liberá algunos fragmentos de información.';

const WIN_MESSAGE = '--- ANALISIS DE PISTAS COMPLETADO --- \n\n Pistas recolectadas: 🍣, ✈️, 💜, 👠, 🌭, 🌎... \n\n Conclusion del sistema: ¡ERROR 404! NINGUNA DE ESTAS PISTAS ES CORRECTA. 😉 \n\n Tu verdadera experiencia es demasiado increible para ser descifrada. Para desbloquearla, necesitamos tu confirmacion para la noche del: \n\n SABADO 20 DE SEPTIEMBRE \n\n ¿Aceptas la verdadera mision, sin mas pistas?';
const ALT_DATE_MESSAGE = 'Recalculando... ¡Alerta! El sistema ha encontrado una unica ventana de oportunidad alternativa: \n\n VIERNES 19 DE SEPTIEMBRE \n\n ¿Procedemos?';

const WHATSAPP_MSG_SATURDAY = 'Ok, ok, ¡me atraparon! Reservo el sábado 20 de septiembre para lo que sea que estén tramando, siniestras. ¡Avisen!';
const WHATSAPP_MSG_FRIDAY = 'El sábado 20 no puedo, pero me libero para el Plan B del viernes 19. Anotado. ¡No se van a librar de mí tan fácil! 😉';

const FONT_STYLE_RETRO = {
    fontFamily: '"Press Start 2P"',
    fill: '#ffffff',
    align: 'center'
};

const BALL_SPEED_INCREASE = 1.05;
const MAX_BALL_SPEED = 800;

/**
 * Escena de Inicio
 */
class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.add.text(500, 300, START_MESSAGE, { ...FONT_STYLE_RETRO, fontSize: '14px', wordWrap: { width: 800 }, lineSpacing: 10 }).setOrigin(0.5);
        
        const playButton = this.add.text(500, 480, 'JUGAR', { ...FONT_STYLE_RETRO, fontSize: '24px', fill: '#00ff00', backgroundColor: '#333', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();

        playButton.on('pointerdown', () => this.scene.start('GameScene'));
        playButton.on('pointerover', () => playButton.setStyle({ fill: '#ffffff' }));
        playButton.on('pointerout', () => playButton.setStyle({ fill: '#00ff00' }));
    }
}

/**
 * Escena Principal del Juego
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.collectedClues = [];
        this.emojisToRemove = [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.collectedClues = [];
        this.emojisToRemove = [];

        const gameWidth = 800;
        const sidebarWidth = 200;
        
        this.physics.world.setBounds(0, 0, gameWidth, 600);
        this.physics.world.setBoundsCollision(true, true, true, false);
        
        this.add.rectangle(gameWidth + (sidebarWidth / 2), 300, sidebarWidth, 600, 0x1a1a1a).setStrokeStyle(2, 0xffffff);
        this.add.text(gameWidth + 100, 40, 'PISTAS', { ...FONT_STYLE_RETRO, fontSize: '16px' }).setOrigin(0.5);
        this.cluesText = this.add.text(gameWidth + 100, 300, '', { ...FONT_STYLE_RETRO, fontSize: '24px', wordWrap: { width: sidebarWidth - 20 }, align: 'center' }).setOrigin(0.5);

        this.paddle = this.add.rectangle(400, 540, 150, 20, 0xffffff);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.allowGravity = false;

        this.ball = this.add.circle(400, 300, 15, 0xffffff);
        this.physics.add.existing(this.ball);
        this.ball.body.setCircle(15);
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(1);
        this.ball.body.setVelocity(200, -300);

        this.bricks = this.physics.add.staticGroup();
        const brickColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 10; j++) {
                const brick = this.add.rectangle(80 + j * 70, 70 + i * 37, 64, 32, brickColors[i % brickColors.length]);
                this.bricks.add(brick);
            }
        }

        this.fallingEmojis = this.physics.add.group();

        this.physics.add.collider(this.ball, this.paddle);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.overlap(this.paddle, this.fallingEmojis, this.collectEmoji, null, this);

        this.input.on('pointermove', (pointer) => {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 75, gameWidth - 75);
        });
    }

    hitBrick(ball, brick) {
        brick.destroy();
        
        const randomEmoji = Phaser.Math.RND.pick(EMOJI_LIST);
        const emojiText = this.add.text(brick.x, brick.y, randomEmoji, { fontSize: '48px' }).setOrigin(0.5);
        
        this.fallingEmojis.add(emojiText);
        emojiText.body.setVelocityY(150);
        
        if (this.bricks.countActive(true) === 0) {
            this.scene.start('WinScene');
        }
    }

    collectEmoji(paddle, emoji) {
        if (emoji.isCollected) return;
        emoji.isCollected = true;

        this.collectedClues.push(emoji.text);
        this.cluesText.setText(this.collectedClues.join(' '));
        this.emojisToRemove.push(emoji);

        if (this.ball.body.velocity.length() < MAX_BALL_SPEED) {
            this.ball.body.velocity.x *= BALL_SPEED_INCREASE;
            this.ball.body.velocity.y *= BALL_SPEED_INCREASE;
        }
    }

    update() {
        if (this.ball.y > 600) {
            this.scene.start('GameOverScene');
        }

        if (this.emojisToRemove.length > 0) {
            this.emojisToRemove.forEach(emoji => emoji.destroy());
            this.emojisToRemove = [];
        }
        
        this.fallingEmojis.children.each(emoji => {
            if (emoji && emoji.y > 620) {
                emoji.destroy();
            }
        });
    }
}

/**
 * Escena de Victoria
 */
class WinScene extends Phaser.Scene {
    constructor() { super('WinScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.add.text(500, 250, WIN_MESSAGE, { ...FONT_STYLE_RETRO, fontSize: '12px', wordWrap: { width: 850 } }).setOrigin(0.5);
        
        // --- WHATSAPP MODIFICADO ---
        // Se elimina el número de la URL para que el usuario elija el contacto.
        const btnAccept = this.add.text(300, 500, 'ACEPTO', { ...FONT_STYLE_RETRO, fontSize: '16px', fill: '#00ff00', backgroundColor: '#333', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        btnAccept.on('pointerdown', () => window.open(`https://wa.me/?text=${encodeURIComponent(WHATSAPP_MSG_SATURDAY)}`, '_blank'));
        
        const btnDecline = this.add.text(700, 500, 'IMPOSIBLE ESE DIA', { ...FONT_STYLE_RETRO, fontSize: '16px', fill: '#ff0000', backgroundColor: '#333', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        btnDecline.on('pointerdown', () => this.scene.start('AltDateScene'));
    }
}

/**
 * Escena de Fecha Alternativa
 */
class AltDateScene extends Phaser.Scene {
    constructor() { super('AltDateScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.add.text(500, 250, ALT_DATE_MESSAGE, { ...FONT_STYLE_RETRO, fontSize: '14px', wordWrap: { width: 800 } }).setOrigin(0.5);
        
        // --- WHATSAPP MODIFICADO ---
        const btnPlanB = this.add.text(500, 450, 'ACEPTO PLAN B', { ...FONT_STYLE_RETRO, fontSize: '20px', fill: '#00ff00', backgroundColor: '#333', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        btnPlanB.on('pointerdown', () => window.open(`https://wa.me/?text=${encodeURIComponent(WHATSAPP_MSG_FRIDAY)}`, '_blank'));
    }
}

/**
 * Escena de GAME OVER
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.add.text(500, 200, 'GAME OVER', { ...FONT_STYLE_RETRO, fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(500, 300, 'Sin completar no hay experiencia', { ...FONT_STYLE_RETRO, fontSize: '14px', fill: '#ffffff' }).setOrigin(0.5);
        const restartButton = this.add.text(500, 420, 'Jugar de nuevo', { ...FONT_STYLE_RETRO, fontSize: '24px', fill: '#00ff00', backgroundColor: '#333', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => this.scene.start('GameScene'));
        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#ffffff' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#00ff00' }));
    }
}


// --- Configuración Final del Juego ---
const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 }
        }
    },
    scene: [StartScene, GameScene, WinScene, AltDateScene, GameOverScene]
};

const game = new Phaser.Game(config);