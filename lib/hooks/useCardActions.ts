'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseCardActionsOptions {
  /**
   * API endpoint for updating the resource.
   */
  updateEndpoint: string;
  /**
   * API endpoint for deleting the resource.
   */
  deleteEndpoint: string;
  /**
   * Key name for the resource ID in request body (e.g., 'taskId', 'rewardId').
   */
  idKey: string;
  /**
   * Error messages for operations.
   */
  errorMessages: {
    updateFailed: string;
    deleteFailed: string;
  };
}

interface UseCardActionsReturn {
  loading: boolean;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (open: boolean) => void;
  handleToggleActive: (id: string, currentActive: boolean) => Promise<void>;
  handleDelete: () => void;
  confirmDelete: (id: string) => Promise<void>;
}

/**
 * Hook for common card CRUD operations.
 * Reduces duplicate code in TaskCard, RewardCard, etc.
 *
 * @example
 * const {
 *   loading,
 *   isConfirmOpen,
 *   setIsConfirmOpen,
 *   handleToggleActive,
 *   handleDelete,
 *   confirmDelete
 * } = useCardActions({
 *   updateEndpoint: '/api/tasks/update',
 *   deleteEndpoint: '/api/tasks/delete',
 *   idKey: 'taskId',
 *   errorMessages: {
 *     updateFailed: t('card.updateFailed'),
 *     deleteFailed: t('card.deleteFailed'),
 *   },
 * });
 */
export function useCardActions({
  updateEndpoint,
  deleteEndpoint,
  idKey,
  errorMessages,
}: UseCardActionsOptions): UseCardActionsReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleToggleActive = useCallback(
    async (id: string, currentActive: boolean) => {
      setLoading(true);
      try {
        const response = await fetch(updateEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [idKey]: id,
            is_active: !currentActive,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update');
        }

        router.refresh();
      } catch (error) {
        console.error('Error toggling active:', error);
        toast.error(errorMessages.updateFailed);
      } finally {
        setLoading(false);
      }
    },
    [updateEndpoint, idKey, errorMessages.updateFailed, router]
  );

  const handleDelete = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const response = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [idKey]: id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete');
        }

        router.refresh();
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error(errorMessages.deleteFailed);
      } finally {
        setLoading(false);
      }
    },
    [deleteEndpoint, idKey, errorMessages.deleteFailed, router]
  );

  return {
    loading,
    isConfirmOpen,
    setIsConfirmOpen,
    handleToggleActive,
    handleDelete,
    confirmDelete,
  };
}
