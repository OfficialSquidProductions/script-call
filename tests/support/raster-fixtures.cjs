'use strict';
// Test-only static RGBA raster with a visible border/diagonals and transparent fill.
const zlib=require('node:zlib');
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;}return(n^0xffffffff)>>>0;}
function chunk(type,data){const x=Buffer.alloc(data.length+12);x.writeUInt32BE(data.length);x.write(type,4);data.copy(x,8);x.writeUInt32BE(crc(x.subarray(4,-4)),x.length-4);return x;}
function png(w=600,h=100){const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;const rows=[];for(let y=0;y<h;y++){const row=Buffer.alloc(w*4+1);for(let x=0;x<w;x++){const i=1+x*4;row[i]=140;row[i+1]=30;row[i+2]=180;row[i+3]=(x<4||x>=w-4||y<4||y>=h-4||Math.abs(y/h-x/w)<.03||Math.abs(y/h+x/w-1)<.03)?255:0;}rows.push(row);}return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);}
module.exports={png};
