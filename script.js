gsap.registerPlugin(ScrollTrigger);

// ---------- Smooth Scrolling (Lenis) ----------
const lenis = new Lenis({
    duration: 1.2,
    easing: t => 1 - Math.pow(2, -10 * t),
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false
});
lenis.on("scroll", () => ScrollTrigger.update());
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ---------- Helper (split text) ----------
function splitTextIntoLetters() {
    const title = document.querySelector(".hero-title h1");
    if (!title || title.querySelector(".letter")) return;

    title.innerHTML = "";
    [..."TIPS TIMES"].forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "letter";
        span.dataset.index = i;
        span.textContent = ch;
        if (ch === " ") {
            span.style.width = "0.35em";
            span.style.display = "inline-block";
        }
        title.appendChild(span);
    });
}

// ---------- Elastic Letters with Exponential Decay ----------
function initElasticLetters() {
    const hero = document.querySelector(".hero-title h1");
    const letters = document.querySelectorAll(".hero-title h1 .letter");
    if (!hero) return;

    // Updated constants with exponential decay approach
    const maxDist = 220;
    const decayFactor = 0.6;       // Controls how quickly the effect fades (0.3-0.6)
    const maxForce = 1;          // Maximum force strength (0.5-1.0)
    const pull = 120;
    const scaleAmt = 0.35;
    const neighborRange = 4;
    const neighborInfluence = 0.6;
    
    let mX = 0, mY = 0, over = false, rafId;
    let letterPositions = []; // Cache for performance

    // Cache letter positions to reduce DOM queries
    function cacheLetterPositions() {
        const heroRect = hero.getBoundingClientRect();
        letterPositions = Array.from(letters).map(letter => {
            const rect = letter.getBoundingClientRect();
            return {
                x: rect.left - heroRect.left + rect.width / 2,
                y: rect.top - heroRect.top + rect.height / 2,
                element: letter
            };
        });
    }

    hero.addEventListener("mousemove", e => {
        const rect = hero.getBoundingClientRect();
        mX = e.clientX - rect.left;
        mY = e.clientY - rect.top;
        over = true;
        
        // Cache positions on first interaction
        if (letterPositions.length === 0) {
            cacheLetterPositions();
        }
        
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(applyElastic);
    });

    hero.addEventListener("mouseleave", () => {
        over = false;
        letters.forEach((l, i) => {
            gsap.to(l, {
                x: 0, y: 0, scale: 1,
                duration: 1.2,
                ease: "elastic.out(1.2,0.4)",
                delay: i * 0.05,
                overwrite: true
            });
        });
    });

    // Recalculate positions on resize
    window.addEventListener("resize", () => {
        letterPositions = [];
    });

    function applyElastic() {
        if (!over || letterPositions.length === 0) return;

        // Find closest letter to cursor
        let closestIdx = 0, closestD = Infinity;
        letterPositions.forEach((pos, i) => {
            const d = Math.abs(mX - pos.x);
            if (d < closestD) {
                closestD = d;
                closestIdx = i;
            }
        });

        letterPositions.forEach((pos, i) => {
            const dx = mX - pos.x; // Vector FROM letter TO cursor
            const dy = mY - pos.y;
            const dist = Math.hypot(dx, dy);

            // EXPONENTIAL DECAY APPROACH - No hard cutoff!
            let force = 0;
            if (dist > 0) {
                // Exponential decay formula for ultra-smooth transitions
                force = Math.exp(-dist / (maxDist * decayFactor)) * maxForce;
                
                // Apply neighbor influence
                const nDist = Math.abs(i - closestIdx);
                if (nDist > 0 && nDist <= neighborRange) {
                    force *= neighborInfluence * Math.pow(0.5, nDist - 1);
                } else if (nDist > neighborRange) {
                    // Even neighbors get exponential decay instead of hard cutoff
                    const neighborDecay = Math.exp(-nDist / 2) * 0.1;
                    force *= neighborDecay;
                }

                // Lower threshold for ultra-smooth distant interactions
                if (force > 0.01) {
                    const pullStrength = force * 0.25;
                    const tx = dx * pullStrength;
                    const ty = dy * pullStrength;

                    gsap.to(pos.element, {
                        x: tx,
                        y: ty,
                        scale: 1 + force * scaleAmt,
                        duration: 0.3,
                        ease: "power2.out",
                        overwrite: true
                    });
                    return;
                }
            }

            // Smooth return to original position
            gsap.to(pos.element, {
                x: 0, y: 0, scale: 1,
                duration: 0.8,
                ease: "elastic.out(1,0.3)",
                overwrite: true
            });
        });

        if (over) {
            rafId = requestAnimationFrame(applyElastic);
        }
    }
}

