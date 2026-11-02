import { describe, expect, it } from "vitest";
import { getDigitalFileContentType } from "./digitalFileUtils";

const file = (name: string, type = "") => ({ name, type }) as File;

describe("getDigitalFileContentType", () => {
  it.each([
    ["book.pdf", "application/pdf"],
    ["book.epub", "application/epub+zip"],
    ["book.doc", "application/msword"],
    [
      "book.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ])("accepts %s", (name, contentType) => {
    expect(getDigitalFileContentType(file(name))).toBe(contentType);
  });

  it("rejects other extensions and mismatched MIME types", () => {
    expect(getDigitalFileContentType(file("video.mp4", "video/mp4"))).toBeNull();
    expect(getDigitalFileContentType(file("fake.pdf", "image/png"))).toBeNull();
  });
});
