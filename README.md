# Exemple GraphQL

API GraphQL minimale en Node.js pour exposer des repositories GitHub.

## Installation

```bash
npm install
```

## Lancer l'API

```bash
npm start
```

L'endpoint GraphQL est disponible en `POST http://localhost:4000/graphql`.

Exemple de requête :

```graphql
{
  repositories {
    owner
    name
    url
  }
}
```

## Tests

```bash
npm test
```
