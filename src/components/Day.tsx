import * as App from '../App';
import * as React from 'react';
import * as SDK from '@remnote/plugin-sdk';

interface DayProps {
    readonly dailyDoc: App.DailyDoc;
    readonly children: React.JSX.Element | React.JSX.Element[];
}

export function Day({ dailyDoc, children }: DayProps) {
    return (
        <div>
            <h1 className="text-2xl hover:cursor-pointer underline underline-offset-4" style={{color: '#7c6efa'}} onClick={() => dailyDoc.rem.openRemAsPage()}>
                {dailyDoc.name}
            </h1>
            <div>{children}</div>
        </div>
    );
}
