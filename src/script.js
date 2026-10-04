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
    const arrivalInput = enquireForm.querySelector("#enquire-arrival");
    const departureInput = enquireForm.querySelector("#enquire-departure");
    const prefixInput = enquireForm.querySelector("[data-phone-prefix]");
    const phoneInput = enquireForm.querySelector("[data-phone-number]");
    const phoneGroup = enquireForm.querySelector(".phone-group");
    const whatsappInput = enquireForm.querySelector("[data-whatsapp]");
    const endpoint = "https://formsubmit.co/ajax/mistfrontvilla@gmail.com";

    const todayIso = () => {
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      return local.toISOString().slice(0, 10);
    };

    if (arrivalInput) arrivalInput.min = todayIso();
    if (departureInput) departureInput.min = todayIso();

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

    const digitsOnly = (value) => value.replace(/\D/g, "");

    const normalizedPrefix = () => {
      const digits = digitsOnly(prefixInput?.value || "");
      return digits.slice(0, 3) || "91";
    };

    const phoneError = () => {
      const prefix = digitsOnly(prefixInput?.value || "");
      if (prefix && !/^\d{1,3}$/.test(prefix)) {
        return "Country code can have up to 3 digits.";
      }

      const number = digitsOnly(phoneInput?.value || "");
      if (!number) return "Please fill in Phone number.";

      const code = normalizedPrefix();
      if (code === "91") {
        if (!/^[6-9]\d{9}$/.test(number)) {
          return "For +91, enter a valid 10-digit mobile number.";
        }
        return "";
      }

      if (!/^\d{6,12}$/.test(number)) {
        return "Please enter a valid phone number (6–12 digits).";
      }
      return "";
    };

    const fieldError = (field) => {
      if (field === phoneInput) return phoneError();

      const label = field.dataset.requiredLabel || field.name;
      const value = field.value.trim();

      if (!value) return `Please fill in ${label}.`;

      if (field.type === "email" || field.name === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address.";
        }
      }

      if (field.name === "number_of_people") {
        if (!/^[1-9]\d*$/.test(value) || Number(value) > 20) {
          return "Please enter a valid number of people (1–20).";
        }
      }

      if (field.name === "arrival_date" || field.name === "departure_date") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return `Please choose a valid ${label.toLowerCase()}.`;
        }
        if (value < todayIso()) {
          return `${label} cannot be in the past.`;
        }
      }

      return "";
    };

    const setPhoneGroupInvalid = (invalid) => {
      phoneGroup?.classList.toggle("is-invalid", invalid);
      if (phoneInput) {
        if (invalid) markFieldError(phoneInput);
        else clearFieldError(phoneInput);
      }
      if (prefixInput) {
        if (invalid) markFieldError(prefixInput);
        else clearFieldError(prefixInput);
      }
    };

    const validateForm = () => {
      const errors = [];

      requiredFields.forEach((field) => {
        if (field === phoneInput) return;
        clearFieldError(field);
        const error = fieldError(field);
        if (error) {
          markFieldError(field);
          errors.push({ field, error });
        }
      });

      const phoneIssue = phoneError();
      setPhoneGroupInvalid(Boolean(phoneIssue));
      if (phoneIssue) {
        errors.push({ field: phoneInput, error: phoneIssue });
      }

      if (
        arrivalInput?.value &&
        departureInput?.value &&
        !arrivalInput.classList.contains("is-invalid") &&
        !departureInput.classList.contains("is-invalid") &&
        departureInput.value <= arrivalInput.value
      ) {
        markFieldError(departureInput);
        errors.push({
          field: departureInput,
          error: "Departure date must be after the arrival date.",
        });
      }

      return errors;
    };

    const restrictPrefixInput = () => {
      if (!prefixInput) return;
      prefixInput.value = digitsOnly(prefixInput.value).slice(0, 3);
    };

    const restrictPhoneInput = () => {
      if (!phoneInput) return;
      phoneInput.value = digitsOnly(phoneInput.value).slice(0, 12);
    };

    const syncDepartureMin = () => {
      if (!arrivalInput || !departureInput || !arrivalInput.value) return;
      const nextDay = new Date(`${arrivalInput.value}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, "0");
      const day = String(nextDay.getDate()).padStart(2, "0");
      const minDeparture = `${year}-${month}-${day}`;
      departureInput.min = minDeparture;
      if (departureInput.value && departureInput.value < minDeparture) {
        departureInput.value = "";
      }
    };

    arrivalInput?.addEventListener("change", syncDepartureMin);

    prefixInput?.addEventListener("input", () => {
      restrictPrefixInput();
      setPhoneGroupInvalid(Boolean(phoneError()));
    });
    phoneInput?.addEventListener("input", () => {
      restrictPhoneInput();
      setPhoneGroupInvalid(Boolean(phoneError()));
    });

    requiredFields.forEach((field) => {
      if (field === phoneInput) return;
      const recheck = () => {
        const error = fieldError(field);
        if (error) markFieldError(field);
        else clearFieldError(field);
        if (field === arrivalInput) syncDepartureMin();
      };
      field.addEventListener("input", recheck);
      field.addEventListener("change", recheck);
      field.addEventListener("blur", recheck);
    });

    enquireForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      restrictPrefixInput();
      restrictPhoneInput();

      const errors = validateForm();
      if (errors.length) {
        setFormStatus(errors[0].error, "is-error");
        errors[0].field?.focus();
        return;
      }

      setFormStatus("Sending your enquiry…");
      if (submitButton) submitButton.disabled = true;

      const formData = new FormData(enquireForm);
      const payload = Object.fromEntries(formData.entries());
      const prefix = normalizedPrefix();
      const number = digitsOnly(phoneInput.value);
      payload.phone_prefix = prefix;
      payload.phone = number;
      payload.phone_full = `+${prefix}${number}`;
      payload.whatsapp_available = whatsappInput?.checked ? "Yes" : "No";
      payload.trip_dates = `${payload.arrival_date} to ${payload.departure_date}`;

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
        if (prefixInput) prefixInput.value = "91";
        if (arrivalInput) arrivalInput.min = todayIso();
        if (departureInput) departureInput.min = todayIso();
        requiredFields.forEach(clearFieldError);
        setPhoneGroupInvalid(false);
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
