export let ws: WebSocket;

const queue: (string | Uint8Array)[] = [];
function makeWebSocket() {
  const webSocket = new WebSocket("/ws");
  webSocket.addEventListener("error", () => (ws = makeWebSocket()));
  webSocket.addEventListener("close", () => (ws = makeWebSocket()));
  webSocket.addEventListener("open", () => {
    for (const data of queue) {
      //console.log("Re-sending:", data.type, data);
      webSocket.send(data);
    }

    queue.splice(0, queue.length);
  });

  return webSocket;
}

ws = makeWebSocket();

export function send(
  textData: { type: string } & {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
  },
  binaryData?: ArrayBuffer
) {
  let data: (typeof queue)[number] = JSON.stringify(textData);
  if (binaryData) {
    const jsonBytes = new TextEncoder().encode(data + "\n");
    data = new Uint8Array(
      new ArrayBuffer(jsonBytes.length + binaryData.byteLength)
    );

    data.set(jsonBytes, 0);
    data.set(new Uint8Array(binaryData), jsonBytes.length);
  }

  if (ws.readyState !== WebSocket.OPEN) {
    //console.log("Queuing:", data.type, data);
    queue.push(data);
    return;
  }

  //console.log("Sending:", data.type, data);
  ws.send(data);
}

// TODO: Change the `any` to `unknown` or make the method generic
export function listen(
  abortSignal: AbortSignal,
  handlers: { [type: string]: (data: any) => void }
) {
  ws.addEventListener(
    "message",
    (event) => {
      const { type, data } = JSON.parse(event.data);
      //console.log("Receiving:", type, data);
      const handler = handlers[type];
      if (handler) {
        handler(data);
      }
    },
    { signal: abortSignal }
  );
}
