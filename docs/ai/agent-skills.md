# Agent Skills для разработки на Matreshka

Дополнение к [документации](../README.md) и [getting started](../getting-started/overview.md).

[Agent Skills](https://skills.sh/) — модульные инструкции для AI-агентов в Cursor и других средах. Набор для Matreshka BFF помогает агенту следовать соглашениям фреймворка: `Context`, `ContextRef`, layout, color tokens и типичные ошибки при сериализации страниц.

## Установка

Из корня репозитория или любого проекта на Matreshka:

```bash
npx skills add matreshka-dev/agents--skill
```

CLI клонирует [репозиторий skills](https://github.com/matreshka-dev/agents--skill) и копирует пакеты в `.agents/skills/` (для Cursor — также в каталог skills агента, в зависимости от настроек CLI).

Обновление уже установленных skills:

```bash
npx skills update
```

Поиск других skills в экосистеме:

```bash
npx skills find matreshka
```
