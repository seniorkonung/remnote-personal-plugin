import * as SDK from '@remnote/plugin-sdk'
import * as App from '../App'
import { Day } from './Day'
import { Regime } from './Regime'

interface RegimePanelProps {
    dailyDocs: App.DailyDoc[]
}

export function RegimePanel({ dailyDocs }: RegimePanelProps) {
    const plugin = SDK.usePlugin()

    const dailyDocsAndRegime = SDK.useRunAsync(async () => {
        return await Promise
            .all(dailyDocs.map(async dailyDoc => {
                const regime = await App.regime(plugin, dailyDoc.rem)
                return {dailyDoc, regime}
            }))
    }, [dailyDocs]) ?? []

    const days = dailyDocsAndRegime.map(({dailyDoc, regime}) => {
        return (
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
                <Regime regime={regime} />
            </Day>
        )
    })
    
    return <>{days}</>
}