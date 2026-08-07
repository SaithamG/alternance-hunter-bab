// Genere un brouillon d'email de candidature spontanee, a relire et modifier
// avant validation. Le CV n'est pas re-ecrit ici : on part d'un modele de lettre
// courte (ce que lisent reellement les recruteurs pour une candidature spontanee)
// qui renvoie vers le CV joint en piece jointe au moment de l'envoi.

function objet(entreprise) {
  return `Candidature spontanée – Alternance Technicien Systèmes Réseaux et Sécurité`;
}

function corps(entreprise, config) {
  const nom = config.nomCandidat || "[Ton prénom NOM]";
  const tel = config.telephoneCandidat || "[ton téléphone]";
  const email = config.emailCandidat || "[ton email]";
  const ou = entreprise.ville ? ` à ${entreprise.ville}` : "";

  return `Bonjour,

Actuellement en formation certifiante Technicien Systèmes Réseaux et Sécurité avec l'ISCOD (2025-2027), je recherche une entreprise${ou} pour poursuivre mon alternance : je suis en cours de réinstallation au Pays Basque et souhaite y ancrer la suite de mon parcours.

Depuis avril 2025, j'occupe un poste de technicien support logiciel en alternance (résolution d'incidents N1/N2 à distance, ticketing, accompagnement des utilisateurs, configuration d'un chatbot IA), complété par une mission terrain en régie pour un domaine viticole et hôtelier (déploiement, diagnostic hardware, brassage, maintien en condition opérationnelle) et un projet personnel de gestion logistique (base de données, intégration d'API, automatisation). Je maîtrise Windows/macOS, Active Directory, Microsoft 365, le déploiement et diagnostic matériel.

Votre activité correspond au type de structure où je souhaite continuer à progresser en systèmes, réseaux et sécurité. Je suis disponible pour un entretien à votre convenance afin de vous présenter mon parcours plus en détail.

Vous trouverez mon CV en pièce jointe. Je reste à votre disposition pour toute information complémentaire.

Cordialement,
${nom}
${tel}
${email}

--
[RELECTURE REQUISE avant envoi : ajoute un detail concret sur ${entreprise.nom}
(un projet, un service, une actualite) - une lettre qui montre que tu connais
l'entreprise part toujours mieux qu'une lettre generique.]`;
}

export function genererBrouillon(entreprise, config) {
  return {
    destinataire: entreprise.email,
    objet: objet(entreprise),
    corps: corps(entreprise, config),
  };
}
