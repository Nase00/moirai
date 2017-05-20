import Router from 'koa-router';
import send from 'koa-send';
import queryString from 'query-string';

import getEventHandlers from 'handlers';
import { ENV, PUBLIC_DIR } from 'config';
import {
  FETCH_SPOTIFY_TOKEN,
  EMIT_SPOTIFY_REFRESH_TOKEN_UPDATE
} from 'ducks/devices';
import store from 'store';
import { SPOTIFY_TOKEN_REFRESH_INVERVAL } from 'constants';
import { setResponse, errorNoHandler, filterSensativeState, getHueStates } from 'utils';

const router = new Router();

const isAllowedGuest = (id) => id === ENV.guest.id && store.getState().meta.guestEnabled;
const isAuthorized = ({ request }) => {
  const idMatch = request.headers.id === ENV.id;

  return idMatch || isAllowedGuest(request.headers.id);
};

router.post('/api/state', async (ctx) => {
  if (isAuthorized(ctx)) {
    const hueStates = await getHueStates(store);
    const metaState = store.getState().meta;

    setResponse({ next: ctx }, 200);
    ctx.body = filterSensativeState({ hueStates, ...metaState });
  } else {
    setResponse({ next: ctx }, 403);
  }
});

router.post('/api', (ctx) => {
  if (isAuthorized(ctx)) {
    const handlers = getEventHandlers(ctx.request);
    const eventHandler = handlers[ctx.request.header.event];

    if (eventHandler) {
      eventHandler();
      setResponse({ next: ctx }, 200);
    } else {
      errorNoHandler(ctx.headers.event);
      setResponse({ next: ctx }, 500);
    }
  } else {
    setResponse({ next: ctx }, 403);
  }
});

router.get('/api/register-spotify', async (ctx) => {
  const code = queryString.parse(ctx.request.url)['/api/register-spotify?code'];

  store.dispatch({
    type: FETCH_SPOTIFY_TOKEN,
    code
  });

  setInterval(() => store.dispatch({
    type: EMIT_SPOTIFY_REFRESH_TOKEN_UPDATE
  }), SPOTIFY_TOKEN_REFRESH_INVERVAL);

  await send(ctx, '/spotify-auth.html', { root: PUBLIC_DIR });
});


export default router;
