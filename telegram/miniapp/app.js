(() => {
  const telegram = window.Telegram?.WebApp;
  const form = document.querySelector("#brief");
  const summary = document.querySelector("#summary");
  const send = document.querySelector("#send");

  telegram?.ready();
  telegram?.expand();

  const update = () => {
    const data = Object.fromEntries(new FormData(form).entries());
    const lines = [
      "Здравствуйте! Я заполнил мини-бриф Code Cube.",
      `Проект: ${data.project}.`,
      `Бюджет: ${data.budget}.`,
      `Задача: ${String(data.goal || "уточню в диалоге").trim() || "уточню в диалоге"}.`,
      "Хочу получить состав первого этапа и оценку.",
    ];
    const message = lines.join("\n");
    summary.textContent = message;
    send.href = `https://t.me/wise_video?text=${encodeURIComponent(message)}`;

    if (telegram?.MainButton) {
      telegram.MainButton.setText("ОТПРАВИТЬ ОЛЕГУ");
      telegram.MainButton.show();
    }
  };

  telegram?.MainButton?.onClick(() => telegram.openTelegramLink(send.href));
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
})();
