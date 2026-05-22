export type PresentConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type PresentFn = (opts: PresentConfirmOptions) => Promise<boolean>;

let presenter: PresentFn | null = null;

export function registerConfirmPresenter(fn: PresentFn | null) {
  presenter = fn;
}

export function hasConfirmPresenter(): boolean {
  return presenter !== null;
}

export function presentThemedConfirm(opts: PresentConfirmOptions): Promise<boolean> {
  if (presenter) {
    return presenter(opts);
  }
  return Promise.resolve(false);
}
