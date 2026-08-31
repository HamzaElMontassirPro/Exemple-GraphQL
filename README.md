# Exemple GraphQL

API GraphQL d’exemple pour gérer des projets et des tâches, inspirée d’un projet personnel de gestion.

## Prérequis

- Node.js 20 ou supérieur
- npm

## Installation

```bash
npm install
```

## Lancer l’API

```bash
npm start
```

Par défaut, Apollo Server démarre sur `http://localhost:4000/`.

Pour changer le port :

```bash
PORT=5000 npm start
```

## Développement

```bash
npm run dev
```

## Tests

```bash
npm test
```

## Exemple de requête

```graphql
query {
  projects {
    id
    name
    description
    tasks {
      id
      title
      status
    }
  }
}
```

## Exemple de mutation

```graphql
mutation {
  createTask(
    input: {
      title: "Préparer la démonstration"
      description: "Ajouter une tâche depuis GraphQL"
      projectId: "project-1"
    }
  ) {
    id
    title
    status
    project {
      name
    }
  }
}
```