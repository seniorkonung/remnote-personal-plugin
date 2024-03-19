import * as App from '../App';
import { RichText } from './RichText';

interface RegimeProps {
    readonly regime: App.Regime;
}

export function Regime({ regime }: RegimeProps) {
    return (
        <div className="grid grid-cols-2 px-2">
            <div>
                <p className="font-medium my-3">{App.REM_TEXT_START_DAY}:</p>
                <p className="italic my-3 underline underline-offset-4" style={{ letterSpacing: '0.05em', textDecorationColor: 'orange' }}>
                    {regime.startDay || '-'}
                </p>
            </div>

            <div>
                <p className="font-medium my-3">{App.REM_TEXT_WAKING_TIME}:</p>
                <p className="italic my-3 underline underline-offset-4" style={{ letterSpacing: '0.05em', textDecorationColor: 'orange' }}>
                    {regime.wakingTime || '-'}
                </p>
            </div>

            <div>
                <p className="font-medium my-3">{App.REM_TEXT_END_DAY}:</p>
                <p className="italic my-3 underline underline-offset-4" style={{ letterSpacing: '0.05em', textDecorationColor: 'orange' }}>
                    {regime.endDay || '-'}
                </p>
            </div>

            <div>
                <p className="font-medium my-3">{App.REM_TEXT_SLEEP_TIME}:</p>
                <p className="italic my-3 underline underline-offset-4" style={{ letterSpacing: '0.05em', textDecorationColor: 'orange' }}>
                    {regime.sleepTime || '-'}
                </p>
            </div>

            <div className="col-span-2">
                <div className="flex gap-2">
                    <p className="font-medium my-3">{App.REM_TEXT_WAKING}:</p>
                    <p className="italic my-3" style={{ letterSpacing: '0.025em' }}>
                        <RichText richText={regime.waking?.backText} defaultValue={'-'} />
                    </p>
                </div>

                <div className="flex gap-2">
                    <p className="font-medium my-3">{App.REM_TEXT_VIGOR_LEVEL}:</p>
                    <p className="italic my-3" style={{ letterSpacing: '0.025em' }}>
                        <RichText richText={regime.vigorLevel?.backText} defaultValue={'-'} />
                    </p>
                </div>

                <div className="flex gap-2">
                    <p className="font-medium my-3">{App.REM_TEXT_SLEEP_QUOLITY}:</p>
                    <p className="italic my-3" style={{ letterSpacing: '0.025em' }}>
                        <RichText richText={regime.sleepQuolity?.backText} defaultValue={'-'} />
                    </p>
                </div>
            </div>
        </div>
    );
}
