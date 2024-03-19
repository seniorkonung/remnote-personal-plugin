import * as App from '../App';

interface PomodoroProps {
    readonly pomodoro: Pick<App.Pomodoro, 'name' | 'isBad' | 'value'>;
    readonly isTotal?: boolean;
}

export function Pomodoro({ pomodoro, isTotal = false }: PomodoroProps) {
    return (
        <div className="flex gap-2 items-center">
            <div
                className="w-1"
                style={{
                    height: '80%',
                    backgroundColor: isTotal ? 'blue' : pomodoro.isBad ? 'red' : 'green',
                }}
            ></div>

            {isTotal ? (
                <p
                    className="font-medium my-2 my-1 px-2 py-1 rounded-md"
                    style={{
                        letterSpacing: '0.01em',
                        color: 'white',
                        backgroundColor: 'blue',
                    }}
                >
                    {pomodoro.name}
                </p>
            ) : (
                <p
                    className="font-medium my-2"
                    style={{
                        letterSpacing: '0.01em',
                    }}
                >
                    {pomodoro.name}
                </p>
            )}

            <p
                className="italic my-2 flex gap-2 content-center"
                style={{
                    letterSpacing: '0.025em',
                }}
            >
                <span>—</span>
                <span className="font-bold">{pomodoro.value}</span>
                <span style={{ opacity: '.75' }}>пом.</span>
            </p>
        </div>
    );
}
