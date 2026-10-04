(() => {
  const header = document.querySelector(".site-header");
  const slideshow = document.querySelector("[data-slideshow]");
  const revealItems = document.querySelectorAll(".reveal");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 40);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const initSlideshow = (slides) => {
    if (!slideshow || slides.length === 0) return;

    const prevBtn = slideshow.querySelector("[data-prev]");
    const nextBtn = slideshow.querySelector("[data-next]");
    const dotsWrap = slideshow.querySelector(".slideshow-dots");
    let index = 0;
    let timer;

    const goTo = (nextIndex) => {
      slides[index].classList.remove("is-active");
      dotsWrap.children[index]?.classList.remove("is-active");
      index = (nextIndex + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      dotsWrap.children[index]?.classList.add("is-active");
    };

    const startTimer = () => {
      clearInterval(timer);
      if (slides.length < 2) return;
      timer = setInterval(() => goTo(index + 1), 5000);
    };

    dotsWrap.replaceChildren();
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slideshow-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", `Show photo ${i + 1}`);
      dot.addEventListener("click", () => {
        goTo(i);
        startTimer();
      });
      dotsWrap.appendChild(dot);
    });

    prevBtn?.addEventListener("click", () => {
      goTo(index - 1);
      startTimer();
    });

    nextBtn?.addEventListener("click", () => {
      goTo(index + 1);
      startTimer();
    });

    slideshow.addEventListener("mouseenter", () => clearInterval(timer));
    slideshow.addEventListener("mouseleave", startTimer);
    startTimer();
  };

  const buildSlides = (images) => {
    const stage = slideshow?.querySelector(".slideshow-stage");
    if (!slideshow || !stage) return;

    stage.replaceChildren();

    if (!images.length) {
      const empty = document.createElement("p");
      empty.className = "slideshow-empty";
      empty.textContent = "Gallery photos will appear here once added to the images folder.";
      stage.appendChild(empty);
      return;
    }

    const slides = images.map((image, i) => {
      const figure = document.createElement("figure");
      figure.className = "slide" + (i === 0 ? " is-active" : "");

      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt || image.caption || "Mistfront photo";
      img.loading = i === 0 ? "eager" : "lazy";

      const caption = document.createElement("figcaption");
      caption.textContent = image.caption || image.alt || "Mistfront photo";

      figure.append(img, caption);
      stage.appendChild(figure);
      return figure;
    });

    initSlideshow(slides);
  };

  const loadGallery = async () => {
    if (!slideshow) return;

    try {
      const response = await fetch("gallery.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Gallery manifest failed with ${response.status}`);
      }
      const data = await response.json();
      buildSlides(Array.isArray(data.images) ? data.images : []);
    } catch (error) {
      console.error(error);
      buildSlides([]);
    }
  };

  loadGallery();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
