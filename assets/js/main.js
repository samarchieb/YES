/* YES – Yellow Energy Saving · interactions (sans bibliothèque) */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- En-tête : verre au défilement, menu mobile ---------- */
  const header = $("[data-header]");
  const burger = $("[data-burger]");
  const onScrollHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  const setMenu = (open) => {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };
  burger.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));

  const drop = $(".nav__drop");
  const dropBtn = $(".nav__drop-btn");
  const setDrop = (open) => {
    drop.classList.toggle("is-open", open);
    dropBtn.setAttribute("aria-expanded", String(open));
  };
  dropBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setDrop(!drop.classList.contains("is-open"));
  });
  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target)) setDrop(false);
  });
  $$(".nav a").forEach((a) =>
    a.addEventListener("click", () => {
      setDrop(false);
      setMenu(false);
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (drop.classList.contains("is-open")) {
      setDrop(false);
      dropBtn.focus();
    } else if (header.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  // Lien actif selon la section visible
  const navLinks = $$(".nav > a");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((a) => {
    const t = $(a.getAttribute("href"));
    if (t) io.observe(t);
  });


  /* ---------- En-tête premium : surbrillance glissante + progression ---------- */
  const navEl = $("[data-nav]");
  const pill = $("[data-nav-pill]");
  if (navEl && pill) {
    const items = $$(":scope > a, :scope > .nav__drop > .nav__drop-btn", navEl);
    const place = (el) => {
      if (!el || !window.matchMedia("(min-width: 901px)").matches) return pill.style.setProperty("--po", 0);
      const n = navEl.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      pill.style.setProperty("--px", (r.left - n.left).toFixed(1) + "px");
      pill.style.setProperty("--pw", r.width.toFixed(1) + "px");
      pill.style.setProperty("--po", 1);
    };
    const toActive = () => place($(":scope > a.is-active", navEl));
    items.forEach((el) => {
      el.addEventListener("pointerenter", () => place(el));
      el.addEventListener("focus", () => place(el));
    });
    navEl.addEventListener("pointerleave", toActive);
    new MutationObserver(toActive).observe(navEl, { subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", toActive);
    document.fonts && document.fonts.ready.then(toActive);
    toActive();
  }
  const progress = $("[data-progress]");
  if (progress) {
    let pend = false;
    const upd = () => {
      pend = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--read", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    };
    window.addEventListener("scroll", () => { if (!pend) { pend = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- Compteurs ---------- */
  function count(el) {
    const target = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const f = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: el.hasAttribute("data-group") });
    if (reduced) return (el.textContent = f.format(target));
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / 1600);
      el.textContent = f.format(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (!reduced) $$("[data-count]").forEach((el) => (el.textContent = "0"));

  /* ---------- Apparitions ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        $$("[data-count]", en.target).forEach(count);
        revealIO.unobserve(en.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  $$("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ---------- Défilement : points des solutions, parallaxe, étapes ---------- */
  const solutions = $("[data-solutions]");
  const dots = $$(".sol-dots li");
  const solImgs = $$(".sol__img img");
  const steps = $("[data-steps]");
  const stepsFill = $("[data-steps-fill]");
  const stepItems = $$(".steps__list li");
  let ticking = false;

  function onScroll() {
    ticking = false;
    const vh = window.innerHeight;

    if (solutions) {
      const r = solutions.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height));
      const active = Math.min(dots.length - 1, Math.floor(clamp((vh * 0.85 - r.top) / r.height) * dots.length));
      dots.forEach((d, i) => d.classList.toggle("is-on", i <= active && r.top < vh * 0.85));
      if (!reduced) solImgs.forEach((img, i) => img.style.setProperty("--py", `${((0.5 - p) * (16 + i * 4)).toFixed(1)}px`));
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = reduced ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25));
      stepsFill.parentElement.style.setProperty("--p", p.toFixed(3));
      stepItems.forEach((li, i) => li.classList.toggle("is-lit", p >= i / (stepItems.length - 1) - 0.02));
    }
  }
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  onScroll();

  /* ---------- FAQ ---------- */
  const qas = $$("[data-faq] .qa");
  qas.forEach((qa) => {
    const btn = $("button", qa);
    btn.addEventListener("click", () => {
      const open = !qa.classList.contains("is-open");
      qas.forEach((o) => {
        const on = o === qa && open;
        o.classList.toggle("is-open", on);
        $("button", o).setAttribute("aria-expanded", String(on));
      });
    });
  });

  /* ---------- Avis clients : bande défilante automatique ---------- */
  const rvm = $("[data-rvm]");
  if (rvm && !reduced) {
    const track = $("[data-rvm-track]", rvm);
    const originals = $$(".rv", track);
    // Copie pour une boucle sans couture (ignorée par les lecteurs d'écran)
    originals.forEach((c) => {
      const k = c.cloneNode(true);
      k.setAttribute("aria-hidden", "true");
      track.append(k);
    });
    const SPEED = 38; // px par seconde
    let x = 0;
    let last = 0;
    let paused = false;
    let visible = false;
    let raf = 0;
    let half = 0;
    const measure = () => (half = track.scrollWidth / 2);
    measure();
    window.addEventListener("resize", measure);
    const wrap = () => {
      if (x <= -half) x += half;
      if (x > 0) x -= half;
    };
    const tick = (t) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!paused) x -= SPEED * dt;
      wrap();
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }).observe(rvm);
    document.addEventListener("visibilitychange", run);
    // Pause au survol et au focus clavier
    rvm.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") paused = true; });
    rvm.addEventListener("pointerleave", () => { if (!dragging) paused = false; });
    rvm.addEventListener("focusin", () => (paused = true));
    rvm.addEventListener("focusout", () => (paused = false));
    // Glisser à la souris ou au doigt
    let dragging = false;
    let sx = 0;
    let sxX = 0;
    rvm.addEventListener("pointerdown", (e) => {
      dragging = true;
      paused = true;
      sx = e.clientX;
      sxX = x;
      rvm.setPointerCapture(e.pointerId);
      rvm.classList.add("is-dragging");
    });
    rvm.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      x = sxX + (e.clientX - sx);
      wrap();
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      rvm.classList.remove("is-dragging");
      if (e.pointerType !== "mouse") paused = false;
    };
    rvm.addEventListener("pointerup", endDrag);
    rvm.addEventListener("pointercancel", endDrag);
  }

  /* ---------- Avis clients : carrousel (ancien) ---------- */
  const vcar = $("[data-vcarousel]");
  if (vcar) {
    const quotes = $$(".vq", vcar);
    const vnav = $("[data-vnav]", vcar);
    const vcount = $("[data-vcount]", vcar);
    let vi = 0;
    let vtimer = 0;
    const vshow = (n) => {
      vi = (n + quotes.length) % quotes.length;
      quotes.forEach((q, k) => {
        q.classList.toggle("is-current", k === vi);
        q.setAttribute("aria-hidden", String(k !== vi));
      });
      vcount.textContent = `${vi + 1} / ${quotes.length}`;
    };
    if (quotes.length < 2) {
      vnav.hidden = true;
    } else {
      $("[data-vprev]", vcar).addEventListener("click", () => { clearInterval(vtimer); vshow(vi - 1); });
      $("[data-vnext]", vcar).addEventListener("click", () => { clearInterval(vtimer); vshow(vi + 1); });
      if (!reduced) vtimer = setInterval(() => vshow(vi + 1), 7000);
      vcar.addEventListener("pointerenter", () => clearInterval(vtimer));
    }
    vshow(0);
  }

  /* ---------- Avis clients : formulaire ---------- */
  const vform = $("[data-vform]");
  if (vform) {
    const vdone = $("[data-vdone]");
    const words = { 1: "Décevant", 2: "Moyen", 3: "Bien", 4: "Très bien", 5: "Excellent" };
    const word = $("[data-rating-word]", vform);
    const msg = vform.elements.message;
    const counter = $("[data-vcount-chars]", vform);
    const setErr = (id, text, field) => {
      $(`#${id}`).textContent = text;
      if (field) field.closest(".vfield").classList.toggle("has-error", !!text);
    };
    vform.addEventListener("change", (e) => {
      if (e.target.name === "note") {
        word.textContent = words[e.target.value];
        setErr("e-note", "");
      }
    });
    msg.addEventListener("input", () => {
      counter.textContent = `${msg.value.length} / 600`;
      if (msg.value.trim().length >= 10) setErr("e-vmsg", "", msg);
    });
    vform.elements.name.addEventListener("input", (e) => {
      if (e.target.value.trim().length >= 2) setErr("e-vname", "", e.target);
    });
    vform.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = vform.querySelector('input[name="note"]:checked');
      const name = vform.elements.name.value.trim();
      const text = msg.value.trim();
      let first = null;
      if (!note) { setErr("e-note", "Choisissez une note de 1 à 5 étoiles."); first = first || $("#r5"); }
      if (name.length < 2) { setErr("e-vname", "Indiquez votre prénom.", vform.elements.name); first = first || vform.elements.name; }
      if (text.length < 10) { setErr("e-vmsg", "Écrivez quelques mots (10 caractères minimum).", msg); first = first || msg; }
      if (first) return first.focus();

      const city = vform.elements.city.value.trim();
      const type = vform.elements.type.value;
      const publish = vform.elements.publish.checked;
      const details = [
        `Note : ${"★".repeat(note.value)}${"☆".repeat(5 - note.value)} (${note.value}/5 – ${words[note.value]})`,
        `Prénom : ${name}`,
        city ? `Ville : ${city}` : null,
        type ? `Installation : ${type}` : null,
        `Publication autorisée : ${publish ? "oui" : "non"}`,
      ].filter(Boolean);
      const body = `${details.join("\n")}\n\n${text}`;
      window.location.href = `mailto:contact@yellowenergysaving.pro?subject=${encodeURIComponent(`Avis client – ${name} (${note.value}/5)`)}&body=${encodeURIComponent(body)}`;
      $("[data-vdone-stars]").textContent = "★".repeat(note.value) + "☆".repeat(5 - note.value);
      vform.hidden = true;
      vdone.hidden = false;
      vdone.focus({ preventScroll: true });
    });
    $("[data-vreset]").addEventListener("click", () => {
      vform.reset();
      word.textContent = "Choisissez une note";
      counter.textContent = "0 / 600";
      vdone.hidden = true;
      vform.hidden = false;
      $("#r5").focus();
    });
  }

  /* ---------- Avis (ancienne carte) ---------- */
  const reviews = $$("[data-reviews] .review__item");
  const nav = $(".review__nav");
  if (!nav) {
    // ancienne carte d avis retirée
  } else if (reviews.length < 2) {
    nav.hidden = true;
  } else {
    let i = 0;
    const show = (n) => {
      i = (n + reviews.length) % reviews.length;
      reviews.forEach((r, k) => r.classList.toggle("is-current", k === i));
    };
    $("[data-prev]", nav).addEventListener("click", () => show(i - 1));
    $("[data-next]", nav).addEventListener("click", () => show(i + 1));
  }

  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Hero : vidéo d'ambiance ---------- */
  const heroVideo = $("[data-hero-video]");
  const pauseBtn = $("[data-hero-pause]");
  if (heroVideo) {
    const conn = navigator.connection;
    const saveData = conn && (conn.saveData || /2g/.test(conn.effectiveType || ""));
    const wide = window.matchMedia("(min-width: 901px)").matches;
    // Ordinateur, mouvement autorisé, pas d'économiseur de données : on charge la vidéo
    if (wide && !reduced && !saveData) {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.preload = "auto";
      const setPaused = (paused) => {
        pauseBtn.setAttribute("aria-label", paused ? "Lire la vidéo" : "Mettre la vidéo en pause");
        $("[data-ic-pause]", pauseBtn).hidden = paused;
        $("[data-ic-play]", pauseBtn).hidden = !paused;
      };
      heroVideo.addEventListener("playing", () => {
        pauseBtn.hidden = false;
        setPaused(false);
      });
      heroVideo.addEventListener("pause", () => setPaused(true));
      pauseBtn.addEventListener("click", () => (heroVideo.paused ? heroVideo.play() : heroVideo.pause()));
      heroVideo.play().catch(() => {});
      // Pas de lecture inutile quand le hero est hors écran
      let userPaused = false;
      pauseBtn.addEventListener("click", () => (userPaused = heroVideo.paused));
      new IntersectionObserver(([en]) => {
        if (userPaused) return;
        if (en.isIntersecting) heroVideo.play().catch(() => {});
        else heroVideo.pause();
      }).observe(heroVideo.closest(".hero"));
    }
  }

  /* ---------- Solutions : explorateur interactif ---------- */
  const explorer = $("[data-explorer]");
  if (explorer) {
    const tabs = $$('[role="tab"]', explorer);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const countEl = $("[data-explorer-count]", explorer);
    const DURATION = 6500;
    let current = 0;
    let manual = reduced; // mouvement réduit : pas de défilement automatique
    let inView = false;
    explorer.style.setProperty("--dur", `${DURATION}ms`);

    const select = (i, { focus = false, user = false } = {}) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        const on = k === current;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle("is-active", on);
        panels[k].inert = !on;
      });
      countEl.textContent = String(current + 1).padStart(2, "0");
      if (focus) tabs[current].focus();
      if (user) stopAuto();
      else restartBar();
      // Sur mobile, garde l'onglet actif visible dans la rangée défilante
      if (window.matchMedia("(max-width: 1180px)").matches) {
        tabs[current].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      }
    };
    // Relance l'animation de la barre de progression
    const restartBar = () => {
      if (manual || !inView) return;
      explorer.classList.remove("is-auto");
      void explorer.offsetWidth;
      explorer.classList.add("is-auto");
    };
    const stopAuto = () => {
      manual = true;
      explorer.classList.remove("is-auto", "is-paused");
    };
    explorer.addEventListener("animationend", (e) => {
      if (e.animationName === "explorer-fill" && !manual) select(current + 1);
    });

    tabs.forEach((t, i) => t.addEventListener("click", () => select(i, { user: true })));
    explorer.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) select(current + keys[e.key], { focus: true, user: true });
      else if (e.key === "Home") select(0, { focus: true, user: true });
      else if (e.key === "End") select(tabs.length - 1, { focus: true, user: true });
      else return;
      e.preventDefault();
    });

    // Pause au survol ou au focus clavier
    const pause = (on) => !manual && explorer.classList.toggle("is-paused", on);
    explorer.addEventListener("pointerenter", () => pause(true));
    explorer.addEventListener("pointerleave", () => pause(false));
    explorer.addEventListener("focusin", () => pause(true));
    explorer.addEventListener("focusout", (e) => {
      if (!explorer.contains(e.relatedTarget)) pause(false);
    });

    // Défilement automatique uniquement quand l'explorateur est visible
    new IntersectionObserver(
      ([en]) => {
        inView = en.isIntersecting;
        if (manual) return;
        if (inView) restartBar();
        else explorer.classList.remove("is-auto");
      },
      { threshold: 0.35 }
    ).observe(explorer);

    // Précharge les autres visuels après le premier affichage
    panels.forEach((p) => {
      const img = $("img", p);
      if (img) img.loading = "eager";
    });
  }

  /* ---------- Pourquoi YES : un avantage ouvert à la fois, le badge photo suit ---------- */
  const whyList = $("[data-why]");
  if (whyList) {
    const perks = $$(".perk", whyList);
    const badge = $(".why2__badge");
    const valueEl = $("[data-why-value]");
    const labelEl = $("[data-why-label]");
    const open = (perk) => {
      perks.forEach((p) => {
        const on = p === perk;
        p.classList.toggle("is-open", on);
        $(".perk__head", p).setAttribute("aria-expanded", String(on));
      });
      valueEl.textContent = perk.dataset.value;
      labelEl.textContent = perk.dataset.label;
      badge.classList.remove("is-swap");
      void badge.offsetWidth;
      badge.classList.add("is-swap");
    };
    perks.forEach((p) => {
      const head = $(".perk__head", p);
      head.addEventListener("click", () => {
        if (!p.classList.contains("is-open")) open(p);
      });
    });
  }

  /* ---------- Réalisations : vitrine photo + liste ---------- */
  const plist = $("[data-plist]");
  if (plist) {
    const tabs = $$('[role="tab"]', plist);
    // Seconde image (fondu enchaîné) créée ici, pour ne pas livrer d image invisible dans le HTML
    const first = $(".showcase__img");
    const buffer = first.cloneNode(false);
    buffer.classList.remove("is-on");
    buffer.alt = "";
    buffer.setAttribute("aria-hidden", "true");
    first.after(buffer);
    const imgs = [first, buffer];
    const factsEl = $(".showcase__facts");
    const view = $(".showcase__view");
    let on = 0; // image visible (double tampon pour le fondu)
    let cur = 0;
    let hoverT = 0;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1001px)");
    // Précharge les photos
    tabs.forEach((t) => { const i = new Image(); i.src = t.dataset.img; });
    const renderFacts = (t) => {
      factsEl.innerHTML = t.dataset.facts
        .split(";;")
        .map((f) => { const [k, v] = f.split("|"); return `<div><dt>${k}</dt><dd>${v}</dd></div>`; })
        .join("");
      factsEl.classList.remove("is-swap");
      void factsEl.offsetWidth;
      factsEl.classList.add("is-swap");
    };
    const select = (i, { focus = false, scroll = false } = {}) => {
      if (i === cur && imgs[on].getAttribute("src") === tabs[i].dataset.img) return;
      cur = i;
      const t = tabs[i];
      tabs.forEach((b, k) => {
        b.setAttribute("aria-selected", String(k === i));
        b.tabIndex = k === i ? 0 : -1;
      });
      const next = imgs[1 - on];
      next.src = t.dataset.img;
      next.alt = t.dataset.alt;
      next.removeAttribute("aria-hidden");
      imgs[on].setAttribute("aria-hidden", "true");
      imgs[on].alt = "";
      requestAnimationFrame(() => {
        imgs[on].classList.remove("is-on");
        next.classList.add("is-on");
        on = 1 - on;
      });
      renderFacts(t);
      if (focus) t.focus();
      if (scroll && !fine.matches) {
        const r = view.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight) view.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i, { scroll: true }));
      t.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !fine.matches) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(() => select(i), 90);
      });
      t.addEventListener("pointerleave", () => clearTimeout(hoverT));
    });
    plist.addEventListener("keydown", (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      select((cur + k + tabs.length) % tabs.length, { focus: true });
    });
    renderFacts(tabs[0]);
  }

  /* ---------- Réalisations : cartes photo + visionneuse (retiré) ---------- */
  const pcards = $("[data-pcards]");
  const lb = $("[data-lightbox]");
  if (pcards && lb && typeof lb.showModal === "function") {
    const btns = $$(".pcard__btn", pcards);
    const img = $("[data-lb-img]", lb);
    let li = 0;
    let opener = null;
    const fill = (i) => {
      li = (i + btns.length) % btns.length;
      const b = btns[li];
      const src = $("img", b);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      $("[data-lb-tag]", lb).textContent = $(".pcard__tag", b).textContent;
      $("[data-lb-title]", lb).textContent = $(".pcard__cap strong", b).textContent;
      $("[data-lb-meta]", lb).textContent = $(".pcard__meta", b).textContent;
      $("[data-lb-count]", lb).textContent = `${li + 1} / ${btns.length}`;
      img.classList.remove("is-swap");
      void img.offsetWidth;
      img.classList.add("is-swap");
    };
    btns.forEach((b, i) =>
      b.addEventListener("click", () => {
        opener = b;
        fill(i);
        lb.showModal();
        document.documentElement.style.overflow = "hidden";
      })
    );
    $("[data-lb-prev]", lb).addEventListener("click", () => fill(li - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => fill(li + 1));
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") fill(li + 1);
      if (e.key === "ArrowLeft") fill(li - 1);
    });
    // Clic sur le fond sombre : ferme
    lb.addEventListener("click", (e) => {
      if (e.target === lb) lb.close();
    });
    // Balayage sur mobile
    let sx = 0;
    lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => {
      const d = e.changedTouches[0].clientX - sx;
      if (Math.abs(d) > 50) fill(li + (d < 0 ? 1 : -1));
    });
    lb.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      opener?.focus();
    });
  }

  /* ---------- Réalisations : carrousel 3D (retiré) ---------- */
  const cover = $("[data-cover]");
  if (cover) {
    const stage = $("[data-cover-stage]", cover);
    const items = $$(".cover__item", stage);
    const N = items.length;
    const info = $(".cover__info", cover);
    const tagEl = $("[data-cover-tag]", cover);
    const titleEl = $("[data-cover-title]", cover);
    const metaEl = $("[data-cover-meta]", cover);
    const numEl = $("[data-cover-num]", cover);
    const dotsEl = $("[data-cover-dots]", cover);
    let cur = 0;
    let timer = 0;
    let inView = false;
    let hovered = false;

    const dots = items.map((it, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `${it.dataset.title} (${i + 1} sur ${N})`);
      b.addEventListener("click", () => { go(i); restart(); });
      li.append(b);
      dotsEl.append(li);
      return b;
    });

    // Décalage circulaire le plus court : -2…2
    const offsetOf = (i) => {
      let o = i - cur;
      if (o > N / 2) o -= N;
      if (o < -N / 2) o += N;
      return o;
    };
    const layout = () => {
      items.forEach((it, i) => {
        const o = offsetOf(i);
        it.style.setProperty("--o", o);
        it.style.setProperty("--ao", Math.abs(o));
        it.classList.toggle("is-current", o === 0);
        it.classList.toggle("is-hidden", Math.abs(o) > 2);
        it.setAttribute("aria-hidden", String(o !== 0));
      });
    };
    const go = (i) => {
      cur = (i + N) % N;
      layout();
      const it = items[cur];
      tagEl.textContent = it.dataset.tag;
      titleEl.textContent = it.dataset.title;
      metaEl.innerHTML = "";
      it.dataset.meta.split("|").forEach((m) => {
        const li = document.createElement("li");
        li.textContent = m;
        metaEl.append(li);
      });
      numEl.textContent = String(cur + 1).padStart(2, "0");
      dots.forEach((d, k) => d.setAttribute("aria-current", String(k === cur)));
      info.classList.remove("is-swap");
      void info.offsetWidth;
      info.classList.add("is-swap");
    };

    // Lecture automatique : seulement visible, sans survol, mouvement autorisé
    const restart = () => {
      clearInterval(timer);
      if (reduced || !inView || hovered) return;
      timer = setInterval(() => go(cur + 1), 4500);
    };
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; restart(); }, { threshold: 0.4 }).observe(cover);
    cover.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovered = true; restart(); } });
    cover.addEventListener("pointerleave", () => { hovered = false; restart(); });

    $("[data-cover-prev]", cover).addEventListener("click", () => { go(cur - 1); restart(); });
    $("[data-cover-next]", cover).addEventListener("click", () => { go(cur + 1); restart(); });
    items.forEach((it, i) => it.addEventListener("click", () => { if (!moved && i !== cur) { go(i); restart(); } }));
    cover.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { go(cur + 1); restart(); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(cur - 1); restart(); e.preventDefault(); }
    });

    // Glisser / balayer
    let startX = 0;
    let startT = 0;
    let dx = 0;
    let dragging = false;
    let moved = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startT = performance.now();
      dx = 0;
      stage.setPointerCapture(e.pointerId);
      clearInterval(timer);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 6) {
        moved = true;
        stage.classList.add("is-dragging");
        items.forEach((it) => it.style.setProperty("--drag", `${dx * 0.6}px`));
      }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      items.forEach((it) => it.style.setProperty("--drag", "0px"));
      const v = Math.abs(dx) / Math.max(1, performance.now() - startT);
      if (Math.abs(dx) > 60 || (v > 0.4 && Math.abs(dx) > 15)) go(cur + (dx < 0 ? 1 : -1));
      setTimeout(() => (moved = false), 0);
      restart();
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);

    go(0);
  }

  /* ---------- Réalisations : galerie extensible + filtres ---------- */
  const wgallery = $("[data-wgallery]");
  if (wgallery) {
    const wps = $$(".wp", wgallery);
    const chips = $$("[data-wfilters] button");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 641px)");
    let hoverT = 0;
    const openWp = (wp, scroll = false) => {
      wps.forEach((w) => {
        const on = w === wp;
        w.classList.toggle("is-open", on);
        $(".wp__btn", w).setAttribute("aria-expanded", String(on));
      });
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === wp.dataset.cat)));
      if (scroll && !fine.matches) wp.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" });
    };
    wps.forEach((wp) => {
      $(".wp__btn", wp).addEventListener("click", () => openWp(wp));
      wp.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !fine.matches) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(() => openWp(wp), 120);
      });
      wp.addEventListener("pointerleave", () => clearTimeout(hoverT));
    });
    // Filtres : ouvre le premier projet de la catégorie et atténue les autres un instant
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        const cat = chip.dataset.cat;
        const first = wps.find((w) => w.dataset.cat === cat);
        if (!first) return;
        openWp(first, true);
        wps.forEach((w) => w.classList.toggle("is-dim", w.dataset.cat !== cat));
        wgallery.classList.add("has-filter");
        clearTimeout(chip._t);
        chip._t = setTimeout(() => wgallery.classList.remove("has-filter"), 1600);
      })
    );
    // Carrousel mobile : la carte centrée devient la carte active
    wgallery.addEventListener("scroll", () => {
      if (fine.matches) return;
      const mid = wgallery.scrollLeft + wgallery.clientWidth / 2;
      let best = wps[0];
      wps.forEach((w) => {
        if (Math.abs(w.offsetLeft + w.offsetWidth / 2 - mid) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - mid)) best = w;
      });
      if (!best.classList.contains("is-open")) openWp(best);
    }, { passive: true });
  }

  /* ---------- Étapes : parcours interactif ---------- */
  const journey = $("[data-journey]");
  if (journey) {
    const tabs = $$('[role="tab"]', journey);
    const items = tabs.map((t) => t.closest("li"));
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const fill = $("[data-journey-fill]", journey);
    const runner = $("[data-journey-runner]", journey);
    let current = 0;
    let autoTimer = 0;
    let userTook = false;

    const show = (i, focus = false) => {
      current = i;
      const p = i / (tabs.length - 1);
      fill.parentElement.style.setProperty("--p", p.toFixed(3));
      runner.style.setProperty("--p", p.toFixed(3));
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        items[k].classList.toggle("is-current", on);
        items[k].classList.toggle("is-done", k < i);
        panels[k].hidden = !on;
        panels[k].classList.toggle("is-active", on);
      });
      if (focus) tabs[i].focus();
    };
    const stopAuto = () => {
      userTook = true;
      clearTimeout(autoTimer);
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => { stopAuto(); show(i); }));
    journey.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      stopAuto();
      show((current + keys[e.key] + tabs.length) % tabs.length, true);
    });

    // Lecture automatique, une seule fois, quand la section apparaît
    const play = () => {
      if (userTook || current >= tabs.length - 1) return;
      autoTimer = setTimeout(() => { show(current + 1); play(); }, 1500);
    };
    show(0);
    if (!reduced) {
      const io2 = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) {
          io2.disconnect();
          play();
        }
      }, { threshold: 0.5 });
      io2.observe(journey);
    }
  }

  /* ---------- Pourquoi : cartes inclinables + badge photo ---------- */
  const whyCards = $("[data-why-cards]");
  if (whyCards) {
    const cards = $$(".card", whyCards);
    const badge = $(".why__badge");
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const activate = (card) => {
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle("is-active", on);
        $(".card__btn", c).setAttribute("aria-expanded", String(on));
      });
      if (badge && card) {
        $("[data-why-v]", badge).innerHTML = card.dataset.value;
        $("[data-why-l]", badge).textContent = card.dataset.label;
        badge.classList.remove("is-swap");
        void badge.offsetWidth;
        badge.classList.add("is-swap");
      }
    };
    cards.forEach((card) => {
      const btn = $(".card__btn", card);
      btn.addEventListener("click", () => activate(card));
      btn.addEventListener("focus", () => activate(card));
      card.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse") activate(card);
      });
      // Inclinaison 3D et lumière qui suit la souris
      card.addEventListener("pointermove", (e) => {
        if (!fineHover.matches || reduced) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.classList.add("is-tilting");
        card.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
        card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
    activate(cards[0]);
  }

  /* ---------- Solutions : panneaux extensibles ---------- */
  const panelsRoot = $("[data-panels]");
  if (panelsRoot) {
    const pans = $$(".pan", panelsRoot);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)");
    let hoverTimer = 0;
    const openPan = (pan) => {
      if (pan.classList.contains("is-open")) return;
      pans.forEach((p) => {
        const on = p === pan;
        p.classList.toggle("is-open", on);
        $(".pan__trigger", p).setAttribute("aria-expanded", String(on));
        $(".pan__content", p).inert = !on;
      });
    };
    pans.forEach((p, i) => {
      $(".pan__content", p).inert = i !== 0;
      $(".pan__trigger", p).addEventListener("click", () => {
        openPan(p);
        // Clavier : amène le focus sur le bouton d'action du panneau ouvert
        if (!fine.matches) p.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      });
      // Survol (souris, grand écran) : petite temporisation pour éviter les ouvertures involontaires
      p.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !fine.matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => openPan(p), 140);
      });
      p.addEventListener("pointerleave", () => clearTimeout(hoverTimer));
    });
    // Flèches gauche/droite entre les panneaux
    panelsRoot.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const cur = pans.findIndex((p) => p.classList.contains("is-open"));
      const next = (cur + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : pans.length - 1)) % pans.length;
      e.preventDefault();
      openPan(pans[next]);
      $(".pan__content .btn", pans[next]).focus({ preventScroll: true });
    });
  }

  /* ---------- Hero : parallaxe douce ---------- */
  const heroBg = $("[data-hero-bg] video");
  if (heroBg && !reduced) {
    let pending = false;
    const desktop = window.matchMedia("(min-width: 901px)");
    const move = () => {
      pending = false;
      const y = window.scrollY;
      if (!desktop.matches || y > window.innerHeight * 1.2) return;
      heroBg.style.setProperty("--hero-shift", `${(y * 0.28).toFixed(1)}px`);
    };
    window.addEventListener("scroll", () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(move);
      }
    }, { passive: true });
  }

  /* =========================================================
     Hero : simulateur « Simulez votre installation »
     Hypothèses reprises du site YES existant (productible constaté 1 510 à 1 630 kWh/kWc).
     ========================================================= */
  const sim = $("[data-sim]");
  if (!sim) return;

  const SIM = {
    yieldKwhPerKwc: 1600,
    moduleWc: 565,
    m2PerKwc: 5.5,
    profiles: [
      { id: "maison", label: "Maison", min: 10, max: 150, value: 30 },
      { id: "commerce", label: "Commerce", min: 20, max: 400, value: 60 },
      { id: "entreprise", label: "Entreprise", min: 100, max: 3000, value: 550 },
      { id: "pompage", label: "Pompage", min: 20, max: 600, value: 120 },
    ],
  };
  const DAY_START = 6;
  const DAY_END = 18;
  const HOURS_PER_SECOND = 0.8;
  const W = 300;
  const H = 110;
  const fmt1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtInt = new Intl.NumberFormat("fr-FR");
  const solar = (h) => (h <= DAY_START || h >= DAY_END ? 0 : Math.pow(Math.sin((Math.PI * (h - DAY_START)) / (DAY_END - DAY_START)), 1.5));
  const xOf = (h) => ((h - (DAY_START - 1)) / (DAY_END - DAY_START + 2)) * W;
  const yOf = (f) => H - 6 - f * (H - 18);
  const quarter = (h) => Math.round(h * 4) / 4;
  const clock = (h) => {
    const q = quarter(h);
    const hh = Math.floor(q);
    return `${String(hh).padStart(2, "0")}:${String(Math.round((q - hh) * 60)).padStart(2, "0")}`;
  };
  const points = (until = DAY_END + 1) => {
    const p = [];
    for (let h = DAY_START - 1; h <= until + 1e-9; h += 0.1) p.push(`${xOf(h).toFixed(1)},${yOf(solar(h)).toFixed(1)}`);
    return p;
  };
  const areaPath = (h) => `M${xOf(DAY_START - 1)},${yOf(0)} L${points(h).join(" L")} L${xOf(h).toFixed(1)},${yOf(0)} Z`;

  // Courbe SVG
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const chart = $("[data-sim-chart]", sim);
  const defs = el("defs", {});
  const grad = el("linearGradient", { id: "simFill", x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(el("stop", { offset: 0, "stop-color": "#FFD21E", "stop-opacity": 0.6 }), el("stop", { offset: 1, "stop-color": "#F5A623", "stop-opacity": 0.03 }));
  defs.append(grad);
  chart.append(defs);
  [8, 12, 18].forEach((h) => {
    chart.append(el("line", { x1: xOf(h), x2: xOf(h), y1: 8, y2: H - 6, class: "sim__grid" }));
    const t = el("text", { x: xOf(h), y: H + 13, "text-anchor": "middle" });
    t.textContent = `${h} h`;
    chart.append(t);
  });
  chart.append(el("line", { x1: 0, x2: W, y1: yOf(0), y2: yOf(0), class: "sim__base" }));
  const area = el("path", { fill: "url(#simFill)", class: "sim__area-fill" });
  const curve = el("path", { d: `M${points().join(" L")}`, class: "sim__curve" });
  const halo = el("circle", { r: 10, class: "sim__halo" });
  const dot = el("circle", { r: 5, class: "sim__dot" });
  chart.append(area, curve, halo, dot);

  const tabs = $("[data-sim-tabs]", sim);
  const hourIn = $("[data-sim-hour]", sim);
  const areaIn = $("[data-sim-area]", sim);
  const playBtn = $("[data-sim-play]", sim);
  const live = $("[data-sim-live]", sim);
  const cta = $("[data-sim-cta]", sim);
  const out = {
    kw: $("[data-sim-kw]", sim),
    clock: $("[data-sim-clock]", sim),
    area: $("[data-sim-area-out]", sim),
    kwc: $("[data-sim-kwc]", sim),
    modules: $("[data-sim-modules]", sim),
    daily: $("[data-sim-daily]", sim),
  };
  const state = { profile: 0, areas: SIM.profiles.map((p) => p.value), hour: 10.25, playing: !reduced };

  SIM.profiles.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "radio");
    b.textContent = p.label;
    b.addEventListener("click", () => {
      state.profile = i;
      renderProfile();
    });
    tabs.append(b);
  });
  tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const n = SIM.profiles.length;
    state.profile = (state.profile + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
    renderProfile();
    tabs.children[state.profile].focus();
  });

  function paint(h) {
    const cx = xOf(h).toFixed(1);
    const cy = yOf(solar(h)).toFixed(1);
    area.setAttribute("d", areaPath(h));
    halo.setAttribute("cx", cx);
    halo.setAttribute("cy", cy);
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
  }

  let lastQ = -1;
  function renderNumbers() {
    const p = SIM.profiles[state.profile];
    const a = state.areas[state.profile];
    const kwc = a / SIM.m2PerKwc;
    const modules = Math.round((kwc * 1000) / SIM.moduleWc);
    const daily = (kwc * SIM.yieldKwhPerKwc) / 365; // moyenne sur l'année
    const q = quarter(state.hour);
    const instant = kwc * 0.8 * solar(q);
    const dailyLabel = daily >= 1000 ? `${fmt1.format(daily / 1000)} MWh` : daily >= 100 ? `${fmtInt.format(Math.round(daily))} kWh` : `${fmt1.format(daily)} kWh`;
    out.kw.textContent = instant < 0.05 ? "0" : fmt1.format(instant);
    out.clock.textContent = clock(q);
    hourIn.value = String(q);
    hourIn.setAttribute("aria-valuetext", clock(q));
    hourIn.style.setProperty("--fill", `${((q - DAY_START) / (DAY_END - DAY_START)) * 100}%`);
    out.area.textContent = `${fmtInt.format(a)} m²`;
    areaIn.setAttribute("aria-valuetext", `${a} mètres carrés`);
    areaIn.style.setProperty("--fill", `${((a - p.min) / (p.max - p.min)) * 100}%`);
    out.kwc.textContent = `${fmt1.format(kwc)} kWc`;
    out.modules.textContent = fmtInt.format(modules);
    out.daily.textContent = dailyLabel;
    // Demande d'étude pré-remplie avec la simulation
    const subject = `Demande d'étude solaire – ${p.label}`;
    const body = `Bonjour,\n\nJe souhaite recevoir une étude précise.\n\nSimulation : ${p.label}, ${a} m², ${fmt1.format(kwc)} kWc, ${modules} panneaux, environ ${dailyLabel}/jour en moyenne.\n\nNom & prénom :\nTéléphone :\nGouvernorat :\n`;
    cta.href = `mailto:contact@yellowenergysaving.pro?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  function renderProfile() {
    const p = SIM.profiles[state.profile];
    [...tabs.children].forEach((b, i) => {
      b.setAttribute("aria-checked", String(i === state.profile));
      b.tabIndex = i === state.profile ? 0 : -1;
    });
    areaIn.min = p.min;
    areaIn.max = p.max;
    areaIn.step = p.max > 1000 ? 50 : 5;
    areaIn.value = state.areas[state.profile];
    renderNumbers();
  }
  areaIn.addEventListener("input", () => {
    state.areas[state.profile] = Number(areaIn.value);
    renderNumbers();
  });
  hourIn.addEventListener("input", () => {
    setPlaying(false);
    state.hour = Number(hourIn.value);
    paint(state.hour);
    renderNumbers();
  });

  // Journée animée : seulement si la carte est visible et l'onglet actif
  let raf = 0;
  let last = 0;
  let visible = true;
  function tick(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    let next = state.hour + dt * HOURS_PER_SECOND;
    if (next > DAY_END) next = DAY_START;
    state.hour = next;
    paint(next);
    const q = quarter(next);
    if (q !== lastQ) {
      lastQ = q;
      renderNumbers();
    }
    raf = requestAnimationFrame(tick);
  }
  function loop() {
    cancelAnimationFrame(raf);
    if (!state.playing || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function setPlaying(on) {
    state.playing = on;
    live.classList.toggle("is-on", on);
    playBtn.setAttribute("aria-label", on ? "Mettre la journée en pause" : "Lancer la journée");
    $("[data-icon-pause]", playBtn).hidden = !on;
    $("[data-icon-play]", playBtn).hidden = on;
    loop();
  }
  playBtn.addEventListener("click", () => setPlaying(!state.playing));
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    loop();
  }).observe(sim);
  document.addEventListener("visibilitychange", loop);

  renderProfile();
  paint(state.hour);
  setPlaying(state.playing);
})();
