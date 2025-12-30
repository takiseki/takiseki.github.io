window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
});

const pages = {
    landing: document.getElementById('landing-page'),
    games: document.getElementById('games-page'),
    favorites: document.getElementById('favorites-page'),
    social: document.getElementById('social-page')
};

let currentPage = 'landing';

function navigateTo(pageName) {
    if (pageName === currentPage || !pages[pageName]) return;
    
    const currentPageEl = pages[currentPage];
    const nextPageEl = pages[pageName];
    
    currentPageEl.classList.add('slide-out');
    
    setTimeout(() => {
        currentPageEl.classList.remove('active', 'slide-out');
        nextPageEl.classList.add('active');
        currentPage = pageName;
        
        updateMusicPlayerState();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        createBlossomBurst(e.clientX, e.clientY);
        setTimeout(() => {
            navigateTo(link.getAttribute('data-page'));
        }, 100);
    });
});

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        createBlossomBurst(e.clientX, e.clientY);
        setTimeout(() => {
            navigateTo('landing');
        }, 100);
    });
});

function createBlossomBurst(x, y) {
    const container = document.getElementById('particle-container');
    const particleCount = 12;
    const symbols = ['🌸', '🌺', '💮', '🏵️'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 80 + Math.random() * 40;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

const musicControlBtn = document.getElementById('music-control-btn');
const audio = document.getElementById('background-music');
const playIcon = musicControlBtn.querySelector('.play-icon');
const pauseIcon = musicControlBtn.querySelector('.pause-icon');
const floatingMusicPlayer = document.getElementById('floating-music-player');
const musicText = document.getElementById('music-text');

let isPlaying = false;

function toggleMusic() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            
            document.body.classList.add('music-playing');
            floatingMusicPlayer.classList.add('playing');
            
            musicText.textContent = 'Playing parano - frozy';
            
            updateMusicPlayerState();
        }).catch((error) => {
            console.log('Playback requires user interaction:', error);
        });
    }
}

function pauseMusic() {
    audio.pause();
    isPlaying = false;
    
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    
    document.body.classList.remove('music-playing');
    floatingMusicPlayer.classList.remove('playing');
    
    musicText.textContent = 'Click to play music';
    
    updateMusicPlayerState();
}

function updateMusicPlayerState() {
    if (currentPage === 'landing') {
        floatingMusicPlayer.classList.remove('compact');
        floatingMusicPlayer.classList.remove('hidden');
    } else {
        if (isPlaying) {
            floatingMusicPlayer.classList.add('compact');
            floatingMusicPlayer.classList.remove('hidden');
        } else {
            floatingMusicPlayer.classList.add('hidden');
        }
    }
}

musicControlBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    createBlossomBurst(e.clientX, e.clientY);
    toggleMusic();
});

document.querySelectorAll('.card, .social-link').forEach(element => {
    element.addEventListener('click', (e) => {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        createBlossomBurst(x, y);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentPage !== 'landing') {
        navigateTo('landing');
    }
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.setProperty('--hover-x', '0px');
        this.style.setProperty('--hover-y', '0px');
    });
    
    card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        this.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

updateMusicPlayerState();

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.nav-link, .back-btn, .music-control-btn')) {
        e.preventDefault();
    }
});

let touchTimeout;
document.querySelectorAll('button, a, .card').forEach(element => {
    element.addEventListener('touchstart', function() {
        touchTimeout = setTimeout(() => {
            this.style.transform = 'scale(0.95)';
        }, 100);
    });
    
    element.addEventListener('touchend', function() {
        clearTimeout(touchTimeout);
        this.style.transform = '';
    });
    
    element.addEventListener('touchcancel', function() {
        clearTimeout(touchTimeout);
        this.style.transform = '';
    });
});

console.log('🌸 Portfolio loaded successfully with enhanced animations!');
