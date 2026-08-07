// Configuration chargee depuis les variables d'environnement (voir .env.example).

function liste(valeur, defaut) {
  return (valeur ?? defaut)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  latitude: Number(process.env.LATITUDE ?? 43.426),
  longitude: Number(process.env.LONGITUDE ?? -1.367),
  rayonKm: Number(process.env.RAYON_KM ?? 20),

  romes: liste(process.env.ROMES, "M1801,M1802,I1401"),
  lbaCaller: process.env.LBA_CALLER || "alternance-hunter-bab",

  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? "",
  motsClesPlaces: liste(
    process.env.MOTS_CLES_PLACES,
    "ESN,société informatique,infogérance,sécurité informatique,réseaux informatiques"
  ),

  cvFile: process.env.CV_FILE || "data/cv.pdf",
  nomCandidat: process.env.NOM_CANDIDAT ?? "",
  telephoneCandidat: process.env.TELEPHONE_CANDIDAT ?? "",
  emailCandidat: process.env.EMAIL_CANDIDAT || process.env.SMTP_USER || "",

  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailExpediteur: process.env.EMAIL_EXPEDITEUR || process.env.SMTP_USER || "",
  emailReponseA: process.env.EMAIL_REPONSE_A || process.env.SMTP_USER || "",

  canal: (process.env.CANAL ?? "ntfy").toLowerCase(),
  ntfyTopic: process.env.NTFY_TOPIC ?? "",
  telegramToken: process.env.TELEGRAM_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
};
