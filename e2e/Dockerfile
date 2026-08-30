FROM mcr.microsoft.com/playwright:v1.62.0-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY components ./components
COPY fixtures ./fixtures
COPY pages ./pages
COPY specs ./specs
COPY support ./support
COPY tools ./tools
COPY playwright.config.ts tsconfig.json tsconfig.e2e.json ./

CMD ["npm", "run", "e2e"]
