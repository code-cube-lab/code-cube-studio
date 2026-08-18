const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:4173";
const pages = [
  "index.html",
  "services.html",
  "cases.html",
  "pricing.html",
  "approach.html",
  "contacts.html",
  "privacy.html",
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const errors = [];
  const report = { desktop: {}, mobile: {}, calculator: {}, cases: {}, headerAction: {} };

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktop.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    desktop.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    for (const file of pages) {
      const response = await desktop.goto(`${baseUrl}/${file}`, { waitUntil: "networkidle" });
      report.desktop[file] = response ? response.status() : null;
      if (!response || response.status() !== 200) errors.push(`${file}: HTTP ${response ? response.status() : "none"}`);
    }

    await desktop.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    const hero = await desktop.locator("h1").innerText();
    if (!hero.includes("Нахожу")) errors.push("index.html: commercial offer is missing from h1");
    if (process.env.QA_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.QA_SCREENSHOT_DIR, { recursive: true });
      await desktop.screenshot({
        path: path.join(process.env.QA_SCREENSHOT_DIR, "home-desktop.jpg"),
        type: "jpeg",
        quality: 82,
      });
    }

    await desktop.goto(`${baseUrl}/cases.html`, { waitUntil: "networkidle" });
    const caseImages = desktop.locator(".case-photo img");
    for (let index = 0; index < await caseImages.count(); index += 1) {
      await caseImages.nth(index).scrollIntoViewIfNeeded();
    }
    await desktop.waitForFunction(
      () => [...document.querySelectorAll(".case-photo img")].every((image) => image.complete && image.naturalWidth > 0),
      null,
      { timeout: 15_000 },
    ).catch(() => {});
    report.cases = await desktop.locator(".case-photo img").evaluateAll((images) => ({
      count: images.length,
      loaded: images.filter((image) => image.complete && image.naturalWidth > 0).length,
      unloaded: images
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
    }));
    if (report.cases.count !== 14 || report.cases.loaded !== 14) {
      errors.push(`cases.html: expected 14 loaded images, got ${report.cases.loaded}/${report.cases.count}`);
    }
    if (process.env.QA_SCREENSHOT_DIR) {
      const growthSection = desktop.locator("section").filter({ hasText: "GROWTH SYSTEMS" }).first();
      await growthSection.scrollIntoViewIfNeeded();
      await desktop.screenshot({
        path: path.join(process.env.QA_SCREENSHOT_DIR, "cases-growth-desktop.jpg"),
        type: "jpeg",
        quality: 82,
      });
    }
    report.headerAction = await desktop.locator(".header-actions .button").evaluate((element) => ({
      text: element.textContent.trim(),
      width: element.getBoundingClientRect().width,
      scrollWidth: element.scrollWidth,
    }));
    if (report.headerAction.width < report.headerAction.scrollWidth) {
      errors.push(`header action is clipped: ${report.headerAction.width}/${report.headerAction.scrollWidth}`);
    }

    await desktop.goto(`${baseUrl}/services.html#growth`, { waitUntil: "networkidle" });
    const growthText = await desktop.locator("#growth").innerText();
    for (const platform of ["Avito", "Kwork", "FL.ru", "Workspace", "hh.ru"]) {
      if (!growthText.includes(platform)) errors.push(`services.html: missing platform ${platform}`);
    }

    await desktop.goto(`${baseUrl}/pricing.html#calculator`, { waitUntil: "networkidle" });
    await desktop.locator("#calc-market").check();
    await desktop.locator("#calc-sales").check();
    report.calculator.price = await desktop.locator("[data-result-price]").innerText();
    if (!report.calculator.price.replace(/\s/g, " ").includes("98 000")) {
      errors.push(`pricing.html: expected calculator total 98 000, got ${report.calculator.price}`);
    }

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mobile.on("console", (message) => {
      if (message.type() === "error") errors.push(`mobile console: ${message.text()}`);
    });
    mobile.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));

    for (const file of pages) {
      await mobile.goto(`${baseUrl}/${file}`, { waitUntil: "networkidle" });
      const dimensions = await mobile.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      report.mobile[file] = dimensions;
      if (dimensions.scrollWidth > dimensions.innerWidth) {
        errors.push(`${file}: mobile overflow ${dimensions.scrollWidth}/${dimensions.innerWidth}`);
      }
    }

    console.log(JSON.stringify(report, null, 2));
    if (errors.length) {
      console.error("BROWSER_QA=FAIL");
      errors.forEach((error) => console.error(`- ${error}`));
      process.exitCode = 1;
      return;
    }
    console.log("BROWSER_QA=PASS");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
