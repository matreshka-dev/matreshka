# Client Settings

> Справочник. Минимальный пример для первого экрана — в [first-app.md](../getting-started/first-app.md).

`clientSettings` — это конфигурация приложения, которую BFF отправляет клиенту в `HandshakeMessage` при инициализации сессии. Через нее задаются:

- имя приложения;
- favicon и PWA-иконки;
- аналитика;
- реестр шрифтов;
- реестр цветовых токенов.

Это не runtime-состояние страницы, а глобальная конфигурация клиентского приложения.

## Где используется

Обычно `clientSettings` передаются в transport-слое при вызове `initClient(...)`:

```ts
const client = app.getClient(params);
app.initClient(client, params, (applicationId) => clientSettings);
```

Третий аргумент — функция `(applicationId: string) => ClientSettings`, если для разных клиентов нужны разные настройки.

Именно после client handshake BFF отправляет `HandshakeMessage`, и клиент применяет настройки.

## Тип `ClientSettings`

```ts
type ClientSettings = {
  appName: string;
  appShortName?: string;
  analytics?: {
    yandex?: {
      id: string;
    };
  };
  faviconUrl?: {
    png: string;
    svg?: string;
  };
  pwaIconUrl?: {
    png: string;
    svg?: string;
  };
  fonts: AppFontsConfig;
  colors: {
    registry: ColorToken[];
    default: Partial<Record<ColorRole, ColorToken>>;
  };
};
```

## Минимальный пример

```ts
import type { ClientSettings } from "@matreshka/bff/core/types/client-settings";
import { ColorRole } from "@matreshka/shared/enums/color-role";
import { appFonts } from "./font-tokens";
import { selectBackgroundColorToken } from "./color-tokens/select-background";

export const clientSettings: ClientSettings = {
  appName: "Панель управления тестами",
  fonts: appFonts,
  colors: {
    registry: [selectBackgroundColorToken],
    default: {
      [ColorRole.Background]: selectBackgroundColorToken,
    },
  },
};
```

Этого уже достаточно, чтобы:

- клиент получил имя приложения;
- зарегистрировал шрифты;
- зарегистрировал цветовую палитру и глобальные роли на `html`.

## Поля и их влияние

### `appName`

Основное имя приложения.

На web-платформе используется, в частности:

- для meta `app-name`;
- для динамического PWA manifest как `name`.

Пример:

```ts
appName: "Delta Admin";
```

### `appShortName`

Короткое имя приложения.

На web-платформе попадает в PWA manifest как `short_name`. Это полезно для ярлыков, home screen и других мест, где длинное имя неудобно.

Пример:

```ts
appShortName: "Delta";
```

### `analytics`

Секция для клиентской аналитики.

Сейчас в типах есть поддержка:

```ts
analytics: {
  yandex: {
    id: "12345678",
  },
}
```

На клиенте это приводит к подключению скрипта Яндекс.Метрики при получении BFF `HandshakeMessage`.

Важно: это именно клиентская инициализация аналитики, а не серверная интеграция.

### `faviconUrl`

Ссылки на favicon.

```ts
faviconUrl: {
  png: "https://example.com/favicon.png",
  svg: "https://example.com/favicon.svg",
}
```

На web-платформе клиент обновляет ссылки на favicon в документе.

Если поле не указано, используются дефолтные клиентские пути:

- `/favicon.svg`
- `/favicon.png`

### `pwaIconUrl`

Иконки для PWA/home screen.

```ts
pwaIconUrl: {
  png: "https://example.com/pwa.png",
  svg: "https://example.com/pwa.svg",
}
```

На web-платформе это влияет на:

- `apple-touch-icon` / home screen icon;
- динамически создаваемый PWA manifest.

Практическая рекомендация из типов: для `png` лучше не использовать прозрачный фон, иначе ОС может подставить свой фон.

### `fonts`

Реестр шрифтов приложения.

Это один из самых важных разделов `clientSettings`. Клиент:

- регистрирует stylesheet-based fonts;
- генерирует `@font-face` для file-based fonts;
- вычисляет default font stack;
- применяет дефолтный стек к документу.

Ниже детали.

### `colors`

Объект с двумя частями:

- **`registry`** — реестр определений `ColorToken[]` (как раньше массив `colors`). Клиент регистрирует их при handshake, чтобы резолвить id в `properties.colors` компонентов.
- **`default`** — глобальные роли по умолчанию (`Partial<Record<ColorRole, ColorToken>>`). Клиент вешает их на `document.documentElement`; наследуют platform overlays, узлы без своих `colors` и subtree под `ServerComponentWrapper`.

Локальные `properties.colors` на компоненте (через wrapper) перекрывают `default` для своей ветки.

