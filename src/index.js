// CLI :
//   node src/index.js discover [--debug]   -> cherche des entreprises (LBA + Places), les ajoute a data/entreprises.json
//   node src/index.js draft                -> genere un brouillon pour chaque entreprise "nouvelle" ayant un email
//   node src/index.js list [statut]        -> liste les entreprises (toutes, ou filtrees par statut)
//   node src/index.js approve <id...>      -> valide un ou plusieurs brouillons pour envoi
//   node src/index.js reject <id...>       -> ecarte une ou plusieurs entreprises
//   node src/index.js send [--yes]         -> envoie REELLEMENT les candidatures "validee" (confirmation demandee sauf --yes)
//
// Rien ne part par email sans etre passe par `approve` PUIS `send` avec confirmation.

import { createInterface } from "node:readline/promises";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.js";
import { chargerEntreprises, sauverEntreprises, fusionner } from "./base.js";
import { chercherEntreprisesLBA } from "./labonnealternance.js";
import { chercherEntreprisesPlaces } from "./places.js";
import { chercherEmail } from "./trouverEmail.js";
import { genererBrouillon } from "./brouillon.js";
import { envoyerCandidature } from "./envoi.js";
import { notifierInfo } from "./notify.js";

const DOSSIER_BROUILLONS = join(process.cwd(), "data", "brouillons");

function slug(id) {
  return id.replace(/[^a-z0-9-]/gi, "_");
}

async function cmdDiscover(args) {
  const debug = args.includes("--debug");
  const existantes = await chargerEntreprises();

  const [lba, places] = await Promise.all([
    chercherEntreprisesLBA(config, { debug }).catch((err) => {
      console.warn(`[discover] LBA indisponible : ${err.message}`);
      return [];
    }),
    chercherEntreprisesPlaces(config).catch((err) => {
      console.warn(`[discover] Places indisponible : ${err.message}`);
      return [];
    }),
  ]);

  const { fusion, ajouts } = fusionner(existantes, [...lba, ...places]);
  await sauverEntreprises(fusion);

  console.log(`Discover : ${lba.length} via LBA, ${places.length} via Places, ${ajouts} nouvelle(s) entreprise(s) ajoutee(s).`);
  if (ajouts > 0) {
    await notifierInfo(
      config,
      "Nouvelles entreprises trouvées",
      `${ajouts} nouvelle(s) entreprise(s) repérée(s) pour ton alternance. Lance "npm run draft" pour préparer les candidatures.`
    ).catch((err) => console.warn(`[notify] ${err.message}`));
  }
}

async function cmdDraft() {
  const entreprises = await chargerEntreprises();
  const aTraiter = entreprises.filter((e) => e.statut === "nouvelle");
  if (aTraiter.length === 0) {
    console.log("Aucune entreprise a traiter (lance d'abord `npm run discover`).");
    return;
  }

  await mkdir(DOSSIER_BROUILLONS, { recursive: true });
  let prets = 0;
  let sansEmail = 0;

  for (const e of aTraiter) {
    if (!e.email) {
      const { email, site } = await chercherEmail(e, config);
      e.email = email;
      e.site = site ?? e.site;
    }

    if (!e.email) {
      e.statut = "email_manquant";
      sansEmail++;
      continue;
    }

    const brouillon = genererBrouillon(e, config);
    const fichier = join(DOSSIER_BROUILLONS, `${slug(e.id)}.txt`);
    await writeFile(
      fichier,
      `A: ${brouillon.destinataire}\nObjet: ${brouillon.objet}\n\n${brouillon.corps}\n`,
      "utf8"
    );
    e.statut = "brouillon";
    e.brouillonPath = fichier;
    prets++;
  }

  await sauverEntreprises(entreprises);
  console.log(`Draft : ${prets} brouillon(s) prêt(s) à relire dans data/brouillons/, ${sansEmail} sans email trouvé (à compléter manuellement via "list email_manquant").`);

  if (prets > 0) {
    await notifierInfo(
      config,
      "Candidatures à relire",
      `${prets} brouillon(s) prêt(s) dans data/brouillons/. Relis, ajuste, puis "npm run approve -- <id>".`
    ).catch((err) => console.warn(`[notify] ${err.message}`));
  }
}

