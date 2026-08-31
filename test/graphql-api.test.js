const assert = require('node:assert/strict');
const test = require('node:test');
const { createGraphQLServer } = require('../src/server');

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postGraphQL(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

test('returns repositories through the GraphQL endpoint', async () => {
  const server = createGraphQLServer();
  const port = await listen(server);

  try {
    const response = await postGraphQL(port, {
      query: '{ repositories { owner name url } }'
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.repositories, [
      {
        owner: 'HamzaElMontassirPro',
        name: 'Exemple-GraphQL',
        url: 'https://github.com/HamzaElMontassirPro/Exemple-GraphQL'
      }
    ]);
  } finally {
    await close(server);
  }
});

test('creates and retrieves a GitHub repository', async () => {
  const server = createGraphQLServer();
  const port = await listen(server);

  try {
    const mutation = await postGraphQL(port, {
      query: `
        mutation AddRepository($input: RepositoryInput!) {
          createRepository(input: $input) { owner name url description }
        }
      `,
      variables: {
        input: {
          owner: 'octocat',
          name: 'Hello-World',
          description: 'Repository de démonstration'
        }
      }
    });

    assert.equal(mutation.status, 200);
    assert.deepEqual(mutation.body.data.createRepository, {
      owner: 'octocat',
      name: 'Hello-World',
      url: 'https://github.com/octocat/Hello-World',
      description: 'Repository de démonstration'
    });

    const query = await postGraphQL(port, {
      query: '{ repository(owner: "octocat", name: "hello-world") { owner name url } }'
    });

    assert.equal(query.status, 200);
    assert.deepEqual(query.body.data.repository, {
      owner: 'octocat',
      name: 'Hello-World',
      url: 'https://github.com/octocat/Hello-World'
    });
  } finally {
    await close(server);
  }
});

test('returns GraphQL errors with an HTTP 200 response', async () => {
  const server = createGraphQLServer();
  const port = await listen(server);

  try {
    const response = await postGraphQL(port, {
      query: '{ unknownField }'
    });

    assert.equal(response.status, 200);
    assert.ok(response.body.errors.length > 0);
  } finally {
    await close(server);
  }
});
