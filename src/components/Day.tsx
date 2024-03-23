import * as App from '../App';
import * as React from 'react';
import _ from 'lodash';

interface DayProps {
    readonly dailyDoc: App.DailyDoc;
    readonly contentAfter?: React.JSX.Element;
    readonly children: React.JSX.Element | React.JSX.Element[];
}

export function Day({ dailyDoc, contentAfter, children }: DayProps) {
    return (
        <div>
            <h1 className="text-2xl">
                <span
                    className="underline underline-offset-4 text-blue-60 cursor-pointer"
                    onClick={() => dailyDoc.rem.openRemAsPage()}
                >
                    {dailyDoc.name}
                </span>
                {_.isNotUndefined(contentAfter) && <span>{contentAfter}</span>}
            </h1>
            <div>{children}</div>
        </div>
    );
}
