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
        SDK.useRunAsync(async () => {
            return _.asyncMap(dailyDocs, async (dailyDoc) => {
                const pomodoros = await App.pomodoros(plugin, dailyDoc.rem);
                return { dailyDoc, pomodoros };
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

    const days = dailyDocsAndPomodoros.map(({ dailyDoc, pomodoros }) => {
        const total = calculateTotalPomodoros(pomodoros);
        return (
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
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
