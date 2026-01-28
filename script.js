document.addEventListener('DOMContentLoaded', () => {
    // 1. Define Animation Function (Delayed)
    const startHeroAnimations = () => {
        // Animate Hero Badge
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

        // Animate Title
        const title = document.querySelector('.hero-title');
        const subtitle = document.querySelector('.hero-subtitle-sub');
        const storeButtons = document.querySelector('.store-buttons');

        if (title) {
            title.innerHTML = '';
            const titleLines = ["Quit Porn Addiction with", "Science-Based Blocking"];
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

            // Animate Subtitle after Title
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

                // Animate Badges last
                if (storeButtons) {
                    const buttonsDelay = subtitleStartDelay + (subtitleWords.length * 100) + 300;
                    storeButtons.style.animation = 'none'; // Reset CSS animation
                    storeButtons.style.opacity = '0';
                    setTimeout(() => {
                        storeButtons.style.animation = `appleReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;
                    }, buttonsDelay);

                    // Animate CTA Group AFTER Badges (User Request)
                    const ctaGroup = document.querySelector('.cta-group');
                    if (ctaGroup) {
                        const ctaDelay = buttonsDelay + 400; // 400ms delay after badges start
                        ctaGroup.style.opacity = '0';
                        setTimeout(() => {
                            ctaGroup.style.animation = `appleReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;
                        }, ctaDelay);
                    }
                }
            }
        }
    };

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
            const rect = statText.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate progress based on element position in viewport
            // Start: When element is near bottom (windowHeight * 0.9)
            // End: When element is near center/top (windowHeight * 0.4)
            // As user scrolls down, rect.top DECREASES.

            const startPoint = windowHeight * 0.9;
            const endPoint = windowHeight * 0.4;

            // Progress 0 when rect.top == startPoint
            // Progress 1 when rect.top == endPoint
            // Formula: (startPoint - rect.top) / (startPoint - endPoint)

            let progress = (startPoint - rect.top) / (startPoint - endPoint);
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
            localStorage.setItem('blockermax_cookie_consent', 'accepted'); // Set consent immediately

            // Hide the real banner if it was about to show
            if (cookieBanner) {
                cookieBanner.classList.remove('visible');
                cookieBanner.style.display = 'none';
            }

            audio.muted = false;
            audio.volume = 1.0;
            audio.play().then(() => {
                updateIcon(true);
            }).catch(e => console.error("Play error:", e));
            closePopup();
            startHeroAnimations();
        });

        // NO - Decline Cookies (Still Plays Music as per user request)
        btnNo.addEventListener('click', () => {
            localStorage.setItem('blockermax_cookie_consent', 'declined'); // Set consent immediately

            // Hide the real banner if it was about to show
            if (cookieBanner) {
                cookieBanner.classList.remove('visible');
                cookieBanner.style.display = 'none';
            }

            audio.muted = false; // Force unmute
            audio.volume = 1.0;
            audio.play().then(() => {
                updateIcon(true);
            }).catch(e => console.error("Play error:", e));
            closePopup();
            startHeroAnimations();
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
        if (videos[0].paused) {
            videos[0].play().catch(e => console.log("Auto-play prevented", e));
        }

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
    const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

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

    // Real Cookie Consent Logic
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAccept = document.getElementById('cookie-accept');
    const cookieDecline = document.getElementById('cookie-decline');

    // Mobile Cookie Elements
    const mobileCookieNotice = document.querySelectorAll('.mobile-cookie-notice'); // Use class as ID might dupe if bad HTML
    const mobileCookieAccept = document.querySelectorAll('.mobile-cookie-btn.primary');
    const mobileCookieDecline = document.querySelectorAll('.mobile-cookie-btn.secondary');

    if (cookieBanner) {
        // Check local storage
        const hasConsented = localStorage.getItem('blockermax_cookie_consent');

        if (!hasConsented) {
            // Show banner with a slight delay
            setTimeout(() => {
                // Double check if consent was given during the delay (e.g. via music popup)
                if (!localStorage.getItem('blockermax_cookie_consent')) {
                    cookieBanner.classList.add('visible');
                    // Also show mobile notice
                    mobileCookieNotice.forEach(el => el.style.display = 'block');
                }
            }, 2000);
        }

        const hideBanner = () => {
            cookieBanner.classList.remove('visible');
            cookieBanner.style.pointerEvents = 'none';
            // Hide mobile notices too
            mobileCookieNotice.forEach(el => el.style.display = 'none');

            setTimeout(() => {
                cookieBanner.style.display = 'none';
            }, 600);
        };

        const acceptCookies = () => {
            localStorage.setItem('blockermax_cookie_consent', 'accepted');
            hideBanner();
        };

        const declineCookies = () => {
            localStorage.setItem('blockermax_cookie_consent', 'declined');
            hideBanner();
        };

        if (cookieAccept) cookieAccept.addEventListener('click', acceptCookies);
        if (cookieDecline) cookieDecline.addEventListener('click', declineCookies);

        // Bind mobile buttons (using forEach because querySelectorAll returns NodeList)
        mobileCookieAccept.forEach(btn => btn.addEventListener('click', acceptCookies));
        mobileCookieDecline.forEach(btn => btn.addEventListener('click', declineCookies));
    }
});
