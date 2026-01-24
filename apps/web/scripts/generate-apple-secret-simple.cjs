
const jwt = require('jsonwebtoken');

// 180 days in seconds
const EXPIRATION_DURATION = 15552000;

const teamId = '7KSK5QLDBW';
const keyId = '63J7R9X7W2';
const clientId = 'com.peaceblvdgames.thesign.web';
const privateKeyContent = `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg1aj+OicrCa7R/cHPIEISoQbmdEL27fhyzYorCFd+fBWgCgYIKoZIzj0DAQehRANCAARI7oTGFyR/qmQ92aMR38jKYh3DV+47TirTapx6kb+pSbbTm9ReRlFhz5mCnXRnlTrMB9XyUYbkTbMvqQcFaS06`;

// Format the private key
const privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKeyContent}\n-----END PRIVATE KEY-----`;

const now = Math.floor(Date.now() / 1000);

// Apple recommends no 'typ' header and standard ES256
const token = jwt.sign(
    {},
    privateKey,
    {
        algorithm: 'ES256',
        keyid: keyId, // jsonwebtoken uses keyid or header.kid
        expiresIn: '60d', // let library handle expiration string
        issuer: teamId,
        audience: 'https://appleid.apple.com',
        subject: clientId,
        header: {
            kid: keyId
        }
    }
);

console.log(token);
