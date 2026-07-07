import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/organizationRepository', () => ({
  organizationRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
  },
}));

import { organizationService } from './organizationService';
import { organizationRepository } from '../repositories/organizationRepository';

const mockOrg = {
  id: 'uuid-1',
  name: 'Acme',
  industry: null,
  website: null,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('organizationService.getAllOrganizations', () => {
  it('returns all organizations', async () => {
    vi.mocked(organizationRepository.findAll).mockResolvedValue([mockOrg] as never);
    const result = await organizationService.getAllOrganizations();
    expect(result).toEqual([mockOrg]);
  });
});

describe('organizationService.getOrganizationById', () => {
  it('returns organization when found', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(mockOrg as never);
    const result = await organizationService.getOrganizationById('uuid-1');
    expect(result).toEqual(mockOrg);
  });

  it('throws when not found', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(null);
    await expect(organizationService.getOrganizationById('unknown')).rejects.toThrow('Organization not found');
  });
});

describe('organizationService.createOrganization', () => {
  it('creates and returns organization', async () => {
    vi.mocked(organizationRepository.create).mockResolvedValue(mockOrg as never);
    const result = await organizationService.createOrganization({ name: 'Acme' });
    expect(result).toEqual(mockOrg);
    expect(organizationRepository.create).toHaveBeenCalledWith({ name: 'Acme' });
  });
});

describe('organizationService.updateOrganization', () => {
  it('updates when organization exists', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(mockOrg as never);
    const updated = { ...mockOrg, name: 'NewName' };
    vi.mocked(organizationRepository.update).mockResolvedValue(updated as never);
    const result = await organizationService.updateOrganization('uuid-1', { name: 'NewName' });
    expect(result.name).toBe('NewName');
  });

  it('throws when organization not found', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(null);
    await expect(organizationService.updateOrganization('unknown', {})).rejects.toThrow('Organization not found');
  });
});

describe('organizationService.deleteOrganization', () => {
  it('deletes when organization exists', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(mockOrg as never);
    vi.mocked(organizationRepository.delete).mockResolvedValue(mockOrg as never);
    await expect(organizationService.deleteOrganization('uuid-1')).resolves.toBeUndefined();
  });

  it('throws when organization not found', async () => {
    vi.mocked(organizationRepository.findById).mockResolvedValue(null);
    await expect(organizationService.deleteOrganization('unknown')).rejects.toThrow('Organization not found');
  });
});

describe('organizationService.getOrganizationStats', () => {
  it('returns stats', async () => {
    vi.mocked(organizationRepository.getStats).mockResolvedValue({ total: 3 });
    const result = await organizationService.getOrganizationStats();
    expect(result).toEqual({ total: 3 });
  });
});
