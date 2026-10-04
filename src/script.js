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

  const enquireForm = document.querySelector("[data-enquire-form]");
  if (enquireForm) {
    const formStatus = enquireForm.querySelector("[data-form-status]");
    const submitButton = enquireForm.querySelector("[data-submit-button]");
    const requiredFields = Array.from(
      enquireForm.querySelectorAll("[data-required-label]")
    );
    const endpoint = "https://formsubmit.co/ajax/mistfrontvilla@gmail.com";

    const setFormStatus = (text, state) => {
      if (!formStatus) return;
      formStatus.textContent = text;
      formStatus.classList.remove("is-success", "is-error");
      if (state) formStatus.classList.add(state);
    };

    const clearFieldError = (field) => {
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    };

    const markFieldError = (field) => {
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    };

    const isFilled = (field) => {
      const value = field.value.trim();
      if (!value) return false;
      if (field.type === "email") {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      if (field.name === "number_of_people") {
        return /^[1-9]\d*$/.test(value);
      }
      return true;
    };

    const validateRequiredFields = () => {
      const missing = [];

      requiredFields.forEach((field) => {
        clearFieldError(field);
        if (!isFilled(field)) {
          markFieldError(field);
          missing.push(field.dataset.requiredLabel || field.name);
        }
      });

      return missing;
    };

    requiredFields.forEach((field) => {
      field.addEventListener("input", () => {
        if (isFilled(field)) clearFieldError(field);
      });
      field.addEventListener("blur", () => {
        if (!isFilled(field)) markFieldError(field);
        else clearFieldError(field);
      });
    });

    enquireForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const missing = validateRequiredFields();
      if (missing.length) {
        const list =
          missing.length === 1
            ? missing[0]
            : `${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;
        setFormStatus(`Please fill in ${list} before sending your enquiry.`, "is-error");
        enquireForm.querySelector(`[data-required-label="${missing[0]}"]`)?.focus();
        return;
      }

      setFormStatus("Sending your enquiry…");
      if (submitButton) submitButton.disabled = true;

      const formData = new FormData(enquireForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === "false" || result.success === false) {
          throw new Error(result.message || "Unable to send enquiry right now.");
        }

        enquireForm.reset();
        requiredFields.forEach(clearFieldError);
        setFormStatus("Thanks — your enquiry was sent. We will reply by email soon.", "is-success");
      } catch (error) {
        console.error(error);
        setFormStatus(
          error.message || "Something went wrong while sending. Please try again in a moment.",
          "is-error"
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

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
