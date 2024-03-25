import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Ration } from './Ration';

interface RationPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function RationPanel({ dailyDocs }: RationPanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndRations =
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                return {
                    dailyDoc,
                    rations: await App.rations(plugin, dailyDoc.rem),
                    zoom: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_RATIONS)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndRations.map(({ dailyDoc, rations, zoom }) => {
        const categories = _.chain(rations)
            .flatMap(({ snacks }) => _.flatten(snacks))
            .flatMap(({ categories }) => categories)
            .uniq()
            .sort()
            .map((category, i, categories) => {
                const name = _.isEmpty(category.trim()) ? 'Без категории' : category;
                const delimiter = _.block(() => {
                    const isLastCategory = i === categories.length - 1;
                    if (isLastCategory) return '.';
                    else return ',';
                });

                return (
                    <span key={name} className="font-medium">
                        {'🏷️ '}
                        {name}
                        {delimiter}
                    </span>
                );
            })
            .value();

        return (
            <Day key={dailyDoc.rem._id} zoom={zoom} dailyDoc={dailyDoc}>
                <p className="flex flex-wrap gap-1">{categories}</p>
                <ol className="grid gap-3 mt-6" style={{ paddingInlineStart: '1.6em' }}>
                    {rations.map((ration) => {
                        return <Ration ration={ration} />;
                    })}
                </ol>
            </Day>
        );
    });

    return (
        <div className="grid grid-cols-1 gap-6">
            {days}
            <style>{`
                ol > li::marker {
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
