import { useCallback, useEffect, useState, type MouseEvent } from "react";

type VolumeExplorerProps = {
  password: string;
};

export default function VolumeExplorer({ password }: VolumeExplorerProps) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    void (async function () {
      const response = await fetch(`/${password}/volume`);
      setItems(await response.json());
    })();
  }, []);

  const handleDeleteButtonClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      const name = event.currentTarget.dataset.name;
      if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
      }

      await fetch(`/${password}/volume?name=${name}`, {
        method: "DELETE",
      });

      const response = await fetch(`/${password}/volume`);
      setItems(await response.json());
    },
    [password]
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item}>
            <td>{item}</td>
            <td>
              <button data-name={item} onClick={handleDeleteButtonClick}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
