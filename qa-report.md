# QA report — Code Cube Digital Studio

Дата проверки: 18 августа 2026 года.

## Итог

| Уровень | Статус | Доказательство |
|---|---|---|
| Structure verified | PASS | 8 HTML-файлов, 7 основных страниц, 0 битых локальных ссылок, 0 повторяющихся `id` |
| JavaScript syntax | PASS | `node --check assets/app.js` |
| Local HTTP | PASS | 8/8 проверенных URL вернули HTTP 200 |
| Desktop browser | PASS | главная открыта в Codex Browser, `scrollWidth === clientWidth`, 0 console errors |
| Mobile browser | PASS | 7/7 основных страниц проверены при viewport 390×844, фактический client width 375, переполнения нет |
| Calculator | PASS | лендинг + бизнес-бот + канал = 155 000–198 000 ₽ с пакетной скидкой 7% |
| Brief | PASS | сводка обновляется, Telegram URL содержит выбранные данные, отправка не выполняется автоматически |
| Mobile menu | PASS | `aria-expanded=true`, меню видно, доступны 6 ссылок |
| Telegram live verified | NOT TESTED | реальное сообщение не отправлялось, бот не открывался в этой итерации |
| Payment live verified | NOT APPLICABLE | сайт не принимает оплату |
| Production verified | NOT TESTED | сайт не публиковался и не привязан к домену |

## Статическая проверка

Команда:

```powershell
python scripts/check_site.py
```

Результат:

```text
SITE_CHECK=PASS
HTML_PAGES=8
MAIN_PAGES=7
BROKEN_LOCAL_REFERENCES=0
DUPLICATE_IDS=0
```

Дополнительно:

```text
JS_SYNTAX=PASS
PLACEHOLDER_SCAN=PASS
```

## HTTP smoke-test

HTTP 200 получен для:

- `/`
- `/services.html`
- `/cases.html`
- `/pricing.html`
- `/approach.html`
- `/contacts.html`
- `/privacy.html`
- `/404.html`

## Browser QA

### Desktop

- Заголовок вкладки: `Олег / Code Cube — сайты, боты и Telegram Mini Apps`.
- Главный `h1`: `Сайты. Боты. Mini Apps. Одна система продаж.`
- Фактические размеры документа: `clientWidth=1265`, `scrollWidth=1265`.
- Ошибки консоли: `0`.
- Визуально подтверждены фирменная шапка, крупная типографика, signal-stage и CTA.

### Mobile

Viewport задан как 390×844; внутренняя область браузера составила 375 px.

Для каждой страницы:

- `scrollWidth=375` и `clientWidth=375`;
- один `h1`;
- заголовок находится внутри контентной ширины: `right=363`, `width=351`;
- мобильная кнопка меню видима;
- ошибок консоли нет.

После первого прохода был найден и исправлен визуальный дефект: длинные русские заголовки выходили за ширину grid-элемента и обрезались без формального scroll overflow. Добавлены `min-width: 0`, контролируемый mobile font-size и `overflow-wrap`.

## Интерактивы

### Калькулятор

Проверенный набор:

- лендинг;
- бизнес-бот;
- упаковка Telegram-канала.

Результат:

- нижний ориентир: `155 000 ₽`;
- верхний ориентир: `198 000 ₽`;
- пакетная скидка: `7%`;
- сформирован `https://t.me/wise_video?text=...` с расшифровкой состава и бюджета.

### Бриф

Проверенный набор:

- проект: связанная digital-система;
- цель: получать заявки;
- бюджет: 120 000–250 000 ₽;
- контекст: сайт, бот и канал в одной системе.

Результат:

- сводка содержит все четыре пункта;
- статус: `Бриф готов. Данные ещё никуда не отправлены.`;
- Telegram URL сформирован;
- переход по внешней ссылке и отправка сообщения не выполнялись.

## Проверенные публичные кейсы

Публичные страницы были открыты в Codex Browser до сборки сайта:

- WISE / FRAME — `https://code-cube-lab.github.io/wise-frame-public/miniapp`;
- ЭКЗАМ — `https://code-cube-lab.github.io/ekzam-ege-oge-platform-public/?page=direct&v=fa85988`;
- Контур пары — `https://kontur-pary.aliviaweavers72.chatgpt.site/`;
- Т-18 — `https://t18-technology-guide.altheasolwold3296.chatgpt.site/`.

Контакт `@wise_video` подтверждён видимой ссылкой в публичном проекте WISE / FRAME.

## Ограничения

- Прямой автоматизированный просмотр Avito был заблокирован политикой сайта; ограничение не обходилось.
- Конкретные Avito-карточки, рейтинги и отзывы продавцов не проверены.
- Веб-шрифты загружаются с Google Fonts; при недоступности используются системные fallback-шрифты.
- Нет домена, аналитики, CRM, серверной формы, реальной Telegram-сессии и платежей.
- Публичная публикация требует отдельного решения по домену, хостингу, юридическим реквизитам и аналитике.

## Запуск

```powershell
cd "C:\Users\GIGA\Documents\Codex\2026-08-12\new-chat\outputs\code-cube-digital-studio"
python -m http.server 4173
```

Локальный URL: `http://127.0.0.1:4173/`.
