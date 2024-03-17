import * as App from '../App'
import * as React from 'react'
import * as SDK from '@remnote/plugin-sdk'

interface DayProps {
    dailyDoc: App.DailyDoc
    children: React.JSX.Element | React.JSX.Element[]
}

export function Day({ dailyDoc, children }: DayProps) {
    return (
        <div>
            <SDK.RemViewer remId={dailyDoc.rem._id} height='auto' width='100%' />
            {/* <p>{dailyDoc.name}</p> */}
            <div>
                {children}
            </div>
        </div>
    )
}