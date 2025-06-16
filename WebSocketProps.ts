export type WebSocketProps = {
  send: (
    data: { type: string } & {
      [key: string]:
        | string
        | number
        | boolean
        | string[]
        | number[]
        | boolean[];
    }
  ) => void;
  listen: (
    abortSignal: AbortSignal,
    handlers: { [type: string]: (data: any) => void }
  ) => void;
};
