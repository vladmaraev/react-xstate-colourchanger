import { MachineConfig, send, Action, assign } from "xstate";



function say(text: string): Action<DMContext, SDSEvent> {
    return send((_context: DMContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<DMContext, SDSEvent> {
    return send('LISTEN')
}


export const dmMachine: MachineConfig<DMContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            entry: say("Let's create an appointment"),
            on: { ENDSPEECH: "who" }
        },
        who: {
            entry: say("Who are you meeting with?"),
            on: { ENDSPEECH: ".ask" },
            states: {
                ask: {
                    entry: listen(),
                    on: {
                        'MATCH': {
                            target: "result",
                            actions: assign((context) => { return { person: context.recResult } })
                        }
                    }
                }
            }
        }
    }
})
