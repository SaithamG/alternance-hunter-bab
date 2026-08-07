# alternance-hunter-bab

Repère les entreprises IT/systèmes-réseaux/sécurité autour de **Bayonne, Anglet,
Biarritz, jusqu'à Cambo-les-Bains**, susceptibles d'accueillir une alternance
(Technicien Systèmes Réseaux et Sécurité, ISCOD), et prépare des candidatures
spontanées personnalisées — **jamais envoyées automatiquement**, toujours
relues et validées par toi avant le départ réel de l'email.

## Principe

```
discover  -> cherche des entreprises (API La Bonne Alternance + Google Places)
draft     -> génère un brouillon de mail par entreprise (email trouvé automatiquement si possible)
list      -> affiche l'état de chaque entreprise
approve   -> TOI tu valides les brouillons que tu as relus
send      -> envoie réellement (confirmation demandée), uniquement les candidatures validées
```

Rien n'est envoyé sans être passé par `approve`.

## Installation

```bash
npm install
cp .env.example .env
```

Remplis `.env` :
- **Identité** : `NOM_CANDIDAT`, `TELEPHONE_CANDIDAT`, `EMAIL_CANDIDAT`
- **CV** : place ton CV en PDF dans `data/cv.pdf` (ou change `CV_FILE`)
- **SMTP** : pour envoyer réellement les emails (voir commentaires dans `.env.example`
  pour un compte Gmail avec mot de passe d'application)
- **Google Places** (optionnel) : clé API si tu veux cette source en plus de
  La Bonne Alternance

## Utilisation

```bash
npm run discover              # cherche les entreprises
npm run list -- nouvelle      # voir ce qui a été trouvé
npm run draft                 # génère les brouillons dans data/brouillons/
npm run list -- brouillon     # voir les brouillons prêts (avec leur id)

# Ouvre et relis chaque fichier dans data/brouillons/*.txt, personnalise-le
# (un détail concret sur l'entreprise vaut mieux qu'une lettre générique).

npm run approve -- lba-12345678900012 places-abc123   # valide ce que tu as relu
npm run send                  # demande confirmation puis envoie ce qui est validé
```

`npm run list -- email_manquant` montre les entreprises trouvées mais sans
email détecté automatiquement — tu peux éditer `data/entreprises.json`
pour ajouter l'email à la main puis relancer `npm run draft`.

## Sources de données

- **[La Bonne Alternance](https://labonnealternance.apprentissage.beta.gouv.fr/)**
  (API publique et gratuite, beta.gouv.fr) : offres d'alternance ET entreprises
  à fort potentiel d'embauche identifiées par l'État pour la candidature
  spontanée (`lbaCompanies`). C'est la source principale pour ne pas se limiter
  aux offres publiées.
- **Google Places** (optionnelle, clé API requise) : complète avec des
  entreprises IT locales via recherche par mots-clés autour de la zone.

⚠️ L'API La Bonne Alternance a changé de forme par le passé. Si `discover`
remonte 0 résultat de façon suspecte, lance `node src/index.js discover --debug`
pour voir la réponse brute et ajuster `extraireEntreprise()` dans
`src/labonnealternance.js` si le format a évolué.

## Zone de recherche

Par défaut centrée sur un point médian Bayonne/Cambo-les-Bains avec un rayon
de 20 km (couvre BAB + Cambo). Ajustable via `LATITUDE`, `LONGITUDE`,
`RAYON_KM` dans `.env`.

## Codes ROME ciblés par défaut

- `M1801` — Administration de systèmes d'information
- `M1802` — Expertise et support en systèmes d'information
- `I1401` — Maintenance informatique et bureautique

Ajustables via `ROMES` dans `.env`.

## Données personnelles

`data/entreprises.json`, `data/brouillons/`, `data/cv.*` et `.env` sont
ignorés par git (voir `.gitignore`) — même si ce repo est privé, ces fichiers
contiennent tes candidatures et tes identifiants SMTP, ils ne doivent pas
finir dans l'historique.
