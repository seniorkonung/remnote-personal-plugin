import * as App from '../App';
import * as SDK from '@remnote/plugin-sdk';
import _ from 'lodash';
import { RichText } from './RichText';

interface RitualProps {
    readonly ritual: App.Ritual;
}

export function Ritual({ ritual }: RitualProps) {
    const plugin = SDK.usePlugin();
    const name =
        SDK.useRunAsync(async () => {
            return App.richTextToString(plugin, ritual.rem.text).then(_.trim);
        }, [plugin, ritual]) ?? '';
    const value =
        SDK.useRunAsync(async () => {
            return App.richTextToHtml(plugin, ritual.rem.backText).then(_.trim);
        }, [plugin, ritual]) ?? '';

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
                    <RichText richText={ritual.rem.backText} defaultValue="-" />
                )}
            </p>
        </div>
    );
}
