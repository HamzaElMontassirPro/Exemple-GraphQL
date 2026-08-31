import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { resolvers, typeDefs } from './schema.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const port = Number.parseInt(process.env.PORT ?? '4000', 10);
const { url } = await startStandaloneServer(server, {
  listen: { port },
});

console.log(`🚀 API GraphQL disponible sur ${url}`);
