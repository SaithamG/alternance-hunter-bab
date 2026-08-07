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

  return `Bonjour,

Actuellement en formation Technicien Systèmes Réseaux et Sécurité en alternance avec l'ISCOD, je recherche une entreprise pour m'accueillir dans le cadre de mon contrat d'alternance.

Votre activité${entreprise.ville ? ` à ${entreprise.ville}` : ""} correspond au type de structure où je souhaite mettre en pratique mes compétences : administration systèmes et réseaux, sécurité informatique, support technique. Je suis disponible pour un entretien à votre convenance afin de vous présenter mon parcours et ma motivation.

Vous trouverez mon CV en pièce jointe. Je reste à votre disposition pour toute information complémentaire.

Cordialement,
${nom}
${tel}
${email}

--
[RELECTURE REQUISE avant envoi : personnalise ce message avec un detail concret sur
${entreprise.nom} (un projet, un service, une actualite) - une lettre generique part
moins bien qu'une lettre qui montre que tu connais l'entreprise.]`;
}

export function genererBrouillon(entreprise, config) {
  return {
    destinataire: entreprise.email,
    objet: objet(entreprise),
    corps: corps(entreprise, config),
  };
}
