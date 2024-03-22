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
                const others = await App.others(plugin, dailyDoc.rem);
                const version = App.version(dailyDoc.name);
                const daysUntilEndOfMonth = App.daysUntilEndOfMonth(dailyDoc.name);
                const notesCount = await App.notesCount(plugin, dailyDoc.rem);
                const theses = await App.theses(plugin, dailyDoc.rem);
                return { dailyDoc, others, version, daysUntilEndOfMonth, notesCount, theses };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndMain.map(({ dailyDoc, ...params }) => {
        return (
            <Day
                key={dailyDoc.rem._id}
                dailyDoc={dailyDoc}
                contentAfter={
                    <span className="text-sm font-medium align-bottom ml-2">
                        {params.notesCount} 🖊️
                    </span>
                }
            >
                <div className="px-2">
                    <Main
                        others={params.others}
                        daysUntilEndOfMonth={params.daysUntilEndOfMonth}
                        version={params.version}
                        notesCount={params.notesCount}
                        theses={params.theses}
                    />
                </div>
            </Day>
        );
    });

    return <div className="grid grid-cols-1 gap-6">{days}</div>;
}
