import type { Item } from './Item.d.ts';

const textInput = document.querySelector('#textInput') as HTMLInputElement;
const logoutButton = document.querySelector('#logoutButton') as HTMLButtonElement;
const itemUl = document.querySelector('#itemUl') as HTMLUListElement;

const password = localStorage.getItem('password');
if (!password) {
  textInput.placeholder = 'Submit to set password';
}

textInput.addEventListener('keydown', async function (event) {
  if (event.key !== 'Enter') {
    return;
  }

  const text = textInput.value.trim();
  if (!text) {
    return;
  }

  if (!password) {
    localStorage.setItem('password', text);
    location.reload();
    return;
  }

  await fetch(`/${password}`, { method: 'POST', body: text });
  textInput.value = '';
  await render();
});

textInput.focus();

logoutButton.addEventListener('click', function () {
  if (!confirm('Are you sure you want to log out?')) {
    return;
  }

  localStorage.removeItem('password');
  location.reload();
});

async function render() {
  if (!password) {
    return;
  }

  itemUl.replaceChildren();

  const response = await fetch(`/${password}`);
  const items: Item[] = await response.json();

  for (const item of items) {
    const li = document.createElement('li');

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '✕';
    li.append(deleteButton);

    deleteButton.addEventListener('click', async function () {
      if (!confirm(`Delete item "${item.name}"?`)) {
        return;
      }

      await fetch(`/${password}?name=${item.name}`, { method: 'DELETE' });
      li.remove();
    });

    li.append(` ${item.name.slice(0, -'Z.json'.length).replace('T', ' ')}: `);

    const textSpan = document.createElement('span');
    textSpan.textContent = item.text;
    li.append(textSpan);

    textSpan.addEventListener('click', async function () {
      const newText = prompt('Text:', item.text);
      if (newText === null || newText === item.text) {
        return;
      }

      await fetch(`/${password}?name=${item.name}`, {
        method: 'PUT',
        body: newText,
      });
      textSpan.textContent = newText;
    });

    itemUl.append(li);
  }
}

await render();

// Update the list whenever the tab visibility changes to keep it up to date
document.addEventListener('visibilitychange', render);