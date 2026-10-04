export type Layout = "65" | "75" | "tkl";
export type Lang = "ru" | "en";
export type Part = "caps" | "switches" | "plate" | "pcb" | "case";
export interface Config {
  version: 1;
  layout: Layout;
  finish: "silver" | "graphite" | "sage";
  material: "aluminium" | "polycarbonate";
  caps: "chalk" | "ink" | "moss";
  switch: "linear" | "tactile" | "clicky";
}
export const DEFAULT: Config = {
  version: 1,
  layout: "75",
  finish: "silver",
  material: "aluminium",
  caps: "chalk",
  switch: "linear",
};
export const OPTIONS = {
  layout: ["65", "75", "tkl"],
  finish: ["silver", "graphite", "sage"],
  material: ["aluminium", "polycarbonate"],
  caps: ["chalk", "ink", "moss"],
  switch: ["linear", "tactile", "clicky"],
} as const;
export const CASE_COLORS = {
  silver: "#b7b9b4",
  graphite: "#353b3b",
  sage: "#889b85",
};
export const CAP_COLORS = {
  chalk: ["#e6e6dc", "#b9beb7", "#cbdc8e"],
  ink: ["#3b4548", "#253034", "#d5e697"],
  moss: ["#9baa8f", "#647c6b", "#dfdfbd"],
};
export const SWITCH_COLORS = {
  linear: "#e88a80",
  tactile: "#c49a68",
  clicky: "#83bad0",
};
export const PARTS: Part[] = ["caps", "switches", "plate", "pcb", "case"];
export const INFO = {
  "65": {
    name: "65%",
    width: 318,
    depth: 116,
    ru: "Больше места для мыши. Стрелки рядом; F-ряд доступен через Fn на реальных компактных клавиатурах.",
    en: "More room for your mouse. Dedicated arrows; compact keyboards typically access F-keys through Fn.",
  },
  "75": {
    name: "75%",
    width: 326,
    depth: 138,
    ru: "Компактный баланс. Отдельный F-ряд и стрелки без цифрового блока.",
    en: "A compact balance. Dedicated function row and arrows, without a number pad.",
  },
  tkl: {
    name: "TKL",
    width: 365,
    depth: 138,
    ru: "Раздельные блоки навигации и стрелок. Привычная раскладка без цифрового блока.",
    en: "Separated navigation and arrow clusters. Familiar spacing, without a number pad.",
  },
};
export const SWITCH_INFO = {
  linear: {
    ru: "Ровный ход без тактильного бугорка. Звук зависит от всей сборки.",
    en: "Smooth travel without a tactile bump. Sound depends on the whole build.",
  },
  tactile: {
    ru: "Ощутимый бугорок при нажатии. Без специального механизма щелчка.",
    en: "A noticeable bump during travel. No dedicated click mechanism.",
  },
  clicky: {
    ru: "Тактильный отклик и отдельный слышимый щелчок.",
    en: "Tactile feedback with a distinct audible click.",
  },
};
export const PART_INFO: Record<
  Part,
  { ru: [string, string]; en: [string, string] }
