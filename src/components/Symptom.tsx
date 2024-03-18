import * as App from '../App'
import { RichText } from './RichText'

interface SymptomProps {
    symptom: App.Symptom
}

export function Symptom({ symptom }: SymptomProps) {
    return (
        <li>
            <RichText richText={symptom.rem.text} />
            <ul>
                {symptom.notes.map((note) => {
                    return <li className="mt-1" key={note.rem._id}><RichText richText={note.rem.text} /></li>
                })}
            </ul>            
        </li>
    )
}