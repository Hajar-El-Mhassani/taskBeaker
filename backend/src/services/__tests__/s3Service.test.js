const fc = require('fast-check');
const s3Service = require('../s3Service');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk');

describe('S3 Service', () => {
  let mockS3;

  beforeEach(() => {
    mockS3 = {
      putObject: jest.fn(),
      deleteObject: jest.fn(),
      headObject: jest.fn(),
    };

    mockS3.putObject.mockReturnValue({ promise: jest.fn() });
    mockS3.deleteObject.mockReturnValue({ promise: jest.fn() });
    mockS3.headObject.mockReturnValue({ promise: jest.fn() });

    AWS.S3.mockImplementation(() => mockS3);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: taskbreaker, Property 33: Avatar stored with correct path
   * Feature: taskbreaker, Property 34: Avatar upload returns URL
   * Validates: Requirements 8.2, 8.3
   */
  describe('Property 33 & 34: Avatar stored with correct path and returns URL', () => {
    it('should store avatar with path avatars/{userId} and return URL', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('image/png', 'image/jpeg', 'image/jpg', 'image/gif'),
          async (userId, mimeType) => {
            // Arrange
            const fileBuffer = Buffer.from('fake-image-data');
            mockS3.putObject().promise.mockResolvedValue({});

            // Act
            const result = await s3Service.uploadAvatar(
              userId,
              fileBuffer,
              mimeType
            );

            // Assert - Property 33: Correct path format
            const putObjectCall = mockS3.putObject.mock.calls[0][0];
            expect(putObjectCall.Key).toMatch(new RegExp(`^avatars/${userId}\\.`));
            expect(putObjectCall.Bucket).toBe(process.env.S3_BUCKET);

            // Assert - Property 34: Returns valid URL
            expect(result).toHaveProperty('url');
            expect(result.url).toContain('https://');
            expect(result.url).toContain(process.env.S3_BUCKET);
            expect(result.url).toContain(`avatars/${userId}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle different image MIME types correctly', async () => {
      const testCases = [
        { mimeType: 'image/png', expectedExt: 'png' },
        { mimeType: 'image/jpeg', expectedExt: 'jpg' },
        { mimeType: 'image/jpg', expectedExt: 'jpg' },
        { mimeType: 'image/gif', expectedExt: 'gif' },
      ];

      for (const { mimeType, expectedExt } of testCases) {
        // Arrange
        const userId = 'user-123';
        const fileBuffer = Buffer.from('fake-image-data');
        mockS3.putObject().promise.mockResolvedValue({});

        // Act
        const result = await s3Service.uploadAvatar(
          userId,
          fileBuffer,
          mimeType
        );

        // Assert
        const putObjectCall = mockS3.putObject.mock.calls[mockS3.putObject.mock.calls.length - 1][0];
        expect(putObjectCall.Key).toBe(`avatars/${userId}.${expectedExt}`);
        expect(putObjectCall.ContentType).toBe(mimeType);
        expect(result.url).toContain(`.${expectedExt}`);
      }
    });
  });

  describe('Upload export functionality', () => {
    it('should upload export with correct path format', async () => {
      // Arrange
      const taskId = 'task-123';
      const jsonBuffer = Buffer.from(JSON.stringify({ test: 'data' }));
      mockS3.putObject().promise.mockResolvedValue({});

      // Act
      const result = await s3Service.uploadExport(taskId, jsonBuffer);

      // Assert
      const putObjectCall = mockS3.putObject.mock.calls[0][0];
      expect(putObjectCall.Key).toBe(`exports/${taskId}.json`);
      expect(putObjectCall.ContentType).toBe('application/json');
      expect(result.url).toContain(`exports/${taskId}.json`);
    });
  });

  describe('Delete file functionality', () => {
    it('should delete file from S3', async () => {
      // Arrange
      const key = 'avatars/user-123.png';
      mockS3.deleteObject().promise.mockResolvedValue({});

      // Act
      await s3Service.deleteFile(key);

      // Assert
      expect(mockS3.deleteObject).toHaveBeenCalledWith({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      });
    });

    it('should throw error on delete failure', async () => {
      // Arrange
      const key = 'avatars/user-123.png';
      mockS3.deleteObject().promise.mockRejectedValue(new Error('S3 error'));

      // Act & Assert
      await expect(s3Service.deleteFile(key)).rejects.toThrow(
        'Failed to delete file'
      );
    });
  });

  describe('File exists functionality', () => {
    it('should return true if file exists', async () => {
      // Arrange
      const key = 'avatars/user-123.png';
      mockS3.headObject().promise.mockResolvedValue({});

      // Act
      const result = await s3Service.fileExists(key);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      // Arrange
      const key = 'avatars/non-existent.png';
      const error = new Error('Not Found');
      error.code = 'NotFound';
      mockS3.headObject().promise.mockRejectedValue(error);

      // Act
      const result = await s3Service.fileExists(key);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw error on upload failure', async () => {
      // Arrange
      const userId = 'user-123';
      const fileBuffer = Buffer.from('fake-image-data');
      const mimeType = 'image/png';
      mockS3.putObject().promise.mockRejectedValue(new Error('S3 error'));

      // Act & Assert
      await expect(
        s3Service.uploadAvatar(userId, fileBuffer, mimeType)
      ).rejects.toThrow('Failed to upload avatar');
    });
  });
});
