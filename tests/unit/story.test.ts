import { describe, it, expect } from "vitest";
import { parseStory, toBlocks } from "@/lib/story";

describe("parseStory", () => {
  it("extracts the leading H1 title and the body", () => {
    const { title, body } = parseStory("# The Sleepy Fox\n\nOnce upon a time.");
    expect(title).toBe("The Sleepy Fox");
    expect(body).toBe("Once upon a time.");
  });

  it("returns an empty title when no H1 is present yet (mid-stream)", () => {
    const { title, body } = parseStory("Once upon");
    expect(title).toBe("");
    expect(body).toBe("Once upon");
  });

  it("handles CRLF line endings", () => {
    const { title } = parseStory("# Title\r\n\r\nBody");
    expect(title).toBe("Title");
  });
});

describe("toBlocks", () => {
  it("splits a body into paragraphs on blank lines", () => {
    expect(toBlocks("Para one.\n\nPara two.")).toEqual(["Para one.", "Para two."]);
  });

  it("keeps single newlines inside a stanza together", () => {
    const blocks = toBlocks("Line one\nLine two\n\nNext stanza");
    expect(blocks).toEqual(["Line one\nLine two", "Next stanza"]);
  });

  it("drops empty blocks", () => {
    expect(toBlocks("\n\n\nHello\n\n\n")).toEqual(["Hello"]);
  });
});
