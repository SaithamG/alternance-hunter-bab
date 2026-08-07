// Recherche best-effort d'un email de contact sur le site web d'une entreprise.
// Ce n'est PAS fiable a 100% (beaucoup de sites cachent l'email derriere un
// formulaire) : le champ `email` reste `null` si rien n'est trouve, et la
// commande `draft` marque alors l'entreprise comme "email a completer
// manuellement" plutot que d'inventer une adresse.

import { obtenirSiteWeb } from "./places.js";

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const DOMAINES_A_IGNORER = ["sentry.io", "wixpress.com", "example.com", "domain.com", "godaddy.com"];
const PAGES_A_ESSAYER = ["", "/contact", "/contact-us", "/nous-contacter", "/mentions-legales"];

function estUneAdresseValable(email, domaineSite) {
  const domaine = email.split("@")[1]?.toLowerCase();
  if (!domaine) return false;
  if (DOMAINES_A_IGNORER.some((d) => domaine.includes(d))) return false;
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email)) return false;
  return true;
}

async function extraireEmailDePage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const trouves = html.match(REGEX_EMAIL) ?? [];
    const valables = trouves.filter((e) => estUneAdresseValable(e, url));
    return valables[0] ?? null;
  } catch {
    return null;
  }
}

/** Essaie de trouver un email de contact a partir du site web d'une entreprise. */
export async function chercherEmail(entreprise, config) {
  let site = entreprise.site;

  if (!site && entreprise.source === "places" && entreprise.placeId && config.googlePlacesApiKey) {
    site = await obtenirSiteWeb(config, entreprise.placeId);
  }
  if (!site) return { email: null, site };

  const base = site.replace(/\/$/, "");
  for (const chemin of PAGES_A_ESSAYER) {
    const email = await extraireEmailDePage(base + chemin);
    if (email) return { email, site };
  }
  return { email: null, site };
}
