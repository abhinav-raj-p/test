const canvas = document.getElementById('warpCanvas');
const ctx = canvas.getContext('2d');
const innerCanvas = document.getElementById('innerCanvas');
const ctxInner = innerCanvas.getContext('2d');

const whiteOverlay = document.getElementById('white-overlay');
const dashboardSection = document.getElementById('dashboard-section');
const miniRing = document.getElementById('mini-ring-target');
const fadeElements = document.querySelectorAll('.fade-element');

const quoteSection = document.getElementById('quote-section');
const glowingDome = document.getElementById('glowing-dome');
const quoteContent = document.getElementById('quote-content');
const spacerQuote = document.getElementById('spacer-quote');

const timelineSection = document.getElementById('timeline-section');
const spacerTimeline = document.getElementById('spacer-timeline');
const timelinePathFill = document.getElementById('timeline-fill');
const timelineDot = document.getElementById('timeline-dot');

// Global canvas setup
let width, height, centerX, centerY;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    centerX = width / 2;
    centerY = height / 2;
    
    // Inner canvas handles sharp 300x300 rendering inside the 150x150 ring
    if (innerCanvas) {
        innerCanvas.width = 300;
        innerCanvas.height = 300;
    }
}
window.addEventListener('resize', resize);
resize();

const colors = ['#00ffa2', '#e1ff00', '#ff00d4', '#00e5ff', '#ff8c00'];

class Particle {
    constructor(index) {
        this.index = index;
        this.isRingParticle = index < 60; 
        
        this.reset3D();
        this.z = Math.random() * width; 
    }

    reset3D() {
        this.mode = '3D';
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 400 + 100;
        this.x3d = Math.cos(angle) * radius;
        this.y3d = Math.sin(angle) * radius;
        this.z = width;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speed = Math.random() * 4 + 2;
        this.length3d = Math.random() * 1.5 + 0.8;
        
        this.ringTheta = this.isRingParticle ? (this.index / 60) * Math.PI * 2 + (Math.random() * 0.1) : 0;
        this.ringRadiusOffset = (Math.random() * 10 - 5);
        this.ringDashLength = Math.random() * 0.15 + 0.05;
        this.startX = undefined;
        this.startY = undefined;
    }

    update(p) {
        if (p < 0.3) {
            if (this.mode !== '3D') {
                this.mode = '3D';
                this.startX = undefined;
            }
            const speedMultiplier = 1 + (p / 0.3) * 35; 
            this.z -= this.speed * speedMultiplier;
            if (this.z <= 10) this.reset3D();
            
        } else if (p < 0.4) {
            if (this.mode === '3D') {
                this.mode = 'MORPHING';
                const fov = 400;
                const scale = fov / Math.max(1, this.z);
                this.startX = this.x3d * scale + centerX;
                this.startY = this.y3d * scale + centerY;
            }
            
            if (!this.isRingParticle) {
                this.z -= this.speed * 8;
                if (this.z <= 10) this.reset3D();
            }
        } else {
            if (this.mode !== '2D') this.mode = '2D';
        }
    }

    draw3D(ctxLocal) {
        const fov = 400;
        const scale = fov / Math.max(1, this.z);
        const x2d = this.x3d * scale + centerX;
        const y2d = this.y3d * scale + centerY;

        const prevZ = this.z + this.speed * this.length3d * 20;
        const prevScale = fov / prevZ;
        const prevX2d = this.x3d * prevScale + centerX;
        const prevY2d = this.y3d * prevScale + centerY;

        const thickness = Math.max(2, Math.min(25, scale * 3.5));
        const alpha = Math.min(1, Math.max(0, (width - this.z) / (width * 0.8)));

        const currentAlpha = ctxLocal.globalAlpha;
        ctxLocal.globalAlpha = currentAlpha * alpha;
        
        ctxLocal.beginPath();
        ctxLocal.moveTo(prevX2d, prevY2d);
        ctxLocal.lineTo(x2d, y2d);
        ctxLocal.strokeStyle = this.color;
        ctxLocal.lineWidth = thickness;
        ctxLocal.lineCap = 'round';
        ctxLocal.stroke();
        
        ctxLocal.globalAlpha = currentAlpha;
    }

