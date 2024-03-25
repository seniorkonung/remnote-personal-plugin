import * as App from '../App';
import * as React from 'react';
import _ from 'lodash';

interface DayProps {
    readonly dailyDoc: App.DailyDoc;
    readonly zoom?: () => void;
    readonly contentAfter?: React.JSX.Element;
    readonly children: React.JSX.Element | React.JSX.Element[];
}

export function Day(props: DayProps) {
    return (
        <div>
            <h1 className="text-2xl">
                <span
                    className="underline underline-offset-4 text-blue-60 cursor-pointer"
                    onClick={() => props.dailyDoc.rem.openRemAsPage()}
                >
                    {props.dailyDoc.name}
                </span>
                {_.isNotUndefined(props.zoom) && (
                    <span>
                        <span> | </span>
                        <span className="cursor-pointer" onClick={props.zoom}>
                            🔎
                        </span>
                    </span>
                )}
                {_.isNotUndefined(props.contentAfter) && <span> {props.contentAfter}</span>}
            </h1>
            <div>{props.children}</div>
        </div>
    );
}
