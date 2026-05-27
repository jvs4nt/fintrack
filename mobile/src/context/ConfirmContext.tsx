import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { PresentConfirmOptions } from '@/src/confirmBridge';
import { registerConfirmPresenter } from '@/src/confirmBridge';

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<PresentConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const present = useCallback((o: PresentConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOpts(o);
    });
  }, []);

  useEffect(() => {
    registerConfirmPresenter(present);
    return () => registerConfirmPresenter(null);
  }, [present]);

  const finish = useCallback((result: boolean) => {
    setOpts(null);
    const r = resolveRef.current;
    resolveRef.current = null;
    r?.(result);
  }, []);

  return (
    <>
      {children}
      {opts ? (
        <ConfirmModal
          visible
          title={opts.title}
          message={opts.message}
          confirmLabel={opts.confirmLabel ?? 'OK'}
          destructive={opts.destructive}
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      ) : null}
    </>
  );
}
