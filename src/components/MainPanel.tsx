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
                    zoom: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_TOTALS),
                            App.Helpers.includesStringInRem(App.REM_TEXT_OTHER)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                    zoomNotes: await _.block(async () => {
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
                zoom={params.zoom}
                contentAfter={
                    <span
                        className="text-sm font-medium align-bottom cursor-pointer"
                        onClick={params.zoomNotes}
                    >
                        {params.notesCount} 🖊️
                    </span>
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