Каждый токен из `default` должен быть в `registry`, иначе клиент не найдёт id при применении ролей на `html`.

Если вы используете токен в компоненте или в `default`, добавьте его в `colors.registry`.

## Подробно про шрифты

`fonts` имеют тип `AppFontsConfig`:

```ts
type AppFontsConfig = {
  faces: Record<string, FontFaceToken>;
  stacks: {
    list: Record<string, FontStackToken>;
    default: string;
  };
};

type FontStackToken = {
  entries: string[];
  fontWeight?: number | string;
  fontSize?: number;
  lineHeight?: number;
};
```

### `faces`

`faces` — это реестр отдельных font face.

Пример:

```ts
faces: {
  inter: {
    family: "Inter",
    asset: {
      kind: "stylesheet",
      url: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
  },
  systemUi: {
    family: "system-ui",
  },
  sansSerif: {
    family: "sans-serif",
  },
}
```

У одного face есть:

- `family` — CSS font-family;
- `weight` — опционально;
- `style` — например `normal` или `italic`;
- `asset` — источник шрифта.

`weight` у face описывает конкретный зарегистрированный вариант шрифта. Это не то же самое, что `fontWeight` у stack-а: `fontWeight` применяется к компоненту как CSS font-weight.

### Два способа зарегистрировать face

#### 1. Через `stylesheet`

```ts
inter: {
  family: "Inter",
  asset: {
    kind: "stylesheet",
    url: "https://fonts.googleapis.com/css2?family=Inter:...",
  },
}
```

В этом случае клиент добавляет `<link rel="stylesheet">` в документ.

Это удобно для Google Fonts или готовых CSS-подключений.

#### 2. Через `file`

```ts
inter: {
  family: "Inter",
  weight: 400,
  asset: {
    kind: "file",
    url: "https://example.com/fonts/inter-400.woff2",
    format: "woff2",
  },
}
```

В этом случае клиент генерирует `@font-face`.

Это удобно, когда вы сами хостите шрифты и хотите полный контроль над файлами.

### `stacks`

`stacks` — это именованные наборы шрифтов, которые потом удобно использовать в компонентах.

Пример:

```ts
stacks: {
  list: {
    app: {
      entries: ["inter", "systemUi", "sansSerif"],
      fontSize: 16,
      lineHeight: 24,
    },
    heading: {
      entries: ["montserrat", "systemUi", "sansSerif"],
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 32,
    },
  },
  default: "app",
}
```

Здесь:

- `entries` — список id из `faces` или других stack-ов;
- `fontWeight` — вес шрифта для этого stack-а;
- `fontSize` — базовый размер текста в пикселях на BFF-уровне;
- `lineHeight` — высота строки в пикселях на BFF-уровне;
- `default` — id default stack, который клиент применит как основной для документа.

Клиент переводит `fontSize` и `lineHeight` в `rem` от базы `16px`. Например, `fontSize: 24` станет `1.5rem`, а `lineHeight: 32` станет `2rem`. Это сохраняет удобство работы с макетными пикселями в BFF-коде, но итоговый UI продолжает масштабироваться вместе с базовым размером шрифта клиента.

### Полный пример `appFonts`

Ниже реальный паттерн:

```ts
import { AppFontsConfig, FontFaceStyle } from "@matreshka/shared/types/fonts";

export const appFonts: AppFontsConfig = {
  faces: {
    montserrat: {
      family: "Montserrat",
      asset: {
        kind: "stylesheet",
        url: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
      },
    },
    inter: {
      family: "Inter",
      asset: {
        kind: "stylesheet",
        url: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    },
    interItalic: {
      family: "Inter",
      style: FontFaceStyle.Italic,
      asset: {
        kind: "stylesheet",
        url: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    },
    systemUi: {
      family: "system-ui",
    },
    sansSerif: {
      family: "sans-serif",
    },
  },
  stacks: {
    list: {
      app: {
        entries: ["inter", "systemUi", "sansSerif"],
        fontSize: 16,
        lineHeight: 24,
      },
      heading: {
        entries: ["montserrat", "systemUi", "sansSerif"],
        fontWeight: 700,
        fontSize: 28,
        lineHeight: 36,
      },
      action: {
        entries: ["inter", "systemUi", "sansSerif"],
        fontWeight: 600,
        fontSize: 14,
        lineHeight: 20,
      },
    },
    default: "app",
  },
};
```

### Как использовать стек в компоненте

После регистрации шрифтов стек можно передавать компонентам:

```ts
text(
  {
    font: appFonts.stacks.list.heading,
  },
  "Заголовок",
);
```

Можно завести несколько stack-ов под разные типографические роли:

