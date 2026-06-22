import { apiClient } from './client';
import type {
  ChecklistGroup,
  ChecklistItem,
  ChecklistItemCreate,
  ChecklistItemUpdate,
} from '../types';

export async function fetchChecklistGroups(): Promise<ChecklistGroup[]> {
  const { data } = await apiClient.get<{ success: boolean; groups: ChecklistGroup[] }>(
    '/api/checklist-groups',
  );
  return data.groups;
}

export async function fetchChecklistItems(params?: {
  groupId?: number;
  strategy?: string;
}): Promise<ChecklistItem[]> {
  const { data } = await apiClient.get<{ success: boolean; items: ChecklistItem[] }>(
    '/api/checklist-items',
    { params },
  );
  return data.items;
}

export async function createChecklistItem(
  payload: ChecklistItemCreate,
): Promise<ChecklistItem> {
  const { data } = await apiClient.post<{ success: boolean; item: ChecklistItem }>(
    '/api/checklist-items',
    payload,
  );
  return data.item;
}

export async function updateChecklistItem(
  id: number,
  payload: ChecklistItemUpdate,
): Promise<ChecklistItem> {
  const { data } = await apiClient.put<{ success: boolean; item: ChecklistItem }>(
    `/api/checklist-items/${id}`,
    payload,
  );
  return data.item;
}

export async function deleteChecklistItem(id: number): Promise<void> {
  await apiClient.delete(`/api/checklist-items/${id}`);
}
