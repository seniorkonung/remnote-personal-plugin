import * as SDK from '@remnote/plugin-sdk'
import * as App from '../App'

interface SymptomProps {
    symptom: App.Symptom
}

export function Symptom({ symptom }: SymptomProps) {
    return (
        <div>
            <SDK.RemViewer remId={symptom.rem._id} width='100%' height='auto' />
            <div className='pl-3'>
                {symptom.notes.map((note) => {
                    return <SDK.RemViewer key={note.rem._id} remId={note.rem._id} width='100%' height='auto' />
                })}
            </div>            
        </div>
    )
}