```ts
stack([
  text(
    {
      font: appFonts.stacks.list.heading,
    },
    "Профиль",
  ),
  text(
    {
      font: appFonts.stacks.list.app,
    },
    "Основной текст страницы",
  ),
  button(
    {
      font: appFonts.stacks.list.action,
    },
    [text("Сохранить")],
  ),
]);
```

Здесь `heading` задает крупный жирный заголовок, `app` — обычный текст, а `action` — компактную типографику для кнопок и других action-элементов.

То есть:

1. `clientSettings.fonts` регистрируют доступные faces и stacks;
2. stack описывает не только `font-family`, но и типографические настройки;
3. затем компоненты могут ссылаться на конкретный `FontStackToken`.

## Подробно про цветовые токены

`colors.registry` — массив определений `ColorToken[]`; `colors.default` — необязательные глобальные роли на `html`.

Поддерживаются два формата каждого токена в `registry`.

### 1. Один набор цветов для всех тем

```ts
const selectBackgroundColorToken: ColorToken = {
  default: "#f5f7ff",
  hover: "#e8edff",
  active: "#d9e2ff",
};
```

Такой токен одинаково работает и в светлой, и в темной теме.

### 2. Разные цвета для `light` и `dark`

```ts
const accentColorToken: ColorToken = {
  light: {
    default: "#2563eb",
    hover: "#1d4ed8",
    active: "#1e40af",
  },
  dark: {
    default: "#60a5fa",
    hover: "#3b82f6",
    active: "#2563eb",
  },
};
```

Такой токен позволяет явно задавать разные значения для светлой и темной схемы.

### Переходы между default / hover / active

У токена можно опционально задать `transition`: длительность (мс) и `TimingFunction`. Без этого блока цвета переключаются мгновенно.

`transition` живет на корне токена — одинаково для `light` и `dark`.

```ts
import { TimingFunction } from "@matreshka/shared/enums/timing-function";

// все состояния
transition: { duration: 300, timingFunction: TimingFunction.EaseInOut }

// только hover
transition: { hover: { duration: 200, timingFunction: TimingFunction.EaseOut } }

// базовый + override: default/active 300ms, hover 150ms
transition: { duration: 300, active: { duration: 100 }, hover: { duration: 150 } }
```

Пример в токене:

```ts
const selectBackgroundColorToken: ColorToken = {
  default: "#f5f7ff",
  hover: "#e8edff",
  active: "#d9e2ff",
  transition: {
    duration: 300,
    timingFunction: TimingFunction.EaseInOut,
    hover: { duration: 150 },
  },
};
```

Если `timingFunction` не указан, клиент использует `ease`. Transition применяется у интерактивных компонентов (`.interactive`) при смене состояний.

### Mask (`mask-image`) для linear-gradient

На корне токена (как `transition`) можно задать `mask` — пока только `ColorTokenMaskType.LinearGradient`. Клиент сериализует его в CSS `--{role}-color-mask-image`; у `surface` с ролью `Background` это применяется как `mask-image` (и `-webkit-mask-image`).

Направление — `direction` в **градусах** (как в CSS `linear-gradient(Ndeg, …)`). Stop’ы: `color` и опционально `at` (0–100, проценты). Без `direction` и без `at` получается shorthand вроде `linear-gradient(black, black, transparent)`.

```ts
import { ColorTokenMaskType } from "@matreshka/shared/enums/color-token-mask-type";

const frostedHeaderColorToken: ColorToken = {
  light: { default: "rgba(236, 238, 244, 0.72)" },
  dark: { default: "rgba(21, 21, 21, 0.72)" },
  mask: {
    type: ColorTokenMaskType.LinearGradient,
    direction: 180,
    stops: [
      { color: "black" },
      { color: "black", at: 70 },
      { color: "transparent", at: 100 },
    ],
  },
};
```

→ `--background-color-mask-image: linear-gradient(180deg, black, black 70%, transparent 100%)`

Типичный сценарий — `surface` в overlay с полупрозрачным фоном и `ComponentAnimationEffect.BackdropBlur` в `onShow`: mask затухает к краю, чтобы размытие не обрывалось резкой границей.

```ts
import { animate, ComponentAnimationEffect } from "@matreshka/bff/core";

surface(
  {
    onShow: animate({
      duration: 0,
      effects: {
        [ComponentAnimationEffect.BackdropBlur]: { 0: 0, 100: 16 },
      },
    }),
    colors: {
      [ColorRole.Background]: frostedHeaderColorToken,
    },
  },
  [
    /* контент */
  ],
);
```

### Как зарегистрировать палитру

