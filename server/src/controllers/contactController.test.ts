import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

vi.mock('../services/contactService', () => ({
  contactService: {
    getAllContacts: vi.fn(),
    getContactById: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    getContactStats: vi.fn(),
  },
}));

import { contactController } from './contactController';
import { contactService } from '../services/contactService';

const mockContact = {
  id: 'uuid-1',
  firstName: 'Alice',
  lastName: 'Dupont',
  email: 'alice@example.com',
  phone: null,
  position: null,
  organizationId: null,
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

describe('contactController.getAll', () => {
  it('returns contacts with 200', async () => {
    vi.mocked(contactService.getAllContacts).mockResolvedValue([mockContact] as never);
    const res = makeRes();
    await contactController.getAll({} as Request, res);
    expect(res.json).toHaveBeenCalledWith([mockContact]);
  });

  it('returns 500 on error', async () => {
    vi.mocked(contactService.getAllContacts).mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await contactController.getAll({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('contactController.getById', () => {
  it('returns contact when found', async () => {
    vi.mocked(contactService.getContactById).mockResolvedValue(mockContact as never);
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.getById(req, res);
    expect(res.json).toHaveBeenCalledWith(mockContact);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(contactService.getContactById).mockRejectedValue(new Error('Contact not found'));
    const req = { params: { id: 'unknown' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.getById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(contactService.getContactById).mockRejectedValue(new Error('DB error'));
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.getById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('contactController.create', () => {
  it('returns 201 with created contact', async () => {
    vi.mocked(contactService.createContact).mockResolvedValue(mockContact as never);
    const req = { body: { firstName: 'Alice', lastName: 'Dupont', email: 'alice@example.com' } } as Request;
    const res = makeRes();
    await contactController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockContact);
  });

  it('returns 400 on invalid input', async () => {
    const req = { body: { firstName: '' } } as Request;
    const res = makeRes();
    await contactController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('contactController.update', () => {
  it('returns updated contact', async () => {
    vi.mocked(contactService.updateContact).mockResolvedValue(mockContact as never);
    const req = { params: { id: 'uuid-1' }, body: { firstName: 'Alice' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.update(req, res);
    expect(res.json).toHaveBeenCalledWith(mockContact);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(contactService.updateContact).mockRejectedValue(new Error('Contact not found'));
    const req = { params: { id: 'unknown' }, body: {} } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.update(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('contactController.delete', () => {
  it('returns 204 on success', async () => {
    vi.mocked(contactService.deleteContact).mockResolvedValue(undefined);
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(contactService.deleteContact).mockRejectedValue(new Error('Contact not found'));
    const req = { params: { id: 'unknown' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(contactService.deleteContact).mockRejectedValue(new Error('DB error'));
    const req = { params: { id: 'uuid-1' } } as Request<{ id: string }>;
    const res = makeRes();
    await contactController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('contactController.getStats', () => {
  it('returns stats', async () => {
    vi.mocked(contactService.getContactStats).mockResolvedValue({ total: 5 });
    const res = makeRes();
    await contactController.getStats({} as Request, res);
    expect(res.json).toHaveBeenCalledWith({ total: 5 });
  });

  it('returns 500 on error', async () => {
    vi.mocked(contactService.getContactStats).mockRejectedValue(new Error('DB error'));
    const res = makeRes();
    await contactController.getStats({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
