import { apiClient } from './client';
import { User, Role } from '../../../../packages/shared/src/types';

export interface UserWithDetails extends User {
    isActive: boolean;
    manager?: {
        id: string;
        name: string;
    };
    roles: Role[];
    teams?: {
        team: {
            id: string;
            name: string;
        }
    }[];
}

export const fetchUsers = async (): Promise<UserWithDetails[]> => {
    return apiClient.get<UserWithDetails[]>('/users');
};

export const deactivateUser = async (id: string): Promise<UserWithDetails> => {
    return apiClient.patch<UserWithDetails>(`/users/${id}/deactivate`, {});
};

export const activateUser = async (id: string): Promise<UserWithDetails> => {
    return apiClient.patch<UserWithDetails>(`/users/${id}/activate`, {});
};

export const createUser = async (data: any): Promise<UserWithDetails> => {
    return apiClient.post<UserWithDetails>('/users', data);
};

export const updateUser = async (id: string, data: any): Promise<UserWithDetails> => {
    return apiClient.put<UserWithDetails>(`/users/${id}`, data);
};

export const deleteUser = async (id: string): Promise<void> => {
    return apiClient.delete(`/users/${id}`);
};
