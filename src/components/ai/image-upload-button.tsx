type ImageUploadButtonProps = {
  loading: boolean;
  onImageSelected: (file: File) => void;
};

export function ImageUploadButton({
  loading,
  onImageSelected,
}: ImageUploadButtonProps): React.JSX.Element {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-zinc-300 px-5 text-sm font-semibold dark:border-zinc-700">
      Upload sign photo
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={loading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onImageSelected(file);
          }
          event.target.value = "";
        }}
      />
    </label>
  );
}
