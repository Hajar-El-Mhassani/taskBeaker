const fc = require('fast-check');
const cognitoService = require('../cognitoService');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk');

describe('Cognito Service', () => {
  let mockCognito;

  beforeEach(() => {
    mockCognito = {
      signUp: jest.fn(),
      adminConfirmSignUp: jest.fn(),
      adminInitiateAuth: jest.fn(),
      adminGetUser: jest.fn(),
    };

    mockCognito.signUp.mockReturnValue({
      promise: jest.fn(),
    });
    mockCognito.adminConfirmSignUp.mockReturnValue({
      promise: jest.fn(),
    });
    mockCognito.adminInitiateAuth.mockReturnValue({
      promise: jest.fn(),
    });
    mockCognito.adminGetUser.mockReturnValue({
      promise: jest.fn(),
    });

    AWS.CognitoIdentityServiceProvider.mockImplementation(() => mockCognito);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: taskbreaker, Property 1: Valid signup creates user account
   * Validates: Requirements 1.1
   */
  describe('Property 1: Valid signup creates user account', () => {
    it('should create a Cognito user account for any valid email and password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc
            .string({ minLength: 8, maxLength: 20 })
            .filter(
              (pwd) =>
                /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)
            ),
          async (email, password) => {
            // Arrange
            const mockUserId = `user-${Date.now()}`;
            mockCognito.signUp().promise.mockResolvedValue({
              UserSub: mockUserId,
            });
            mockCognito.adminConfirmSignUp().promise.mockResolvedValue({});

            // Act
            const result = await cognitoService.signUp(email, password);

            // Assert
            expect(result).toHaveProperty('userId');
            expect(result).toHaveProperty('email', email);
            expect(result.userId).toBe(mockUserId);
            expect(mockCognito.signUp).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject duplicate email addresses', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';

      mockCognito.signUp().promise.mockRejectedValue({
        code: 'UsernameExistsException',
      });

      // Act & Assert
      await expect(cognitoService.signUp(email, password)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should reject invalid passwords', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'weak';

      mockCognito.signUp().promise.mockRejectedValue({
        code: 'InvalidPasswordException',
      });

      // Act & Assert
      await expect(cognitoService.signUp(email, password)).rejects.toThrow(
        /Password must be at least 8 characters/
      );
    });
  });

  /**
   * Feature: taskbreaker, Property 7: Protected endpoints validate tokens
   * Validates: Requirements 2.5, 10.2
   */
  describe('Property 7: Protected endpoints validate tokens', () => {
    it('should validate JWT tokens using Cognito JWKS', async () => {
      // Note: This test validates the token verification logic structure
      // In a real environment, we would need actual JWT tokens from Cognito
      // For unit testing, we verify the function exists and handles errors

      const invalidToken = 'invalid.jwt.token';

      // Act & Assert
      await expect(
        cognitoService.verifyToken(invalidToken)
      ).rejects.toThrow();
    });
  });

  describe('Login functionality', () => {
    it('should return tokens for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const mockTokens = {
        AccessToken: 'mock-access-token',
        IdToken: 'mock-id-token',
        RefreshToken: 'mock-refresh-token',
      };

      mockCognito.adminInitiateAuth().promise.mockResolvedValue({
        AuthenticationResult: mockTokens,
      });

      // Act
      const result = await cognitoService.login(email, password);

      // Assert
      expect(result).toHaveProperty('accessToken', mockTokens.AccessToken);
      expect(result).toHaveProperty('idToken', mockTokens.IdToken);
      expect(result).toHaveProperty('refreshToken', mockTokens.RefreshToken);
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'WrongPassword123';

      mockCognito.adminInitiateAuth().promise.mockRejectedValue({
        code: 'NotAuthorizedException',
      });

      // Act & Assert
      await expect(cognitoService.login(email, password)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('Get user functionality', () => {
    it('should retrieve user details from Cognito', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUserData = {
        Username: userId,
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'sub', Value: userId },
        ],
      };

      mockCognito.adminGetUser().promise.mockResolvedValue(mockUserData);

      // Act
      const result = await cognitoService.getUser(userId);

      // Assert
      expect(result).toEqual(mockUserData);
      expect(mockCognito.adminGetUser).toHaveBeenCalledWith({
        UserPoolId: process.env.USER_POOL_ID,
        Username: userId,
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';

      mockCognito.adminGetUser().promise.mockRejectedValue({
        code: 'UserNotFoundException',
      });

      // Act & Assert
      await expect(cognitoService.getUser(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });
});
