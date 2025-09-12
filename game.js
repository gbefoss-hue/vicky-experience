// --- CONSTANTES Y TEXTOS CLAVE ---
const EMOJI_LIST = ['🍟', '🍷', '🍸', '✈️', '⛱️', '🪩', '👠', '🍣', '💜', '🐣', '🐶', '🌙', '☃️', '🥑', '🌎', '🌭'];

const START_MESSAGE = '¿Pensabas que zafabas??? Te inventaste un casorio para irte antes?\n\nLas Siniestras te informan que tu experiencia está por llegar...\nVolvé a la infancia con este juego y liberá algunos fragmentos de información.';

// --- TEXTOS MODIFICADOS ---
const WIN_MESSAGE = '--- ANÁLISIS DE PISTAS COMPLETADO --- \n\n Pistas recolectadas: 🍣, ✈️, 💜, 👠, 🌭, 🌎... \n\n Conclusión del sistema: ¡ERROR 404! NINGUNA DE ESTAS PISTAS ES CORRECTA. 😉 \n\n Lo único que necesitamos es tu confirmación para la noche del: \n\n SÁBADO 20 DE SEPTIEMBRE';
const ALT_DATE_MESSAGE = 'Recalculando... ¡Alerta! El sistema ha encontrado una unica ventana de oportunidad alternativa: \n\n VIERNES 19 DE SEPTIEMBRE \n\n ¿Procedemos?';

const WHATSAPP_MSG_SATURDAY = 'Yeeeiiiii. Reservo el sábado 20 de septiembre para lo que sea que estén tramando, siniestras. ¡Avisen!';
const WHATSAPP_MSG_FRIDAY = 'El sábado 20 no puedo! pero me libero para el Plan B del viernes 19. Agendado!';

// --- ESTILO MODERNO ---
const FONT_STYLE_MODERN = {
    fontFamily: '"Poppins", sans-serif',
    fill: '#E2E8F0', // Un blanco más suave
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
        this.cameras.main.setBackgroundColor('#1a202c');
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, START_MESSAGE, { ...FONT_STYLE_MODERN, fontSize: '20px', wordWrap: { width: 800 }, lineSpacing: 10 }).setOrigin(0.5);
        
        const playButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'JUGAR', { ...FONT_STYLE_MODERN, fontSize: '32px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive(); // Color menta vibrante

        playButton.on('pointerdown', () => this.scene.start('GameScene'));
        playButton.on('pointerover', () => playButton.setScale(1.1));
        playButton.on('pointerout', () => playButton.setScale(1));
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
        this.cameras.main.setBackgroundColor('#1a202c');
        this.collectedClues = [];
        this.emojisToRemove = [];

        const gameWidth = 800;
        const gameHeight = 600;
        const sidebarWidth = 200;
        
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
        this.physics.world.setBoundsCollision(true, true, true, false);
        
        this.add.rectangle(gameWidth + (sidebarWidth / 2), gameHeight / 2, sidebarWidth, gameHeight, 0x111827).setStrokeStyle(1, 0x4A5568); // Barra lateral más oscura y con borde sutil
        this.add.text(gameWidth + 100, 40, 'PISTAS', { ...FONT_STYLE_MODERN, fontSize: '22px', fill: '#A0AEC0' }).setOrigin(0.5);
        this.cluesText = this.add.text(gameWidth + 100, 300, '', { ...FONT_STYLE_MODERN, fontSize: '32px', wordWrap: { width: sidebarWidth - 20 }, align: 'center' }).setOrigin(0.5);

        this.paddle = this.add.rectangle(gameWidth / 2, gameHeight - 60, 150, 20, 0xffffff);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.allowGravity = false;

        this.ball = this.add.circle(gameWidth / 2, gameHeight / 2, 12, 0xffffff);
        this.physics.add.existing(this.ball);
        this.ball.body.setCircle(12);
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(1);
        this.ball.body.setVelocity(250, -350);

        const brickColors = [0x3A86FF, 0x8338EC, 0xFF006E, 0xFB5607, 0xFFBE0B];
        this.bricks = this.physics.add.staticGroup();
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 10; j++) {
                const brick = this.add.rectangle(80 + j * 70, 70 + i * 37, 64, 32, brickColors[i]);
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
        this.cameras.main.setBackgroundColor('#1a202c');
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, WIN_MESSAGE, { ...FONT_STYLE_MODERN, fontSize: '18px', wordWrap: { width: 850 }, lineSpacing: 10 }).setOrigin(0.5);
        
        const btnAccept = this.add.text(this.scale.width / 2 - 200, this.scale.height - 100, 'ACEPTO', { ...FONT_STYLE_MODERN, fontSize: '24px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive();
        btnAccept.on('pointerdown', () => window.open(`https://wa.me/?text=${encodeURIComponent(WHATSAPP_MSG_SATURDAY)}`, '_blank'));
        btnAccept.on('pointerover', () => btnAccept.setScale(1.1));
        btnAccept.on('pointerout', () => btnAccept.setScale(1));

        const btnDecline = this.add.text(this.scale.width / 2 + 200, this.scale.height - 100, 'IMPOSIBLE ESE DÍA', { ...FONT_STYLE_MODERN, fontSize: '24px', fill: '#E53E3E' }).setOrigin(0.5).setInteractive();
        btnDecline.on('pointerdown', () => this.scene.start('AltDateScene'));
        btnDecline.on('pointerover', () => btnDecline.setScale(1.1));
        btnDecline.on('pointerout', () => btnDecline.setScale(1));
    }
}

/**
 * Escena de Fecha Alternativa
 */
class AltDateScene extends Phaser.Scene {
    constructor() { super('AltDateScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#1a202c');
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, ALT_DATE_MESSAGE, { ...FONT_STYLE_MODERN, fontSize: '20px', wordWrap: { width: 800 }, lineSpacing: 10 }).setOrigin(0.5);
        
        const btnPlanB = this.add.text(this.scale.width / 2, this.scale.height - 150, 'ACEPTO PLAN B', { ...FONT_STYLE_MODERN, fontSize: '28px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive();
        btnPlanB.on('pointerdown', () => window.open(`https://wa.me/?text=${encodeURIComponent(WHATSAPP_MSG_FRIDAY)}`, '_blank'));
        btnPlanB.on('pointerover', () => btnPlanB.setScale(1.1));
        btnPlanB.on('pointerout', () => btnPlanB.setScale(1));
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
        this.cameras.main.setBackgroundColor('#1a202c');
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'GAME OVER', { ...FONT_STYLE_MODERN, fontSize: '64px', fill: '#E53E3E' }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Sin completar no hay experiencia', { ...FONT_STYLE_MODERN, fontSize: '20px' }).setOrigin(0.5);
        const restartButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'Jugar de nuevo', { ...FONT_STYLE_MODERN, fontSize: '32px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => this.scene.start('GameScene'));
        restartButton.on('pointerover', () => restartButton.setScale(1.1));
        restartButton.on('pointerout', () => restartButton.setScale(1));
    }
}


// --- Configuración Final y Responsiva del Juego ---
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: 1000,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 }
        }
    },
    scene: [StartScene, GameScene, WinScene, AltDateScene, GameOverScene]
};

const game = new Phaser.Game(config);