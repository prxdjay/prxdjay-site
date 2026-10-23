(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (reduced.matches || !gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap-enhanced");

  const animated = new Set();
  const remember = (...items) => items.flat().filter(Boolean).forEach((item) => animated.add(item));
  const revealGroup = (trigger, items, options = {}) => {
    const targets = items.filter(Boolean);
    if (!targets.length) return;
    remember(targets);
    gsap.fromTo(targets,
      { autoAlpha: 0, y: options.y || 34 },
      {
        autoAlpha: 1,
        y: 0,
        duration: options.duration || .72,
        stagger: options.stagger || .08,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: {
          trigger,
          start: options.start || "top 78%",
          once: true,
        },
      }
    );
  };

  try {
    const heroImage = document.querySelector("#heroImg");
    remember(heroImage);

    const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (heroImage) {
      hero.fromTo(heroImage,
        { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)", filter: "brightness(.72) contrast(1.08)" },
        { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", filter: "brightness(1) contrast(1)", duration: 1.18 }
      );
    }

    const releaseArt = document.querySelector(".nda-release__art");
    const releaseFrame = document.querySelector(".nda-release__frame");
    if (releaseArt && releaseFrame) {
      remember(releaseFrame);
      gsap.fromTo(releaseFrame,
        { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
        {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          duration: 1.05,
          ease: "power3.inOut",
          scrollTrigger: { trigger: releaseArt, start: "top 82%", once: true },
        }
      );
    }

    revealGroup(".nda-release__copy", [...document.querySelectorAll(".nda-release__kicker, .nda-release__title, .nda-release__date")], { start: "top 78%", y: 28, stagger: .09 });
    revealGroup(".music", [document.querySelector(".stage"), ...document.querySelectorAll(".music__copy > *")], { start: "top 74%", y: 38, stagger: .09 });
    revealGroup(".videos", [...document.querySelectorAll(".videos .sec-head > *"), ...document.querySelectorAll(".videos .vitem")], { start: "top 78%", y: 40, stagger: .07 });
    revealGroup(".follow", [...document.querySelectorAll(".follow__intro > *"), ...document.querySelectorAll(".quicklinks a")], { start: "top 80%", y: 30, stagger: .065 });
    revealGroup(".contact", [...document.querySelectorAll(".contact__main > *"), document.querySelector(".contact__media")], { start: "top 82%", y: 34, stagger: .08 });

    addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  } catch (error) {
    document.documentElement.classList.remove("gsap-enhanced");
    if (animated.size) gsap.set([...animated], { clearProps: "opacity,visibility,transform,clipPath,filter" });
  }

  reduced.addEventListener?.("change", (event) => {
    if (!event.matches) return;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.globalTimeline.clear();
    if (animated.size) gsap.set([...animated], { clearProps: "opacity,visibility,transform,clipPath,filter" });
    document.documentElement.classList.remove("gsap-enhanced");
  });
})();
