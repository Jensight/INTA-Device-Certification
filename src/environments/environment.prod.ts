export const environment = {
  appVersion: require('../../package.json').version,
  production: true,
  SERVER: 'http://10.191.251.121:8080/',        // HTTPS — normal UI to Node API calls
  SERVER_HTTP: 'http://10.191.251.121:8080/',   // HTTP  — API plugin calls (vauto-api / test-case)
  ENABLE_SSO: false
};
