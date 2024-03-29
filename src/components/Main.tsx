import * as App from '../App';
import _ from 'lodash';
import { Property } from './Property';
import { RichText } from './RichText';

interface MainProps {
    readonly others: App.Other[];
    readonly daysUntilEndOfYear: number;
    readonly daysUntilEndOfMonth: number;
    readonly theses: App.Thesis[];
    readonly notesCount: number;
}

export function Main(props: MainProps) {
    return (
        <div>
            <div className="grid grid-cols-2 gap-2">
                <Property
                    text={['До конца года']}
                    backText={[_.toString(props.daysUntilEndOfYear)]}
                />
                <Property
                    text={['До конца месяца']}
                    backText={[_.toString(props.daysUntilEndOfMonth)]}
                />
                {props.others.map((other) => {
                    return (
                        <Property
                            key={other.rem._id}
                            text={other.rem.text}
                            backText={other.rem.backText}
                        />
                    );
                })}
            </div>

            <div className="grid gap-3 mt-6">
                {props.theses.map((thesis) => {
                    return (
                        <div className="flex items-center gap-3" key={thesis.embeddedHtml}>
                            <span
                                className="flex-none flex justify-center items-center h-8 w-8 border-px border-solid rounded-full font-bold text-xl"
                                style={{
                                    color: `var(--text-color-${thesis.color})`,
                                    borderColor: `var(--text-color-${thesis.color})`,
                                }}
                            >
                                {thesis.isGood
                                    ? '↑'
                                    : thesis.isBad
                                    ? '↓'
                                    : thesis.isEvent
                                    ? '⇄'
                                    : thesis.isInfo
                                    ? '~'
                                    : '?'}
                            </span>

                            <span
                                className="underline decoration-dotted underline-offset-4"
                                style={{ textDecorationColor: `var(--text-color-${thesis.color})` }}
                            >
                                <RichText
                                    embededdHtml={thesis.embeddedHtml}
                                    richText={undefined}
                                    defaultValue="-"
                                />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
