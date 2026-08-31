# Exemple GraphQL

API GraphQL minimale en C# avec ASP.NET Core et Hot Chocolate pour exposer des repositories GitHub.

## Prérequis

- .NET 10 SDK

## Installation

```bash
dotnet restore
```

## Lancer l'API

```bash
dotnet run --project src/ExempleGraphQL.Api
```

L'endpoint GraphQL est disponible en `POST http://localhost:5100/graphql` ou sur l'URL affichée par ASP.NET Core.

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

Exemple de mutation :

```graphql
mutation {
  createRepository(input: { owner: "octocat", name: "Hello-World", description: "Repository de démonstration" }) {
    id
    owner
    name
    url
  }
}
```

## Tests

```bash
dotnet run --project tests/ExempleGraphQL.Api.Tests
```
