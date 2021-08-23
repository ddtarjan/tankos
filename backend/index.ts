const uWS = require("uwebsockets.js")
import { readFile } from 'fs/promises';
const path = require('path');
const mime = require('mime-types');

/* Helper function converting Node.js buffer to ArrayBuffer */
function toArrayBuffer(buffer: any) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function sendFile(filePath: any, res: any) {
  let data;
  data = await readFile(filePath).catch(() => {});
  if (!data) {
    console.log(`error reading ${filePath}`);
    return false
  }
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.writeHeader('Content-Type', mimeType);
  res.end(toArrayBuffer(data));
  console.log(`sent ${filePath} mimeType ${mimeType}`)
  return true;
};

/* SSL would be SSLApp() */
uWS.App()
  .ws('/*', {
  
    /* There are many common helper features */
//    idleTimeout: 30000,
//    maxBackpressure: 1024,
//    maxPayloadLength: 512,
  
    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    message: (ws: any, message: any, isBinary: boolean) => {
      /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
      
      /* Here we echo the message back, using compression if available */
      let ok = ws.send(message, isBinary, true);
    }
    
  }).get('/*', (res: any, req: any) => {
    res.onAborted(() => {
      if (res.id == -1) {
        console.log("error: onAborted called twice");
      } else {
        console.log('request aborted');
        console.timeEnd(res.id);
      }
      res.id = -1;
    });
    const url = req.getUrl();
    const filePath = path.join(__dirname, '../static', url == "/" ? "/index.html" : url);
    sendFile(filePath, res).then(sent => {
      if (sent)
        return;
      console.log(`url not found: ${url}`)
      res.writeStatus('404');
      res.end();
    });
  }).listen(9001, (listenSocket: any) => {
  
    if (listenSocket) {
      console.log('Listening to port 9001');
    }
    
  });
