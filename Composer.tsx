import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";

type ComposerProps = {
  ws: WebSocket;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
};

export default function Composer({ ws, draft, setDraft }: ComposerProps) {
  const handleTextAreaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      localStorage.setItem("draft", event.currentTarget.value);
      setDraft(event.currentTarget.value);
    },
    [setDraft]
  );

  useEffect(() => {
    setDraft(localStorage.getItem("draft") || "");
  }, [setDraft]);

  const handleTextAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        setDraft("");
        return;
      }

      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      const value = event.currentTarget.value.trim();
      if (!value) {
        return;
      }

      const [name, ...lines] = value.split("\n");
      const text = lines.join("\n").trim();

      ws.send(
        JSON.stringify({
          type: "createItem",
          name,
          text,
        })
      );

      setDraft("");
      localStorage.setItem("draft", "");
    },
    [ws, setDraft]
  );

  const rows = useMemo(() => draft.trim().split("\n").length, [draft]);

  return (
    <div className={Composer.name}>
      {rows > 1 && (
        <div className="hint">
          <div>Name:</div>
          <div>Text:</div>
        </div>
      )}
      <textarea
        autoComplete="off"
        autoFocus
        onKeyDown={handleTextAreaKeyDown}
        placeholder="Press Enter to submit, Escape to clear, Shift+Enter to enter name+text mode"
        value={draft}
        rows={rows === 1 ? 1 : rows + 1}
        onChange={handleTextAreaChange}
      />
    </div>
  );
}
