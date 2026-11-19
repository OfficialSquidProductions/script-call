// Read actual exported page text through macOS PDFKit, without automating an app.
ObjC.import('PDFKit');
function run([file]) {
 const pdf=$.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(file)),count=Number(pdf.pageCount);
 if(!Number.isInteger(count)||count<1)throw Error('Unable to read the exported PDF.');
 return JSON.stringify(Array.from({length:count},(_,i)=>ObjC.unwrap(pdf.pageAtIndex(i).string)));
}
