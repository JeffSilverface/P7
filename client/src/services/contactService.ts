import api from './api';
import type { Contact, CreateContactInput, UpdateContactInput } from '../types/contact';
import type { Stats } from '../types/shared';

export const contactService = {
  getAll: async (): Promise<Contact[]> => {
    const { data } = await api.get<Contact[]>('/contacts');
    return data;
  },

  getById: async (id: string): Promise<Contact> => {
    const { data } = await api.get<Contact>(`/contacts/${id}`);
    return data;
  },

  create: async (input: CreateContactInput): Promise<Contact> => {
    const { data } = await api.post<Contact>('/contacts', input);
    return data;
  },

  update: async (id: string, input: UpdateContactInput): Promise<Contact> => {
    const { data } = await api.put<Contact>(`/contacts/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },

  getStats: async (): Promise<Stats> => {
    const { data} = await api.get<Stats>('/contacts/stats');
    return data;
  },
};
