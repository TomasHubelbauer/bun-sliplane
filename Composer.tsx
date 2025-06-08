import {
  useCallback,
  useEffect,
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
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem("draft", event.currentTarget.value);
      setDraft(event.currentTarget.value);
    },
    [setDraft]
  );

  useEffect(() => {
    setDraft(localStorage.getItem("draft") || "");
  }, [setDraft]);

  const handleInputKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setDraft("");
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      const text = event.currentTarget.value.trim();
      if (!text) {
        return;
      }

      if (!password) {
        localStorage.setItem("password", text);
        setPassword(text);
        await onSubmit();
        return;
      }

      await fetch(`/${password}`, { method: "POST", body: text });
      setDraft("");
      await onSubmit();
    },
    [password, setPassword, onSubmit, setDraft]
  );

  return (
    <input
      autoComplete="off"
      autoFocus
      onKeyDown={handleInputKeyDown}
      placeholder={!password ? "Set password" : undefined}
      value={draft}
      onChange={handleInputChange}
    />
  );
}
