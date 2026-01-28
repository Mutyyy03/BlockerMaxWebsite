document.addEventListener('DOMContentLoaded', () => {
    // 1. Animate Hero Badge first
    const badge = document.querySelector('.hero-badge');
    if (badge) {
        badge.style.opacity = '0';
        badge.style.transform = 'translateY(20px)';
        badge.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transform = 'translateY(0)';
        }, 300);
    }

    // 2. Animate Title
    const title = document.querySelector('.hero-title');
    const subtitle = document.querySelector('.hero-subtitle-sub');
    const storeButtons = document.querySelector('.store-buttons');

    if (title) {
        title.innerHTML = '';
        const titleLines = ["Quit your porn addiction", "with BlockerMax"];
        const titleStartDelay = 800;
        let globalWordIndex = 0;

        titleLines.forEach((lineText, lineIndex) => {
            const words = lineText.split(' ');
            words.forEach(word => {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.className = 'hero-word';
                span.style.animationDelay = `${titleStartDelay + (globalWordIndex * 150)}ms`;
                title.appendChild(span);
                globalWordIndex++;
            });
            if (lineIndex < titleLines.length - 1) title.appendChild(document.createElement('br'));
        });

        // 3. Animate Subtitle after Title
        if (subtitle) {
            const subtitleText = subtitle.innerText;
            subtitle.innerText = '';
            const subtitleWords = subtitleText.split(' ');
            const subtitleStartDelay = titleStartDelay + (globalWordIndex * 150) + 400;

            subtitleWords.forEach((word, index) => {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.className = 'hero-subtitle-word';
                span.style.animationDelay = `${subtitleStartDelay + (index * 100)}ms`;
                subtitle.appendChild(span);
            });

            // 4. Animate Badges last
            if (storeButtons) {
                const buttonsDelay = subtitleStartDelay + (subtitleWords.length * 100) + 300;
                storeButtons.style.animation = 'none'; // Reset CSS animation
                storeButtons.style.opacity = '0';
                setTimeout(() => {
                    storeButtons.style.animation = `appleReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;
                }, buttonsDelay);
            }
        }
    }

    // Reveal Stat Text on Scroll
    const statText = document.querySelector('.stat-text');
    const infoSection = document.querySelector('.info');

    if (statText && infoSection) {
        // Extract text processing logic
        const originalHTML = statText.innerHTML;
        let mainText = statText.childNodes[0].nodeValue || statText.innerText;
        let suffixHTML = '';

        if (statText.children.length > 0) {
            const citation = statText.querySelector('.citation');
            if (citation) {
                mainText = mainText.replace(citation.innerText, '').trim();
                suffixHTML = `<br><span class="citation">${citation.innerHTML}</span>`;
            }
        }

        statText.innerHTML = '';
        const words = mainText.trim().split(' ');

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word + (index < words.length - 1 ? ' ' : '');
            statText.appendChild(span);
        });

        statText.insertAdjacentHTML('beforeend', suffixHTML);
        let spans = Array.from(statText.querySelectorAll('span:not(.citation)'));

        const revealText = () => {
            const sectionTop = infoSection.offsetTop;
            const sectionHeight = infoSection.offsetHeight;
            const viewportHeight = window.innerHeight;
            const scrollY = window.scrollY;

            // Start logic
            const startScroll = sectionTop - viewportHeight * 0.2; // Start earlier or later depending on feel, 0.2 means when 20% of viewport is past top
            const endScroll = startScroll + (viewportHeight * 0.6); // Finish faster (0.6 screen height)

            let progress = (scrollY - startScroll) / (endScroll - startScroll);
            progress = Math.max(0, Math.min(1, progress));

            const wordCount = spans.length;
            const activeWordCount = Math.floor(progress * wordCount);

            spans.forEach((span, index) => {
                if (index < activeWordCount) {
                    span.classList.add('active');
                } else {
                    span.classList.remove('active');
                }
            });
        };

        window.addEventListener('scroll', revealText);
        revealText();
    }

    // Background Music & Popup Logic
    const audio = document.getElementById('bg-music');
    const soundToggle = document.getElementById('sound-toggle');
    const iconMuted = soundToggle ? soundToggle.querySelector('.icon-muted') : null;
    const iconSound = soundToggle ? soundToggle.querySelector('.icon-sound') : null;
    const popupOverlay = document.getElementById('music-popup-overlay');
    const btnYes = document.getElementById('music-yes');
    const btnNo = document.getElementById('music-no');

    if (audio && soundToggle && popupOverlay) {
        // Helper to update UI
        const updateIcon = (isSoundOn) => {
            if (isSoundOn) {
                if (iconMuted) iconMuted.style.display = 'none';
                if (iconSound) iconSound.style.display = 'block';
            } else {
                if (iconMuted) iconMuted.style.display = 'block';
                if (iconSound) iconSound.style.display = 'none';
            }
        };

        const closePopup = () => {
            popupOverlay.classList.add('hidden');
            // Remove from DOM after transition to avoid blocking clicks if opacity fails
            setTimeout(() => {
                popupOverlay.style.display = 'none';
            }, 500);
        };

        // YES - Accept Cookies (Play Music)
        btnYes.addEventListener('click', () => {
            audio.muted = false;
            audio.volume = 1.0;
            audio.play().then(() => {
                updateIcon(true);
            }).catch(e => console.error("Play error:", e));
            closePopup();
        });

        // NO - Decline Cookies (Still Plays Music as per user request)
        btnNo.addEventListener('click', () => {
            audio.muted = false; // Force unmute
            audio.volume = 1.0;
            audio.play().then(() => {
                updateIcon(true);
            }).catch(e => console.error("Play error:", e));
            closePopup();
        });

        // Manual Toggle Button Logic (Post-Popup)
        soundToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused || audio.muted) {
                // Turn On
                audio.muted = false;
                audio.play();
                updateIcon(true);
            } else {
                // Turn Off 
                audio.pause();
                updateIcon(false);
            }
        });
    }

    // Video Crossfade Loop Logic
    const videos = document.querySelectorAll('.hero-video');
    if (videos.length >= 2) {
        let activeIndex = 0; // The one currently visible
        let otherIndex = 1;  // The buffer

        // We assume index 0 is active initially and playing via autoplay attribute
        // But double check autoplay if JS loads late
        if (videos[0].paused) videos[0].play();

        // 1.5s transition
        const transitionDuration = 1.5;
        let crossfadeScheduled = false;

        const checkTime = () => {
            const activeVideo = videos[activeIndex];
            const bufferVideo = videos[otherIndex];

            // Check if we are near end
            // We use duration - transition. If duration unknown, default large but it should be known by now
            const duration = activeVideo.duration;
            if (!duration) {
                requestAnimationFrame(checkTime);
                return;
            }

            const timeLeft = duration - activeVideo.currentTime;

            if (timeLeft <= transitionDuration && !crossfadeScheduled) {
                crossfadeScheduled = true;

                // Prepare buffer
                bufferVideo.currentTime = 0;
                bufferVideo.play().then(() => {
                    // Start fading
                    bufferVideo.classList.add('active'); // Opacity -> 1
                    activeVideo.classList.remove('active'); // Opacity -> 0

                    // Switch indices
                    const temp = activeIndex;
                    activeIndex = otherIndex;
                    otherIndex = temp;

                    // Reset flag after transition is effectively done (plus small buffer)
                    setTimeout(() => {
                        crossfadeScheduled = false;
                        // Pause the old one to save resources
                        // videos[otherIndex].pause(); // Optional, but good for performance
                    }, transitionDuration * 1000 + 500);
                }).catch(e => console.log("Buffer play failed", e));
            }
            requestAnimationFrame(checkTime);
        };

        requestAnimationFrame(checkTime);
    }

    // Mobile Menu Logic
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const menuClose = document.querySelector('.menu-close');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileMenuToggle && mobileMenuOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Lock scroll
        });

        const closeMenu = () => {
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Unlock scroll
        };

        if (menuClose) menuClose.addEventListener('click', closeMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Navbar Scroll Logic (Darken on Scroll)
    const navbar = document.querySelector('.glass-nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) { // Trigger earlier, e.g. 200px
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});
