const http = require('node:http');
const { graphql } = require('graphql');
const { createRepositoryStore, schema } = require('./schema');

const maxBodySize = 1024 * 1024;

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBodySize) {
        const error = new Error('Payload too large');
        error.code = 'PAYLOAD_TOO_LARGE';
        reject(error);
        return;
      }

      body += chunk;
    });

    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function createGraphQLServer(rootValue = createRepositoryStore()) {
  return http.createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');

    if (pathname !== '/graphql') {
      sendJson(response, 404, { error: 'Route introuvable. Utilisez /graphql.' });
      return;
    }

    if (request.method !== 'POST') {
      response.setHeader('allow', 'POST');
      sendJson(response, 405, { error: 'Méthode non autorisée. Utilisez POST.' });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      if (error.code === 'PAYLOAD_TOO_LARGE') {
        sendJson(response, 413, { error: 'La requête est trop volumineuse.' });
        return;
      }

      sendJson(response, 400, { error: 'JSON invalide.' });
      return;
    }

    if (!payload.query) {
      sendJson(response, 400, { error: 'Le champ query est obligatoire.' });
      return;
    }

    const result = await graphql({
      schema,
      source: payload.query,
      rootValue,
      variableValues: payload.variables,
      operationName: payload.operationName
    });

    sendJson(response, result.errors ? 400 : 200, result);
  });
}

module.exports = {
  createGraphQLServer
};
