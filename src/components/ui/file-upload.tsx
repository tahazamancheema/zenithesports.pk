"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, X, File, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
}

/**
 * File upload zone with drag-and-drop support.
 */
export function FileUpload({
  onFileSelect,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  maxSizeMB = 5,
  label,
  hint,
  error: externalError,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = externalError || internalError;

  const handleFile = (selectedFile: File) => {
    setInternalError(null);

    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setInternalError(`File exceeds maximum size of ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </label>
      )}

      {!file ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[var(--radius-md)] cursor-pointer transition-colors duration-200",
            "bg-[var(--color-bg-800)] hover:bg-[var(--color-bg-700)]",
            isDragging
              ? "border-[var(--color-gold-500)] bg-[var(--gold-tint-sm)]"
              : "border-[var(--color-line-600)]",
            error && "border-[var(--color-danger)] bg-red-500/5"
          )}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={onChange}
            accept={accept}
            className="hidden"
          />
          <UploadCloud
            className={cn(
              "h-10 w-10 mb-3",
              isDragging
                ? "text-[var(--color-gold-500)]"
                : error
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-text-faint)]"
            )}
          />
          <p className="text-sm text-[var(--color-text-primary)] font-medium mb-1 text-center">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-[var(--color-text-faint)] text-center max-w-[250px]">
            {accept.split(",").join(", ")} (max. {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border border-[var(--color-line-600)] rounded-[var(--radius-md)] bg-[var(--color-bg-800)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-[var(--color-bg-700)] rounded-[var(--radius-sm)] shrink-0">
              <File className="h-5 w-5 text-[var(--color-gold-400)]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {file.name}
              </p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-1.5 ml-2 rounded-[var(--radius-sm)] text-[var(--color-text-faint)] hover:text-[var(--color-danger)] hover:bg-[var(--color-bg-700)] transition-colors shrink-0"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-1.5 mt-1 text-[var(--color-danger)]">
          <AlertCircle className="h-3.5 w-3.5" />
          <p className="text-xs" role="alert">
            {error}
          </p>
        </div>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-faint)] mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
