'use client';

import type { CSSProperties, ReactNode } from 'react';

export default function ConfirmDeleteForm({
  action,
  message,
  style,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      style={style}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
