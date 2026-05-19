import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceDialogOptions {
  title: string;
  message: string;
  choices: ChoiceOption[];
  cancelLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  choose: (options: ChoiceDialogOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type DialogState =
  | { kind: 'confirm'; options: ConfirmOptions }
  | { kind: 'choice'; options: ChoiceDialogOptions }
  | null;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const resolveRef = useRef<((value: boolean | string | null) => void) | null>(null);

  const close = useCallback((value: boolean | string | null) => {
    setDialog(null);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve as (value: boolean | string | null) => void;
      setDialog({ kind: 'confirm', options });
    });
  }, []);

  const choose = useCallback((options: ChoiceDialogOptions) => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve as (value: boolean | string | null) => void;
      setDialog({ kind: 'choice', options });
    });
  }, []);

  const handleOverlayClick = () => {
    close(dialog?.kind === 'confirm' ? false : null);
  };

  const handleCancel = () => {
    close(dialog?.kind === 'confirm' ? false : null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, choose }}>
      {children}
      {dialog && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-container confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{dialog.options.title}</h3>
              <button type="button" className="modal-close" onClick={handleCancel} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">{dialog.options.message}</p>
              {dialog.kind === 'choice' && (
                <div className="confirm-choices">
                  {dialog.options.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      className="btn btn-secondary confirm-choice-btn"
                      onClick={() => close(choice.id)}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {dialog.kind === 'confirm' ? (
                <>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    {dialog.options.cancelLabel ?? 'Cancelar'}
                  </button>
                  <button
                    type="button"
                    className={`btn ${dialog.options.danger ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => close(true)}
                  >
                    {dialog.options.confirmLabel ?? 'Confirmar'}
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  {dialog.options.cancelLabel ?? 'Cancelar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
