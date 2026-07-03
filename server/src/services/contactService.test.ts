import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/contactRepository', () => ({
  contactRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
  },
}));

import { contactService } from './contactService';
import { contactRepository } from '../repositories/contactRepository';

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

beforeEach(() => vi.clearAllMocks());

describe('contactService.getAllContacts', () => {
  it('returns all contacts', async () => {
    vi.mocked(contactRepository.findAll).mockResolvedValue([mockContact] as never);
    const result = await contactService.getAllContacts();
    expect(result).toEqual([mockContact]);
    expect(contactRepository.findAll).toHaveBeenCalledOnce();
  });
});

describe('contactService.getContactById', () => {
  it('returns contact when found', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(mockContact as never);
    const result = await contactService.getContactById('uuid-1');
    expect(result).toEqual(mockContact);
  });

  it('throws when not found', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(null);
    await expect(contactService.getContactById('unknown')).rejects.toThrow('Contact not found');
  });
});

describe('contactService.createContact', () => {
  it('creates and returns contact', async () => {
    vi.mocked(contactRepository.create).mockResolvedValue(mockContact as never);
    const input = { firstName: 'Alice', lastName: 'Dupont', email: 'alice@example.com' };
    const result = await contactService.createContact(input);
    expect(result).toEqual(mockContact);
    expect(contactRepository.create).toHaveBeenCalledWith(input);
  });
});

describe('contactService.updateContact', () => {
  it('updates when contact exists', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(mockContact as never);
    const updated = { ...mockContact, firstName: 'Bob' };
    vi.mocked(contactRepository.update).mockResolvedValue(updated as never);
    const result = await contactService.updateContact('uuid-1', { firstName: 'Bob' });
    expect(result.firstName).toBe('Bob');
  });

  it('throws when contact not found', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(null);
    await expect(contactService.updateContact('unknown', {})).rejects.toThrow('Contact not found');
  });
});

describe('contactService.deleteContact', () => {
  it('deletes when contact exists', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(mockContact as never);
    vi.mocked(contactRepository.delete).mockResolvedValue(mockContact as never);
    await expect(contactService.deleteContact('uuid-1')).resolves.toBeUndefined();
  });

  it('throws when contact not found', async () => {
    vi.mocked(contactRepository.findById).mockResolvedValue(null);
    await expect(contactService.deleteContact('unknown')).rejects.toThrow('Contact not found');
  });
});

describe('contactService.getContactStats', () => {
  it('returns stats', async () => {
    vi.mocked(contactRepository.getStats).mockResolvedValue({ total: 5 });
    const result = await contactService.getContactStats();
    expect(result).toEqual({ total: 5 });
  });
});
