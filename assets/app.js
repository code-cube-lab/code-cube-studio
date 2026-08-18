(() => {
  const telegramUser = "wise_video";
  const money = new Intl.NumberFormat("ru-RU");
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentFile || (currentFile === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const closeMenu = () => {
    body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const updateScroll = () => {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty("--scroll-progress", `${max > 0 ? (scrolled / max) * 100 : 0}%`);
    header?.classList.toggle("is-scrolled", scrolled > 8);
  };

  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    }, { passive: true });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  document.querySelectorAll("[data-telegram-message]").forEach((link) => {
    const message = link.dataset.telegramMessage || "Здравствуйте! Хочу обсудить digital-проект.";
    link.href = `https://t.me/${telegramUser}?text=${encodeURIComponent(message)}`;
  });

  const calculator = document.querySelector("[data-calculator]");
  if (calculator) {
    const checkboxes = [...calculator.querySelectorAll("input[data-price]")];
    const urgency = calculator.querySelector("[data-urgency]");
    const resultPrice = document.querySelector("[data-result-price]");
    const resultRange = document.querySelector("[data-result-range]");
    const resultList = document.querySelector("[data-result-list]");
    const estimateLink = document.querySelector("[data-estimate-link]");
    const copyButton = document.querySelector("[data-copy-estimate]");
    let estimateText = "";

    const updateCalculator = () => {
      const selected = checkboxes.filter((checkbox) => checkbox.checked);
      const base = selected.reduce((sum, checkbox) => sum + Number(checkbox.dataset.price), 0);
      const factor = Number(urgency?.value || 1);
      const bundleDiscount = selected.length >= 3 ? 0.93 : 1;
      const estimate = Math.round((base * factor * bundleDiscount) / 1000) * 1000;
      const upper = Math.round((estimate * 1.28) / 1000) * 1000;
      const selectedNames = selected.map((checkbox) => checkbox.dataset.name);

      if (!selected.length) {
        resultPrice.textContent = "—";
        resultRange.textContent = "Выберите хотя бы одно направление";
        resultList.innerHTML = "<li><span>Состав</span><strong>пока пусто</strong></li>";
        estimateLink.href = `https://t.me/${telegramUser}?text=${encodeURIComponent("Здравствуйте! Хочу обсудить проект, но пока не определился с форматом.")}`;
        estimateText = "";
        return;
      }

      resultPrice.textContent = `от ${money.format(estimate)} ₽`;
      resultRange.textContent = `ориентир до ${money.format(upper)} ₽ после уточнения объёма`;
      resultList.innerHTML = selectedNames.map((name) => `<li><span>${name}</span><strong>включено</strong></li>`).join("") +
        (selected.length >= 3 ? "<li><span>Пакетная скидка</span><strong>−7%</strong></li>" : "");

      estimateText = [
        "Здравствуйте! Я рассчитал проект на сайте Code Cube.",
        `Направления: ${selectedNames.join(", ")}.`,
        `Предварительный ориентир: ${money.format(estimate)}–${money.format(upper)} ₽.`,
        "Хочу уточнить состав и получить фиксированную смету."
      ].join("\n");
      estimateLink.href = `https://t.me/${telegramUser}?text=${encodeURIComponent(estimateText)}`;
    };

    calculator.addEventListener("change", updateCalculator);
    urgency?.addEventListener("input", updateCalculator);
    copyButton?.addEventListener("click", async () => {
      if (!estimateText) {
        copyButton.textContent = "Сначала выберите услуги";
        return;
      }
      try {
        await navigator.clipboard.writeText(estimateText);
        copyButton.textContent = "Смета скопирована";
      } catch {
        copyButton.textContent = "Не удалось скопировать";
      }
      window.setTimeout(() => { copyButton.textContent = "Скопировать расчёт"; }, 1800);
    });
    updateCalculator();
  }

  const briefForm = document.querySelector("[data-brief-form]");
  if (briefForm) {
    const summary = document.querySelector("[data-brief-summary]");
    const briefLink = document.querySelector("[data-brief-link]");
    const status = document.querySelector("[data-form-status]");

    const labels = {
      project: "Проект",
      goal: "Цель",
      budget: "Бюджет",
      deadline: "Срок",
      details: "Контекст"
    };

    const getValues = () => Object.fromEntries(new FormData(briefForm).entries());

    const updateBrief = () => {
      const values = getValues();
      const rows = Object.entries(values).filter(([, value]) => String(value).trim());
      summary.innerHTML = rows.length
        ? rows.map(([key, value]) => `<li><span>${labels[key] || key}</span><strong>${String(value).replace(/[<>]/g, "")}</strong></li>`).join("")
        : "<li><span>Бриф</span><strong>заполните поля слева</strong></li>";

      const lines = ["Здравствуйте! Хочу обсудить проект через Code Cube."];
      rows.forEach(([key, value]) => lines.push(`${labels[key] || key}: ${value}`));
      lines.push("Готов уточнить детали и получить оценку.");
      briefLink.href = `https://t.me/${telegramUser}?text=${encodeURIComponent(lines.join("\n"))}`;
    };

    briefForm.addEventListener("input", updateBrief);
    briefForm.addEventListener("change", updateBrief);
    briefForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getValues();
      if (!values.project) {
        status.textContent = "Выберите тип проекта — это поможет подготовить сообщение.";
        briefForm.querySelector("[name='project']")?.focus();
        return;
      }
      status.textContent = "Бриф готов. Данные ещё никуда не отправлены.";
      updateBrief();
      briefLink.focus();
    });
    updateBrief();
  }
})();
