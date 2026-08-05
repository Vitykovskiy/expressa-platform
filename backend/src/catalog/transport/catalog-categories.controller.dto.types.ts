export type CategoryDto = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryRequestContext = {
  requestId?: string;
};
