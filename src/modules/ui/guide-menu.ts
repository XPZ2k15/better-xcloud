import { BxEvent } from "@/utils/bx-event";
import { AppInterface, STATES } from "@/utils/global";
import { createButton, ButtonStyle, CE } from "@/utils/html";
import { t } from "@/utils/translation";
import { SettingsNavigationDialog } from "./dialog/settings-dialog";

export enum GuideMenuTab {
    HOME = 'home',
}

export class GuideMenu {
    static #BUTTONS = {
        scriptSettings: createButton({
            label: t('better-xcloud'),
            style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE | ButtonStyle.PRIMARY,
            onClick: e => {
                // Wait until the Guide dialog is closed
                window.addEventListener(BxEvent.XCLOUD_DIALOG_DISMISSED, e => {
                    setTimeout(() => SettingsNavigationDialog.getInstance().show(), 50);
                }, {once: true});

                // Close all xCloud's dialogs
                window.BX_EXPOSED.dialogRoutes.closeAll();
            },
        }),

        appSettings: createButton({
            label: t('app-settings'),
            style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE,
            onClick: e => {
                // Close all xCloud's dialogs
                window.BX_EXPOSED.dialogRoutes.closeAll();

                AppInterface.openAppSettings && AppInterface.openAppSettings();
            },
        }),

        closeApp: createButton({
            label: t('close-app'),
            style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE | ButtonStyle.DANGER,
            onClick: e => {
                AppInterface.closeApp();
            },
        }),

        reloadPage: createButton({
            label: t('reload-page'),
            style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE,
            onClick: e => {
                if (STATES.isPlaying) {
                    confirm(t('confirm-reload-stream')) && window.location.reload();
                } else {
                    window.location.reload();
                }

                // Close all xCloud's dialogs
                window.BX_EXPOSED.dialogRoutes.closeAll();
            },
        }),

        backToHome: createButton({
            label: t('back-to-home'),
            style: ButtonStyle.FULL_WIDTH | ButtonStyle.FOCUSABLE,
            onClick: e => {
                confirm(t('back-to-home-confirm')) && (window.location.href = window.location.href.substring(0, 31));
            },
        }),
    }

    static #renderButtons(buttons: HTMLElement[]) {
        const $div = CE('div', {});

        for (const $button of buttons) {
            $div.appendChild($button);
        }

        return $div;
    }

    static #injectHome($root: HTMLElement) {
        // Find the last divider
        const $dividers = $root.querySelectorAll('div[class*=Divider-module__divider]');
        if (!$dividers) {
            return;
        }

        const buttons: HTMLElement[] = [];

        // "Better xCloud" button
        buttons.push(GuideMenu.#BUTTONS.scriptSettings);

        // "App settings" button
        AppInterface && buttons.push(GuideMenu.#BUTTONS.appSettings);

        // "Reload page" button
        buttons.push(GuideMenu.#BUTTONS.reloadPage);

        // "Close app" buttons
        AppInterface && buttons.push(GuideMenu.#BUTTONS.closeApp);

        const $buttons = GuideMenu.#renderButtons(buttons);

        const $lastDivider = $dividers[$dividers.length - 1];
        $lastDivider.insertAdjacentElement('afterend', $buttons);
    }

    static #injectHomePlaying($root: HTMLElement) {
        const $btnQuit = $root.querySelector('a[class*=QuitGameButton]');
        if (!$btnQuit) {
            return;
        }

        const buttons: HTMLElement[] = [];

        buttons.push(GuideMenu.#BUTTONS.scriptSettings);
        AppInterface && buttons.push(GuideMenu.#BUTTONS.appSettings);

        // Reload page
        buttons.push(GuideMenu.#BUTTONS.reloadPage);

        // Back to home
        buttons.push(GuideMenu.#BUTTONS.backToHome);

        const $buttons = GuideMenu.#renderButtons(buttons);
        $btnQuit.insertAdjacentElement('afterend', $buttons);

        // Hide xCloud's Home button
        const $btnXcloudHome = $root.querySelector('div[class^=HomeButtonWithDivider]') as HTMLElement;
        $btnXcloudHome && ($btnXcloudHome.style.display = 'none');
    }

    static async #onShown(e: Event) {
        const where = (e as any).where as GuideMenuTab;

        if (where === GuideMenuTab.HOME) {
            const $root = document.querySelector('#gamepass-dialog-root div[role=dialog] div[role=tabpanel] div[class*=HomeLandingPage]') as HTMLElement;
            if ($root) {
                if (STATES.isPlaying) {
                    GuideMenu.#injectHomePlaying($root);
                } else {
                    GuideMenu.#injectHome($root);
                }
            }
        }
    }

    static observe() {
        window.addEventListener(BxEvent.XCLOUD_GUIDE_MENU_SHOWN, GuideMenu.#onShown);
    }
}
