type TrimmedTextProps = {
  text: string;
  limit: number;
};

export default function TrimmedText({ text, limit }: TrimmedTextProps) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
