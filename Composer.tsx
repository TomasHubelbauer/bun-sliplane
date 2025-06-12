import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";

type ComposerProps = {
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  password: string | null;
  setPassword: Dispatch<SetStateAction<string | null>>;
  onSubmit: () => Promise<void>;
};

export default function Composer({
  draft,
  setDraft,
  password,
  setPassword,
  onSubmit,
}: ComposerProps) {
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
    async (event: KeyboardEvent<HTMLTextAreaElement>) => {
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

      if (!password) {
        localStorage.setItem("password", value);
        setPassword(value);
        await onSubmit();
        return;
      }

      const [name, ...lines] = value.split("\n");
      const text = lines.join("\n").trim();

      await fetch(`/${password}`, {
        method: "POST",
        body: JSON.stringify({ name, text }),
      });

      setDraft("");
      localStorage.setItem("draft", "");
      await onSubmit();
    },
    [password, setPassword, onSubmit, setDraft]
  );

  const rows = useMemo(() => draft.split("\n").length, [draft]);

  const placeholder = useMemo(() => {
    if (!password) {
      return "Set password";
    }

    return "Press Enter to submit, Escape to clear, Shift+Enter to enter name+text mode";
  }, [password]);

  return (
    <div className="composer">
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
        placeholder={placeholder}
        value={draft}
        rows={rows === 1 ? 1 : rows + 1}
        onChange={handleTextAreaChange}
      />
    </div>
  );
}
