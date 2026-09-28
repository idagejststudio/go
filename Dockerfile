FROM node:22-bookworm-slim

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    NODE_ENV=production \
    PORT=8787

WORKDIR /app/go-api
COPY go-api/package*.json ./
RUN npm ci --omit=dev && npx playwright install --with-deps --only-shell chromium \
    && chmod -R a+rX /opt/playwright-browsers \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=node:node go-api/server.js go-api/server.js
COPY --chown=node:node index.html ./
COPY --chown=node:node bogtype-test/ bogtype-test/
COPY --chown=node:node design-system-reference/ design-system-reference/
COPY --chown=node:node find-ligesom/ find-ligesom/
COPY --chown=node:node husk-din-huskeliste/ husk-din-huskeliste/
COPY --chown=node:node udelukkelsesfunktion/ udelukkelsesfunktion/
COPY --chown=node:node ved-ikke-soegning/ ved-ikke-soegning/

USER node
EXPOSE 8787
CMD ["node", "go-api/server.js"]
