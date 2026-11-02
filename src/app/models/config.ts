//  export const SERVER = '/';
import {environment} from '../../environments/environment';
export const SERVER = environment.SERVER;           // HTTPS — normal UI to Node API calls
export const SERVER_HTTP = environment.SERVER_HTTP;   // HTTP  — API plugin calls (vauto-api / test-case)
export const ENABLE_SSO = environment.ENABLE_SSO;
export const CM_PROFILE ="Rogers DC Lab CM Profile";
export const SESSION_30MINS_LOGOUT = 1800
export const SESSION_30DAYS_LOGOUT = 2592000
export const DOMIAN_URL = "https://reqcentral.com"




