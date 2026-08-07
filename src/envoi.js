// Envoi reel des candidatures par email (SMTP via nodemailer).
// N'est appele QUE pour les entreprises au statut "validee" (voir index.js) :
// aucun envoi automatique sans validation explicite de l'utilisateur.

import nodemailer from "nodemailer";
import { access } from "node:fs/promises";
import { join } from "node:path";

let transporteur;

function obtenirTransporteur(config) {
  if (!transporteur) {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      throw new Error(
        "SMTP non configure : renseigne SMTP_HOST, SMTP_USER et SMTP_PASS dans .env"
      );
    }
    transporteur = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
  }
  return transporteur;
}

export async function envoyerCandidature(config, entreprise, brouillon) {
  if (!brouillon.destinataire) {
    throw new Error(`Pas d'email destinataire pour "${entreprise.nom}"`);
  }

  const cheminCv = join(process.cwd(), config.cvFile);
  const attachments = [];
  try {
    await access(cheminCv);
    attachments.push({ filename: "CV.pdf", path: cheminCv });
  } catch {
    console.warn(`[envoi] CV introuvable (${config.cvFile}) : email envoye sans piece jointe.`);
  }

  const transport = obtenirTransporteur(config);
  await transport.sendMail({
    from: config.emailExpediteur,
    replyTo: config.emailReponseA,
    to: brouillon.destinataire,
    subject: brouillon.objet,
    text: brouillon.corps,
    attachments,
  });
}
