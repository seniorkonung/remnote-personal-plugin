import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Main } from './Main';

interface MainPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function MainPanel({ dailyDocs }: MainPanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndMain =
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                return {
                    dailyDoc,
                    others: await App.others(plugin, dailyDoc.rem),
                    daysUntilEndOfYear: App.daysUntilEndOfYear(dailyDoc.name),
                    daysUntilEndOfMonth: App.daysUntilEndOfMonth(dailyDoc.name),
                    notesCount: await App.notesCount(plugin, dailyDoc.rem),
                    theses: await App.theses(plugin, dailyDoc.rem),
                    zoomTitle: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_NOTES)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndMain.map(({ dailyDoc, ...params }) => {
        return (
            <Day
                key={dailyDoc.rem._id}
                dailyDoc={dailyDoc}
                title="Заметки"
                zoomTitle={params.zoomTitle}
                contentAfter={
                    <span className="text-sm font-medium align-bottom">{params.notesCount} 🖊️</span>
                }
            >
                <div className="px-2">
                    <Main
                        others={params.others}
                        daysUntilEndOfMonth={params.daysUntilEndOfMonth}
                        daysUntilEndOfYear={params.daysUntilEndOfYear}
                        notesCount={params.notesCount}
                        theses={params.theses}
                    />
                </div>
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}
