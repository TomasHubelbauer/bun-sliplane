export let ws: WebSocket;

const queue: ({ type: string } & object)[] = [];
function makeWebSocket() {
  const webSocket = new WebSocket("/ws");
  webSocket.addEventListener("error", () => (ws = makeWebSocket()));
  webSocket.addEventListener("close", () => (ws = makeWebSocket()));
  webSocket.addEventListener("open", () => {
    for (const data of queue) {
      //console.log("Re-sending:", data.type, data);
      webSocket.send(JSON.stringify(data));
    }

    queue.splice(0, queue.length);
  });

  return webSocket;
}

ws = makeWebSocket();

export function send(
  data: { type: string } & {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
  }
) {
  if (ws.readyState !== WebSocket.OPEN) {
    //console.log("Queuing:", data.type, data);
    queue.push(data);
    return;
  }

  //console.log("Sending:", data.type, data);
  ws.send(JSON.stringify(data));
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
