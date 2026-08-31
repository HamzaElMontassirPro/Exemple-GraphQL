const http = require('node:http');
const { graphql } = require('graphql');
const { createRepositoryStore, schema } = require('./schema');

const maxBodySize = 1024 * 1024;

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let settled = false;

    const cleanup = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
    };

    const resolveOnce = (payload) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(payload);
    };

    const rejectOnce = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      request.resume();
      reject(error);
    };

    const onData = (chunk) => {
      size += chunk.length;
      if (size > maxBodySize) {
        const error = new Error('Payload too large');
        error.code = 'PAYLOAD_TOO_LARGE';
        rejectOnce(error);
        return;
      }

      body += chunk;
    };

    const onEnd = () => {
      if (!body) {
        resolveOnce({});
        return;
      }

      try {
        resolveOnce(JSON.parse(body));
      } catch (error) {
        rejectOnce(error);
      }
    };

    const onError = (error) => rejectOnce(error);

    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', onError);
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
      sendJson(response, 404, { error: 'Route not found. Use /graphql.' });
      return;
    }

    if (request.method !== 'POST') {
      response.setHeader('allow', 'POST');
      sendJson(response, 405, { error: 'Method not allowed. Use POST.' });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      if (error.code === 'PAYLOAD_TOO_LARGE') {
        sendJson(response, 413, { error: 'Request payload is too large.' });
        return;
      }

      sendJson(response, 400, { error: 'Invalid JSON.' });
      return;
    }

    if (!payload.query) {
      sendJson(response, 400, { error: 'The query field is required.' });
      return;
    }

    const result = await graphql({
      schema,
      source: payload.query,
      rootValue,
      variableValues: payload.variables,
      operationName: payload.operationName
    });

    sendJson(response, 200, result);
  });
}

module.exports = {
  createGraphQLServer
};
