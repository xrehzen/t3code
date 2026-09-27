import { describe, expect, it, vi } from "vite-plus/test";
import { enMessages, type MessageKey } from "./en.ts";
import { trMessages } from "./tr.ts";
import {
  createI18n,
  DEFAULT_LOCALE,
  type MessageTables,
  normalizeForSearch,
  resolveLocale,
} from "./index.ts";

describe("resolveLocale", () => {
  it("maps the locale shapes that actually reach the app", () => {
    // `app.getSystemLocale()` returns the POSIX form, Intl returns the BCP-47 form,
    // and navigator.language can arrive with any casing.
    expect(resolveLocale("tr_TR")).toBe("tr");
    expect(resolveLocale("tr-TR")).toBe("tr");
    expect(resolveLocale("TR")).toBe("tr");
    expect(resolveLocale("tr")).toBe("tr");
    expect(resolveLocale("en_US")).toBe("en");
    expect(resolveLocale("en-GB")).toBe("en");
  });

  it("falls back to English for a locale we do not ship", () => {
    expect(resolveLocale("de_DE")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});

describe("message resolution", () => {
  it("reads the active catalog", () => {
    expect(createI18n("tr").t("action.save")).toBe("Kaydet");
    expect(createI18n("en").t("action.save")).toBe("Save");
  });

  it("falls back to English for a key the active locale omits", () => {
    // A partial catalog is the normal state of a translation in progress, and it
    // is also how a downstream fork ships a small patch without editing source.
    const partial: MessageTables = { en: enMessages, tr: {} };
    const instance = createI18n("tr", partial);

    expect(instance.t("action.save")).toBe("Save");
  });

  it("returns the raw key when no catalog has it, so rendering never throws", () => {
    const empty: MessageTables = { en: {}, tr: {} };
    const missing = "action.thisKeyDoesNotExist" as MessageKey;

    expect(createI18n("tr", empty).t(missing)).toBe(missing);
  });

  it("interpolates slots into a single pattern", () => {
    const instance = createI18n("en");

    expect(instance.t("contextWindow.usedTokens", { count: 4096 })).toBe(
      "Context window 4096 tokens used",
    );
    expect(
      instance.t("desktop.startup.failedDetail", { stage: "boot", message: "boom", detail: "" }),
    ).toBe("Stage: boot\nboom");
  });

  it("leaves a slot alone when the caller does not supply it", () => {
    // Better a visible `{count}` than a crash or a silently wrong number.
    expect(createI18n("en").t("contextWindow.used", {})).toBe("Context window {count} used");
  });
});

describe("normalizeForSearch", () => {
  it("folds dotted and dotless I correctly under Turkish", () => {
    // The trap this exists for: under a Turkish locale a plain `toLowerCase()`
    // turns "I" into "i", where Turkish readers expect "ı". Identifiers and
    // command labels are authored in English, so folding them with the naive
    // call makes them unmatchable.
    expect(normalizeForSearch("NOT_LOGGED_IN", "tr")).toBe("not_logged_ın");
    expect(normalizeForSearch("NOT_LOGGED_IN", "tr")).not.toBe("NOT_LOGGED_IN".toLowerCase());
    expect(normalizeForSearch("I", "tr")).toBe("ı");
    // "İ" lowercases to a single "i" in Turkish but to "i" + combining dot elsewhere.
    expect(normalizeForSearch("İstanbul", "tr")).toBe("istanbul");
    expect(normalizeForSearch("İstanbul", "en")).not.toBe(normalizeForSearch("İstanbul", "tr"));
  });

  it("matches plain toLowerCase under English", () => {
    for (const sample of ["Failed to connect", "NOT_LOGGED_IN", "İstanbul"]) {
      expect(normalizeForSearch(sample, "en")).toBe(sample.toLowerCase());
    }
  });
});

describe("locale switching", () => {
  it("notifies subscribers only when the locale actually changes", () => {
    const instance = createI18n("en");
    const listener = vi.fn();
    const unsubscribe = instance.subscribe(listener);

    instance.setLocale("en");
    expect(listener).not.toHaveBeenCalled();

    instance.setLocale("tr");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(instance.t("action.cancel")).toBe("İptal");

    unsubscribe();
    instance.setLocale("en");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("catalog coverage", () => {
  it("keeps every English key translated in Turkish", () => {
    // Guards against an English string being added and silently shipping untranslated.
    const missing = (Object.keys(enMessages) as MessageKey[]).filter(
      (key) => trMessages[key] === undefined,
    );

    expect(missing).toEqual([]);
  });

  it("keeps the same interpolation slots in both catalogs", () => {
    const slots = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const mismatched = (Object.keys(enMessages) as MessageKey[]).filter((key) => {
      const translated = trMessages[key];
      return translated !== undefined && slots(translated).join() !== slots(enMessages[key]).join();
    });

    expect(mismatched).toEqual([]);
  });

  it("introduces no catalog key that English does not define", () => {
    const extra = (Object.keys(trMessages) as MessageKey[]).filter(
      (key) => enMessages[key] === undefined,
    );

    expect(extra).toEqual([]);
  });
});
