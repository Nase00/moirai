/* globals console */
/* eslint no-console: 0 */
import http from 'http';

import { ENV } from 'config';
import { UNIFIED_REMOTE_PORT } from 'constants';
import { setResponse } from 'utils';

import * as commands from './unified/commands';

/**
 * Send events to a Unified Remote server,
 * using a session established by ./fetch-unified.js
 */

const sendUnifiedCommand = (store, action, next) => {
  const { hostname } = ENV.unified;
  const { unifiedID } = store.getState().meta;

  const commandBody = commands[action.name](action);

  const options = {
    hostname,
    port: UNIFIED_REMOTE_PORT,
    path: `http://${hostname}:${UNIFIED_REMOTE_PORT}/client/request`,
    method: 'POST',
    headers: {
      'UR-Connection-ID': unifiedID
    }
  };

  const request = http.request(options, (response) => {
    response.setEncoding('utf8');

    response.on('data', () => {
      setResponse({ next }, 200);
    });
  });

  request.on('error', ({ message }) => {
    console.log(`Problem with request: ${message}`);
  });

  request.write(commandBody);
  request.end();
};

export default sendUnifiedCommand;
