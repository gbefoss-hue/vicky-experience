// --- CONSTANTES Y TEXTOS CLAVE ---
const EMOJI_LIST = ['🍟', '🍷', '🍸', '✈️', '⛱️', '🪩', '👠', '🍣', '💜', '🐣', '🐶', '🌙', '☃️', '🥑', '🌎', '🌭'];

const START_MESSAGE_LINE_1 = '¿Pensaste que zafabas??? ¿Te inventaste un casorio para irte antes?';
const START_MESSAGE_LINE_2 = 'LAS SINIESTRAS TE INFORMAN QUE TU EXPERIENCIA ESTÁ POR LLEGAR...';
const WIN_MESSAGE = '--- ¡DISEÑO DE EXPERIENCIA COMPLETADO! --- \n\nElementos recolectados: 🍣, ✈️, 💜, 👠, 🌭, 🌎... \n\nConclusión: ¡PREPARATIVOS EN MARCHA! 😉 \n\n Lo único que necesitamos es tu confirmación para la noche del: \n\nSÁBADO 20 DE SEPTIEMBRE';
const ALT_DATE_MESSAGE = 'RECALCULANDO...\n¡ALERTA! EL SISTEMA ENCONTRÓ UNA ÚNICA VENTAJA DE OPORTUNIDAD ALTERNATIVA:\n\nVIERNES 19 DE SEPTIEMBRE';

const WHATSAPP_MSG_SATURDAY = 'Yeeeiiiii. Reservo el sábado 20 de septiembre para lo que sea que estén tramando, siniestras. ¡Avisen!';
const WHATSAPP_MSG_FRIDAY = 'El sábado 20 no puedo! pero me libero para el Plan B del viernes 19. Agendado!';

const FONT_STYLE_IMPACT = {
    fontFamily: '"Anton", sans-serif',
    fill: '#E2E8F0',
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

        // --- DISEÑO DE TEXTO MODIFICADO ---
        // Línea 1, más pequeña y en un color secundario
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, START_MESSAGE_LINE_1, { ...FONT_STYLE_IMPACT, fontSize: '32px', fill: '#A0AEC0', wordWrap: { width: 900 } }).setOrigin(0.5);
        
        // Línea 2, más grande y en el color principal
        this.add.text(this.scale.width / 2, this.scale.height / 2, START_MESSAGE_LINE_2, { ...FONT_STYLE_IMPACT, fontSize: '48px', wordWrap: { width: 900 }, lineSpacing: 10 }).setOrigin(0.5);
        
        // --- BOTÓN CON RECTÁNGULO ---
        const buttonWidth = 400;
        const buttonHeight = 80;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height / 2 + 150;

        const buttonRect = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4FD1C5).setStrokeStyle(2, 0x2C7A7B);
        const buttonText = this.add.text(buttonX, buttonY, '¡JUGAR AHORA!', { ...FONT_STYLE_IMPACT, fontSize: '42px', fill: '#1A202C' }).setOrigin(0.5);
        
        // Hacemos el rectángulo interactivo para que toda el área sea un botón
        buttonRect.setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'))
            .on('pointerover', () => buttonRect.fillColor = 0x81E6D9)
            .on('pointerout', () => buttonRect.fillColor = 0x4FD1C5);
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
        
        this.add.rectangle(gameWidth + (sidebarWidth / 2), gameHeight / 2, sidebarWidth, gameHeight, 0x111827).setStrokeStyle(1, 0x4A5568);
        this.add.text(gameWidth + 100, 60, 'PISTAS', { ...FONT_STYLE_IMPACT, fontSize: '40px', fill: '#A0AEC0' }).setOrigin(0.5);
        this.cluesText = this.add.text(gameWidth + 100, 300, '', { ...FONT_STYLE_IMPACT, fontSize: '48px', wordWrap: { width: sidebarWidth - 20 }, align: 'center' }).setOrigin(0.5);

        // --- CAMBIO: Ancho de la barra aumentado de 150 a 200 ---
        this.paddle = this.add.rectangle(gameWidth / 2, gameHeight - 60, 200, 20, 0xffffff);
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

        // --- CAMBIO: Lógica de movimiento ajustada al nuevo ancho de la barra ---
        this.input.on('pointermove', (pointer) => {
            const halfPaddleWidth = this.paddle.displayWidth / 2;
            this.paddle.x = Phaser.Math.Clamp(pointer.x, halfPaddleWidth, gameWidth - halfPaddleWidth);
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
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, WIN_MESSAGE, { ...FONT_STYLE_IMPACT, fontSize: '32px', wordWrap: { width: 900 }, lineSpacing: 15 }).setOrigin(0.5);
        
        const btnAccept = this.add.text(this.scale.width / 2 - 250, this.scale.height - 120, '¡ACEPTO!', { ...FONT_STYLE_IMPACT, fontSize: '48px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive();
        btnAccept.on('pointerdown', () => window.open(`https://wa.me/?text=${encodeURIComponent(WHATSAPP_MSG_SATURDAY)}`, '_blank'));
        btnAccept.on('pointerover', () => btnAccept.setScale(1.1));
        btnAccept.on('pointerout', () => btnAccept.setScale(1));

        const btnDecline = this.add.text(this.scale.width / 2 + 250, this.scale.height - 120, 'IMPOSIBLE', { ...FONT_STYLE_IMPACT, fontSize: '48px', fill: '#E53E3E' }).setOrigin(0.5).setInteractive();
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
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, ALT_DATE_MESSAGE, { ...FONT_STYLE_IMPACT, fontSize: '38px', wordWrap: { width: 900 }, lineSpacing: 15 }).setOrigin(0.5);
        
        const btnPlanB = this.add.text(this.scale.width / 2, this.scale.height - 150, 'ACEPTO PLAN B', { ...FONT_STYLE_IMPACT, fontSize: '48px', fill: '#4FD1C5' }).setOrigin(0.5).setInteractive();
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
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, 'GAME OVER', { ...FONT_STYLE_IMPACT, fontSize: '90px', fill: '#E53E3E' }).setOrigin(0.5);
        
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, 'Eso te pasa por angurrienta, sin completar no hay experiencia.', { ...FONT_STYLE_IMPACT, fontSize: '24px', wordWrap: { width: 600 } }).setOrigin(0.5);
        
        const buttonWidth = 450;
        const buttonHeight = 80;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height / 2 + 130;

        const restartRect = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4FD1C5).setStrokeStyle(2, 0x2C7A7B);
        const restartText = this.add.text(buttonX, buttonY, 'Volver a intentarlo', { ...FONT_STYLE_IMPACT, fontSize: '40px', fill: '#1A202C' }).setOrigin(0.5);

        restartRect.setInteractive()
            .on('pointerdown', () => this.scene.start('GameScene'))
            .on('pointerover', () => restartRect.fillColor = 0x81E6D9)
            .on('pointerout', () => restartRect.fillColor = 0x4FD1C5);
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