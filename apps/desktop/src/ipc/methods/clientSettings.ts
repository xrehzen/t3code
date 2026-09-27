import { ClientSettingsSchema } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

import * as ElectronApp from "../../electron/ElectronApp.ts";
import * as DesktopClientSettings from "../../settings/DesktopClientSettings.ts";
import { applyInterfaceLanguage } from "../../settings/DesktopInterfaceLanguage.ts";
import * as DesktopSnapShot from "../../snapShot/DesktopSnapShot.ts";
import * as IpcChannels from "../channels.ts";
import * as DesktopIpc from "../DesktopIpc.ts";

export const getClientSettings = DesktopIpc.makeIpcMethod({
  channel: IpcChannels.GET_CLIENT_SETTINGS_CHANNEL,
  payload: Schema.Void,
  result: Schema.NullOr(ClientSettingsSchema),
  handler: Effect.fn("desktop.ipc.clientSettings.get")(function* () {
    const clientSettings = yield* DesktopClientSettings.DesktopClientSettings;
    return Option.getOrNull(yield* clientSettings.get);
  }),
});

export const setClientSettings = DesktopIpc.makeIpcMethod({
  channel: IpcChannels.SET_CLIENT_SETTINGS_CHANNEL,
  payload: ClientSettingsSchema,
  result: Schema.Void,
  handler: Effect.fn("desktop.ipc.clientSettings.set")(function* (settings) {
    const clientSettings = yield* DesktopClientSettings.DesktopClientSettings;
    const snapShot = yield* DesktopSnapShot.DesktopSnapShot;
    const electronApp = yield* ElectronApp.ElectronApp;
    yield* clientSettings.set(settings);
    yield* snapShot.configure(settings);
    // The main process holds its own copy of the message catalog, so a
    // language change has to be applied here as well or the native menus keep
    // rendering the previous language while the window is already Turkish.
    applyInterfaceLanguage(settings.interfaceLanguage, yield* electronApp.systemLocale);
  }),
});
