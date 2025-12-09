const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION,
});

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const REGION = process.env.AWS_REGION_CUSTOM || process.env.AWS_REGION;

// JWKS client for token verification
const jwksUri = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
const client = jwksClient({
  jwksUri,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
});

/**
 * Get signing key for JWT verification
 */
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
}

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{userId: string, email: string}>}
 */
async function signUp(email, password) {
  try {
    const params = {
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    };

    const result = await cognito.signUp(params).promise();

    // Auto-confirm user (for development - in production, use email verification)
    if (result.UserSub) {
      await cognito
        .adminConfirmSignUp({
          UserPoolId: USER_POOL_ID,
          Username: email,
        })
        .promise();
    }

    return {
      userId: result.UserSub,
      email,
    };
  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      const err = new Error('Email already exists');
      err.code = 'EMAIL_EXISTS';
      err.statusCode = 409;
      throw err;
    }
    if (error.code === 'InvalidPasswordException') {
      const err = new Error(
        'Password must be at least 8 characters with uppercase, lowercase, and numbers'
      );
      err.code = 'INVALID_PASSWORD';
      err.statusCode = 400;
      throw err;
    }
    throw error;
  }
}

/**
 * Authenticate a user and return tokens
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{accessToken: string, idToken: string, refreshToken: string}>}
 */
async function login(email, password) {
  try {
    const params = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const result = await cognito.adminInitiateAuth(params).promise();

    if (!result.AuthenticationResult) {
      const err = new Error('Authentication failed');
      err.code = 'AUTH_FAILED';
      err.statusCode = 401;
      throw err;
    }

    return {
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
    };
  } catch (error) {
    if (
      error.code === 'NotAuthorizedException' ||
      error.code === 'UserNotFoundException'
    ) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }
    throw error;
  }
}

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {Promise<{sub: string, email: string}>}
 */
async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          const error = new Error('Invalid or expired token');
          error.code = 'INVALID_TOKEN';
          error.statusCode = 401;
          reject(error);
        } else {
          resolve({
            sub: decoded.sub,
            email: decoded.email,
            username: decoded['cognito:username'],
          });
        }
      }
    );
  });
}

/**
 * Get user details from Cognito
 * @param {string} userId - User ID (sub)
 * @returns {Promise<Object>}
 */
async function getUser(userId) {
  try {
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: userId,
    };

    const result = await cognito.adminGetUser(params).promise();
    return result;
  } catch (error) {
    if (error.code === 'UserNotFoundException') {
      const err = new Error('User not found');
      err.code = 'USER_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  signUp,
  login,
  verifyToken,
  getUser,
};
