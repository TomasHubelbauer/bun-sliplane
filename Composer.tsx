import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import { send } from "./webSocket.ts";

type ComposerProps = {
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
};

export default function Composer({ draft, setDraft }: ComposerProps) {
  const handleTextAreaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.currentTarget.value);
    },
    [setDraft]
  );

  useEffect(() => {
    if (!draft) {
      return;
    }

    const abortController = new AbortController();

    // Prevent HMR reloads from losing the draft
    window.addEventListener("beforeunload", (event) => event.preventDefault(), {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [draft, setDraft]);

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

      send({
        type: "createItem",
        name,
        text,
      });

      setDraft("");
    },
    [setDraft]
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
