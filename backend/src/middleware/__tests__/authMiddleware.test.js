const fc = require('fast-check');
const authMiddleware = require('../authMiddleware');
const cognitoService = require('../../services/cognitoService');

jest.mock('../../services/cognitoService');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: taskbreaker, Property 8: Token extraction works for all protected requests
   * Feature: taskbreaker, Property 9: Valid tokens provide userId
   * Validates: Requirements 10.1, 10.4
   */
  describe('Property 8 & 9: Token extraction and userId attachment', () => {
    it('should extract JWT token from Authorization header for any request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (userId, email) => {
            // Arrange
            const mockToken = `mock.jwt.token-${userId}`;
            req.headers.authorization = `Bearer ${mockToken}`;

            cognitoService.verifyToken.mockResolvedValue({
              sub: userId,
              email,
              username: email.split('@')[0],
            });

            // Act
            await authMiddleware(req, res, next);

            // Assert - Property 8: Token is extracted
            expect(cognitoService.verifyToken).toHaveBeenCalledWith(mockToken);

            // Assert - Property 9: userId is attached to request
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe(userId);
            expect(req.user.email).toBe(email);
            expect(next).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should attach complete user information to request context', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';
      const mockDecoded = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      req.headers.authorization = `Bearer ${mockToken}`;
      cognitoService.verifyToken.mockResolvedValue(mockDecoded);

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(req.user).toEqual({
        userId: mockDecoded.sub,
        email: mockDecoded.email,
        username: mockDecoded.username,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Missing token handling', () => {
    it('should return 401 when Authorization header is missing', async () => {
      // Arrange - no authorization header

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Authorization token required',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty', async () => {
      // Arrange
      req.headers.authorization = 'Bearer ';

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid token format handling', () => {
    it('should return 401 when authorization format is invalid', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token';

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('Invalid authorization format'),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      // Arrange
      req.headers.authorization = 'just.a.token';

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid token handling', () => {
    it('should return 401 when token verification fails', async () => {
      // Arrange
      const mockToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${mockToken}`;

      const error = new Error('Invalid or expired token');
      error.statusCode = 401;
      cognitoService.verifyToken.mockRejectedValue(error);

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid or expired token',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired tokens', async () => {
      // Arrange
      const mockToken = 'expired.jwt.token';
      req.headers.authorization = `Bearer ${mockToken}`;

      const error = new Error('Token expired');
      error.statusCode = 401;
      cognitoService.verifyToken.mockRejectedValue(error);

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token extraction', () => {
    it('should correctly extract token from Bearer authorization', async () => {
      // Arrange
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      req.headers.authorization = `Bearer ${mockToken}`;

      cognitoService.verifyToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(cognitoService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(next).toHaveBeenCalled();
    });

    it('should handle tokens with special characters', async () => {
      // Arrange
      const mockToken = 'token-with_special.chars-123';
      req.headers.authorization = `Bearer ${mockToken}`;

      cognitoService.verifyToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Act
      await authMiddleware(req, res, next);

      // Assert
      expect(cognitoService.verifyToken).toHaveBeenCalledWith(mockToken);
    });
  });
});
