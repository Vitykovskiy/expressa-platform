import type { categoryAdminErrorCodes } from './category-admin.policy.constants';

export type CategoryAdminErrorCode = (typeof categoryAdminErrorCodes)[number];

export type AdminCategory = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
};

export type CategoryDetails = Omit<AdminCategory, 'id' | 'archivedAt'>;
