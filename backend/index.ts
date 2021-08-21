const uWS = require("uwebsockets.js")

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
  
    /* It does Http as well */
    res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
    
  }).listen(9001, (listenSocket: any) => {
  
    if (listenSocket) {
      console.log('Listening to port 9001');
    }
    
  });
