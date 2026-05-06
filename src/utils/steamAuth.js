/**
 * Utility for handling Steam OpenID authentication.
 */

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

/**
 * Initiates the Steam OpenID login process by redirecting the user.
 */
export const initiateSteamLogin = () => {
  const returnUrl = window.location.origin + window.location.pathname; // Returns to the current page
  
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': window.location.origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  window.location.href = `${STEAM_OPENID_URL}?${params.toString()}`;
};

/**
 * Parses the Steam OpenID callback from the URL.
 * @returns {string|null} The SteamID64 if found, otherwise null.
 */
export const handleSteamCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const claimedId = params.get('openid.claimed_id');
  
  console.log("Steam Auth Callback Raw:", { claimedId, allParams: Object.fromEntries(params) });

  if (claimedId) {
    // SteamID64 is the last part of the claimed_id URL
    // Format: http://steamcommunity.com/openid/id/7656119XXXXXXXXXX
    // Using a more robust match that allows for potential trailing slashes
    const match = claimedId.match(/\/id\/(\d+)(\/|$)/);
    const steamId = match ? match[1] : null;
    console.log("Extracted SteamID:", steamId);
    return steamId;
  }
  
  return null;
};
