import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  DEFAULT,
  OPTIONS,
  INFO,
  PARTS,
  PART_INFO,
  SWITCH_INFO,
  CASE_COLORS,
  CAP_COLORS,
  keysFor,
  parseJSON,
  fromURL,
  toURL,
  buildSheet,
  type Config,
  type Lang,
  type Part,
} from "./model";
const KeyboardScene = lazy(() => import("./KeyboardScene"));
const words = {
  ru: {
    studio: "Студия клавиатуры",
    build: "Моя сборка",
    title: "Форма. Ощущение. Вы.",
    subtitle: "Каждая деталь имеет значение.",
    layout: "Раскладка",
    compare: "Сравнить размеры",
    finish: "Корпус",
    caps: "Кейкапы",
    switch: "Переключатели",
    silver: "Серебро",
    graphite: "Графит",
    sage: "Шалфей",
    chalk: "Мел",
    ink: "Чернила",
    moss: "Мох",
    linear: "Линейные",
    tactile: "Тактильные",
    clicky: "Кликающие",
    aluminium: "Алюминий",
    polycarbonate: "Поликарбонат",
    assembled: "В сборе",
    exploded: "По слоям",
    explore: "Разобрать",
    test: "Тест клавиш",
    reset: "Вернуть ракурс",
    drag: "Вращайте · Приближайте · Исследуйте",
    concept: "Оригинальная концепция",
    schematic: "Внутренняя компоновка — схема",
    by: "Проект Бахтияра",
    close: "Закрыть",
    keys: "клавиш",
    parts: "Детали",
    save: "Сохранить на устройстве",
    restore: "Восстановить",
    forget: "Удалить сохранение",
    link: "Ссылка на сборку",
    import: "Импорт JSON",
    export: "Экспорт JSON",
    text: "Скачать состав .txt",
    clear: "Очистить тест",
    activate: "Активировать поле",
    stop: "Завершить тест",
    privacy:
      "Нажатия обрабатываются только в активном поле. Текст не сохраняется и не передаётся.",
    placeholder: "Печатайте здесь… Esc — выйти",
    invalid: "Конфигурация не распознана. Текущая сборка сохранена.",
    saved: "Сборка сохранена только на этом устройстве.",
    restored: "Сохранённая сборка восстановлена.",
    removed: "Локальное сохранение удалено.",
    missing: "На этом устройстве нет сохранённой сборки.",
    storage: "Хранилище недоступно. Используйте экспорт JSON.",
    imported: "Конфигурация импортирована.",
    copied: "Ссылка скопирована.",
    copyfail: "Скопируйте ссылку из поля ниже.",
    notice:
      "Концептуальная клавиатура, не товар. Совместимость с реальными компонентами не заявлена.",
    selected: "Выбранная сборка",
    approx: "Размеры концепции, без кабеля",
    functions: "F-ряд",
    nav: "Навигация",
    compact: "Компактно",
    separate: "Отдельный блок",
    yes: "Есть",
    fn: "Через Fn",
    testHint:
      "Нажмите экранную клавишу или активируйте поле для своей клавиатуры.",
    tested: "проверено",
    testScope:
      "Tab оставляет обычную навигацию. Системные сочетания и Fn могут перехватываться устройством.",
    notStored:
      "Сохраняются только выбранные детали. Ввод теста не входит в файл, ссылку или сохранение.",
    ready: "3D готово",
    loading: "Загрузка 3D…",
  },
  en: {
    studio: "Keyboard studio",
    build: "Your build",
    title: "Form. Feel. Yours.",
    subtitle: "Every detail makes a difference.",
    layout: "Layout",
    compare: "Compare sizes",
    finish: "Case",
    caps: "Keycaps",
    switch: "Switches",
    silver: "Silver",
    graphite: "Graphite",
    sage: "Sage",
    chalk: "Chalk",
    ink: "Ink",
    moss: "Moss",
    linear: "Linear",
    tactile: "Tactile",
    clicky: "Clicky",
    aluminium: "Aluminium",
    polycarbonate: "Polycarbonate",
    assembled: "Assembled",
    exploded: "Exploded",
    explore: "Explore layers",
    test: "Test keys",
    reset: "Reset view",
    drag: "Rotate · Zoom · Explore",
    concept: "An original concept",
    schematic: "Schematic internal arrangement",
    by: "A project by Bakhtiyar",
    close: "Close",
    keys: "keys",
    parts: "Components",
    save: "Save on this device",
    restore: "Restore",
    forget: "Delete saved build",
    link: "Link to this build",
    import: "Import JSON",
    export: "Export JSON",
    text: "Download build sheet .txt",
    clear: "Clear test",
    activate: "Activate typing field",
    stop: "End test",
    privacy:
      "Keystrokes are handled only in the focused field. Typed text is never saved or sent.",
    placeholder: "Type here… Esc to leave",
    invalid: "Invalid configuration. Your current build is unchanged.",
    saved: "Build saved only on this device.",
    restored: "Saved build restored.",
    removed: "Local build deleted.",
    missing: "No saved build on this device.",
    storage: "Storage unavailable. Use JSON export.",
    imported: "Configuration imported.",
    copied: "Build link copied.",
    copyfail: "Copy the link from the field below.",
    notice:
      "A conceptual keyboard, not a product. Real component compatibility is not claimed.",
    selected: "Selected build",
    approx: "Concept dimensions, excluding cable",
    functions: "F-row",
    nav: "Navigation",
    compact: "Compact",
    separate: "Separate cluster",
    yes: "Dedicated",
    fn: "Via Fn",
    testHint: "Tap an on-screen key or activate the field for your keyboard.",
    tested: "tested",
    testScope:
      "Tab keeps normal navigation. System shortcuts and Fn may be handled by your device.",
    notStored:
      "Only component choices are saved. Test input never enters exports, links or local storage.",
    ready: "3D ready",
    loading: "Loading 3D…",
  },
};
type Word = keyof typeof words.en;
export default function App() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = (key: Word) => words[lang][key];
  const initial = useRef<{ c: Config; error: boolean } | null>(null);
  if (!initial.current) {
    try {
      initial.current = { c: fromURL(location.href) ?? DEFAULT, error: false };
    } catch {
      initial.current = { c: DEFAULT, error: true };
    }
  }
  const [config, setConfig] = useState<Config>(initial.current.c),
    [explode, setExplode] = useState(0),
    [part, setPart] = useState<Part | null>(null),
    [panel, setPanel] = useState<"build" | "compare" | "test" | null>(null),
    [status, setStatus] = useState<Word | null>(
      initial.current.error ? "invalid" : null,
    ),
    [command, setCommand] = useState({ id: 0, action: "reset" }),
    [ready, setReady] = useState<boolean | null>(null),
    [active, setActive] = useState(false),
    [pressed, setPressed] = useState(new Set<string>()),
    [tested, setTested] = useState(new Set<string>()),
    [typed, setTyped] = useState(""),
    [share, setShare] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    field = useRef<HTMLTextAreaElement>(null),
    trigger = useRef<HTMLElement | null>(null),
    file = useRef<HTMLInputElement>(null),
    pulse = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keys = keysFor(config.layout),
    info = INFO[config.layout];
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const d = dialog.current;
    if (panel) {
      trigger.current = document.activeElement as HTMLElement;
      d?.showModal();
    } else {
      d?.close();
      setActive(false);
      setTyped("");
      setPressed(new Set());
      trigger.current?.focus();
    }
  }, [panel]);
  useEffect(
    () => () => {
      if (pulse.current) clearTimeout(pulse.current);
    },
    [],
  );
  const update = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setShare("");
    if (key === "layout") {
      setTested(new Set());
      setPressed(new Set());
    }
  };
  const cmd = (action: string) => setCommand((c) => ({ id: c.id + 1, action }));
  const apply = (c: Config) => {
    setConfig(c);
    setTested(new Set());
    setShare("");
    setTyped("");
  };
  const storage = (action: "save" | "restore" | "forget") => {
    try {
      if (action === "save") {
        localStorage.setItem("keyform.build.v1", JSON.stringify(config));
        setStatus("saved");
      } else if (action === "forget") {
        localStorage.removeItem("keyform.build.v1");
        setStatus("removed");
      } else {
        const v = localStorage.getItem("keyform.build.v1");
        if (v) {
          apply(parseJSON(v));
          setStatus("restored");
        } else setStatus("missing");
      }
    } catch {
      setStatus("storage");
    }
  };
  const download = (content: string, ext: string) => {
    const u = URL.createObjectURL(
      new Blob([content], {
        type: ext === "json" ? "application/json" : "text/plain;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = `keyform-${config.layout}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  const link = async () => {
    const url = toURL(config, location.href);
    setShare(url);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("copyfail");
    }
  };
  const onScreenKey = (code: string) => {
    setTested((s) => new Set(s).add(code));
    setPressed(new Set([code]));
    if (pulse.current) clearTimeout(pulse.current);
    pulse.current = setTimeout(() => setPressed(new Set()), 180);
  };
  const options = (name: "finish" | "caps") => (
    <div className="swatches" role="group" aria-label={t(name)}>
      {OPTIONS[name].map((v) => (
        <button
          key={v}
          className={"swatch " + (config[name] === v ? "selected" : "")}
          aria-label={t(v)}
          aria-pressed={config[name] === v}
          title={t(v)}
          onClick={() => update(name, v)}
          style={
            {
              "--swatch":
                name === "finish"
                  ? CASE_COLORS[v as keyof typeof CASE_COLORS]
                  : CAP_COLORS[v as keyof typeof CAP_COLORS][0],
            } as React.CSSProperties
          }
        >
          {config[name] === v ? "✓" : ""}
        </button>
      ))}
      <span className="choice-label">{t(config[name])}</span>
    </div>
  );
  const close = () => setPanel(null);
  return (
    <div className="app">
      <header>
        <a className="brand" href={location.pathname} aria-label="Keyform">
          <span className="brand-mark">k</span>keyform
          <span className="brand-dot">°</span>
        </a>
        <span className="header-note">{t("studio")} / 001</span>
        <div className="header-actions">
          <button
            className="language"
            aria-label={
              lang === "ru" ? "Switch to English" : "Переключить на русский"
            }
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>
          <button className="button dark" onClick={() => setPanel("build")}>
            {t("build")} <span>↗</span>
          </button>
        </div>
      </header>
      <main>
        <section
          className={"workspace " + (ready === false ? "without-webgl" : "")}
          aria-label={t("studio")}
        >
          <div className="hero-caption">
            <div className="eyebrow">
              <span className="dot" /> KEYFORM / {info.name}
            </div>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <div className="model-label">
            <span>0{OPTIONS.layout.indexOf(config.layout) + 1}</span>
            <strong>{info.name}</strong>
            <small>
              {keys.length} {t("keys")}
              <br />
              {info.width} × {info.depth} mm
            </small>
          </div>
          <Suspense
            fallback={
              <div className="scene-message" role="status">
                {t("loading")}
              </div>
            }
          >
            <KeyboardScene
              config={config}
              explode={explode}
              part={part}
              onPart={setPart}
              pressed={pressed}
              command={command}
              lang={lang}
              onReady={setReady}
            />
          </Suspense>
          <div className="stage-tools">
            <div className="pill segmentation">
              <button
                className={explode === 0 ? "active" : ""}
                onClick={() => setExplode(0)}
              >
                {t("assembled")}
              </button>
              <button
                className={explode > 0 ? "active" : ""}
                onClick={() => setExplode(100)}
              >
                {t("exploded")}
              </button>
            </div>
            <button
              className="icon-button"
              title={t("reset")}
              aria-label={t("reset")}
              onClick={() => {
                cmd("reset");
                setExplode(0);
                setPart(null);
              }}
            >
              ↺
            </button>
          </div>
          <div
            className="camera-tools"
            aria-label={lang === "ru" ? "Камера" : "Camera"}
          >
            <button
              aria-label={lang === "ru" ? "Повернуть влево" : "Rotate left"}
              onClick={() => cmd("left")}
            >
              ↶
            </button>
            <button
              aria-label={lang === "ru" ? "Повернуть вправо" : "Rotate right"}
              onClick={() => cmd("right")}
            >
              ↷
            </button>
            <button
              aria-label={lang === "ru" ? "Приблизить" : "Zoom in"}
              onClick={() => cmd("in")}
            >
              +
            </button>
            <button
              aria-label={lang === "ru" ? "Отдалить" : "Zoom out"}
              onClick={() => cmd("out")}
            >
              −
            </button>
            <button
              aria-label={lang === "ru" ? "Вид сверху" : "Top view"}
              onClick={() => cmd("top")}
            >
              ⊞
            </button>
          </div>
          <div className="stage-bottom">
            <span className="drag-hint">⤧ &nbsp; {t("drag")}</span>
            <button className="text-button" onClick={() => setPanel("test")}>
              ⌨ &nbsp; {t("test")} <span>↗</span>
            </button>
          </div>
          {part && (
            <aside className="part-info">
              <div>
                <span className="eyebrow">
                  0{PARTS.indexOf(part) + 1} / {t("parts")}
                </span>
                <h3>{PART_INFO[part][lang][0]}</h3>
                <p>{PART_INFO[part][lang][1]}</p>
              </div>
              <button
                className="icon-button"
                aria-label={t("close")}
                onClick={() => setPart(null)}
              >
                ×
              </button>
            </aside>
          )}
        </section>
        <section className="configuration" aria-label={t("selected")}>
          <div className="config-group layout-group">
            <div className="group-title">
              <span>01</span>
              <h2>{t("layout")}</h2>
            </div>
            <div className="layout-options">
              {OPTIONS.layout.map((v) => (
                <button
                  key={v}
                  aria-pressed={config.layout === v}
                  className={config.layout === v ? "selected" : ""}
                  onClick={() => update("layout", v)}
                >
                  {INFO[v].name}
                </button>
              ))}
            </div>
            <button className="subtle-link" onClick={() => setPanel("compare")}>
              {t("compare")} ↗
            </button>
          </div>
          <div className="config-group">
            <div className="group-title">
              <span>02</span>
              <h2>{t("finish")}</h2>
            </div>
            {options("finish")}
            <select
              aria-label={lang === "ru" ? "Материал корпуса" : "Case material"}
              value={config.material}
              onChange={(e) =>
                update("material", e.target.value as Config["material"])
              }
            >
              {OPTIONS.material.map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </div>
          <div className="config-group">
            <div className="group-title">
              <span>03</span>
              <h2>{t("caps")}</h2>
            </div>
            {options("caps")}
            <small>PBT / {lang === "ru" ? "профильные" : "sculpted"}</small>
          </div>
          <div className="config-group switches-group">
            <div className="group-title">
              <span>04</span>
              <h2>{t("switch")}</h2>
            </div>
            <div className="switch-options">
              {OPTIONS.switch.map((v) => (
                <button
                  key={v}
                  title={SWITCH_INFO[v][lang]}
                  aria-pressed={config.switch === v}
                  className={config.switch === v ? "selected" : ""}
                  onClick={() => update("switch", v)}
                >
                  <i className={v} />
                  {t(v)}
                </button>
              ))}
            </div>
            <small>{SWITCH_INFO[config.switch][lang]}</small>
          </div>
        </section>
        <section className="layer-bar">
          <span className="eyebrow">{t("explore")}</span>
          <input
            aria-label={t("explore")}
            type="range"
            min="0"
            max="100"
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
          />
          <div className="part-buttons">
            {PARTS.map((p, i) => (
              <button
                key={p}
                aria-pressed={part === p}
                onClick={() => {
                  setPart(p);
                  setExplode(100);
                }}
              >
                <span>0{i + 1}</span>
                {PART_INFO[p][lang][0]}
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>{t("by")}</span>
        <span>
          {t("concept")} <i>·</i> {t("schematic")}
        </span>
        <span className="render-status">
          <span className="dot" />
          {ready === null ? t("loading") : ready ? t("ready") : "2D mode"}
        </span>
      </footer>
      {status && !panel && (
        <div className="toast" role="status">
          {t(status)}
          <button aria-label={t("close")} onClick={() => setStatus(null)}>
            ×
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-label={panel ? t(panel) : undefined}
        onCancel={close}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div
          className={"dialog-content " + (panel === "test" ? "test-panel" : "")}
        >
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">KEYFORM / STUDIO</span>
              <h2>{panel ? t(panel) : ""}</h2>
            </div>
            <button
              className="icon-button"
              aria-label={t("close")}
              onClick={close}
            >
              ×
            </button>
          </div>
          {panel === "compare" && (
            <>
              <p>{t("approx")}</p>
              <div className="comparison">
                {OPTIONS.layout.map((l) => (
                  <button
                    key={l}
                    className={
                      "comparison-card " +
                      (config.layout === l ? "selected" : "")
                    }
                    onClick={() => update("layout", l)}
                    aria-pressed={config.layout === l}
                  >
                    <span
                      className="mini-keyboard"
                      style={{
                        width: `${(INFO[l].width / 365) * 100}%`,
                        height: l === "65" ? 55 : 66,
                      }}
                    >
                      {keysFor(l).map((k) => (
                        <i
                          key={k.code}
                          style={{
                            left: `${((k.x - k.w / 2 + 0.2) / 19) * 100}%`,
                            top: `${((k.z + 0.4) / 7.5) * 100}%`,
                            width: `${(k.w / 19) * 92}%`,
                          }}
                        />
                      ))}
                    </span>
                    <strong>
                      {INFO[l].name}
                      <small>
                        {keysFor(l).length} {t("keys")}
                      </small>
                    </strong>
                    <span>
                      {INFO[l].width} × {INFO[l].depth} × 32 mm
                    </span>
                    <p>{INFO[l][lang]}</p>
                  </button>
                ))}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t("layout")}</th>
                    <th>{t("functions")}</th>
                    <th>{t("nav")}</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.layout.map((l) => (
                    <tr key={l}>
                      <th>{INFO[l].name}</th>
                      <td>{t(l === "65" ? "fn" : "yes")}</td>
                      <td>{t(l === "tkl" ? "separate" : "compact")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {panel === "build" && (
            <>
              <div className="build-summary">
                <span className="build-number">{info.name}</span>
                <div>
                  {keys.length} {t("keys")}
                  <br />
                  <small>
                    {info.width} × {info.depth} × 32 mm
                  </small>
                </div>
              </div>
              <dl>
                {(["material", "finish", "caps", "switch"] as const).map(
                  (k) => (
                    <div key={k}>
                      <dt>
                        {k === "material"
                          ? lang === "ru"
                            ? "Материал"
                            : "Material"
                          : t(k)}
                      </dt>
                      <dd>{t(config[k])}</dd>
                    </div>
                  ),
                )}
                <div>
                  <dt>{PART_INFO.plate[lang][0]}</dt>
                  <dd>{t("aluminium")}</dd>
                </div>
                <div>
                  <dt>{PART_INFO.pcb[lang][0]}</dt>
                  <dd>Keyform {info.name} / USB-C</dd>
                </div>
              </dl>
              <p className="fine-print">{t("notice")}</p>
              <div className="build-actions">
                <button
                  className="button dark"
                  onClick={() =>
                    download(JSON.stringify(config, null, 2), "json")
                  }
                >
                  {t("export")} ↓
                </button>
                <button
                  className="button"
                  onClick={() => download(buildSheet(config, lang), "txt")}
                >
                  {t("text")} ↓
                </button>
                <button
                  className="button"
                  onClick={() => file.current?.click()}
                >
                  {t("import")} ↑
                </button>
                <button className="button" onClick={link}>
                  {t("link")} ↗
                </button>
              </div>
              <input
                hidden
                ref={file}
                type="file"
                accept=".json,application/json"
                aria-label={t("import")}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (f.size > 4096) throw Error();
                    apply(parseJSON(await f.text()));
                    setStatus("imported");
                  } catch {
                    setStatus("invalid");
                  }
                  e.target.value = "";
                }}
              />
              {share && (
                <input
                  className="share-field"
                  readOnly
                  aria-label={t("link")}
                  value={share}
                  onFocus={(e) => e.target.select()}
                />
              )}
              <div className="local-actions">
                <button onClick={() => storage("save")}>{t("save")}</button>
                <button onClick={() => storage("restore")}>
                  {t("restore")}
                </button>
                <button onClick={() => storage("forget")}>{t("forget")}</button>
              </div>
              <p className="fine-print">{t("notStored")}</p>
            </>
          )}
          {panel === "test" && (
            <>
              <p>{t("testHint")}</p>
              <div
                className="test-board"
                style={{ aspectRatio: config.layout === "tkl" ? "2.8" : "2.5" }}
              >
                {keys.map((k) => (
                  <button
                    key={k.code}
                    className={
                      (pressed.has(k.code) ? "pressed " : "") +
                      (tested.has(k.code) ? "tested" : "")
                    }
                    style={{
                      left: `${((k.x - k.w / 2 + 0.3) / (config.layout === "tkl" ? 19.2 : 16.7)) * 100}%`,
                      top: `${((k.z + 0.3) / (config.layout === "65" ? 5.6 : 7)) * 100}%`,
                      width: `${((k.w - 0.1) / (config.layout === "tkl" ? 19.2 : 16.7)) * 100}%`,
                      height: `${(0.87 / (config.layout === "65" ? 5.6 : 7)) * 100}%`,
                    }}
                    onClick={() => onScreenKey(k.code)}
                    aria-label={k.code}
                  >
                    {k.label || "space"}
                  </button>
                ))}
              </div>
              <div className="test-controls">
                <span data-testid="tested-count">
                  {tested.size} / {keys.length} {t("tested")}
                </span>
                <button
                  className="subtle-link"
                  onClick={() => {
                    setTested(new Set());
                    setPressed(new Set());
                    setTyped("");
                  }}
                >
                  {t("clear")}
                </button>
              </div>
              <button
                className={"button " + (active ? "" : "dark")}
                onClick={() => {
                  if (active) {
                    setActive(false);
                    setPressed(new Set());
                    field.current?.blur();
                  } else {
                    setActive(true);
                    requestAnimationFrame(() => field.current?.focus());
                  }
                }}
              >
                {active ? t("stop") : t("activate")}
              </button>
              <textarea
                ref={field}
                disabled={!active}
                aria-label={
                  lang === "ru"
                    ? "Поле теста клавиатуры"
                    : "Keyboard test field"
                }
                placeholder={t("placeholder")}
                value={typed}
                onChange={(e) => setTyped(e.target.value.slice(-500))}
                onBlur={() => {
                  setActive(false);
                  setPressed(new Set());
                }}
                onKeyDown={(e) => {
                  if (!active) return;
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(false);
                    setPressed(new Set());
                    field.current?.blur();
                    return;
                  }
                  if (keys.some((k) => k.code === e.code)) {
                    setTested((s) => new Set(s).add(e.code));
                    setPressed((s) => new Set(s).add(e.code));
                  }
                  if (e.key.startsWith("F") && /^F\d+$/.test(e.key))
                    e.preventDefault();
                }}
                onKeyUp={(e) =>
                  setPressed((s) => {
                    const n = new Set(s);
                    n.delete(e.code);
                    return n;
                  })
                }
              />
              <p className="fine-print">
                {t("privacy")} {t("testScope")}
              </p>
            </>
          )}
          {status && (
            <div className="inline-status" role="status">
              {t(status)}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
