import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import '../styles/style.css';

const NAVIGATION_POWERUP = 'navigation_powerup';

const EventQueueCompleteCard = _.once((plugin: SDK.RNPlugin) => {
    return {
        eventId: SDK.AppEvents.QueueCompleteCard,
        listenerKey: undefined,
        handler: function () {
            App.incrementRitualFlashcards(plugin);
        },
    }
});

async function onActivate(plugin: SDK.ReactRNPlugin) {
    await plugin.app.registerWidget('totals', SDK.WidgetLocation.Pane, {
        dimensions: { height: 'auto', width: '100%' },
    });

    await plugin.app.registerSidebarButton({
        id: 'open_totals_widget',
        name: 'Итоги',
        async action() {
            await plugin.window.openWidgetInPane('totals');
        },
    });

    await plugin.app.registerPowerup({
        name: 'Навигация',
        code: NAVIGATION_POWERUP,
        description: '',
        options: {
            properties: [],
        },
    });

    await plugin.app.registerSidebarButton({
        id: 'open_navigation_page',
        name: 'Навигация',
        async action() {
            const navigationRem = await plugin.powerup.getPowerupByCode(NAVIGATION_POWERUP);
            await navigationRem?.openRemAsPage();
        },
    });

    await plugin.app.registerCommand({
        id: 'remove_empty_child_properties',
        name: 'Удалить пустые дочерние свойства',
        quickCode: 'rmpr',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem()
            if (_.isUndefined(focusedRem)) return
            await App.removeEmptyChildProperties(plugin, focusedRem)
        }
    })

    await plugin.app.registerCommand({
        id: 'calculate_and_set_quota',
        name: 'Вычислить и установить квоту',
        quickCode: 'quota',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem()
            if (_.isUndefined(focusedRem)) return
            const dailyRem = await App.findDailyDocInAncestors(focusedRem)
            if (_.isUndefined(dailyRem)) return
            await App.calculateAndSetQuota(plugin, dailyRem)
        }
    })

    await plugin.app.registerCommand({
        id: 'add_portal_product',
        name: 'Добавить портал на продукты',
        quickCode: 'addp',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem()
            if (_.isUndefined(focusedRem)) return
            const dailyRem = await App.findDailyDocInAncestors(focusedRem)
            if (_.isUndefined(dailyRem)) return
            await App.addPortalProduct(plugin, dailyRem)
        }
    })

    plugin.event.addListener(
        EventQueueCompleteCard(plugin).eventId,
        EventQueueCompleteCard(plugin).listenerKey,
        EventQueueCompleteCard(plugin).handler
    );

    plugin.onDeactivate

    await plugin.app.toast('Плагин итогов успешно был запущен!');
}

async function onDeactivate(plugin: SDK.ReactRNPlugin) {
    plugin.event.removeListener(
        EventQueueCompleteCard(plugin).eventId,
        EventQueueCompleteCard(plugin).listenerKey,
        EventQueueCompleteCard(plugin).handler
    );
}

SDK.declareIndexPlugin(onActivate, onDeactivate);
