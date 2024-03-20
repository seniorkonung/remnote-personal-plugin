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
        SDK.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                const rations = await App.rations(plugin, dailyDoc.rem);
                return { dailyDoc, rations };
            });
        }, [plugin, dailyDocs]) ?? [];

    const days = dailyDocsAndRations.map(({ dailyDoc, rations }) => {
        const categories = _.chain(rations)
            .flatMap(({ snacks }) => _.flatten(snacks))
            .flatMap(({ categories }) => categories)
            .uniq()
            .sort()
            .map((category, i, categories) => {
                const name = _.block(() => {
                    const isEmptyCategory = _.isEmpty(category.trim());
                    if (isEmptyCategory) return 'Без категории';
                    else return category;
                });

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
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
                <p className="flex flex-wrap gap-1 mb-6">{categories}</p>
                <ol className="grid gap-3">
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
