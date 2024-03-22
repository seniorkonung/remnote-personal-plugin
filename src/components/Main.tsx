import * as App from '../App';
import _ from 'lodash';
import { Property } from './Property';
import { RichText } from './RichText';

interface MainProps {
    readonly others: App.Other[];
    readonly version: number;
    readonly daysUntilEndOfMonth: number;
    readonly theses: App.Thesis[];
    readonly notesCount: number;
}

export function Main(props: MainProps) {
    return (
        <div>
            <div className="grid grid-cols-2 gap-2">
                <Property text={['Версия']} backText={[_.toString(props.version)]} />
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
                                style={{ borderColor: thesis.color, color: thesis.color }}
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

                            <RichText embededdHtml={thesis.embeddedHtml} defaultValue="-" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
