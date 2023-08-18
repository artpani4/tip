Установка:

```tsx
deno install --allow-all -n tip https://deno.land/x/tip/mod.ts
```

Использование:

```bash
tip generate
```

Чтоб получить короткое описание:

```bash
tip generate --short
```

Добавить инфу:

```bash
tip generate --info \"Переведи ответ на русский язык\"
```

> env переменная может быть установлена вручную, либо через .env файл с названием OPENAI_API_KEY
