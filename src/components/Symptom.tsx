import * as App from '../App';
import { RichText } from './RichText';

interface SymptomProps {
    readonly symptom: App.Symptom;
}

export function Symptom({ symptom }: SymptomProps) {
    return (
        <li>
            <span className="font-medium">
                <RichText richText={symptom.rem.text} />
            </span>
            <ul style={{ paddingInlineStart: '1.6em' }}>
                {symptom.notes.map((note) => {
                    return (
                        <li className="mt-3" key={note.rem._id}>
                            <RichText richText={note.rem.text} />
                        </li>
                    );
                })}
            </ul>
        </li>
    );
}