async function cmdList(args) {
  const entreprises = await chargerEntreprises();
  const filtre = args[0];
  const filtrees = filtre ? entreprises.filter((e) => e.statut === filtre) : entreprises;

  if (filtrees.length === 0) {
    console.log(filtre ? `Aucune entreprise au statut "${filtre}".` : "Aucune entreprise en base.");
    return;
  }
  for (const e of filtrees) {
    console.log(`[${e.statut}] ${e.id} - ${e.nom} (${e.ville || "?"}) ${e.email ? `<${e.email}>` : "(pas d'email)"}`);
  }
}

async function cmdApprove(args) {
  if (args.length === 0) {
    console.log("Usage : npm run approve -- <id> [id...]  (voir les ids avec `npm run list -- brouillon`)");
    return;
  }
  const entreprises = await chargerEntreprises();
  let n = 0;
  for (const id of args) {
    const e = entreprises.find((x) => x.id === id);
    if (!e) {
      console.warn(`Id inconnu : ${id}`);
      continue;
    }
    if (e.statut !== "brouillon") {
      console.warn(`"${e.nom}" n'est pas au statut brouillon (statut actuel : ${e.statut}), ignore.`);
      continue;
    }
    e.statut = "validee";
    n++;
  }
  await sauverEntreprises(entreprises);
  console.log(`${n} candidature(s) validee(s), prete(s) pour "npm run send".`);
}

async function cmdReject(args) {
  const entreprises = await chargerEntreprises();
  let n = 0;
  for (const id of args) {
    const e = entreprises.find((x) => x.id === id);
    if (e) {
      e.statut = "rejetee";
      n++;
    }
  }
  await sauverEntreprises(entreprises);
  console.log(`${n} entreprise(s) ecartee(s).`);
}

async function cmdSend(args) {
  const auto = args.includes("--yes");
  const entreprises = await chargerEntreprises();
  const aEnvoyer = entreprises.filter((e) => e.statut === "validee");

  if (aEnvoyer.length === 0) {
    console.log("Rien a envoyer (valide d'abord des brouillons avec `npm run approve`).");
    return;
  }

  console.log(`${aEnvoyer.length} candidature(s) prete(s) a partir :`);
  for (const e of aEnvoyer) console.log(`  - ${e.nom} <${e.email}>`);

  if (!auto) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const reponse = await rl.question(`\nEnvoyer reellement ces ${aEnvoyer.length} email(s) maintenant ? (oui/non) `);
    rl.close();
    if (reponse.trim().toLowerCase() !== "oui") {
      console.log("Annule, rien n'a ete envoye.");
      return;
    }
  }

  let envoyees = 0;
  for (const e of aEnvoyer) {
    try {
      const fichier = e.brouillonPath ? await readFile(e.brouillonPath, "utf8") : null;
      const brouillon = fichier
        ? {
            destinataire: e.email,
            objet: fichier.match(/^Objet: (.*)$/m)?.[1] ?? "Candidature spontanée",
            corps: fichier.split("\n\n").slice(1).join("\n\n"),
          }
        : genererBrouillon(e, config);

      await envoyerCandidature(config, e, brouillon);
      e.statut = "envoyee";
      e.envoyeeLe = new Date().toISOString();
      envoyees++;
      console.log(`  -> envoye a ${e.nom}`);
    } catch (err) {
      console.error(`  -> ECHEC pour ${e.nom} : ${err.message}`);
    }
    await sauverEntreprises(entreprises); // sauvegarde apres CHAQUE envoi : jamais deux fois le meme si le process est interrompu
  }

  console.log(`${envoyees}/${aEnvoyer.length} candidature(s) envoyee(s).`);
}

async function main() {
  const [commande, ...args] = process.argv.slice(2);
  switch (commande) {
    case "discover":
      return cmdDiscover(args);
    case "draft":
      return cmdDraft();
    case "list":
      return cmdList(args);
    case "approve":
      return cmdApprove(args);
    case "reject":
      return cmdReject(args);
    case "send":
      return cmdSend(args);
    default:
      console.log("Commandes : discover | draft | list [statut] | approve <id...> | reject <id...> | send [--yes]");
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
