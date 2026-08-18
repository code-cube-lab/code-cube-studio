const token = process.env.TELEGRAM_BOT_TOKEN;
const portfolioUrl = process.env.PORTFOLIO_URL || "https://example.com/";
const miniAppUrl = process.env.MINIAPP_URL || "https://example.com/telegram/miniapp/";
const supportUsername = (process.env.SUPPORT_USERNAME || "wise_video").replace(/^@/, "");

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

const apiBase = `https://api.telegram.org/bot${token}`;

const api = async (method, payload = {}) => {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`${method}: ${result.description || "Telegram API error"}`);
  return result.result;
};

const mainKeyboard = {
  inline_keyboard: [
    [{ text: "Посмотреть услуги", callback_data: "services" }, { text: "Узнать цены", callback_data: "prices" }],
    [{ text: "Открыть портфолио", url: portfolioUrl }],
    [{ text: "Заполнить мини-бриф", web_app: { url: miniAppUrl } }],
    [{ text: "Написать Олегу", url: `https://t.me/${supportUsername}` }],
  ],
};

const texts = {
  start: "Здравствуйте! Я бот Code Cube. Помогу выбрать сайт, Telegram-бот, Mini App или упаковку канала и перейти к короткому брифу.",
  services: "Направления Code Cube:\n\n• лендинги и многостраничные сайты;\n• Telegram-боты и автоматизация;\n• Telegram Mini Apps;\n• упаковка каналов;\n• связка сайт + бот + канал + Mini App.",
  prices: "Стартовые ориентиры:\n\n• аудит + прототип — 15 000 ₽;\n• лендинг — от 49 000 ₽;\n• многостраничный сайт — от 99 000 ₽;\n• Telegram-бот — от 39 000 ₽;\n• Mini App prototype — от 69 000 ₽;\n• Mini App MVP — от 119 000 ₽;\n• упаковка канала — от 24 000 ₽.\n\nТочная смета зависит от экранов, ролей и интеграций.",
  help: "Выберите кнопку под сообщением или используйте /services, /prices, /brief, /terms и /support.",
  terms: "Цена фиксируется после согласования состава этапа. Домен, хостинг, сторонние сервисы и платные API оплачиваются отдельно, если не включены в смету. Публичный запуск и live-интеграции проверяются отдельно от локальной сборки.",
  support: `Связь с Олегом: @${supportUsername}`,
};

const send = (chatId, text, replyMarkup = mainKeyboard) => api("sendMessage", {
  chat_id: chatId,
  text,
  reply_markup: replyMarkup,
  disable_web_page_preview: true,
});

const handleMessage = async (message) => {
  const chatId = message.chat.id;
  const command = (message.text || "").split(/\s+/)[0].split("@")[0].toLowerCase();
  if (command === "/start") return send(chatId, texts.start);
  if (command === "/services") return send(chatId, texts.services);
  if (command === "/prices") return send(chatId, texts.prices);
  if (command === "/brief") return send(chatId, "Откройте мини-бриф:", { inline_keyboard: [[{ text: "Заполнить бриф", web_app: { url: miniAppUrl } }]] });
  if (command === "/terms") return send(chatId, texts.terms);
  if (command === "/support") return send(chatId, texts.support);
  return send(chatId, texts.help);
};

const handleCallback = async (query) => {
  const text = query.data === "services" ? texts.services : query.data === "prices" ? texts.prices : texts.help;
  await api("answerCallbackQuery", { callback_query_id: query.id });
  await send(query.message.chat.id, text);
};

await api("setMyCommands", {
  commands: [
    { command: "start", description: "Начать" },
    { command: "services", description: "Услуги" },
    { command: "prices", description: "Цены" },
    { command: "brief", description: "Мини-бриф" },
    { command: "help", description: "Помощь" },
    { command: "terms", description: "Условия" },
    { command: "support", description: "Связь" },
  ],
});

let offset = 0;
console.log("Code Cube bot started");

while (true) {
  try {
    const updates = await api("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
    for (const update of updates) {
      offset = update.update_id + 1;
      if (update.message) await handleMessage(update.message);
      if (update.callback_query) await handleCallback(update.callback_query);
    }
  } catch (error) {
    console.error(error.message);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

