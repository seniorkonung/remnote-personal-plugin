import * as SDK from '@remnote/plugin-sdk';
import * as Utils from './Utils';
import _ from 'lodash';
import FP from 'lodash/fp';

export const getReferencedRemsFromRichText = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<(SDK.Rem | undefined)[]> => {
    return _.asyncMap(
        await plugin.richText.getRemIdsFromRichText(richText ?? []),
        plugin.rem.findOne
    );
};

export const richTextToHtml = async (
    plugin: SDK.RNPlugin,
    rawRichText?: SDK.RichTextInterface
): Promise<string> => {
    const richText = rawRichText?.flatMap((richElement) => {
        const textOfDeletedRem = _.block(() => {
            if (_.isObject(richElement) === false) return;
            if ('textOfDeletedRem' in richElement === false) return;
            return richElement.textOfDeletedRem;
        });
        if (_.isUndefined(textOfDeletedRem)) return richElement;
        else
            return [
                '🗑️ | ',
                ...(_.last(
                    Utils.splitArray(textOfDeletedRem, (x) => _.isString(x) && x.trim() === '|')
                ) ?? []),
            ];
    });
    await getReferencedRemsFromRichText(plugin, richText);
    return await plugin.richText.toHTML(richText ?? []);
};

const extractTextFromHtml = (html: string): string => {
    const node = _.block(() => {
        const node = document.createElement('div');
        node.innerHTML = html;
        return node;
    });
    return node.innerText;
};

export const richTextToString = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<string> => {
    return extractTextFromHtml(await richTextToHtml(plugin, richText));
};

export interface Filter {
    (plugin: SDK.RNPlugin, rem: SDK.Rem): Promise<boolean>;
}

export const getRems = async (
    plugin: SDK.RNPlugin,
    rem: SDK.Rem,
    ...filters: Filter[]
): Promise<SDK.Rem[]> => {
    if (_.isEmpty(filters)) return [rem];
    const [filter, ...tailFilters] = filters;

    const filteredRem = await _.block(async () => {
        const childrenRem = await rem.getChildrenRem();
        return _.asyncMap(childrenRem, async (rem) => {
            return { rem, isFiltered: await filter(plugin, rem) };
        }).then((a) => {
            return a.filter(({ isFiltered }) => isFiltered).map(({ rem }) => rem);
        });
    });

    return _.asyncMap(filteredRem, (rem) => getRems(plugin, rem, ...tailFilters)).then((arr) => {
        return arr.reduce((res, rems) => {
            return res.concat(rems);
        }, []);
    });
};

export const includesStringInRem =
    (searchString: string): Filter =>
    async (plugin, rem) => {
        if (_.isUndefined(rem.text)) return false;
        const html = await richTextToString(plugin, rem.text);
        return html.includes(searchString);
    };

export const hasTagInRem =
    (tagName: string): Filter =>
    async (plugin, rem) => {
        const tags = await rem.getTagRems();
        return _.asyncMap(tags, async (rem) => {
            const name = await richTextToString(plugin, rem.text);
            return name.includes(tagName);
        }).then(FP.includes(true));
    };

export const getBulletIcon = async (
    plugin: SDK.RNPlugin,
    rem: SDK.Rem
): Promise<string | undefined> => {
    const iconRem = await getRems(plugin, rem, async (plugin, rem) => {
        const text = await richTextToString(plugin, rem.text);
        return text.includes('Bullet Icon');
    }).then(_.head);

    if (_.isUndefined(iconRem)) return;
    else return richTextToString(plugin, iconRem.backText);
};

export type Color = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
export const stringToColor = (str: string): Color | undefined => {
    switch (str) {
        case 'red':
            return str;
        case 'orange':
            return str;
        case 'yellow':
            return str;
        case 'green':
            return str;
        case 'blue':
            return str;
        case 'purple':
            return str;
        default:
            return;
    }
};

export const getHighlightColor = async (rem: SDK.Rem): Promise<Color | undefined> => {
    const color = _.toLower(await rem?.getHighlightColor());
    return stringToColor(color);
};

export const richTextToEmbeddedHtml = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<string> => {
    if (_.isUndefined(richText)) return '';

    const html = await richTextToHtml(plugin, richText);
    const remsInfo = await _.asyncMap(
        await plugin.richText.getRemIdsFromRichText(richText),
        async (id) => {
            const rem = await plugin.rem.findOne(id);
            if (_.isUndefined(rem)) return { id };
            else
                return {
                    id,
                    color: await getHighlightColor(rem),
                    icon: await getBulletIcon(plugin, rem),
                };
        }
    );

    const node = document.createElement('div');
    node.innerHTML = html;

    _.forEach(node.querySelectorAll('a[isRemReference="true"]'), (a, i) => {
        if (a instanceof HTMLAnchorElement === false) return;

        const color = remsInfo.at(i)?.color;
        if (_.isNotUndefined(color)) {
            a.style.padding = '0.1em 0.3em';
            a.style.borderRadius = '0.3em';
            a.classList.add(`highlight-color--${color}`);
            a.classList.add('rn-clr-content-primary');
        } else {
            a.classList.add('text-blue-60');
        }
        a.classList.add('cursor-pointer');

        const icon = remsInfo.at(i)?.icon;
        if (_.isNotUndefined(icon)) {
            a.innerHTML = `<span>${icon}&nbsp;</span>` + a.innerHTML;
        }

        a.removeAttribute('href');
        a.setAttribute('data-rem-id', remsInfo.at(i)?.id ?? '');
    });

    return node.innerHTML;
};

export const getDailyDoc = async (
    plugin: SDK.RNPlugin,
    day: Date
): Promise<SDK.Rem | undefined> => {
    const dailyPowerup = await plugin.powerup.getPowerupByCode(
        SDK.BuiltInPowerupCodes.DailyDocument
    );
    return plugin.rem.findByName([Utils.formatDateWithOrdinal(day)], dailyPowerup?._id ?? null);
};

export const prevDailyDoc = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<SDK.Rem | undefined> => {
    const dailyDocName = await richTextToString(plugin, dailyRem.text);
    const dateOfDay = Utils.convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return;

    const dateOfPrevDay = new Date(
        dateOfDay.getFullYear(),
        dateOfDay.getMonth(),
        dateOfDay.getDate() - 1
    );
    const dailyPowerup = await plugin.powerup.getPowerupByCode(
        SDK.BuiltInPowerupCodes.DailyDocument
    );

    return plugin.rem.findByName(
        [Utils.formatDateWithOrdinal(dateOfPrevDay)],
        dailyPowerup?._id ?? null
    );
};