// Initialize the effect
initElasticLetters();


// ---------- Hero Intro & Letter Setup ----------
document.addEventListener("DOMContentLoaded", () => {
    splitTextIntoLetters();
    initElasticLetters();

    // Time in nav bar
    const timeEl = document.querySelector(".nav-time");
    const tick = () => {
        timeEl.textContent = new Date().toLocaleTimeString("en-US", {
            weekday: "short", hour: "2-digit", minute: "2-digit",
            second: "2-digit", hour12: true
        }).toUpperCase();
    };
    tick(); setInterval(tick, 1000);

    // Hero fade-in
    gsap.from(".hero-description", { y: 50, opacity: 0, duration: 1.2, ease: "power2.out", delay: 0.4 });
    gsap.from(".hero-title h1", { y: 100, opacity: 0, duration: 1.5, ease: "power3.out", delay: 0.6 });
    gsap.from(".author-credit", { x: 30, opacity: 0, duration: 0.8, ease: "power2.out", delay: 1 });

    // Nav hide outside first section
    const nav = document.querySelector(".navigation");
    ScrollTrigger.create({
        trigger: ".section-1",
        start: "bottom top",
        end: "bottom top",
        onEnter: () => gsap.to(nav, { y: -100, opacity: 0, duration: 0.5 }),
        onLeaveBack: () => gsap.to(nav, { y: 0, opacity: 1, duration: 0.5 })
    });

    // Hover-to-show nav
    const hoverZone = document.createElement("div");
    hoverZone.style.cssText = "position:fixed;top:0;left:0;width:100%;height:80px;z-index:999";
    document.body.appendChild(hoverZone);
    hoverZone.addEventListener("mouseenter", () => {
        if (ScrollTrigger.isInViewport(".section-1", 0, "bottom top")) return;
        gsap.to(nav, { y: 0, opacity: 1, duration: 0.4 });
    });
    hoverZone.addEventListener("mouseleave", () => {
        if (ScrollTrigger.isInViewport(".section-1", 0, "bottom top")) return;
        gsap.to(nav, { y: -100, opacity: 0, duration: 0.4, delay: 0.8 });
    });

    // Team image zoom
    gsap.to(".team-image", {
        scale: 1, scrollTrigger: {
            trigger: ".section-2", start: "top center", end: "20% center", scrub: true
        }
    });
    gsap.to(".team-text", {
        opacity: 1, scrollTrigger: {
            trigger: ".section-2", start: "30% center", end: "35% center", scrub: true
        }
    });

    // Names cycle
    const names = ["Our Team!", "Varun Girish", "Pranav Raju", "Jaden Asher", "Partheve Shravanan", "Hrithik Venkateshwar"];
    let nameIdx = 0;
    ScrollTrigger.create({
        trigger: ".section-2", start: "40% center", end: "90% center",
        onUpdate: self => {
            const i = Math.floor(self.progress * (names.length - 1));
            if (i !== nameIdx) {
                nameIdx = i;
                gsap.to(".team-text", { opacity: 0, duration: 0.2, onComplete: () => {
                    document.querySelector(".team-text").textContent = names[i];
                    gsap.to(".team-text", { opacity: 1, duration: 0.2 });
                }});
            }
        }
    });

    // Image shrink into gallery
    //gsap.to(".team-image", {
    //    scale: 0.3, x: () => -window.innerWidth * 0.3,
    //    scrollTrigger: { trigger: ".section-2", start: "90% center", end: "bottom center", scrub: true }
    //});

    // Horizontal portfolio scroll
    const track = document.querySelector(".portfolio-track");
    gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: { trigger: ".section-3", start: "top top", end: "bottom top", scrub: 1, pin: ".portfolio-container" }
    });

    // Contact fade-in
    gsap.from(".contact-container", {
        y: 100, opacity: 0, scrollTrigger: { trigger: ".section-4", start: "top center", end: "center center", scrub: true }
    });

    // Background colour transitions (only sections 2-4)
    const bg = gsap.quickSetter("body", "backgroundColor");
    const colours = ["#f5f5f5", "#111111", "#6d6d6dff", "#111111"];
    [[".section-2", 0, 1], [".section-3", 1, 2], [".section-4", 2, 3]].forEach(([sel, from, to]) => {
        ScrollTrigger.create({
            trigger: sel, start: "top bottom", end: "top center", scrub: 0.1,
            onUpdate: s => bg(gsap.utils.interpolate(colours[from], colours[to], s.progress))
        });
    });
});
