"use client";

import { toBlocks } from "@/lib/story";

/**
 * The story itself — the one piece of markup that must look identical whether
 * a tale is streaming in for the first time or being re-read from the library.
 *
 * It renders only the article. Actions differ between the two callers (the
 * reader can delete; the generator can regenerate), so they stay at the call
 * site.
 */
export default function StoryArticle({
  title,
  body,
  streaming = false,
  note,
  testId,
}: {
  title: string;
  body: string;
  /** Show the caret that says the storyteller is still writing. */
  streaming?: boolean;
  /** A gentle message under the story — used when a stream ends badly. */
  note?: string;
  testId?: string;
}) {
  const blocks = toBlocks(body);

  return (
    <article
      data-testid={testId}
      className="printable rounded-2xl border border-white/10 bg-surface/50 p-5 sm:p-10"
    >
      {title && (
        <h1
          data-testid="story-title"
          className="mb-6 text-center font-serif text-2xl text-starlight sm:text-4xl"
        >
          {title}
        </h1>
      )}

      <div className="story-body" data-testid="story-body">
        {blocks.map((block, i) => (
          <p key={i}>
            {block.split("\n").map((line, j, arr) => (
              <span key={j} className="verse-line">
                {line}
                {j < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        ))}
        {streaming && (
          <span
            data-testid="streaming-indicator"
            className="ml-1 inline-block h-5 w-2 animate-pulse bg-amber align-middle"
            aria-label="The story is still being written"
          />
        )}
      </div>

      {note && <p className="mt-6 text-center text-sm text-amber">{note}</p>}
    </article>
  );
}
