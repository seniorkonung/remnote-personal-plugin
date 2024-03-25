import * as App from '../App';
import * as React from 'react';
import _ from 'lodash';

interface DayProps {
    readonly dailyDoc: App.DailyDoc;
    readonly title: string;
    readonly zoomTitle?: () => void;
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
                <span> | </span>
                {_.isUndefined(props.zoomTitle) ? (
                    <span className="text-xl">{props.title}</span>
                ) : (
                    <span
                        className="text-xl underline underline-offset-4 text-blue-60 cursor-pointer"
                        onClick={props.zoomTitle}
                    >
                        {props.title}
                    </span>
                )}
                {_.isNotUndefined(props.contentAfter) && <span> {props.contentAfter}</span>}
            </h1>
            <div>{props.children}</div>
        </div>
    );
}
