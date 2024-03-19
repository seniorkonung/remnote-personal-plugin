import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Regime } from './Regime';

interface RegimePanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function RegimePanel({ dailyDocs }: RegimePanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndRegime =
        SDK.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                const regime = await App.regime(plugin, dailyDoc.rem);
                return { dailyDoc, regime };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndRegime.map(({ dailyDoc, regime }) => {
        return (
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
                <Regime regime={regime} />
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}