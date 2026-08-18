const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "assets", "cases");
const packagesRoot = "C:\\!_1_WB\\сайты\\02_ПЕРЕНОСИМЫЕ_ПАКЕТЫ_20260818";

const publicProjects = [
  {
    slug: "wise-frame",
    title: "WISE / FRAME",
    url: "https://code-cube-lab.github.io/wise-frame-public/#/miniapp?screen=home",
  },
  {
    slug: "ekzam",
    title: "ЭКЗАМ",
    url: "https://code-cube-lab.github.io/ekzam-ege-oge-platform-public/?page=direct&v=fa85988",
  },
  {
    slug: "kontur-pary",
    title: "Контур пары",
    url: "https://kontur-pary.aliviaweavers72.chatgpt.site/",
  },
  {
    slug: "t18",
    title: "Т-18",
    url: "https://t18-technology-guide.altheasolwold3296.chatgpt.site/",
  },
];

const localProjects = [
  {
    slug: "ponyatno",
    title: "Понятно",
    root: path.join(packagesRoot, "04_Понятно_бухгалтерская_платформа", "source", "apps", "admin"),
    entry: "/index.html",
  },
  {
    slug: "forma-quest",
    title: "FORMA QUEST",
    root: path.join(packagesRoot, "18_FORMA_QUEST_фитнес_игра", "source", "07_web", "public"),
    entry: "/index.html",
  },
  {
    slug: "landscape",
    title: "Облагораживание участка",
    root: path.join(packagesRoot, "17_Облагораживание_участка", "source"),
    entry: "/index.html",
  },
  {
    slug: "mpstats",
    title: "MPStats",
    root: path.join(packagesRoot, "15_MPStats_товарная_лаборатория", "source"),
    entry: "/index.html",
  },
  {
    slug: "white-list",
    title: "WHITE LIST",
    root: path.join(packagesRoot, "16_WHITE_LIST_портфолио", "source"),
    entry: "/index.html",
  },
  {
    slug: "mika-growth",
    title: "Mika Growth",
    root: path.join(packagesRoot, "08_Mika_Growth_доска_клиентов", "source", "GitHub_mika-oracle-growth"),
    entry: "/index.html",
  },
  {
    slug: "telegram-leads",
    title: "Клиенты с телефона",
    root: path.join(packagesRoot, "09_Telegram_клиенты_с_телефона", "source"),
    entry: "/Клиенты_с_телефона.html",
  },
  {
    slug: "white-list-leads",
    title: "WHITE LIST — лиды",
    root: path.join(packagesRoot, "19_Oleg_White_List_лиды", "source"),
    entry: "/index.html",
  },
];

const projectVisuals = [
  {
    slug: "mika-oracle",
    title: "Mika Oracle",
    source: path.join(packagesRoot, "01_Mika_Oracle_основной", "source", "public", "og-taro-path.png"),
    position: "centre",
  },
  {
    slug: "pravofakt",
    title: "ПравоФакт",
    source: path.join(packagesRoot, "06_ПравоФакт_юридическая_платформа", "source", "public", "pravofact-decision-map-v2.png"),
    position: "north",
  },
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
};

function createStaticServer(root) {
  const resolvedRoot = path.resolve(root);
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    let filePath = path.resolve(resolvedRoot, `.${pathname}`);

    if (!filePath.startsWith(resolvedRoot)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        close: () => new Promise((done) => server.close(done)),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function capture(page, project, url) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2_500);
  await page.screenshot({
    path: path.join(outputDir, `${project.slug}.jpg`),
    type: "jpeg",
    quality: 82,
    fullPage: false,
  });

  return {
    slug: project.slug,
    title: project.title,
    url,
    status: response ? response.status() : null,
    pageTitle: await page.title(),
  };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  const results = [];

  if (process.env.SKIP_PUBLIC !== "1") {
    for (const project of publicProjects) {
      try {
        results.push(await capture(page, project, project.url));
      } catch (error) {
        results.push({ slug: project.slug, title: project.title, url: project.url, error: error.message });
      }
    }
  }

  const runtimeProjects = [
    { slug: "mika-oracle", title: "Mika Oracle", url: process.env.MIKA_URL },
    { slug: "pravofakt", title: "ПравоФакт", url: process.env.PRAVO_URL },
  ].filter((project) => project.url);

  for (const project of runtimeProjects) {
    results.push(await capture(page, project, project.url));
  }

  for (const project of localProjects) {
    const server = await createStaticServer(project.root);
    try {
      results.push(await capture(page, project, `${server.url}${project.entry}`));
    } finally {
      await server.close();
    }
  }

  for (const project of projectVisuals) {
    await sharp(project.source)
      .resize(1440, 900, { fit: "cover", position: project.position })
      .jpeg({ quality: 82, progressive: true })
      .toFile(path.join(outputDir, `${project.slug}.jpg`));
    results.push({
      slug: project.slug,
      title: project.title,
      source: project.source,
      type: "project-visual",
    });
  }

  await browser.close();
  fs.writeFileSync(
    path.join(outputDir, "capture-report.json"),
    `${JSON.stringify(results, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
