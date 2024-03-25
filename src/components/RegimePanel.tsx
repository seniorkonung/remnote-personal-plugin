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
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                return {
                    dailyDoc,
                    regime: await App.regime(plugin, dailyDoc.rem),
                    zoom: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_TOTALS),
                            App.Helpers.includesStringInRem(App.REM_TEXT_REGIME)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndRegime.map(({ dailyDoc, regime, zoom }) => {
        return (
            <Day key={dailyDoc.rem._id} zoom={zoom} dailyDoc={dailyDoc}>
                <div className="px-2">
                    <Regime regime={regime} />
                </div>
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}
