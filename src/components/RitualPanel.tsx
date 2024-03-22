import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Property } from './Property';

interface RitualPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function RitualPanel({ dailyDocs }: RitualPanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndRituals =
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                const rituals = await App.rituals(plugin, dailyDoc.rem);
                return { dailyDoc, rituals };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndRituals.map(({ dailyDoc, rituals }) => {
        return (
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
                <div className="grid grid-cols-2 gap-2 px-2">
                    {rituals.map((ritual) => {
                        return (
                            <Property
                                key={ritual.rem._id}
                                text={ritual.rem.text}
                                backText={ritual.rem.backText}
                            />
                        );
                    })}
                </div>
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}
