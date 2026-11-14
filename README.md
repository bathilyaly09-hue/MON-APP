# ÉlectriPlan-Pro

Prototype web pour aider les équipes électriques à organiser leurs chantiers, annoter des plans et suivre des tâches et vérifications.

## Fonctionnalités du prototype

- Tableau de bord et gestion locale de plusieurs projets.
- Import de plans PDF, PNG et JPG (limite actuelle : 20 Mo). Le PDF est prévisualisé à partir de sa première page.
- Palette de composants (prises, luminaires, boîtes et tableaux) à glisser-déposer sur le plan, déplacement des repères et suppression.
- Suivi de tâches, checklist interactive et impression / export PDF du rapport via le navigateur.
- Interface responsive adaptée aux écrans mobiles et tablettes.
- Première API Express avec vérification d’état et endpoints de projets.

## Démarrage

Prérequis : Node.js 20 ou plus récent et npm.

```bash
npm install
npm run dev:full
```

Ouvrir http://localhost:5173. Le serveur API tourne sur http://localhost:3001 et Vite transmet `/api` à ce serveur. Pour démarrer seulement l’interface, utilisez `npm run dev`.

## API de démonstration

- `GET /api/health` — état du serveur.
- `GET /api/projects` — liste des projets du processus serveur.
- `POST /api/projects` — créer un projet JSON, par exemple `{"name":"Rénovation du bâtiment A","address":"12 rue des Ateliers"}`.

Le serveur utilise actuellement une mémoire volatile : ses données sont perdues au redémarrage. L’interface garde ses projets dans le stockage local du navigateur; l’API est un socle distinct de démonstration, pas encore relié à un stockage partagé.

## Architecture proposée pour la suite

- **Interface** : React + Vite, expérience responsive et annotations de plans côté navigateur.
- **API** : Express, routes versionnées à terme sous `/api/v1`, validation des entrées, authentification et contrôle d’accès par chantier.
- **Données** : PostgreSQL pour utilisateurs, organisations, projets, plans, zones, composants, circuits, tâches et validations; migrations et sauvegardes à ajouter.
- **Fichiers** : stockage objet privé pour les plans, avec limites de taille/type, accès signé et politique de conservation. Ne pas mettre les plans dans le stockage public du site.
- **Évolution** : synchronisation hors-ligne, collaboration multi-utilisateur, audit des modifications, tests, journalisation et déploiement sécurisé.

## Limites importantes

Ce prototype ne calcule pas les sections de conducteurs, protections, conformité de circuits ou itinéraires réglementaires. Les repères et listes sont des aides de planification uniquement. Toute conception, dimensionnement et validation doit être vérifié par un professionnel qualifié selon la réglementation et les règles locales en vigueur. Les plans sont conservés dans le navigateur courant uniquement pendant la session; évitez les documents sensibles sur un appareil partagé.
