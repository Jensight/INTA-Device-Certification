const { ProxyAgent, Agent } = require("urllib");
const config = require("../config");

let proxyDispatcher = null;
let directDispatcher = null;

// Connect options shared by both dispatchers.
// autoSelectFamily enables Happy Eyeballs so IPv4/IPv6 are attempted in parallel,
// avoiding long stalls when IPv6 is advertised but not routable.
const connectOptions = {
  timeout: 30000,
  autoSelectFamily: true,
};

/**
 * Returns an undici dispatcher for urllib v4's `dispatcher` option.
 * Routes through the HTTP proxy when enabled, otherwise returns a direct
 * Agent configured with a longer connect timeout and Happy Eyeballs so
 * requests don't fail with UND_ERR_CONNECT_TIMEOUT on IPv6-first hosts.
 */
function getProxyDispatcher() {
  if (config.PROXY_STATUS) {
    if (!proxyDispatcher) {
      proxyDispatcher = new ProxyAgent({
        uri: config.PROXY_URL,
        connect: connectOptions,
      });
    }
    return proxyDispatcher;
  }
  if (!directDispatcher) {
    directDispatcher = new Agent({ connect: connectOptions });
  }
  return directDispatcher;
}

module.exports = { getProxyDispatcher };