```ts
export const clientSettings: ClientSettings = {
  appName: "Delta",
  fonts: appFonts,
  colors: {
    registry: [selectBackgroundColorToken, accentColorToken],
    default: {
      [ColorRole.Background]: selectBackgroundColorToken,
      [ColorRole.Text]: accentColorToken,
    },
  },
};
```

Клиент получает реестр и default-роли и регистрирует их при handshake.

### Как использовать токен в компоненте

После регистрации токен можно назначать компоненту по ролям:

```ts
button(
  {
    colors: {
      [ColorRole.Background]: selectBackgroundColorToken,
    },
  },
  [text("Вернуться")],
);
```

Или, например, в кастомном select:

```ts
new ExampleSelect({
  ref: this.context.ref("selectedStatus"),
  colors: {
    [ColorRole.Background]: selectBackgroundColorToken,
  },
  placeholder: "Выберите статус публикации",
  options: [],
});
```

Важно: назначение цветового токена не включает сам визуальный стиль. Токен только говорит клиенту, какой цвет использовать для конкретной роли компонента.

Например, если указать цвет для `ColorRole.Border`, это не создаст границу само по себе. Компонент все равно должен применять border как часть своего состояния, варианта или собственного рендера. Цветовой токен в этом случае отвечает только за цвет этой границы.

Это разделение сделано намеренно: `colors` удобно задавать как группу стилевых ролей и прокидывать через родителя, а конкретные компоненты уже сами применяют нужные роли там, где они действительно используются. Например, родитель может задать общую палитру для вложенных элементов, а кнопки, inputs и иконки внутри возьмут из нее только подходящие роли.

Простой пример:

```ts
stack(
  {
    colors: {
      [ColorRole.Background]: surfaceColorToken,
      [ColorRole.Text]: primaryTextColorToken,
      [ColorRole.Border]: subtleBorderColorToken,
      [ColorRole.Icon]: accentIconColorToken,
    },
  },
  [
    text("Настройки профиля"),
    new BorderedCard([text("Данные аккаунта")]),
    button([icon("edit"), text("Редактировать")]),
  ],
);
```

Здесь родитель задает общую палитру для блока. `text(...)` использует текстовую роль, `icon(...)` — роль иконки, а `BorderedCard` может использовать цвет границы, потому что именно этот компонент рисует border в своем рендере.

Роли берутся из `ColorRole`:

- `background`
- `text`
- `icon`
- `placeholder`
- `border`
- `shadow`
- `backdrop`

### Что реально делает клиент

На клиенте токен:

- приводится к `light`/`dark` виду, если он был задан в короткой форме;
- регистрируется как CSS variables для нужной роли;
- учитывает и `prefers-color-scheme`, и принудительно установленную тему через `data-color-scheme`;
- если задан `transition`, пишет CSS variables длительности и timing function для default / hover / active.

То есть один и тот же токен потом может корректно работать и в системной теме, и в явно выбранной светлой/темной схеме.

## Частая ошибка

Если токен используется в компоненте или в `colors.default`, но отсутствует в `clientSettings.colors.registry`, клиент не сможет его корректно зарегистрировать.

Практическое правило простое:

- все токены из `properties.colors` и `colors.default` — в `colors.registry`;
- если шрифт или палитра не зарегистрированы в `clientSettings`, не стоит ожидать, что клиент узнает о них сам.

## Полный пример

```ts
import type { ClientSettings } from "@matreshka/bff/core/types/client-settings";
import { ColorRole } from "@matreshka/shared/enums/color-role";
import { appFonts } from "./font-tokens";
import { selectBackgroundColorToken } from "./color-tokens/select-background";

export const clientSettings: ClientSettings = {
  appName: "Панель управления тестами",
  appShortName: "Delta",
  faviconUrl: {
    png: "https://example.com/favicon.png",
    svg: "https://example.com/favicon.svg",
  },
  pwaIconUrl: {
    png: "https://example.com/pwa.png",
    svg: "https://example.com/pwa.svg",
  },
  analytics: {
    yandex: {
      id: "12345678",
    },
  },
  fonts: appFonts,
  colors: {
    registry: [selectBackgroundColorToken],
    default: {
      [ColorRole.Background]: selectBackgroundColorToken,
    },
  },
};
```

## Когда об этом думать

`clientSettings` обычно проектируют в самом начале, потому что они влияют на глобальный вид и поведение клиента:

- имя приложения;
- иконки;
- аналитика;
- базовая типографика;
- доступные палитры.

Если `Context` — это состояние конкретного UI-сценария, то `clientSettings` — это глобальная конфигурация клиентского приложения.

## Что читать дальше

- [context.md](../guides/context.md) — серверное состояние UI-сценариев.
- [first-app.md](../getting-started/first-app.md) — минимальный набор settings.
