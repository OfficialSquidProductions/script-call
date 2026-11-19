// Invoked through macOS JavaScript for Automation. PDFKit only, no Apple events.
ObjC.import('AppKit');
ObjC.import('PDFKit');

function run(args) {
  const [input, output] = args;
  const pdf = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(input));
  const count = Number(pdf.pageCount);
  if (!Number.isInteger(count) || count < 1) throw Error('Unable to read the call sheet PDF.');
  for (let index = 0; index < count; index++) {
    const page = pdf.pageAtIndex(index);
    const bounds = page.boundsForBox($.kPDFDisplayBoxMediaBox);
    const size = $.NSMakeSize(Math.ceil(bounds.size.width * 2), Math.ceil(bounds.size.height * 2));
    const image = page.thumbnailOfSizeForBox(size, $.kPDFDisplayBoxMediaBox);
    const bitmap = $.NSBitmapImageRep.imageRepWithData(image.TIFFRepresentation);
    const png = bitmap.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $.NSDictionary.dictionary);
    if (!png.writeToFileAtomically(output + '/' + (index + 1) + '.png', true)) {
      throw Error('Unable to write call sheet page ' + (index + 1) + '.');
    }
  }
  return String(count);
}
