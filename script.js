document.addEventListener('DOMContentLoaded', () => {
    const robotImg = document.getElementById('robot-img');
    const content = document.getElementById('content');
    const parallaxWrapper = document.getElementById('parallax-wrapper');

    // Zoom out animation after a short delay to let the page load
    setTimeout(() => {
        if(robotImg) robotImg.classList.add('zoomed-out');
        if(content) content.classList.add('visible');
        document.body.classList.remove('startup-anim'); // Restore scroll capabilities
    }, 500); // 500ms delay before zooming out

    // Parallax effect: follow cursor
    document.addEventListener('mousemove', (e) => {
        if (!parallaxWrapper) return;
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate offset percentage (-1 to 1)
        const percentX = (mouseX - centerX) / centerX;
        const percentY = (mouseY - centerY) / centerY;
        
        // Max movement in pixels (adjust for stronger/weaker effect)
        const maxMoveX = 30;
        const maxMoveY = 30;
        
        // Move opposite to cursor
        const moveX = percentX * -maxMoveX;
        const moveY = percentY * -maxMoveY;
        
        parallaxWrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
});
