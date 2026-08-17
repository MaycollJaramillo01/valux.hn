'use client';

export default function ConfirmPublishButton({
  label = 'Publicar',
  message = '¿Publicar y avisar a novedades?',
}: {
  label?: string;
  message?: string;
}) {
  return (
    <button
      type="submit"
      name="intent"
      value="publish"
      className="btn btn-primary"
      onClick={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
