import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';
import { AppButton } from '@/components/common';
import { fileUploadService } from '@/services/fileUpload/fileUploadService';
import type { FileUploadModule } from '@/types/fileUpload';

const maxFileSize = 10 * 1024 * 1024;

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

export interface AppFileUploadFieldProps {
  label?: string;
  value?: string | string[];
  module: FileUploadModule;
  isPublic: boolean;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  onChange: (value: string | string[]) => void;
}

const getFileSizeLabel = (file: File) => `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

export const AppFileUploadField = ({
  label,
  value,
  module,
  isPublic,
  multiple = false,
  accept,
  disabled,
  onChange,
}: AppFileUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFilesRef = useRef<PendingFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const hasPendingFiles = pendingFiles.length > 0;

  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);

  useEffect(
    () => () => {
      pendingFilesRef.current.forEach((pendingFile) => {
        if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      });
    },
    [],
  );

  const existingLabels = useMemo(
    () => values.map((id, index) => uploadedFileNames[id] ?? `Uploaded file ${index + 1}`),
    [uploadedFileNames, values],
  );

  const clearPendingFiles = () => {
    pendingFiles.forEach((pendingFile) => {
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    });
    setPendingFiles([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const selectFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    const oversizedFile = selectedFiles.find((file) => file.size > maxFileSize);

    if (oversizedFile) {
      setError(`${oversizedFile.name} is ${getFileSizeLabel(oversizedFile)}. Maximum file size is 10 MB.`);
      return;
    }

    clearPendingFiles();
    setPendingFiles(
      selectedFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      })),
    );
    setError(null);
  };

  const removePendingFile = (fileToRemove: File) => {
    setPendingFiles((currentFiles) => {
      const nextFiles = currentFiles.filter(({ file }) => file !== fileToRemove);
      const removedFile = currentFiles.find(({ file }) => file === fileToRemove);

      if (removedFile?.previewUrl) URL.revokeObjectURL(removedFile.previewUrl);
      if (nextFiles.length === 0 && inputRef.current) inputRef.current.value = '';

      return nextFiles;
    });
  };

  const uploadPendingFiles = async () => {
    if (!pendingFiles.length) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles = await Promise.all(
        pendingFiles.map(async ({ file }) => {
          const response = await fileUploadService.uploadFile({ module, file, isPublic });
          return { id: response.data.id, name: file.name };
        }),
      );
      const uploadedIds = uploadedFiles.map(({ id }) => id);

      setUploadedFileNames((currentNames) => ({
        ...currentNames,
        ...uploadedFiles.reduce<Record<string, string>>((names, file) => {
          names[file.id] = file.name;
          return names;
        }, {}),
      }));
      onChange(multiple ? [...values, ...uploadedIds] : uploadedIds[0] ?? '');
      clearPendingFiles();
    } catch (uploadError) {
      const message =
        uploadError && typeof uploadError === 'object' && 'message' in uploadError
          ? String((uploadError as { message?: unknown }).message)
          : 'Unable to upload file.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const removeValue = (id: string) => {
    setUploadedFileNames((currentNames) => {
      const nextNames = { ...currentNames };
      delete nextNames[id];
      return nextNames;
    });

    if (multiple) {
      onChange(values.filter((item) => item !== id));
      return;
    }

    onChange('');
  };

  return (
    <div className={clsx('grid gap-2', disabled && 'opacity-60')}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">{label}</span>}
      <div className="grid gap-3 rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white p-3 transition-all duration-150 focus-within:border-[#123B8D] focus-within:ring-3 focus-within:ring-[#123B8D]/10">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={(event) => selectFiles(event.target.files)}
        />
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#EAF1FF] text-[#123B8D]">
            <UploadCloud className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold text-[#0B1F4A]">{multiple ? 'Upload files' : 'Upload file'}</p>
            <p className="m-0 text-xs text-[#79859A]">Any file type, max 10 MB each</p>
          </div>
        </div>

        {pendingFiles.length > 0 && (
          <div className="grid gap-2">
            {pendingFiles.map(({ file, previewUrl }) => (
              <div className="grid gap-2 rounded-lg bg-[#F8FAFC] p-2.5" key={`${file.name}-${file.lastModified}`}>
                <div className="flex min-w-0 items-center gap-3">
                  {previewUrl ? (
                    <img
                      className="size-12 shrink-0 rounded-lg object-cover"
                      src={previewUrl}
                      alt=""
                    />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-white text-[#123B8D]">
                      <FileText className="size-5" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="m-0 truncate text-xs font-bold text-[#0B1F4A]">{file.name}</p>
                    <p className="m-0 text-xs text-[#79859A]">{getFileSizeLabel(file)}</p>
                  </div>
                  <button
                    className="ml-auto grid size-7 shrink-0 place-items-center rounded-full border-0 bg-white text-[#64748B] transition hover:text-[#DC2626]"
                    type="button"
                    aria-label="Remove selected file"
                    disabled={disabled || uploading}
                    onClick={() => removePendingFile(file)}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {values.length > 0 && (
          <div className="grid gap-2">
            {values.map((id, index) => (
              <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2" key={id}>
                <span className="min-w-0 truncate text-xs font-semibold text-[#0B1F4A]">{existingLabels[index]}</span>
                <button
                  className="grid size-7 shrink-0 place-items-center rounded-full border-0 bg-white text-[#64748B] transition hover:text-[#DC2626]"
                  type="button"
                  aria-label="Remove uploaded file"
                  disabled={disabled || uploading}
                  onClick={() => removeValue(id)}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <AppButton fullWidth size="sm" variant="outline" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
            Choose
          </AppButton>
          <AppButton
            fullWidth
            size="sm"
            loading={uploading}
            disabled={disabled || !hasPendingFiles}
            onClick={() => void uploadPendingFiles()}
          >
            Upload
          </AppButton>
        </div>

      </div>
      {error && <span className="text-xs font-semibold text-[#DC2626]">{error}</span>}
    </div>
  );
};
