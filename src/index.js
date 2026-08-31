const { createGraphQLServer } = require('./server');

const port = Number(process.env.PORT || 4000);
const server = createGraphQLServer();

server.listen(port, () => {
  console.log(`GraphQL API available at http://localhost:${port}/graphql`);
});
