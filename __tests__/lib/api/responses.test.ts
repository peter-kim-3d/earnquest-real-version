/**
 * Tests for lib/api/responses.ts
 *
 * Standardized API response helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { success, error, errors, withErrorHandler } from '@/lib/api/responses';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

describe('success', () => {
  it('should create success response without data', async () => {
    const response = success();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeUndefined();
    expect(body.message).toBeUndefined();
  });

  it('should create success response with data', async () => {
    const data = { id: 1, name: 'Test' };
    const response = success(data);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(data);
  });

  it('should create success response with message', async () => {
    const response = success(undefined, 'Operation completed');
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('Operation completed');
  });

  it('should create success response with data and message', async () => {
    const data = { result: true };
    const response = success(data, 'Success!');
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(data);
    expect(body.message).toBe('Success!');
  });
});

describe('error', () => {
  it('should create error response with default status', async () => {
    const response = error('Something went wrong');
    const body = await response.json();

    expect(body.error).toBe('Something went wrong');
    expect(response.status).toBe(400);
  });

  it('should create error response with custom status', async () => {
    const response = error('Not found', 404);
    const body = await response.json();

    expect(body.error).toBe('Not found');
    expect(response.status).toBe(404);
  });

  it('should create error response with field errors', async () => {
    const fields = { email: 'Invalid email', name: 'Required' };
    const response = error('Validation failed', 400, fields);
    const body = await response.json();

    expect(body.error).toBe('Validation failed');
    expect(body.fields).toEqual(fields);
  });
});

describe('errors', () => {
  describe('unauthorized', () => {
    it('should create 401 response', async () => {
      const response = errors.unauthorized();
      const body = await response.json();

      expect(body.error).toBe('Unauthorized');
      expect(response.status).toBe(401);
    });
  });

  describe('forbidden', () => {
    it('should create 403 response', async () => {
      const response = errors.forbidden();
      const body = await response.json();

      expect(body.error).toBe('Forbidden');
      expect(response.status).toBe(403);
    });
  });

  describe('notFound', () => {
    it('should create 404 response with default message', async () => {
      const response = errors.notFound();
      const body = await response.json();

      expect(body.error).toBe('Resource not found');
      expect(response.status).toBe(404);
    });

    it('should create 404 response with custom resource name', async () => {
      const response = errors.notFound('Task');
      const body = await response.json();

      expect(body.error).toBe('Task not found');
    });
  });

  describe('badRequest', () => {
    it('should create 400 response with default message', async () => {
      const response = errors.badRequest();
      const body = await response.json();

      expect(body.error).toBe('Bad request');
      expect(response.status).toBe(400);
    });

    it('should create 400 response with custom message', async () => {
      const response = errors.badRequest('Invalid input');
      const body = await response.json();

      expect(body.error).toBe('Invalid input');
    });
  });

  describe('validationFailed', () => {
    it('should create 400 response with validation message', async () => {
      const response = errors.validationFailed();
      const body = await response.json();

      expect(body.error).toBe('Validation failed');
      expect(response.status).toBe(400);
    });

    it('should create 400 response with field errors', async () => {
      const fields = { name: 'Required', email: 'Invalid' };
      const response = errors.validationFailed(fields);
      const body = await response.json();

      expect(body.error).toBe('Validation failed');
      expect(body.fields).toEqual(fields);
    });
  });

  describe('internalError', () => {
    it('should create 500 response with default message', async () => {
      const response = errors.internalError();
      const body = await response.json();

      expect(body.error).toBe('Internal server error');
      expect(response.status).toBe(500);
    });

    it('should create 500 response with custom message', async () => {
      const response = errors.internalError('Database connection failed');
      const body = await response.json();

      expect(body.error).toBe('Database connection failed');
    });
  });

  describe('missingFields', () => {
    it('should create 400 response with missing fields', async () => {
      const response = errors.missingFields(['name', 'email']);
      const body = await response.json();

      expect(body.error).toBe('Missing required fields: name, email');
      expect(response.status).toBe(400);
    });

    it('should handle single missing field', async () => {
      const response = errors.missingFields(['name']);
      const body = await response.json();

      expect(body.error).toBe('Missing required fields: name');
    });
  });
});

describe('withErrorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return handler result on success', async () => {
    const handler = vi.fn().mockResolvedValue(success({ data: 'test' }));
    const wrappedHandler = withErrorHandler(handler);

    const request = new Request('https://example.com');
    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({ data: 'test' });
    expect(handler).toHaveBeenCalledWith(request, undefined);
  });

  it('should catch errors and return internal error response', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Test error'));
    const wrappedHandler = withErrorHandler(handler);

    const request = new Request('https://example.com');
    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(body.error).toBe('Test error');
    expect(response.status).toBe(500);
  });

  it('should handle non-Error throws', async () => {
    const handler = vi.fn().mockRejectedValue('String error');
    const wrappedHandler = withErrorHandler(handler);

    const request = new Request('https://example.com');
    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(body.error).toBe('Internal server error');
    expect(response.status).toBe(500);
  });

  it('should pass context to handler', async () => {
    const handler = vi.fn().mockResolvedValue(success());
    const wrappedHandler = withErrorHandler(handler);

    const request = new Request('https://example.com');
    const context = { params: { id: '123' } };
    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalledWith(request, context);
  });

  it('should log errors to console', async () => {
    const error = new Error('Test error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withErrorHandler(handler);

    const request = new Request('https://example.com');
    await wrappedHandler(request);

    expect(console.error).toHaveBeenCalledWith('API Error:', error);
  });
});
