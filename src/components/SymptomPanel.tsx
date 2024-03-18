import * as SDK from '@remnote/plugin-sdk'
import * as App from '../App'
import _ from 'lodash'
import { Day } from './Day'
import { Symptom } from './Symptom'

interface SymptomPanelProps {
    dailyDocs: App.DailyDoc[]
}

export function SymptomPanel({ dailyDocs }: SymptomPanelProps) {
    const plugin = SDK.usePlugin()

    const dailyDocsAndSymptoms = SDK.useRunAsync(async () => {
        return _.asyncMap(dailyDocs, async dailyDoc => {
            const symptoms = await App.symptoms(plugin, dailyDoc.rem)
            return {dailyDoc, symptoms}
        })
    }, [plugin, dailyDocs]) ?? []

    const days = dailyDocsAndSymptoms.map(({dailyDoc, symptoms}) => {
        return (
            <Day key={dailyDoc.rem._id} dailyDoc={dailyDoc}>
                <ul className="grid gap-1">
                    {symptoms.map(symptom => {
                        return <Symptom key={symptom.rem._id} symptom={symptom}></Symptom>
                    })}
                </ul>
            </Day>
        )
    })
    
    return <div className="grid grid-cols-1 gap-6">{days}</div>
}