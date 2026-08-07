// Persistance simple en JSON (pas de base de donnees : un seul utilisateur,
// quelques dizaines/centaines d'entreprises, un fichier suffit largement).
//
// Statuts possibles d'une entreprise :
//   nouvelle  -> trouvee par `discover`, pas encore de brouillon
//   brouillon -> lettre generee par `draft`, en attente de relecture
//   validee   -> approuvee par l'utilisateur via `approve`, prete a partir
//   envoyee   -> candidature reellement envoyee par `send`
//   rejetee   -> ecartee via `reject` (ne sera plus proposee)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const FICHIER = join(DATA_DIR, "entreprises.json");

export async function chargerEntreprises() {
  try {
    const txt = await readFile(FICHIER, "utf8");
    return JSON.parse(txt);
  } catch {
    return [];
  }
}

export async function sauverEntreprises(entreprises) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FICHIER, JSON.stringify(entreprises, null, 2), "utf8");
}

/** Fusionne de nouvelles entreprises trouvees avec la base existante, sans doublons (par id). */
export function fusionner(existantes, trouvees) {
  const parId = new Map(existantes.map((e) => [e.id, e]));
  let ajouts = 0;
  for (const e of trouvees) {
    if (!parId.has(e.id)) {
      parId.set(e.id, { ...e, statut: "nouvelle", decouverteLe: new Date().toISOString() });
      ajouts++;
    }
  }
  return { fusion: [...parId.values()], ajouts };
}
