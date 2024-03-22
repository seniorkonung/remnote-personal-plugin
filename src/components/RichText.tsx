import * as App from '../App';
import * as Helpers from '../Helpers';
import * as SDK from '@remnote/plugin-sdk';
import * as React from 'react';
import _ from 'lodash';

interface RichTextProps {
    readonly richText?: SDK.RichTextInterface;
    readonly embededdHtml?: string;
    readonly defaultValue?: string | React.JSX.Element;
}

export function RichText(props: RichTextProps) {
    const plugin = SDK.usePlugin();
    const spanRef = React.useRef<HTMLSpanElement>(null);

    const html =
        App.Hooks.useRunAsync(async () => {
            if (_.isNotUndefined(props.embededdHtml)) return props.embededdHtml;
            else return Helpers.richTextToEmbeddedHtml(plugin, props.richText);
        }, [plugin, props.richText]) ??
        props.embededdHtml ??
        '';

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

    if (_.isEmpty(html.trim())) return <span>{props.defaultValue}</span>;
    else return <span ref={spanRef} dangerouslySetInnerHTML={{ __html: html }}></span>;
}
