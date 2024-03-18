import * as App from '../App'
import * as SDK from '@remnote/plugin-sdk'

interface RegimeProps {
    readonly regime: App.Regime
}

export function Regime({ regime }: RegimeProps) {
    return (
        <div>
            <p>{App.REM_TEXT_START_DAY}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.startDay }}></span> */}
            
            <p>{App.REM_TEXT_END_DAY}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.endDay }}></span> */}
            
            <p>{App.REM_TEXT_WAKING}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.waking }}></span> */}
            
            <p>{App.REM_TEXT_SLEEP_QUOLITY}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.sleepQuolity }}></span> */}
            
            <p>{App.REM_TEXT_VIGOR_LEVEL}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.vigorLevel }}></span> */}
            
            <p>{App.REM_TEXT_WAKING_TIME}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.wakingTime }}></span> */}
            
            <p>{App.REM_TEXT_SLEEP_TIME}</p>
            {/* <span dangerouslySetInnerHTML={{ __html: regime.sleepTime }}></span> */}
        </div>
    )
}