    drawGlobal(ctxLocal, ringRect, p, globalRingAngle) {
        if (p < 0.3) {
            this.draw3D(ctxLocal);
        } else if (p < 0.4) {
            if (!this.isRingParticle) {
                const fade = 1 - ((p - 0.3) / 0.1);
                ctxLocal.globalAlpha = Math.max(0, fade);
                this.draw3D(ctxLocal);
                ctxLocal.globalAlpha = 1.0;
            } else {
                const morphP = (p - 0.3) / 0.1;
                const ease = 1 - Math.pow(1 - morphP, 3);
                
                const targetCX = ringRect.left + ringRect.width / 2;
                const targetCY = ringRect.top + ringRect.height / 2;
                const targetRadius = (ringRect.width / 2) * 0.75 + this.ringRadiusOffset * (ringRect.width / 150);
                
                const currentAngle = this.ringTheta + globalRingAngle;
                const targetX = targetCX + Math.cos(currentAngle) * targetRadius;
                const targetY = targetCY + Math.sin(currentAngle) * targetRadius;
                
                const sX = this.startX !== undefined ? this.startX : targetX;
                const sY = this.startY !== undefined ? this.startY : targetY;
                
                const drawX = sX + (targetX - sX) * ease;
                const drawY = sY + (targetY - sY) * ease;
                
                const dx = Math.cos(currentAngle);
                const dy = Math.sin(currentAngle);
                const dashLength = (this.ringDashLength * targetRadius) * ease + 2; 
                
                ctxLocal.beginPath();
                ctxLocal.moveTo(drawX, drawY);
                ctxLocal.lineTo(drawX + dx * dashLength, drawY + dy * dashLength);
                ctxLocal.strokeStyle = this.color;
                ctxLocal.lineWidth = 3 * (ringRect.width / 150);
                ctxLocal.lineCap = 'round';
                ctxLocal.stroke();
            }
        } else {
            if (!this.isRingParticle) return;
            
            const targetCX = ringRect.left + ringRect.width / 2;
            const targetCY = ringRect.top + ringRect.height / 2;
            const targetRadius = (ringRect.width / 2) * 0.75 + this.ringRadiusOffset * (ringRect.width / 150);
            const currentAngle = this.ringTheta + globalRingAngle;
            
            ctxLocal.beginPath();
            ctxLocal.arc(targetCX, targetCY, targetRadius, currentAngle, currentAngle + this.ringDashLength);
            ctxLocal.strokeStyle = this.color;
            ctxLocal.lineWidth = 3 * (ringRect.width / 150); 
            ctxLocal.lineCap = 'round';
            ctxLocal.stroke();
        }
    }
    
    drawInner(ctxInner, globalRingAngle) {
        if (!this.isRingParticle) return;
        const currentAngle = this.ringTheta + globalRingAngle;
        const cx = 150;
        const cy = 150;
        const targetRadius = 150 * 0.75 + this.ringRadiusOffset * 2; 
        
        ctxInner.beginPath();
        ctxInner.arc(cx, cy, targetRadius, currentAngle, currentAngle + this.ringDashLength);
        ctxInner.strokeStyle = this.color;
        ctxInner.lineWidth = 6; 
        ctxInner.lineCap = 'round';
        ctxInner.stroke();
    }
}

const particles = [];
for (let i = 0; i < 400; i++) {
    particles.push(new Particle(i));
}

let originX, originY, translateX, translateY;
const initialScale = 3.0; 
let finalScale = 0.85; // Dynamically calculated

