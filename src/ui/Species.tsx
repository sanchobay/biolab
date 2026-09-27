import { Fragment } from 'react';

// Scientific names stay in Latin in every language and are set in italics (PRD-0003 §9).
const NAME = /(Arthrospira platensis|Arthrospira)/;

/** Renders translated text with any Arthrospira name in italics. */
export function Species({ text }: { text: string }) {
  return (
    <>
      {text.split(NAME).map((part, index) => (NAME.test(part) ? <i key={index}>{part}</i> : <Fragment key={index}>{part}</Fragment>))}
    </>
  );
}
