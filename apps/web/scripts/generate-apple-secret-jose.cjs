
const fs = require('fs');
const jose = require('node-jose'); // We'll use node-jose for better compatibility if simple JWT signing is tricky with raw P8

const teamId = '7KSK5QLDBW';
const keyId = '63J7R9X7W2';
const clientId = 'com.peaceblvdgames.thesign.web';
const privateKeyContent = `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg1aj+OicrCa7R/cHP
IEISoQbmdEL27fhyzYorCFd+fBWgCgYIKoZIzj0DAQehRANCAARI7oTGFyR/qmQ9
2aMR38jKYh3DV+47TirTapx6kb+pSbbTm9ReRlFhz5mCnXRnlTrMB9XyUYbkTbMv
qQcFaS06`;

// Clean up the key content just in case
const cleanedKeyContent = privateKeyContent.replace(/\s/g, '');

const privateKey = `-----BEGIN PRIVATE KEY-----
${privateKeyContent}
-----END PRIVATE KEY-----`;

async function generate() {
    const keystore = jose.JWK.createKeyStore();

    // Import the PEM
    const key = await keystore.add(privateKey, 'pem');

    // Sign
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 15552000; // 180 days

    const token = await jose.JWS.createSign({
        format: 'compact',
        fields: {
            alg: 'ES256',
            kid: keyId,
            typ: undefined // Explicitly undefined to avoid adding 'typ': 'JWT' if Apple dislikes it, or we can just leave it to default
        }
    }, key)
        .update(JSON.stringify({
            iss: teamId,
            iat: now,
            exp: exp,
            aud: 'https://appleid.apple.com',
            sub: clientId
        }))
        .final();

    console.log(token);
}

generate();
