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
    | { type: 'ASR_onResult', value: string }
    | { type: 'TTS_onEnd' }
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
                    entry: say("Tell me the colour"),
                    on: {
                        TTS_onEnd: { actions: send('LISTEN') },
                        ASR_onResult: 'repaint'
                    }
                },
                repaint: {
                    entry: [send((context: SDSContext) => ({
                        type: "SPEAK", value: `Repainting to ${context.recResult}`
                    })),

                        'repaint'],
                    always: { target: 'welcome' }
                }
            }
        },

        asr: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        LISTEN: 'recognising',
                    }
                },
                recognising: {
                    entry: 'recStart',
                    on: {
                        ASR_onResult: {
                            actions: [
                                assign<SDSContext>({ recResult: (context: any, event: any) => { return event.value } }),
                                'recLogResult'
                            ],
                            target: 'idle'
                        },
                    },
                    exit: 'recStop'
                },
                nlu: {
                    invoke: {
                        id: 'getNLU',
                        src: (context: SDSContext) => nluRequest(context.recResult),
                        onDone: {
                            target: 'idle',
                            actions: [
                                assign<SDSContext>({ nluData: (context: any, event: any) => { return event.data } }),
                                'logIntent'
                            ]
                        },
                        onError: {
                            target: 'idle',
                            actions: ['nluSaveResult']
                        }
                    }
                }
            }
        },

        tts: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        SPEAK: {
                            target: 'speaking',
                        },
                    }
                },
                speaking: {
                    entry: [
                        assign<SDSContext>({ ttsAgenda: (context: any, event: any) => { return event.value } }),
                        'tts'],
                    on: {
                        TTS_onEnd: 'idle',
                        SPEAK: 'speaking'
                    }
                }
            }
        }
    }


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
            send('TTS_onEnd');
        },
    });
    const { listen, listening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "ASR_onResult", value: result });
        },
    });
    const [current, send] = useMachine(machine, {
        actions: {
            recStart: asEffect(() => {
                console.log('Ready to receive a color command.');
                if (listening) { stop() };
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
            tts: asEffect((context, effect) => {
                console.log('Speaking...');
                speak({ text: context.ttsAgenda })
            })
            /* speak: asEffect((context) => {
	     * console.log('Speaking...');
        *     speak({text: context.ttsAgenda })
        * } */
        }
    });

    const active = current.matches({ asr: 'recognising' });
    return (
        <div className="App">
            {/* <p>
                Tap / click then say a color to change the background color of the box.Try
		{colors.map((v, _) => <Hint name={v} />)}.
		</p> */}
            <button type="button" className="glow-on-hover" onClick={() => send('CLICK')}
                style={active ? { animation: "glowing 20s linear" } : {}}>
                {active ? "Listening..." : "Click to start"}
            </button>
        </div >
    );
}

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
