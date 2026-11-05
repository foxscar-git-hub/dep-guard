// Regenerates src/top-packages.json: the baseline of well-known package
// names that typosquat candidates get compared against. Combines a broad
// keyword-search sweep of the npm registry with a hand-curated list of the
// packages real typosquatting incidents have actually targeted (the
// keyword-search API ranks by relevance to the keyword, not raw popularity,
// so it can miss famous packages like "express" entirely).
const fs = require('fs');
const path = require('path');

const KEYWORDS = [
  'javascript', 'react', 'vue', 'node', 'typescript', 'cli', 'webpack',
  'babel', 'testing', 'express', 'build', 'framework', 'utility', 'http',
  'server', 'database', 'graphql', 'lint', 'css', 'ui',
];

// Hand-curated: the most widely-depended-on packages, which is exactly the
// set attackers impersonate. Sourced from known typosquatting incidents
// (event-stream, crossenv/cross-env, mongose/mongoose, etc.) plus the
// long-standing top-of-ecosystem packages.
const CURATED = [
  'express', 'lodash', 'react', 'react-dom', 'axios', 'request', 'chalk',
  'commander', 'debug', 'moment', 'webpack', 'babel-core', '@babel/core',
  'eslint', 'jest', 'mocha', 'typescript', 'vue', 'next', 'redux',
  'socket.io', 'mongoose', 'dotenv', 'cors', 'bcrypt', 'jsonwebtoken',
  'nodemon', 'body-parser', 'cookie-parser', 'uuid', 'async', 'colors',
  'yargs', 'inquirer', 'glob', 'rimraf', 'fs-extra', 'chokidar', 'ws',
  'node-fetch', 'got', 'superagent', 'pg', 'mysql', 'mysql2', 'redis',
  'sequelize', 'prisma', 'graphql', 'apollo-server', 'puppeteer', 'cheerio',
  'jsdom', 'sharp', 'multer', 'helmet', 'morgan', 'passport', 'nodemailer',
  'stripe', 'aws-sdk', 'firebase', 'underscore', 'ramda', 'immutable',
  'rxjs', 'date-fns', 'classnames', 'prop-types', 'styled-components',
  'tailwindcss', 'sass', 'less', 'postcss', 'autoprefixer', 'prettier',
  'husky', 'lint-staged', 'vitest', 'cypress', 'playwright', 'supertest',
  'nock', 'sinon', 'chai', 'tape', 'semver', 'minimist', 'yaml', 'ejs',
  'pug', 'handlebars', 'socket.io-client', 'ioredis', 'knex', 'joi',
  'zod', 'yup', 'validator', 'lodash.merge', 'lodash.get', 'cross-env',
  'cross-spawn', 'shelljs', 'concurrently', 'npm-run-all', 'ts-node',
  'esbuild', 'rollup', 'vite', 'parcel', 'gulp', 'grunt', 'karma',
  'jasmine', 'enzyme', '@testing-library/react', 'eslint-config-airbnb',
  'eslint-plugin-react', 'eslint-plugin-import', 'webpack-cli',
  'webpack-dev-server', 'css-loader', 'style-loader', 'file-loader',
  'url-loader', 'mini-css-extract-plugin', 'html-webpack-plugin',
  'core-js', 'regenerator-runtime', 'tslib', 'reflect-metadata',
  'rxjs-compat', 'moment-timezone', 'luxon', 'uuid-validate', 'nanoid',
  'shortid', 'qs', 'query-string', 'form-data', 'content-type',
  'mime', 'mime-types', 'etag', 'fresh', 'send', 'serve-static',
  'finalhandler', 'on-finished', 'destroy', 'ee-first', 'merge-descriptors',
  'proxy-addr', 'range-parser', 'type-is', 'vary', 'statuses',
  'http-errors', 'depd', 'setprototypeof', 'safe-buffer', 'ms',
  'bytes', 'iconv-lite', 'negotiator', 'accepts', 'array-flatten',
  'path-to-regexp', 'encodeurl', 'escape-html', 'cookie', 'cookie-signature',
];

async function fetchKeywordSweep() {
  const names = new Set();
  for (const kw of KEYWORDS) {
    for (let offset = 0; offset < 500; offset += 250) {
      const res = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=keywords:${kw}&popularity=1.0&size=250&from=${offset}`
      );
      if (!res.ok) break;
      const json = await res.json();
      if (!json.objects || json.objects.length === 0) break;
      for (const o of json.objects) names.add(o.package.name);
    }
  }
  return names;
}

(async () => {
  const sweep = await fetchKeywordSweep();
  const all = new Set([...sweep, ...CURATED]);
  const outPath = path.join(__dirname, '..', 'src', 'top-packages.json');
  fs.writeFileSync(outPath, JSON.stringify([...all].sort()));
  console.log(`wrote ${all.size} package names to ${outPath}`);
})();
