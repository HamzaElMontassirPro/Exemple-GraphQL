const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Repository {
    id: ID!
    owner: String!
    name: String!
    description: String
    url: String!
  }

  input RepositoryInput {
    owner: String!
    name: String!
    description: String
  }

  type Query {
    repositories: [Repository!]!
    repository(owner: String!, name: String!): Repository
  }

  type Mutation {
    createRepository(input: RepositoryInput!): Repository!
  }
`);

const defaultRepositories = [
  {
    id: '1',
    owner: 'HamzaElMontassirPro',
    name: 'Exemple-GraphQL',
    description: "Exemple d'API GraphQL pour exposer des repositories GitHub.",
    url: 'https://github.com/HamzaElMontassirPro/Exemple-GraphQL'
  }
];

function createRepositoryStore(initialRepositories = defaultRepositories) {
  const repositories = initialRepositories.map((repository) => ({ ...repository }));

  return {
    repositories: () => repositories,
    repository: ({ owner, name }) => repositories.find(
      (item) => item.owner.toLowerCase() === owner.toLowerCase()
        && item.name.toLowerCase() === name.toLowerCase()
    ) || null,
    createRepository: ({ input }) => {
      const repository = {
        id: String(repositories.length + 1),
        owner: input.owner,
        name: input.name,
        description: input.description || null,
        url: `https://github.com/${input.owner}/${input.name}`
      };

      repositories.push(repository);
      return repository;
    }
  };
}

module.exports = {
  createRepositoryStore,
  schema
};
