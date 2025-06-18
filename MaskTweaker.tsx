import { useCallback, useMemo, useState, type ChangeEvent } from "react";

type Link = {
  rowid: number;
  url: string;
  checkStamp: string;
  changeStamp: string;
  mask: string;
  html: string;
};

type MaskTweakerProps = {
  link: Link;
  onSave: (rowId: number, mask: string) => void;
  onClose: () => void;
};

export default function MaskTweaker({
  link,
  onSave,
  onClose,
}: MaskTweakerProps) {
  const [mask, setMask] = useState(link.mask);

  const handleMaskInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMask(event.target.value);
    },
    []
  );

  const handleSaveButtonClick = useCallback(() => {
    onSave(link.rowid, mask);
    onClose();
  }, [link.rowid, mask, onSave, onClose]);

  const [maskedHtml, error] = useMemo(() => {
    try {
      return [
        mask
          ? link.html.replace(new RegExp(mask, "g"), `<!-- ${mask} -->`)
          : link.html,
        null,
      ];
    } catch (error) {
      return [link.html, error];
    }
  }, [mask, link.html]);

  return (
    <div className={MaskTweaker.name}>
      <input value={mask} onChange={handleMaskInputChange} />
      {error && <div className="error">Error: {error.message}</div>}
      <div className="split">
        <textarea value={maskedHtml} readOnly rows={30} onChange={() => {}} />
        <iframe
          src={`data:text/html;charset=utf-8,${encodeURIComponent(maskedHtml)}`}
        />
      </div>
      <button onClick={handleSaveButtonClick} disabled={!!error}>
        Save
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
