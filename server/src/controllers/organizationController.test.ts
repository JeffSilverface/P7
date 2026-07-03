import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('../services/organizationService', () => ({
  organizationService: {
    getAllOrganizations: vi.fn(),
    getOrganizationById: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    getOrganizationStats: vi.fn(),
  },
}));

import { organizationController } from './organizationController';
import { organizationService } from '../services/organizationService';

const mockOrg = {
  id: 'uuid-1',
  name: 'Acme',
  industry: null,
  website: null,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRes() {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

beforeEach(() => vi.clearAllMocks());

describe('organizationController.getAll', () => {
  it('returns organizations with 200', async () => {
    vi.mocked(organizationService.getAllOrganizations).mockResolvedValue([mockOrg] as never);
    const res = makeRes();
    await organizationController.getAll({} as Request, res);
    expect(res.json).toHaveBeenCalledWith([mockOrg]);
  });

  it('returns 500 on error', async () => {
    vi.mocked(organizationService.getAllOrganizations).mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await organizationController.getAll({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('organizationController.getById', () => {
  it('returns organization when found', async () => {
    vi.mocked(organizationService.getOrganizationById).mockResolvedValue(mockOrg as never);
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.getById(req, res);
    expect(res.json).toHaveBeenCalledWith(mockOrg);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(organizationService.getOrganizationById).mockRejectedValue(new Error('Organization not found'));
    const req = { params: { id: 'unknown' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.getById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(organizationService.getOrganizationById).mockRejectedValue(new Error('DB error'));
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.getById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('organizationController.create', () => {
  it('returns 201 with created organization', async () => {
    vi.mocked(organizationService.createOrganization).mockResolvedValue(mockOrg as never);
    const req = { body: { name: 'Acme' } } as Request;
    const res = makeRes();
    await organizationController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockOrg);
  });

  it('returns 400 on invalid input', async () => {
    const req = { body: { name: '' } } as Request;
    const res = makeRes();
    await organizationController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('organizationController.update', () => {
  it('returns updated organization', async () => {
    vi.mocked(organizationService.updateOrganization).mockResolvedValue(mockOrg as never);
    const req = { params: { id: 'uuid-1' }, body: { name: 'Acme' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.update(req, res);
    expect(res.json).toHaveBeenCalledWith(mockOrg);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(organizationService.updateOrganization).mockRejectedValue(new Error('Organization not found'));
    const req = { params: { id: 'unknown' }, body: {} } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.update(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('organizationController.delete', () => {
  it('returns 204 on success', async () => {
    vi.mocked(organizationService.deleteOrganization).mockResolvedValue(undefined);
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(organizationService.deleteOrganization).mockRejectedValue(new Error('Organization not found'));
    const req = { params: { id: 'unknown' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(organizationService.deleteOrganization).mockRejectedValue(new Error('DB error'));
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await organizationController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('organizationController.getStats', () => {
  it('returns stats', async () => {
    vi.mocked(organizationService.getOrganizationStats).mockResolvedValue({ total: 3 });
    const res = makeRes();
    await organizationController.getStats({} as Request, res);
    expect(res.json).toHaveBeenCalledWith({ total: 3 });
  });

  it('returns 500 on error', async () => {
    vi.mocked(organizationService.getOrganizationStats).mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await organizationController.getStats({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