function calculateLayout() {
    dashboardSection.style.transform = 'none';
    const dashRect = dashboardSection.getBoundingClientRect();
    const ringRect = miniRing.getBoundingClientRect();
    
    // Dynamically calculate finalScale to ensure the entire dashboard fits in the window
    const heading = document.querySelector('.main-heading');
    const ipad = document.querySelector('.ipad-mockup');
    if (heading && ipad) {
        const headingRect = heading.getBoundingClientRect();
        const ipadRect = ipad.getBoundingClientRect();
        const contentHeight = ipadRect.bottom - headingRect.top;
        const contentWidth = ipadRect.width;
        
        // Target 85% of window height and 90% of window width
        const scaleY = (window.innerHeight * 0.85) / contentHeight;
        const scaleX = (window.innerWidth * 0.90) / contentWidth;
        
        finalScale = Math.min(scaleX, scaleY, 1.0); // Never scale up beyond 1.0
    }
    
    const screenCX = window.innerWidth / 2;
    const screenCY = window.innerHeight / 2;
    
    const ringCX = ringRect.left + ringRect.width / 2;
    const ringCY = ringRect.top + ringRect.height / 2;
    
    originX = ringCX - dashRect.left;
    originY = ringCY - dashRect.top;
    translateX = screenCX - ringCX;
    translateY = screenCY - ringCY;
    
    dashboardSection.style.transformOrigin = `${originX}px ${originY}px`;
}
window.addEventListener('load', calculateLayout);
window.addEventListener('resize', calculateLayout);

// Mouse Hover Tilt
let targetTiltX = 0;
let targetTiltY = 0;
let currentTiltX = 0;
let currentTiltY = 0;

window.addEventListener('mousemove', (e) => {
    // Only apply tilt when fully zoomed out and interactive
    if (!dashboardSection.classList.contains('interactive')) {
        targetTiltX = 0;
        targetTiltY = 0;
        return;
    }
    
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    // Mouse down -> mouseY > 0 -> top tilts forward -> rotateX > 0
    targetTiltX = mouseY * 20; 
    targetTiltY = -mouseX * 20; 
});

window.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
});

let globalDashboardOpacity = 0;

