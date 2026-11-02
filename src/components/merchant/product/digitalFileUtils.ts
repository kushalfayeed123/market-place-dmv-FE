const DIGITAL_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const DIGITAL_FILE_ACCEPT = [
  ".pdf",
  ".epub",
  ".doc",
  ".docx",
  ...Object.values(DIGITAL_FILE_TYPES),
].join(",");

export function getDigitalFileContentType(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const contentType = extension ? DIGITAL_FILE_TYPES[extension] : undefined;
  if (!contentType || (file.type && file.type !== contentType)) return null;
  return contentType;
}
