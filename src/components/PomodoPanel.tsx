import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import _ from 'lodash';
import { Day } from './Day';
import { Pomodoro } from './Pomodoro';

interface PomodoroPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

const TOTAL_ID = 'total';
const calculateTotalPomodoros = (pomodoros: App.Pomodoro[]) => {
    return pomodoros.reduce(
        (total, pomodoro) => {
            return {
                ...total,
                id: pomodoro.rem._id,
                value: total.value + pomodoro.value,
            };
        },
        {
            rem: { _id: TOTAL_ID },
            isBad: false,
            name: 'Всего',
            value: 0,
        }
    );
};

export function PomodoroPanel({ dailyDocs }: PomodoroPanelProps) {
    const plugin = SDK.usePlugin();

    const dailyDocsAndPomodoros =
        App.Hooks.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                return {
                    dailyDoc,
                    pomodoros: await App.pomodoros(plugin, dailyDoc.rem),
                    zoomTitle: await _.block(async () => {
                        const rem = await App.Helpers.getRems(
                            plugin,
                            dailyDoc.rem,
                            App.Helpers.includesStringInRem(App.REM_TEXT_TOTALS),
                            App.Helpers.includesStringInRem(App.REM_TEXT_POMODORO)
                        ).then(_.head);
                        if (_.isUndefined(rem)) return;
                        else return () => void rem.openRemAsPage();
                    }),
                };
            });
        }, [plugin, dailyDocs]) ?? [];

    const totals = _.block(() => {
        const allPomodoros = dailyDocsAndPomodoros.map(({ pomodoros }) => pomodoros);
        const pomodoros = App.calculateTotalsPomodoros(allPomodoros);
        const total = calculateTotalPomodoros(pomodoros);
        return (
            <div className="grid px-2">
                {[...pomodoros, total].map((pomodoro) => {
                    return (
                        <Pomodoro
                            key={pomodoro.rem._id}
                            pomodoro={pomodoro}
                            isTotal={pomodoro.rem._id === TOTAL_ID}
                        />
                    );
                })}
            </div>
        );
    });

    const days = dailyDocsAndPomodoros.map(({ dailyDoc, pomodoros, zoomTitle }) => {
        const total = calculateTotalPomodoros(pomodoros);
        return (
            <Day key={dailyDoc.rem._id} title="Помидоры" zoomTitle={zoomTitle} dailyDoc={dailyDoc}>
                <div className="grid px-2">
                    {[...pomodoros, total].map((pomodoro) => {
                        return (
                            <Pomodoro
                                key={pomodoro.rem._id}
                                pomodoro={pomodoro}
                                isTotal={pomodoro.rem._id === TOTAL_ID}
                            />
                        );
                    })}
                </div>
            </Day>
        );
    });

    return (
        <div className="grid grid-cols-1 gap-6">
            {totals}
            {days}
        </div>
    );
}
