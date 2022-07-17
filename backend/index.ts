import { readFile } from 'fs/promises';
const path = require('path');
const mime = require('mime-types');
import { App, WebSocket } from "uWebSockets.js";
import obstacles from './obstacles';

import Players from "./players";

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

const sockets: Set<any> = new Set();

/* SSL would be SSLApp() */
const app = App();

  app.ws('/*', {
//    idleTimeout: 30000,
//    maxBackpressure: 1024,
//    maxPayloadLength: 512,
  
    /* For brevity we skip the other events (upgrade, ping, pong, close) */
    upgrade: (res:any, req:any, context:any) => {
      res.upgrade(
         { key: req.getHeader('sec-websocket-key') }, // 1st argument sets which properties to pass to ws object, in this case ip address
         req.getHeader('sec-websocket-key'),
         req.getHeader('sec-websocket-protocol'),
         req.getHeader('sec-websocket-extensions'), // 3 headers are used to setup websocket
         context // also used to setup websocket
      )
    },
    open: (ws: WebSocket) => {
        console.log('open ', ws._socket);
        ws.subscribe('ALL');
        const myIndex = Players.newPlayer();
        ws.send(JSON.stringify({ type: 'YOU', value: myIndex }));
        ws.send(JSON.stringify({ type: 'OBSTACLES', value: obstacles.getData() }));
    },
    message: (ws: any, message: any, isBinary: boolean) => {
      try{
        const action = JSON.parse(message);
        Players.userInput(0, action.type);
        /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */
        
        /* Here we echo the message back, using compression if available */
//        let ok = ws.send(message, isBinary, true);
      }
      catch (e) {
        console.log('error parsing message: ', e);
      }
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

setInterval(() => {
    const startTS = Date.now();
    Players.updateEntities();
    Players.checkBulletHits();
    app.publish('ALL', JSON.stringify({ type: 'PLAYERS', value: Players.serialize() }));
    const runtime = Date.now() - startTS;
    if (runtime > 3)
      console.log('Tick runtime ', runtime);
}, 40);
