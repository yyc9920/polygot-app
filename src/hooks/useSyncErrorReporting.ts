import { useEffect, useRef } from 'react';
import { SyncErrorService, type SyncError } from '../lib/services/SyncErrorService';
import { useToast } from '../context/ToastContext';
import useLanguage from './useLanguage';

const ERROR_THROTTLE_MS = 5000;

export function useSyncErrorReporting() {
  const toast = useToast();
  const { t } = useLanguage();
  const lastErrorTime = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleError = (error: SyncError) => {
      const errorKey = `${error.type}_${error.key}`;
      const now = Date.now();
      
      if (lastErrorTime.current[errorKey] && now - lastErrorTime.current[errorKey] < ERROR_THROTTLE_MS) {
        return;
      }
      lastErrorTime.current[errorKey] = now;

      let message: string;
      switch (error.type) {
        case 'cloud_save':
          message = t('sync.cloudSaveError');
          break;
        case 'cloud_load':
          message = t('sync.cloudLoadError');
          break;
        case 'local_save':
          message = t('sync.localSaveError');
          break;
        case 'local_load':
          message = t('sync.localLoadError');
          break;
        case 'migration':
          message = t('sync.migrationError');
          break;
        default:
          message = t('sync.unknownError');
      }

      toast.error(message);
    };

    return SyncErrorService.subscribe(handleError);
  }, [toast, t]);
}
