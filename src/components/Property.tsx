import * as App from '../App';
import * as SDK from '@remnote/plugin-sdk';
import _ from 'lodash';
import { RichText } from './RichText';

interface PropertyProps {
    readonly text?: SDK.RichTextInterface;
    readonly backText?: SDK.RichTextInterface;
}

export function Property({ text, backText }: PropertyProps) {
    const plugin = SDK.usePlugin();
    const name =
        App.Hooks.useRunAsync(async () => {
            return App.richTextToString(plugin, text).then(_.trim);
        }, [plugin, text]) ?? '';
    const value =
        App.Hooks.useRunAsync(async () => {
            return App.richTextToHtml(plugin, backText).then(_.trim);
        }, [plugin, backText]) ?? '';

    const isNumber = _.isEmpty(value) ? false : _.isFinite(_.toNumber(value));
    const isCheckbox = ['Yes', 'No'].includes(value);

    return (
        <div>
            <p className="font-medium my-3">{name}:</p>
            <p className="italic my-3">
                {isNumber ? (
                    <span
                        className="underline underline-offset-4"
                        style={{ letterSpacing: '0.05em', textDecorationColor: 'orange' }}
                    >
                        {value}
                    </span>
                ) : isCheckbox ? (
                    <span>{value === 'Yes' ? '✅' : '❌'}</span>
                ) : (
                    <RichText richText={backText} defaultValue="-" />
                )}
            </p>
        </div>
    );
}
