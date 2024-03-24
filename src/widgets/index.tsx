import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import '../styles/style.css';

const TOTALS_POWERUP = 'totals_powerup';

const EventQueueCompleteCard = _.once((plugin: SDK.RNPlugin) => {
    return {
        eventId: SDK.AppEvents.QueueCompleteCard,
        listenerKey: undefined,
        handler: function () {
            App.incrementRitualFlashcards(plugin);
        },
    };
});

async function onActivate(plugin: SDK.ReactRNPlugin) {
    await plugin.app.registerPowerup({
        code: TOTALS_POWERUP,
        name: 'Итоги',
        description: '',
        options: {
            properties: [],
        },
    });

    const totalsPowerup = await plugin.powerup.getPowerupByCode(TOTALS_POWERUP);
    if (_.isUndefined(totalsPowerup)) return;

    const mainTotalsRem = await _.block(async () => {
        const children = await totalsPowerup?.getChildrenRem();
        if (_.isNotUndefined(children) && children.length > 0) return children[0];

        const mainRem = await plugin.rem.createRem();
        if (_.isUndefined(mainRem)) return;

        await mainRem.setParent(totalsPowerup ?? null);
        return mainRem;
    });
    if (_.isUndefined(mainTotalsRem)) return;

    await plugin.app.registerWidget('totals', SDK.WidgetLocation.UnderRemEditor, {
        remIdFilter: mainTotalsRem._id,
    });

    await plugin.app.registerCSS(
        'Styles for powerup totals',
        `
        div[data-document-id="${totalsPowerup._id}"] #DropToOpenAsDocument { display: none }
        div[data-document-id="${totalsPowerup._id}"] .rn-add-rem-button { display: none }
        div[data-node-id="${mainTotalsRem._id}"], div[data-children-node-id="${mainTotalsRem._id}"] { display: none; }
        div[data-document-id="${totalsPowerup._id}"] #document { max-width: 100% }
        div[data-rem-container-id="${mainTotalsRem._id}"] div:has(> .rn-plugin-root) { height: 82vh; padding-top: 1.5rem }
        div[data-children-node-id="${totalsPowerup._id}"] > div:nth-last-child(2) { display: none }
    `
    );

    await plugin.app.registerSidebarButton({
        id: 'open_totals_widget',
        name: 'Итоги',
        async action() {
            await totalsPowerup.openRemAsPage();
        },
    });

    await plugin.app.registerCommand({
        id: 'remove_empty_child_properties',
        name: 'Удалить пустые дочерние свойства',
        quickCode: 'rmpr',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem();
            if (_.isUndefined(focusedRem)) return;
            await App.removeEmptyChildProperties(plugin, focusedRem);
        },
    });

    await plugin.app.registerCommand({
        id: 'calculate_and_set_quota',
        name: 'Вычислить и установить квоту',
        quickCode: 'quota',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem();
            if (_.isUndefined(focusedRem)) return;
            const dailyRem = await App.findDailyDocInAncestors(focusedRem);
            if (_.isUndefined(dailyRem)) return;
            await App.calculateAndSetQuota(plugin, dailyRem);
        },
    });

    await plugin.app.registerCommand({
        id: 'add_portal_product',
        name: 'Добавить портал на продукты',
        quickCode: 'addp',
        action: async () => {
            const focusedRem = await plugin.focus.getFocusedRem();
            if (_.isUndefined(focusedRem)) return;
            const dailyRem = await App.findDailyDocInAncestors(focusedRem);
            if (_.isUndefined(dailyRem)) return;
            await App.addPortalProduct(plugin, dailyRem);
        },
    });

    plugin.event.addListener(
        EventQueueCompleteCard(plugin).eventId,
        EventQueueCompleteCard(plugin).listenerKey,
        EventQueueCompleteCard(plugin).handler
    );

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
