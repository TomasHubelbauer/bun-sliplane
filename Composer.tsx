import {
  useCallback,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";

type ComposerProps = {
  password: string | null;
  setPassword: Dispatch<SetStateAction<string | null>>;
  onSubmit: () => Promise<void>;
};

export default function Composer({
  password,
  setPassword,
  onSubmit,
}: ComposerProps) {
  const [draft, setDraft] = useState<string>("");

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(event.currentTarget.value);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
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
    [password, setPassword, onSubmit]
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
