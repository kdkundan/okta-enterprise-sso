/**
 * passport-saml Strategy configuration.
 *
 * Fetches IdP metadata (entryPoint + cert) from Okta metadata URL at startup.
 * No manual cert copy-paste needed.
 */

import { fetch } from 'undici';
import { parseStringPromise } from 'xml2js';

export const fetchIdpMetadata = async () => {
  const metadataUrl = process.env.SAML_METADATA_URL;
  if (!metadataUrl) throw new Error('SAML_METADATA_URL is not set');

  let xml;
  try {
    const res = await fetch(metadataUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' from metadata URL');
    xml = await res.text();
  } catch (err) {
    throw new Error('Failed to fetch SAML metadata: ' + err.message);
  }

  const parsed = await parseStringPromise(xml, { explicitArray: true });
  const descriptor = parsed['md:EntityDescriptor'] || parsed['EntityDescriptor'];

  const idpDescriptor = (descriptor && (descriptor['md:IDPSSODescriptor'] || descriptor['IDPSSODescriptor']) || [{}])[0];

  const ssoServices = idpDescriptor['md:SingleSignOnService'] || idpDescriptor['SingleSignOnService'] || [];
  const ssoService = ssoServices.find((s) => s.$ && s.$.Binding && s.$.Binding.includes('HTTP-POST')) || ssoServices[0];
  const entryPoint = ssoService && ssoService.$ && ssoService.$.Location;
  if (!entryPoint) throw new Error('Could not extract SSO entry point from metadata');

  const keyDescriptors = idpDescriptor['md:KeyDescriptor'] || idpDescriptor['KeyDescriptor'] || [];
  const signingKey = keyDescriptors.find((k) => k.$ && k.$.use === 'signing') || keyDescriptors[0];

  let rawCert = null;
  if (signingKey) {
    const ki = (signingKey['ds:KeyInfo'] || signingKey['KeyInfo'] || [{}])[0];
    const x5d = (ki['ds:X509Data'] || ki['X509Data'] || [{}])[0];
    const x5c = x5d['ds:X509Certificate'] || x5d['X509Certificate'] || [];
    rawCert = x5c[0] || null;
  }
  if (!rawCert) throw new Error('Could not extract X.509 certificate from metadata');

  const cert = rawCert.replace(/\s+/g, '');
  return { entryPoint, cert };
};

export const getSamlConfig = async () => {
  const { entryPoint, cert } = await fetchIdpMetadata();
  return {
    callbackUrl: process.env.SAML_CALLBACK_URL,
    entryPoint,
    issuer: process.env.SAML_ISSUER,
    cert,
    acceptedClockSkewMs: 300000,
    passReqToCallback: false,
    disableRequestedAuthnContext: true,
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    authnRequestBinding: 'HTTP-POST',
  };
};