> = {
  caps: {
    ru: [
      "Кейкапы",
      "Профильные колпачки PBT. Форма и фактура определяют ощущение под пальцами.",
    ],
    en: [
      "Keycaps",
      "Sculpted PBT caps. Shape and texture define the feel under your fingers.",
    ],
  },
  switches: {
    ru: [
      "Переключатели",
      "Механизм под каждой клавишей. Тип меняет характер хода, а не раскладку.",
    ],
    en: [
      "Switches",
      "The mechanism under each key. Switch type changes travel feel, not the layout.",
    ],
  },
  plate: {
    ru: [
      "Пластина",
      "Фиксирует переключатели. Схематическая алюминиевая пластина с посадочными отверстиями.",
    ],
    en: [
      "Plate",
      "Holds the switches in place. Schematic aluminium plate with switch openings.",
    ],
  },
  pcb: {
    ru: [
      "Плата",
      "Связывает переключатели с контроллером. Дорожки и компоненты показаны схематически.",
    ],
    en: [
      "PCB",
      "Connects switches to the controller. Traces and components are schematic.",
    ],
  },
  case: {
    ru: [
      "Корпус",
      "Основа сборки с полостью для платы. Материал и цвет можно изменить.",
    ],
    en: [
      "Case",
      "The foundation with a cavity for the PCB. Explore different materials and finishes.",
    ],
  },
};
export function validate(value: unknown): Config {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid");
  const c = value as Record<string, unknown>;
  if (
    c.version !== 1 ||
    Object.keys(c).some(
      (k) => !["version", ...Object.keys(OPTIONS)].includes(k),
    )
  )
    throw new Error("invalid");
  for (const [key, values] of Object.entries(OPTIONS))
    if (!values.includes(c[key] as never)) throw new Error("invalid");
  return {
    version: 1,
    layout: c.layout,
    finish: c.finish,
    material: c.material,
    caps: c.caps,
    switch: c.switch,
  } as Config;
}
export function parseJSON(text: string): Config {
  if (text.length > 4096) throw new Error("invalid");
  return validate(JSON.parse(text));
}
export function toURL(c: Config, base: string): string {
  const u = new URL(base);
  u.search = "";
  u.searchParams.set("build", JSON.stringify(c));
  return u.toString();
}
export function fromURL(url: string): Config | null {
  const raw = new URL(url).searchParams.get("build");
  return raw === null ? null : parseJSON(raw);
}
export interface Key {
  code: string;
  label: string;
  x: number;
  z: number;
  w: number;
  accent?: boolean;
  mod?: boolean;
}
export function keysFor(layout: Layout): Key[] {
  const out: Key[] = [];
  const y = layout === "65" ? 0 : 1.35;
  const add = (
    code: string,
    label: string,
    x: number,
    z: number,
    w = 1,
    mod = false,
    accent = false,
  ) => out.push({ code, label, x: x + w / 2, z, w, mod, accent });
  const row = (items: [string, string, number?][], z: number) => {
    let x = 0;
    for (const [code, label, w = 1] of items) {
      add(code, label, x, z, w, w > 1);
      x += w;
    }
  };
  row(
    [
      ["Backquote", layout === "65" ? "esc" : "`"],
      ...Array.from(
        { length: 10 },
        (_, i) =>
          ["Digit" + ((i + 1) % 10), String((i + 1) % 10)] as [string, string],
      ),
      ["Minus", "−"],
      ["Equal", "="],
      ["Backspace", "back", 2],
    ],
    y,
  );
  row(
    [
      ["Tab", "tab", 1.5],
      ..."QWERTYUIOP".split("").map((s) => ["Key" + s, s] as [string, string]),
      ["BracketLeft", "["],
      ["BracketRight", "]"],
      ["Backslash", "\\", 1.5],
    ],
    y + 1,
  );
  row(
    [
      ["CapsLock", "caps", 1.75],
      ..."ASDFGHJKL".split("").map((s) => ["Key" + s, s] as [string, string]),
      ["Semicolon", ";"],
      ["Quote", "'"],
      ["Enter", "enter", 2.25],
    ],
    y + 2,
  );
  row(
    [
      ["ShiftLeft", "shift", 2.25],
      ..."ZXCVBNM".split("").map((s) => ["Key" + s, s] as [string, string]),
      ["Comma", ","],
      ["Period", "."],
      ["Slash", "/"],
      ["ShiftRight", "shift", layout === "tkl" ? 2.75 : 1.75],
    ],
    y + 3,
  );
  row(
    [
      ["ControlLeft", "ctrl", 1.25],
      ["MetaLeft", "win", 1.25],
      ["AltLeft", "alt", 1.25],
      ["Space", "", 6.25],
      ["AltRight", "alt", layout === "tkl" ? 1.25 : 1],
      ["Fn", "fn", layout === "tkl" ? 1.25 : 1],
      ["ControlRight", "ctrl", layout === "tkl" ? 1.25 : 1],
    ],
    y + 4,
  );
  if (layout === "tkl") {
    for (const [i, code] of [
      "Insert",
      "Home",
      "PageUp",
      "Delete",
      "End",
      "PageDown",
    ].entries())
      add(
        code,
        ["ins", "home", "pgup", "del", "end", "pgdn"][i],
        15.6 + (i % 3),
        y + Math.floor(i / 3),
      );
    add("ArrowUp", "↑", 16.6, y + 3);
    add("ArrowLeft", "←", 15.6, y + 4);
    add("ArrowDown", "↓", 16.6, y + 4);
    add("ArrowRight", "→", 17.6, y + 4);
  } else {
    for (const [i, code] of [
      "Delete",
      "PageUp",
      "PageDown",
      "ArrowUp",
      "ArrowRight",
    ].entries())
      add(code, ["del", "pgup", "pgdn", "↑", "→"][i], 15.15, y + i);
    add("ArrowLeft", "←", 13.15, y + 4);
    add("ArrowDown", "↓", 14.15, y + 4);
  }
  if (layout !== "65") {
    add("Escape", "esc", 0, 0, 1, true, true);
    for (let i = 1; i <= 12; i++)
      add("F" + i, "F" + i, 1.6 + (i - 1) * 1.06, 0);
    if (layout === "tkl")
      for (const [i, code] of ["PrintScreen", "ScrollLock", "Pause"].entries())
        add(code, ["prt", "scr", "pause"][i], 15.6 + i, 0);
    else add("Home", "home", 15.15, 0);
  } else {
    out[0].code = "Escape";
    out[0].accent = true;
  }
  out.find((k) => k.code === "Enter")!.accent = true;
  return out;
}
export function buildSheet(c: Config, lang: Lang): string {
  const l = INFO[c.layout];
  return [
    "KEYFORM / " + l.name,
    lang === "ru"
      ? "Концептуальная сборка — Бахтияр"
      : "Concept build — Bakhtiyar",
    "",
    `${l.width} × ${l.depth} × 32 mm · ${keysFor(c.layout).length} keys`,
    ...Object.entries(c)
      .filter(([k]) => k !== "version")
      .map(([k, v]) => `${k}: ${v}`),
    "",
    lang === "ru"
      ? "Внутренняя компоновка схематическая. Совместимость реальных компонентов не заявлена."
      : "Schematic internal arrangement. Real component compatibility is not claimed.",
  ].join("\n");
}
