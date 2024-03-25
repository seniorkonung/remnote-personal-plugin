import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Symptom } from './Symptom';

interface SymptomPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function SymptomPanel({ dailyDocs }: SymptomPanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndSymptoms =
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                return {
                    dailyDoc,
                    symptoms: await App.symptoms(plugin, dailyDoc.rem),
                    zoomTitle: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_TOTALS),
                            App.Helpers.includesStringInRem(App.REM_TEXT_SYMPTOMS)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndSymptoms.map(({ dailyDoc, symptoms, zoomTitle }) => {
        return (
            <Day key={dailyDoc.rem._id} title="Симптомы" zoomTitle={zoomTitle} dailyDoc={dailyDoc}>
                <ul className="grid gap-3" style={{ paddingInlineStart: '1.6em' }}>
                    {symptoms.map((symptom) => {
                        return <Symptom key={symptom.rem._id} symptom={symptom} />;
                    })}
                </ul>
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}
