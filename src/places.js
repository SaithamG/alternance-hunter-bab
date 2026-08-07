// Recherche complementaire via l'API Google Places (Text Search) : entreprises
// IT/reseaux/securite locales, meme celles qui n'apparaissent pas dans les
// donnees France Travail / La Bonne Alternance. Source optionnelle : si
// GOOGLE_PLACES_API_KEY est vide, `discover` saute simplement cette etape.

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

function idDepuisPlaceId(placeId) {
  return `places-${placeId}`;
}

async function appelerAvecRetry(url) {
  let derniereErreur;
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "OK" || json.status === "ZERO_RESULTS") return json;
      derniereErreur = new Error(`Google Places : statut ${json.status} (${json.error_message ?? "?"})`);
    } catch (err) {
      derniereErreur = new Error(`Google Places injoignable : ${err.message}`);
    }
    if (essai < 3) await new Promise((r) => setTimeout(r, essai * 2000));
  }
  throw derniereErreur;
}

/** Cherche des entreprises via un mot-cle, centre sur la zone configuree. */
async function chercherMotCle(config, motCle) {
  const params = new URLSearchParams({
    query: motCle,
    location: `${config.latitude},${config.longitude}`,
    radius: String(config.rayonKm * 1000),
    key: config.googlePlacesApiKey,
  });
  const json = await appelerAvecRetry(`${TEXT_SEARCH_URL}?${params}`);

  return (json.results ?? [])
    .filter((r) => r.business_status !== "CLOSED_PERMANENTLY")
    .map((r) => ({
      id: idDepuisPlaceId(r.place_id),
      source: "places",
      type: "candidature_spontanee",
      nom: r.name,
      ville: (r.formatted_address ?? "").split(",").slice(-2, -1)[0]?.trim() ?? "",
      adresse: r.formatted_address ?? "",
      distanceKm: null,
      siret: null,
      email: null,
      site: null,
      placeId: r.place_id,
    }));
}

const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

/** Recupere le site web d'une entreprise (appel separe : Text Search ne le fournit pas). */
export async function obtenirSiteWeb(config, placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "website",
    key: config.googlePlacesApiKey,
  });
  try {
    const json = await appelerAvecRetry(`${DETAILS_URL}?${params}`);
    return json.result?.website ?? null;
  } catch (err) {
    console.warn(`[Places] Impossible de recuperer le site pour ${placeId} : ${err.message}`);
    return null;
  }
}

/** Cherche toutes les entreprises pour tous les mots-cles configures, dedupliquees par place_id. */
export async function chercherEntreprisesPlaces(config) {
  if (!config.googlePlacesApiKey) {
    console.log("[Places] GOOGLE_PLACES_API_KEY absente, source ignoree.");
    return [];
  }

  const parId = new Map();
  for (const motCle of config.motsClesPlaces) {
    try {
      const resultats = await chercherMotCle(config, motCle);
      for (const r of resultats) parId.set(r.id, r);
      console.log(`[Places] "${motCle}" -> ${resultats.length} resultat(s)`);
    } catch (err) {
      console.warn(`[Places] Echec pour "${motCle}" : ${err.message}`);
    }
  }
  return [...parId.values()];
}