function updateScrollVisuals(p) {
    let easeProgress = 0;
    
    if (p < 0.4) {
        easeProgress = 0;
        globalDashboardOpacity = 0;
    } else {
        let zoomP = (p - 0.4) / 0.6;
        easeProgress = 1 - Math.pow(1 - zoomP, 3);
        globalDashboardOpacity = zoomP;
    }
    
    const scale = finalScale + ((initialScale - finalScale) * (1 - easeProgress));
    const currentTx = translateX * (1 - easeProgress);
    const currentTy = translateY * (1 - easeProgress);
    
    // Include 3D perspective and tilting!
    dashboardSection.style.transform = `perspective(1500px) translate(${currentTx}px, ${currentTy}px) scale(${scale}) rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
    
    document.documentElement.style.setProperty('--ipad-bezel-opacity', globalDashboardOpacity);
    document.documentElement.style.setProperty('--ipad-screen-opacity', globalDashboardOpacity);
    document.documentElement.style.setProperty('--card-opacity', globalDashboardOpacity);
    
    const fadeOp = Math.max(0, (globalDashboardOpacity - 0.2) * 1.25);
    fadeElements.forEach(el => { el.style.opacity = fadeOp; });
    whiteOverlay.style.opacity = fadeOp;
    
    const currentScrollY = window.scrollY;
    const currentMaxDashScroll = Math.max(1, window.innerHeight * 3);
    
    if (p > 0.7 && currentScrollY <= currentMaxDashScroll) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
    if (p === 1) {
        dashboardSection.classList.add('interactive');
    } else {
        dashboardSection.classList.remove('interactive');
    }
}

let globalRingAngle = 0;

function animate() {
    const scrollY = window.scrollY;
    
    // The original maxScroll was the body's scroll height when ONLY .spacer (400vh) existed.
    // Therefore, the original maxScroll was 400vh - 100vh = 300vh.
    const maxDashScroll = Math.max(1, window.innerHeight * 3);
    
    const p = Math.min(Math.max(scrollY / maxDashScroll, 0), 1);
    
    globalRingAngle += 0.015;
    
    // Smoothly interpolate the 3D tilt
    currentTiltX += (targetTiltX - currentTiltX) * 0.1;
    currentTiltY += (targetTiltY - currentTiltY) * 0.1;
    
    updateScrollVisuals(p);
    
    ctx.clearRect(0, 0, width, height); 
    if (ctxInner) ctxInner.clearRect(0, 0, 300, 300);
    
    const ringRect = miniRing.getBoundingClientRect();
    
    // The global canvas crossfades out as the inner canvas fades in (with the dashboard)
    // This allows the inner canvas to perfectly inherit the 3D tilt effect!
    const globalRingAlpha = 1 - globalDashboardOpacity;
    
    particles.forEach(part => {
        part.update(p);
        
        // Draw to global full-screen canvas
        if (p < 0.4 || globalRingAlpha > 0) {
            const tempAlpha = ctx.globalAlpha;
            ctx.globalAlpha = p >= 0.4 ? globalRingAlpha : 1.0;
            part.drawGlobal(ctx, ringRect, p, globalRingAngle);
            ctx.globalAlpha = tempAlpha;
        }
        
        // Draw to inner canvas (which handles the tilted state)
        if (p >= 0.4 && ctxInner) {
            part.drawInner(ctxInner, globalRingAngle);
        }
    });

    // Sequence Architecture Math
    const h = window.innerHeight;
    
    let dashY = 0;
    let quoteY = h;
    let timelineY = h;
    let contactY = h;
    
    // Timeline limits
    const quoteStart = maxDashScroll;
    const maxQuoteScroll = spacerQuote ? spacerQuote.scrollHeight : 0;
    const timelineStart = quoteStart + maxQuoteScroll;
    const maxTimelineScroll = spacerTimeline ? spacerTimeline.scrollHeight : 0;
    const contactStart = timelineStart + maxTimelineScroll;

    // Simulated Native Scrolling Logic
    if (scrollY > quoteStart) {
        const yOffset = -(scrollY - quoteStart);
        const currentTransform = dashboardSection.style.transform;
        dashboardSection.style.transform = `translateY(${yOffset}px) ` + currentTransform;
        whiteOverlay.style.transform = `translateY(${yOffset}px)`;
        canvas.style.transform = `translateY(${yOffset}px)`;
        
        quoteY = h - (scrollY - quoteStart);
        if (scrollY > quoteStart + h) {
            quoteY = 0;
        }
        if (scrollY > timelineStart) {
            quoteY = -(scrollY - timelineStart);
        }
    } else {
        whiteOverlay.style.transform = `none`;
        canvas.style.transform = `none`;
    }

    if (scrollY > timelineStart) {
        timelineY = h - (scrollY - timelineStart);
        if (scrollY > timelineStart + h) {
            timelineY = 0;
        }
        if (scrollY > contactStart) {
            timelineY = -(scrollY - contactStart);
        }
    }

    if (scrollY > contactStart) {
        contactY = h - (scrollY - contactStart);
        if (scrollY > contactStart + h) {
            contactY = 0;
        }
    }

    // Apply translations
    if (quoteSection) quoteSection.style.transform = `translateY(${quoteY}px)`;
    if (timelineSection) timelineSection.style.transform = `translateY(${timelineY}px)`;
    const contactSection = document.getElementById('contact-section');
    if (contactSection) contactSection.style.transform = `translateY(${contactY}px)`;

    // Calculate Quote Physics
    if (quoteSection) {
        let pQuote = (scrollY - quoteStart) / maxQuoteScroll;
        pQuote = Math.min(Math.max(pQuote, 0), 1);
        
        const easeQuote = Math.pow(pQuote, 2); 
        const domeScale = 1 + (easeQuote * 4.5); 
        const domeTy = 80 - (easeQuote * 60); 
        
        glowingDome.style.transform = `translateY(${domeTy}vh) scale(${domeScale})`;
        
        let textOpacity = 1 - ((pQuote - 0.4) / 0.3);
        textOpacity = Math.min(Math.max(textOpacity, 0), 1);
        quoteContent.style.opacity = textOpacity;
    }
    
    // Calculate Timeline SVG Physics
    if (timelineSection && timelinePathFill && timelineDot) {
        const timelineSvg = document.getElementById('timeline-svg');
        const animStart = timelineStart + h;
        const animScroll = maxTimelineScroll - h;
        let pTimeline = (scrollY - animStart) / animScroll;
        pTimeline = Math.min(Math.max(pTimeline, 0), 1);
        
        const drawProgress = pTimeline;
        
        if (timelineSvg) {
            const svgHeight = timelineSvg.getBoundingClientRect().height;
            const maxSvgScroll = Math.max(0, svgHeight - h);
            timelineSvg.style.transform = `translateY(-${drawProgress * maxSvgScroll}px)`;
        }
        
        const pathLength = timelinePathFill.getTotalLength();
        timelinePathFill.style.strokeDasharray = pathLength;
        
        const drawLength = pathLength * drawProgress;
        timelinePathFill.style.strokeDashoffset = pathLength - drawLength;
        
        if (drawLength > 1) {
            timelineDot.setAttribute('opacity', '1');
            const point = timelinePathFill.getPointAtLength(drawLength);
            timelineDot.setAttribute('cx', point.x);
            timelineDot.setAttribute('cy', point.y);
        } else {
            timelineDot.setAttribute('opacity', '0');
        }
        
        document.getElementById('m-born').classList.toggle('active', drawProgress > 0.01);
        document.getElementById('m-22').classList.toggle('active', drawProgress > 0.25);
        document.getElementById('m-26').classList.toggle('active', drawProgress > 0.50);
        document.getElementById('m-31').classList.toggle('active', drawProgress > 0.75);
        document.getElementById('m-41').classList.toggle('active', drawProgress > 0.98);
    }

    requestAnimationFrame(animate);
}

calculateLayout();
animate();

// Gmail Form Logic
const gmailForm = document.getElementById('gmail-form');
if (gmailForm) {
    gmailForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fname = document.getElementById('fname').value;
        const lname = document.getElementById('lname').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        const fullSubject = encodeURIComponent(subject);
        const fullBody = encodeURIComponent(`From: ${fname} ${lname}\n\n${message}`);
        
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=email@example.com&su=${fullSubject}&body=${fullBody}`;
        window.open(gmailUrl, '_blank');
    });
}

// AI Chatbot Logic
const chatFab = document.getElementById('chat-fab');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendChat = document.getElementById('send-chat');
const chatMessages = document.getElementById('chat-messages');

if (chatFab && chatWindow) {
    chatFab.addEventListener('click', () => {
        chatWindow.classList.add('open');
        chatInput.focus();
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        // Add a temporary loading message
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.textContent = 'Thinking...';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Using Pollinations AI - a free, no-key text generation API
            const response = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant on Abhinav\'s portfolio website. Keep your answers brief, friendly, and professional.' },
                        { role: 'user', content: text }
                    ]
                })
            });

            if (!response.ok) throw new Error('API Error');
            const replyText = await response.text(); // Pollinations returns raw text
            
            loadingDiv.remove();
            appendMessage(replyText, 'ai');
        } catch (error) {
            loadingDiv.remove();
            appendMessage('Sorry, I encountered an error connecting to the AI.', 'ai');
            console.error('Chat error:', error);
        }
    };

    sendChat.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}
