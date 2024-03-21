import * as App from '../App';
import * as SDK from '@remnote/plugin-sdk';
import * as React from 'react';
import _ from 'lodash';

interface RichTextProps {
    readonly richText?: SDK.RichTextInterface;
    readonly defaultValue?: string | React.JSX.Element;
}

export function RichText({ richText, defaultValue }: RichTextProps) {
    const plugin = SDK.usePlugin();
    const spanRef = React.useRef<HTMLSpanElement>(null);

    const html =
        SDK.useRunAsync(async () => {
            if (_.isUndefined(richText)) return '';
            const html = await App.richTextToHtml(plugin, richText);
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
        }, [plugin, richText]) ?? '';

    React.useEffect(() => {
        const span = spanRef.current;
        if (_.isNull(span)) return;

        const handleClickOnAnchor = _.memoize((remId: string) => async () => {
            const rem = await plugin.rem.findOne(remId);
            if (_.isUndefined(rem)) return;
            await rem.openRemAsPage();
        });

        _.forEach(span.querySelectorAll('a[isRemReference="true"]'), (a) => {
            const remId = a.getAttribute('data-rem-id');
            if (_.isNull(remId)) return;
            a.addEventListener('click', handleClickOnAnchor(remId));
        });

        return () => {
            _.forEach(span.querySelectorAll('a[isRemReference="true"]'), (a) => {
                const remId = a.getAttribute('data-rem-id');
                if (_.isNull(remId)) return;
                a.removeEventListener('click', handleClickOnAnchor(remId));
            });
        };
    }, [html]);

    if (_.isUndefined(richText)) return <span>{defaultValue}</span>;
    else if (_.isEmpty(html.trim())) return <span>{defaultValue}</span>;
    else return <span ref={spanRef} dangerouslySetInnerHTML={{ __html: html }}></span>;
}
