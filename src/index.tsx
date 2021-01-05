import "./styles.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createMachine, assign } from "xstate";
import { useMachine, asEffect, asLayoutEffect } from "@xstate/react";

import { useSpeechRecognition } from 'react-speech-kit';


const colors = ['aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate',
    'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold',
    'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender',
    'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive',
    'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon',
    'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato',
    'turquoise', 'violet', 'white', 'yellow'];
const grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

var SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList
const speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
const grammars = speechRecognitionList;


interface ASRContext {
    recResult: string;
}

const machine = createMachine<ASRContext>({
    id: "machine",
    initial: "inactive",
    states: {
        inactive: {
            on: {
                CLICK: 'listening',
            }
        },
        listening: {
            entry: 'recStart',
            on: {
                ASR_RESULT: {
                    actions: ['recSaveResult'],
                    target: 'inactive'
                },
            },
            exit: ['repaint', 'recStop']
        },
    }
},
    {
        actions: {
            recSaveResult: (context, event) => {
                context.recResult = event.recResult;
                console.log('Got: ' + event.recResult);
            }
        },
    });



interface HintProp {
    name: string;
}
function Hint(prop: HintProp) {
    return <span style={{ backgroundColor: prop.name }}>{' ' + prop.name}</span>
}

function App() {
    const { listen, listsening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "ASR_RESULT", recResult: result });
        },
    });
    const [current, send] = useMachine(machine, {
        actions: {
            recStart: asEffect(() => {
                console.log('Ready to receive a color command.');
                listen({
                    interimResults: false,
                    continuous: false,
                    grammars: grammars
                });
            }),
            recStop: asEffect(() => {
                console.log('Recognition stopped.');
                stop()
            }),
            repaint: asEffect((context) => {
                console.log('Repainting...');
                document.body.style.background = context.recResult;
            }),
        }
    });
    const active = current.matches("listening");
    return (
        <div className="App">
            {/* <h1>XState React ColourChanger</h1> */}
            <p>
                Tap/click then say a color to change the background color of the box. Try
	    {colors.map((v, _) => <Hint name={v} />)}.
	    </p>
            <button onClick={() => send('CLICK')}>
                🎤 {active ? 'Listening...' : 'Click me!'}
            </button>
        </div >
    );
}


const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
