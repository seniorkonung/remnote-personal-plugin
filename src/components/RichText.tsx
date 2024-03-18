import * as App from '../App';
import * as SDK from '@remnote/plugin-sdk';
import * as React from 'react';
import _ from 'lodash';

interface RichTextProps {
    readonly richText?: SDK.RichTextInterface;
}

export function RichText({ richText }: RichTextProps) {
    if (_.isUndefined(richText)) return <span></span>;

    const plugin = SDK.usePlugin();
    const spanRef = React.useRef<HTMLSpanElement>(null);

    const html =
        SDK.useRunAsync(async () => {
            const html = await App.richTextToHtml(plugin, richText);
            const remsInfo = await _.asyncMap(
                await plugin.richText.deepGetRemIdsFromRichText(richText),
                async (id) => {
                    const rem = await plugin.rem.findOne(id);
                    const color = await rem?.getHighlightColor();
                    return {
                        id,
                        color,
                    };
                }
            );

            const node = document.createElement('div');
            node.innerHTML = html;

            _.forEach(node.querySelectorAll('a[isRemReference="true"]'), (a, i) => {
                if (a instanceof HTMLAnchorElement === false) return;
                a.style.color = _.block(() => {
                    const color = remsInfo.at(i)?.color
                    if (_.isUndefined(color)) return '#7c6efa'
                    else if (['Blue', 'Purple'].includes(color)) return 'white'
                    else return 'black'
                });
                a.style.cursor = 'pointer';
                a.style.textDecoration = 'underline';
                a.style.textUnderlineOffset = '2px';
                a.style.padding = '0.1em 0.3em';
                a.style.borderRadius = '0.3em'
                a.style.backgroundColor = remsInfo.at(i)?.color ?? ''
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
            handleClickOnAnchor(remId);
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

    return <span ref={spanRef} dangerouslySetInnerHTML={{ __html: html }}></span>;
}
