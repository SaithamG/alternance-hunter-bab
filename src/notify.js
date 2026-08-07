// Notifications de service (nouvelles entreprises trouvees, brouillons prets a
// relire...). Meme systeme que crous-watch-bayonne : ntfy (zero compte) ou telegram.

async function envoyerAvecControle(url, options, canal) {
  let derniereErreur;
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return;
      derniereErreur = new Error(`${canal} a repondu HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      derniereErreur = new Error(`${canal} injoignable : ${err.message}`);
    }
    if (essai < 3) await new Promise((r) => setTimeout(r, essai * 2000));
  }
  throw derniereErreur;
}

export async function notifierInfo(config, titre, message) {
  if (!config.canal || (config.canal === "ntfy" && !config.ntfyTopic)) return;

  if (config.canal === "telegram") {
    if (!config.telegramToken || !config.telegramChatId) return;
    await envoyerAvecControle(
      `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: `${titre}\n\n${message}`,
          disable_web_page_preview: true,
        }),
      },
      "Telegram"
    );
    return;
  }

  await envoyerAvecControle(
    `https://ntfy.sh/${config.ntfyTopic}`,
    {
      method: "POST",
      headers: { Title: titre, Priority: "default", Tags: "briefcase" },
      body: message,
    },
    "ntfy"
  );
}
