import { enMessages, type MessageKey } from "./en.ts";
import { trMessages } from "./tr.ts";

/**
 * Message catalogs are resolved through this map, not through a hardcoded
 * conditional, so adding a locale never requires editing lookup logic. The
 * catalogs are statically imported (no runtime JSON fetch, no dynamic import)
 * so the Electron main process and the sandboxed preload bundles can both use
 * this module without an async initialization step.
 */
const catalogs = {
  en: enMessages,
  tr: trMessages,
} as const;

export type SupportedLocale = keyof typeof catalogs;

export const SUPPORTED_LOCALES = Object.keys(catalogs) as SupportedLocale[];

/** English stays the default so an untranslated key is never worse than upstream. */
export const DEFAULT_LOCALE: SupportedLocale = "en";

export type MessageParams = Readonly<Record<string, string | number>>;

/** Signature of the resolver, so non-React helpers can translate too. */
export type Translate = (key: MessageKey, params?: MessageParams) => string;

export interface LocalePresentation {
  /** BCP-47 tag shown in the language picker. */
  readonly tag: string;
  /** Endonym — a language list is read by the person who speaks it. */
  readonly name: string;
}

export const LOCALE_PRESENTATION: Readonly<Record<SupportedLocale, LocalePresentation>> = {
  en: { tag: "en", name: "English" },
  tr: { tag: "tr", name: "Türkçe" },
};

/**
 * Maps a system locale to a supported catalog. Accepts the shapes that arrive
 * from `app.getSystemLocale()`, `Intl.DateTimeFormat().resolvedOptions().locale`,
 * and `navigator.language`, which differ in separator and casing
 * (`tr_TR`, `tr-TR`, `tr`). Unknown locales fall back to {@link DEFAULT_LOCALE}.
 */
export function resolveLocale(systemLocale: string | null | undefined): SupportedLocale {
  if (!systemLocale) return DEFAULT_LOCALE;
  const normalized = systemLocale.toLowerCase().replace(/_/g, "-");
  const exact = SUPPORTED_LOCALES.find((locale) => locale === normalized);
  if (exact) return exact;
  const base = normalized.split("-")[0];
  if (!base) return DEFAULT_LOCALE;
  const byBase = SUPPORTED_LOCALES.find((locale) => locale === base);
  return byBase ?? DEFAULT_LOCALE;
}

/** `i18n.setLocale("tr")` narrows the locale union, so an unknown tag is a type error. */
/**
 * Resolves the stored language preference to a catalog. `system` defers to the
 * host locale, which is the deciding vote for someone who left the preference
 * alone; the stored value is `system` until a setting says otherwise.
 */
export function resolveInterfaceLanguage(
  preference: "system" | SupportedLocale,
  systemLocale: string | null | undefined,
): SupportedLocale {
  return preference === "system" ? resolveLocale(systemLocale) : preference;
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/**
 * Locale-aware search normalization.
 *
 * Turkish (and Azerbaijani) break naive `toLowerCase()` on dotted/dotless I:
 * `"NOT_LOGGED_IN".toLowerCase()` under a Turkish process locale yields
 * `not_logged_ın`, and `"Failed"` becomes `faıled`. Because the app normalizes
 * identifiers with `toLowerCase()` in several places, a Turkish user can end up
 * searching for `faıled` and missing the `Failed` command. Callers that fold
 * text for matching must use this instead.
 */
export function normalizeForSearch(value: string, locale: SupportedLocale): string {
  return value.toLocaleLowerCase(locale);
}

/**
 * One catalog per locale. `en` is total by construction; every other locale may
 * omit keys and inherits them from English.
 */
export type MessageTables = Readonly<Record<SupportedLocale, Partial<Record<MessageKey, string>>>>;

export const defaultTables: MessageTables = catalogs;

export class I18n {
  private _locale: SupportedLocale = DEFAULT_LOCALE;
  private readonly listeners = new Set<() => void>();
  private readonly tables: MessageTables;

  constructor(tables: MessageTables = defaultTables) {
    this.tables = tables;
  }

  /** Current catalog locale. */
  get locale(): SupportedLocale {
    return this._locale;
  }

  /**
   * Resolves a key: active catalog, then English, then the raw key. A missing
   * key is therefore always renderable and never throws, so a partially
   * translated locale degrades instead of blanking the interface.
   */
  t: Translate = (key, params) => {
    const text = this.tables[this._locale][key] ?? enMessages[key] ?? key;
    return params ? interpolate(text, params) : text;
  };

  /** Locale-aware `toLowerCase` — see {@link normalizeForSearch}. */
  normalizeForSearch = (value: string): string => normalizeForSearch(value, this._locale);

  setLocale = (locale: SupportedLocale): void => {
    if (locale === this._locale) return;
    this._locale = locale;
    for (const listener of this.listeners) listener();
  };

  /** Returns the unsubscribe function. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

function interpolate(template: string, params: MessageParams): string {
  let result = template;
  for (const [name, value] of Object.entries(params)) {
    result = result.split(`{${name}}`).join(String(value));
  }
  return result;
}

export function createI18n(
  initialLocale: SupportedLocale = DEFAULT_LOCALE,
  tables: MessageTables = defaultTables,
): I18n {
  const instance = new I18n(tables);
  instance.setLocale(initialLocale);
  return instance;
}

/** Process-wide instance shared by the desktop main process and the web client. */
export const i18n: I18n = createI18n();

export type { MessageKey };
export { enMessages };

/**
 * Locale-aware ordering for user-facing lists.
 *
 * Turkish collation treats dotted and dotless I as a primary difference and
 * orders `ı` before `i`; English orders `i` before `I` before `ı`. Two lists of
 * the same project names therefore came out in a different order depending on
 * whether the UI ran in the desktop shell or a browser, because the default
 * collation follows the host.
 *
 * The comparison options are deliberately left at their defaults. Adding
 * `numeric: true` would order "project-2" before "project-10" rather than after
 * it, and `sensitivity: "base"` would make differently-cased ids compare equal
 * and hand the ordering to a later tie-break. Both are arguably improvements,
 * but they change the list order for an English user, and this is a
 * translation, not a redesign.
 */
export function compareForLocale(
  left: string,
  right: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): number {
  return left.localeCompare(right, locale);
}

export function collatorForLocale(locale: SupportedLocale): (a: string, b: string) => number {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  return (a, b) => collator.compare(a, b);
}
