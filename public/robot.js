const RobotController = {
    robot: null,
    leftPupil: null,
    rightPupil: null,
    leftEye: null,
    rightEye: null,
    mouth: null,
    speech: null,
    thought: null,
    core: null,
    container: null,

    state: 'neutral',
    mood: 100, // 0-100 mood meter
    isBlinking: false,
    isSleeping: false,
    blinkInterval: null,
    idleTimer: null,
    idleTime: 0,
    lastActivity: Date.now(),

    // Frases aleatorias
    idlePhrases: [
        '¿Sigues ahí? 👀',
        'Me aburro un poco... 😴',
        '¿En qué puedo ayudarte? 🤔',
        'Esperando instrucciones... 🤖',
        '¡No me dejes solo! 😢',
        '*bosteza* 🥱',
        'Tic tac tic tac... ⏰',
        '¿Hola? ¿Hay alguien? 👋'
    ],

    greetings: [
        '¡Hola! Bienvenido 👋',
        '¡Hey! ¿Qué tal? 😊',
        '¡Genial verte! 🎉',
        '¡Hola amigo! 🤖',
        '¡Bienvenido de vuelta! ✨'
    ],

    successPhrases: [
        '¡Excelente! 🎉',
        '¡Lo lograste! 🏆',
        '¡Perfecto! ✨',
        '¡Genial! 🚀',
        '¡Increíble! 💪'
    ],

    errorPhrases: [
        '¡Ups! Algo salió mal 😅',
        'Mmm, eso no funcionó 🤔',
        'Intentemos de nuevo 💪',
        '¡No te rindas! 🙏',
        'Casi casi... 😬'
    ],

    init() {
        this.robot = document.getElementById('robot');
        this.leftPupil = document.getElementById('leftPupil');
        this.rightPupil = document.getElementById('rightPupil');
        this.leftEye = document.getElementById('leftEye');
        this.rightEye = document.getElementById('rightEye');
        this.mouth = document.getElementById('robotMouth');
        this.speech = document.getElementById('robotSpeech');
        this.thought = document.getElementById('robotThought');
        this.core = document.getElementById('robotCore');
        this.container = document.getElementById('robotContainer');

        this.startEyeTracking();
        this.startBlinking();
        this.startIdleDetection();
        this.startMoodSystem();

        // Saludo inicial aleatorio
        setTimeout(() => {
            const greeting = this.greetings[Math.floor(Math.random() * this.greetings.length)];
            this.speak(greeting);
            this.wave();
            this.jump();
        }, 800);

        console.log('🤖 Robot inicializado con interacciones avanzadas');
    },

    // ==================== EYE TRACKING ====================
    startEyeTracking() {
        document.addEventListener('mousemove', (e) => {
            if (this.isBlinking || this.isSleeping) return;

            this.registerActivity();

            const robotRect = this.robot.getBoundingClientRect();
            const robotCenterX = robotRect.left + robotRect.width / 2;
            const robotCenterY = robotRect.top + 50;

            const deltaX = e.clientX - robotCenterX;
            const deltaY = e.clientY - robotCenterY;

            const maxMove = 9;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            let normalizedX = 0;
            let normalizedY = 0;

            if (distance > 0) {
                normalizedX = (deltaX / distance) * Math.min(distance / 25, 1) * maxMove;
                normalizedY = (deltaY / distance) * Math.min(distance / 25, 1) * maxMove;
            }

            if (this.leftPupil && this.rightPupil) {
                this.leftPupil.style.transform = `translate(calc(-50% + ${normalizedX}px), calc(-50% + ${normalizedY}px))`;
                this.rightPupil.style.transform = `translate(calc(-50% + ${normalizedX}px), calc(-50% + ${normalizedY}px))`;
            }
        });
    },

    // ==================== BLINKING ====================
    startBlinking() {
        const blink = () => {
            if (this.state === 'love' || this.state === 'amazed' || this.state === 'dizzy' || this.isSleeping) return;

            this.isBlinking = true;
            this.leftEye.classList.add('blink');
            this.rightEye.classList.add('blink');

            setTimeout(() => {
                this.leftEye.classList.remove('blink');
                this.rightEye.classList.remove('blink');
                this.isBlinking = false;
            }, 150);
        };

        const scheduleBlink = () => {
            const delay = 2000 + Math.random() * 4000;
            this.blinkInterval = setTimeout(() => {
                blink();
                scheduleBlink();
            }, delay);
        };

        scheduleBlink();
    },

    // ==================== IDLE DETECTION ====================
    startIdleDetection() {
        const idleIndicator = document.getElementById('idleIndicator');

        setInterval(() => {
            const now = Date.now();
            this.idleTime = (now - this.lastActivity) / 1000;

            // Después de 10 segundos sin actividad
            if (this.idleTime > 10 && this.idleTime < 30 && !this.isSleeping) {
                if (Math.random() < 0.1) { // 10% de probabilidad cada segundo
                    const phrase = this.idlePhrases[Math.floor(Math.random() * this.idlePhrases.length)];
                    this.think(phrase);
                }
            }

            // Después de 30 segundos, se duerme
            if (this.idleTime > 30 && !this.isSleeping) {
                this.sleep();
                idleIndicator.classList.add('show');
            }

            // Después de 60 segundos, ronca
            if (this.idleTime > 60 && this.isSleeping) {
                if (Math.random() < 0.2) {
                    this.snore();
                }
            }

        }, 1000);
    },

    registerActivity() {
        const wasAsleep = this.isSleeping;
        this.lastActivity = Date.now();
        this.idleTime = 0;

        document.getElementById('idleIndicator').classList.remove('show');

        if (wasAsleep) {
            this.wakeUp();
        }
    },

    // ==================== MOOD SYSTEM ====================
    startMoodSystem() {
        // El mood baja lentamente con el tiempo
        setInterval(() => {
            if (!this.isSleeping && this.mood > 50) {
                this.mood -= 0.5;
                this.updateMoodDisplay();
            }
        }, 5000);
    },

    updateMoodDisplay() {
        if (this.mood >= 80) {
            this.core.textContent = '💚';
        } else if (this.mood >= 60) {
            this.core.textContent = '💛';
        } else if (this.mood >= 40) {
            this.core.textContent = '🧡';
        } else {
            this.core.textContent = '💔';
        }
    },

    increaseMood(amount) {
        this.mood = Math.min(100, this.mood + amount);
        this.updateMoodDisplay();
    },

    decreaseMood(amount) {
        this.mood = Math.max(0, this.mood - amount);
        this.updateMoodDisplay();
    },

    // ==================== STATES ====================
    setState(state, duration = null) {
        this.state = state;
        this.robot.className = 'robot';
        this.mouth.className = 'robot-mouth';
        this.speech.classList.remove('error', 'warning');

        switch(state) {
            case 'happy':
                this.robot.classList.add('happy');
                this.mouth.classList.add('smile');
                break;
            case 'very-happy':
                this.robot.classList.add('happy', 'excited');
                this.mouth.classList.add('big-smile');
                break;
            case 'sad':
                this.robot.classList.add('sad');
                this.mouth.classList.add('sad');
                break;
            case 'surprised':
                this.mouth.classList.add('surprised');
                break;
            case 'thinking':
                this.robot.classList.add('thinking');
                break;
            case 'love':
                this.robot.classList.add('love');
                this.mouth.classList.add('smile');
                break;
            case 'amazed':
                this.robot.classList.add('amazed');
                this.mouth.classList.add('surprised');
                break;
            case 'angry':
                this.robot.classList.add('angry');
                this.mouth.classList.add('angry');
                break;
            case 'worried':
                this.robot.classList.add('worried');
                break;
            case 'confused':
                this.robot.classList.add('confused');
                break;
            case 'silly':
                this.robot.classList.add('silly');
                this.mouth.classList.add('smile');
                break;
            case 'dizzy':
                this.robot.classList.add('dizzy');
                break;
            case 'sleeping':
                this.robot.classList.add('sleeping');
                break;
            case 'alert':
                this.robot.classList.add('alert');
                break;
            case 'success':
                this.robot.classList.add('success', 'happy');
                this.mouth.classList.add('big-smile');
                break;
        }

        if (duration) {
            setTimeout(() => this.setState('neutral'), duration);
        }
    },

    // ==================== SPEECH ====================
    speak(message, duration = 3500, type = 'normal', silent = false) {
        if (!silent) this.registerActivity();
        this.speech.textContent = message;
        this.speech.className = 'robot-speech show';

        if (type === 'error') {
            this.speech.classList.add('error');
        } else if (type === 'warning') {
            this.speech.classList.add('warning');
        }

        // Animación de hablar
        this.mouth.classList.add('talking');

        setTimeout(() => {
            this.mouth.classList.remove('talking');
        }, Math.min(duration - 500, 2000));

        setTimeout(() => {
            this.speech.classList.remove('show');
        }, duration);
    },

    think(message, duration = 3000) {
        this.thought.textContent = message;
        this.thought.classList.add('show');
        this.setState('thinking');

        setTimeout(() => {
            this.thought.classList.remove('show');
            if (this.state === 'thinking') {
                this.setState('neutral');
            }
        }, duration);
    },

    // ==================== ANIMATIONS ====================
    wave() {
        this.robot.classList.add('wave');
        setTimeout(() => this.robot.classList.remove('wave'), 1600);
    },

    celebrate() {
        this.robot.classList.add('celebrate', 'excited');
        setTimeout(() => {
            this.robot.classList.remove('celebrate', 'excited');
        }, 3000);
    },

    clap() {
        this.robot.classList.add('clapping');
        setTimeout(() => this.robot.classList.remove('clapping'), 2000);
    },

    dance() {
        this.robot.classList.add('dancing');
        setTimeout(() => this.robot.classList.remove('dancing'), 4000);
    },

    jump() {
        this.robot.classList.add('jumping');
        setTimeout(() => this.robot.classList.remove('jumping'), 500);
    },

    walk() {
        this.robot.classList.add('walking');
        setTimeout(() => this.robot.classList.remove('walking'), 3000);
    },

    point() {
        this.robot.classList.add('pointing');
        setTimeout(() => this.robot.classList.remove('pointing'), 2000);
    },

    // ==================== SLEEP SYSTEM ====================
    sleep() {
        this.isSleeping = true;
        this.setState('sleeping');
        this.speak('💤 Zzz...', 2000, 'normal', true);
    },

    wakeUp() {
        this.isSleeping = false;
        this.setState('surprised', 1500);
        this.speak('¡Oh! ¡Estás aquí! 😊', 2500);
        this.jump();
        this.increaseMood(10);

        setTimeout(() => {
            this.setState('happy', 2000);
        }, 1500);
    },

    snore() {
        this.emitEmoji('💤');
    },

    // ==================== EMOJI REACTIONS ====================
    emitEmoji(emoji, count = 1) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const emojiEl = document.createElement('div');
                emojiEl.className = 'emoji-reaction';
                emojiEl.textContent = emoji;
                emojiEl.style.left = (this.robot.getBoundingClientRect().left + Math.random() * 100) + 'px';
                emojiEl.style.top = (this.robot.getBoundingClientRect().top + 50) + 'px';
                document.body.appendChild(emojiEl);

                setTimeout(() => emojiEl.remove(), 1500);
            }, i * 200);
        }
    },

    // ==================== PARTICLES ====================
    createParticles(color = null) {
        const colors = color ? [color] : ['#4CAF50', '#81C784', '#A5D6A7', '#FFD700', '#FFF'];

        for (let i = 0; i < 35; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = (Math.random() * 100) + 'vw';
                particle.style.bottom = '0';
                particle.style.width = (Math.random() * 12 + 5) + 'px';
                particle.style.height = particle.style.width;
                                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.animation = `particle-rise ${Math.random() * 2 + 2}s ease-out forwards`;

                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 4000);
            }, i * 40);
        }
    },

    // ==================== COMPLEX REACTIONS ====================

    // Celebración completa
    fullCelebration(message) {
        this.registerActivity();
        this.increaseMood(30);
        this.setState('very-happy');
        this.speak(message || this.successPhrases[Math.floor(Math.random() * this.successPhrases.length)], 4000);
        this.celebrate();
        this.createParticles();
        this.emitEmoji('🎉', 5);

        setTimeout(() => {
            this.clap();
            this.emitEmoji('⭐', 3);
        }, 1500);

        setTimeout(() => {
            this.dance();
        }, 3000);

        setTimeout(() => {
            this.setState('happy', 3000);
        }, 5000);
    },

    // Error con reacción
    showError(message) {
        this.registerActivity();
        this.decreaseMood(15);
        this.setState('sad');
        const errorMsg = message || this.errorPhrases[Math.floor(Math.random() * this.errorPhrases.length)];
        this.speak(errorMsg, 3500, 'error');
        this.emitEmoji('😢', 2);

        setTimeout(() => {
            this.setState('worried', 2000);
            this.speak('¡Intentemos de nuevo! 💪', 2500);
        }, 3500);
    },

    // Pensando
    showThinking() {
        this.registerActivity();
        this.setState('thinking');
        this.speak('Procesando... 🤔', 2500);
        this.emitEmoji('💭', 2);
    },

    // Sorprendido
    showSurprised(message) {
        this.registerActivity();
        this.setState('surprised');
        this.speak(message || '¡Oh! 😮', 2500);
        this.jump();
        this.emitEmoji('❗', 2);

        setTimeout(() => this.setState('neutral'), 3000);
    },

    // Enamorado
    showLove(message) {
        this.registerActivity();
        this.increaseMood(20);
        this.setState('love');
        this.speak(message || '¡Me encantas! 💕', 3000);
        this.emitEmoji('❤️', 5);
        this.dance();

        setTimeout(() => this.setState('happy', 2000), 3500);
    },

    // Asombrado
    showAmazed(message) {
        this.registerActivity();
        this.increaseMood(15);
        this.setState('amazed');
        this.speak(message || '¡Increíble! ⭐', 3000);
        this.emitEmoji('✨', 4);

        setTimeout(() => this.setState('happy', 2000), 3500);
    },

    // Enojado
    showAngry(message) {
        this.registerActivity();
        this.decreaseMood(20);
        this.setState('angry');
        this.speak(message || '¡Grr! 😠', 3000, 'error');
        this.emitEmoji('💢', 3);

        setTimeout(() => {
            this.setState('neutral');
            this.speak('Ok, ya pasó... 😤', 2000);
        }, 3500);
    },

    // Confundido
    showConfused(message) {
        this.registerActivity();
        this.setState('confused');
        this.speak(message || '¿Eh? No entiendo... 🤨', 3000);
        this.emitEmoji('❓', 2);

        setTimeout(() => this.setState('neutral'), 3500);
    },

    // Tonto/Gracioso
    showSilly() {
        this.registerActivity();
        this.increaseMood(10);
        this.setState('silly');
        this.speak('¡Bleh! 😜', 2500);
        this.emitEmoji('😝', 3);
        this.dance();

        setTimeout(() => this.setState('happy', 2000), 3000);
    },

    // Mareado
    showDizzy() {
        this.registerActivity();
        this.setState('dizzy');
        this.speak('Estoy mareado... 😵', 3000);
        this.emitEmoji('💫', 3);

        setTimeout(() => {
            this.setState('neutral');
            this.speak('Ya estoy mejor 😅', 2000);
        }, 3500);
    },

    // Alerta
    showAlert(message) {
        this.registerActivity();
        this.setState('alert');
        this.speak(message || '¡Atención! ⚠️', 3000, 'warning');
        this.emitEmoji('⚠️', 2);
        this.jump();

        setTimeout(() => this.setState('neutral'), 3500);
    },

    // ==================== INPUT REACTIONS ====================
    onTyping() {
        this.registerActivity();
        if (this.state !== 'happy' && this.state !== 'sad' && this.state !== 'love') {
            this.mouth.style.width = '35px';
            setTimeout(() => {
                this.mouth.style.width = '';
            }, 150);
        }
    },

    onInputFocus(inputType) {
        this.registerActivity();

        const reactions = {
            'password': { msg: 'Tu secreto está seguro 🔒', state: 'neutral', action: () => this.point() },
            'email': { msg: 'Necesito tu correo 📧', state: 'neutral' }
        };

        const reaction = reactions[inputType];
        if (reaction) {
            this.speak(reaction.msg, 2500);
            if (reaction.state) this.setState(reaction.state, 3000);
            if (reaction.action) reaction.action();
        }
    },

    onPasswordTyping(length) {
        this.registerActivity();

        if (length === 0) {
            this.setState('neutral');
        } else if (length < 4) {
            this.setState('worried');
            if (length === 1) this.speak('Muy corta... 😟', 1500);
        } else if (length < 6) {
            this.setState('thinking');
        } else if (length < 8) {
            this.setState('happy');
            if (length === 6) this.speak('¡Va mejorando! 👍', 1500);
        } else {
            this.setState('very-happy');
            if (length === 8) {
                this.speak('¡Excelente contraseña! 💪', 2000);
                this.emitEmoji('💪', 2);
            }
        }
    }
};

// ==================== PARTICLES BACKGROUND ====================
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            // Atracción suave hacia el mouse
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                this.x += dx * 0.01;
                this.y += dy * 0.01;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(76, 175, 80, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 60; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(76, 175, 80, ${(120 - dist) / 120 * 0.15})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
}

window.RobotController = RobotController;
window.initParticles = initParticles;
