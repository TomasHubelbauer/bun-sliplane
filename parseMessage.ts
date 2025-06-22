export default function parseMessage(
  message: string | Buffer<ArrayBufferLike>
) {
  let textData: { type: string } & object;
  let binaryData: Uint8Array | undefined;

  if (typeof message !== "string") {
    const buffer = new Uint8Array(message);

    const newlineIndex = buffer.indexOf(0x0a); // '\n'
    if (newlineIndex === -1) {
      throw new Error(
        "Invalid binary message format: no newline separator found"
      );
    }

    textData = JSON.parse(
      new TextDecoder().decode(buffer.slice(0, newlineIndex))
    );

    binaryData = buffer.slice(newlineIndex + 1);
  } else {
    textData = JSON.parse(message);
  }

  const { type, ...args } = textData;
  return { type, args: args as any, data: binaryData?.buffer };
}
