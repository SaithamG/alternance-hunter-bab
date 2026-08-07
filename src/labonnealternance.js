// Recherche d'entreprises via l'API publique et gratuite "La Bonne Alternance"
// (mission-apprentissage / beta.gouv.fr). Elle combine deux choses utiles ici :
//  - des offres d'alternance publiees ("peJobs")
//  - des entreprises reperees par algorithme comme ayant un fort potentiel
//    d'embauche en alternance MEME SANS offre publiee ("lbaCompanies") :
//    c'est exactement la source pour des candidatures spontanees.
//
// ATTENTION : cette API n'est pas totalement stable dans le temps (elle a deja
// change de nom de domaine / de forme de reponse par le passe). Le code ci-dessous
// essaie plusieurs chemins possibles pour extraire les champs utiles et ignore
// silencieusement (avec un avertissement) ce qu'il ne comprend pas plutot que de
// planter. Si `discover` remonte 0 resultat LBA de facon suspecte, lance
// `node src/index.js discover --debug` pour voir le JSON brut renvoye par l'API
// et ajuster `extraireEntreprise` ci-dessous en consequence.

const BASE_URL = "https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/jobsEtFormations";

function premiere(...valeurs) {
  return valeurs.find((v) => v !== undefined && v !== null && v !== "");
}

function extraireEntreprise(brut) {
  const c = brut.company ?? brut.entreprise ?? brut;
  const p = brut.place ?? brut.lieu ?? brut;

  const siret = premiere(c.siret, brut.siret, c.id);
  const nom = premiere(c.name, c.raison_sociale, brut.title, brut.name);
  if (!siret || !nom) return null;

  return {
    id: `lba-${siret}`,
    source: "lba",
    type: "candidature_spontanee",
    nom,
    ville: premiere(p.city, p.commune, ""),
    adresse: premiere(p.fullAddress, p.address, ""),
    distanceKm: premiere(p.distance, brut.distance, null),
    siret,
    email: null, // l'API LBA n'expose pas l'email directement (protection anti-spam)
    site: null,
  };
}

async function appelerAvecRetry(url) {
  let derniereErreur;
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
      derniereErreur = new Error(`API La Bonne Alternance : HTTP ${res.status}`);
    } catch (err) {
      derniereErreur = new Error(`API La Bonne Alternance injoignable : ${err.message}`);
    }
    if (essai < 3) await new Promise((r) => setTimeout(r, essai * 2000));
  }
  throw derniereErreur;
}

/** Cherche les entreprises "candidature spontanee" (recruteurs_lba) autour du point donne. */
export async function chercherEntreprisesLBA(config, { debug = false } = {}) {
  const params = new URLSearchParams({
    romes: config.romes.join(","),
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    radius: String(config.rayonKm),
    caller: config.lbaCaller,
  });
  const url = `${BASE_URL}?${params}`;

  const json = await appelerAvecRetry(url);
  if (debug) {
    console.log("--- Reponse brute API La Bonne Alternance ---");
    console.log(JSON.stringify(json, null, 2).slice(0, 4000));
    console.log("--- fin extrait ---");
  }

  const brutes = json?.lbaCompanies?.results ?? json?.lbaCompanies ?? [];
  if (!Array.isArray(brutes)) {
    console.warn("[LBA] Format de reponse inattendu pour lbaCompanies, aucune entreprise extraite.");
    return [];
  }

  const entreprises = [];
  for (const b of brutes) {
    const e = extraireEntreprise(b);
    if (e) entreprises.push(e);
    else console.warn("[LBA] Entree ignoree (champs manquants) :", JSON.stringify(b).slice(0, 200));
  }
  return entreprises;
}
