import * as App from '../App';
import _ from 'lodash';
import { RichText } from './RichText';

interface RationProps {
    readonly ration: App.Ration;
}

export function Ration({ ration }: RationProps) {
    const time = _.isUndefined(ration.time)
        ? '-'
        : _.isEmpty(ration.time.trim())
        ? '-'
        : ration.time;

    const foods = (foods: App.Food[]) =>
        foods.map((food) => {
            return (
                <li key={food.rem._id}>
                    <div>
                        <span className="font-semibold">
                            <RichText richText={food.rem.text} defaultValue="-" />
                        </span>
                        <span> — </span>
                        <span className="italic" style={{ letterSpacing: '0.025em' }}>
                            <span className="font-bold">{food.portion}</span>{' '}
                            <span style={{ opacity: '.75' }}>{food.unit}</span>
                        </span>
                    </div>
                </li>
            );
        });

    return (
        <li>
            <div className="flex items-center gap-4 font-medium">
                <span className="whitespace-nowrap">
                    <span>🕰️ </span>
                    <span className="italic" style={{ letterSpacing: '0.025em' }}>
                        {time}
                    </span>
                </span>
                <div className="text-right">
                    <span className="whitespace-nowrap">
                        <span>⛽ </span>
                        <span className="italic" style={{ letterSpacing: '0.025em' }}>
                            <RichText richText={ration.hungerBefore?.backText} defaultValue="-" />
                        </span>
                    </span>
                    <span className="font-medium"> → </span>
                    <span className="italic" style={{ letterSpacing: '0.025em' }}>
                        <RichText richText={ration.hungerAfter?.backText} defaultValue="-" />
                    </span>
                </div>
            </div>

            <div className="grid gap-3 my-3">
                {ration.snacks.map((snack, i) => {
                    const isSnack = i !== 0;
                    return (
                        <ul className="grid gap-3" style={{ paddingInlineStart: '1em' }}>
                            <span>{isSnack ? '~' : null}</span>
                            {foods(snack)}
                        </ul>
                    );
                })}
            </div>
        </li>
    );
}
