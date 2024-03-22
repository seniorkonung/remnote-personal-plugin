import * as App from './App';
import * as SDK from '@remnote/plugin-sdk';
import _ from 'lodash';

export const richTextToEmbeddedHtml = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<string> => {
    if (_.isUndefined(richText)) return '';

    const ids = await plugin.richText.getRemIdsFromRichText(richText ?? []);
    await _.asyncMap(ids, plugin.rem.findOne);
    const html = await plugin.richText.toHTML(richText ?? []);

    const remsInfo = await _.asyncMap(
        await plugin.richText.deepGetRemIdsFromRichText(richText),
        async (id) => {
            const rem = await plugin.rem.findOne(id);
            return {
                id,
                color: await rem?.getHighlightColor(),
                icon: await _.block(async () => {
                    if (_.isUndefined(rem)) return;

                    const iconRem = await App.getRems(plugin, rem, async (plugin, rem) => {
                        const text = await App.richTextToString(plugin, rem.text);
                        return text.includes('Bullet Icon');
                    }).then(_.head);

                    if (_.isUndefined(iconRem)) return;
                    else return App.richTextToString(plugin, iconRem.backText);
                }),
            };
        }
    );

    const node = document.createElement('div');
    node.innerHTML = html;

    _.forEach(node.querySelectorAll('a[isRemReference="true"]'), (a, i) => {
        if (a instanceof HTMLAnchorElement === false) return;

        const color = remsInfo.at(i)?.color;
        a.style.color = _.block(() => {
            if (_.isUndefined(color)) return '#7c6efa';
            else if (['Blue', 'Purple'].includes(color)) return 'white';
            else return 'black';
        });
        a.style.cursor = 'pointer';
        a.style.textDecoration = 'underline';
        a.style.textUnderlineOffset = '2px';

        if (_.isNotUndefined(color)) {
            a.style.padding = '0.1em 0.3em';
            a.style.borderRadius = '0.3em';
            a.style.backgroundColor = remsInfo.at(i)?.color ?? '';
        }

        const icon = remsInfo.at(i)?.icon;
        if (_.isNotUndefined(icon)) {
            a.innerHTML = `<span>${icon}</span>` + '&nbsp;&nbsp;' + a.innerHTML;
        }

        a.removeAttribute('href');
        a.setAttribute('data-rem-id', remsInfo.at(i)?.id ?? '');
    });

    return node.innerHTML;
};
