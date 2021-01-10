import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Machine, createMachine, assign, send } from "xstate";
import { useMachine, asEffect, asLayoutEffect } from "@xstate/react";

import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
/* import useSpeechRecognition from './asr'; */

import AudioAnalyser from './AudioAnalyser';

const colors = ['aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate',
    'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold',
    'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender',
    'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive',
    'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon',
    'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato',
    'turquoise', 'violet', 'white', 'yellow'];
const grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

/* var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList */
const speechRecognitionList = new webkitSpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
const grammars = speechRecognitionList;

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'MATCH', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'SPEAK', value: string };

const sayColour = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

const say = (text: string) => send((context: SDSContext) => ({
    type: "SPEAK", value: text
}))

const machine = Machine<SDSContext, any, SDSEvent>({
    id: 'machine',
    type: 'parallel',
    states: {
        dm: {
            initial: 'init',
            states: {
                init: {
                    on: {
                        CLICK: 'welcome'
                    }
                },
                welcome: {
                    initial: 'prompt',
                    on: { MATCH: 'repaint' },
                    states: {
                        prompt: {
                            entry: say("Tell me the colour"),
                            on: { ENDSPEECH: 'ask' }
                        },
                        ask: {
                            entry: send('LISTEN'),
                        },
                    }
                },
                repaint: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            entry: sayColour,
                            on: { ENDSPEECH: 'repaint' }
                        },
                        repaint: {
                            entry: 'changeColour',
                            always: '#machine.dm.welcome'
                        }
                    }
                }
            }
        },
        asrtts: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        LISTEN: 'recognising',
                        SPEAK: 'speaking'
                    }
                },
                recognising: {
                    entry: 'recStart',
                    exit: ['recStop', assign<SDSContext>({ recResult: (context: any, event: any) => { return event.value } })],
                    on: {
                        MATCH: {
                            actions: 'recLogResult',
                            target: 'idle'
                        },
                    }
                },
                speaking: {
                    entry: [
                        assign<SDSContext>({ ttsAgenda: (context: any, event: any) => { return event.value } }),
                        'ttsStart'],
                    on: {
                        ENDSPEECH: 'idle',
                    }
                }
            }
        }
    },
},
    {
        actions: {
            recLogResult: (context) => {
                /* context.recResult = event.recResult; */
                console.log('<< ASR: ' + context.recResult);
            },
            test: () => {
                console.log('test')
            },
            logIntent: (context) => {
                /* context.nluData = event.data */
                console.log('<< NLU intent: ' + context.nluData.intent.name)
            }
        },
    });



interface HintProp {
    name: string;
}
interface MicProp {
    active: boolean;
}
function Hint(prop: HintProp) {
    return <span style={{ backgroundColor: prop.name }}>{' ' + prop.name}</span>
}


function App() {
    const { speak, cancel, speaking } = useSpeechSynthesis({
        onEnd: () => {
            send('ENDSPEECH');
        },
    });
    const { listen, listening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "MATCH", value: result });
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
            changeColour: asEffect((context) => {
                console.log('Repainting...');
                document.body.style.background = context.recResult;
            }),
            ttsStart: asEffect((context, effect) => {
                console.log('Speaking...');
                speak({ text: context.ttsAgenda })
            }),
            ttsCancel: asEffect((context, effect) => {
                console.log('TTS STOP...');
                cancel()
            })
            /* speak: asEffect((context) => {
	     * console.log('Speaking...');
             *     speak({text: context.ttsAgenda })
             * } */
        }
    });

    const recognising = current.matches({ asrtts: 'recognising' });
    switch (true) {
        case current.matches({ asrtts: 'recognising' }):
            return (
                <div className="App">
                    <button type="button" className="glow-on-hover"
                        style={{ animation: "glowing 20s linear" }}>
                        Listening...
                    </button>
                </div >
            );
        case current.matches({ asrtts: 'speaking' }):
            return (
                <div className="App">
                    <button type="button" className="glow-on-hover"
                        style={{ animation: "bordering 1s infinite" }}>
                        Speaking...
                    </button>
                </div >
            );
        default:
            return (
                <div className="App">
                    <button type="button" className="glow-on-hover" onClick={() => send('CLICK')}>
                        Click to start
                    </button>
                </div>
            );
    }
};

/* RASA API
 *  */
const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://rasa-nlu-api-00.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://maraev.me' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
