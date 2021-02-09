import { MachineConfig, send, Action } from "xstate";


const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
	initial: 'prompt',
	states: {
            prompt: {
		entry: say(prompt),
		on: { ENDSPEECH: 'ask' }
            },
            ask: {
		entry: send('LISTEN'),
            },
	}})
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            on: {
                RECOGNISED: [
                    { target: 'stop', cond: (context) => context.recResult === 'stop' },
                    { target: 'repaint' }]
            },
	    ...promptAndAsk("Tell me the colour")
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
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
                    always: '#root.dm.welcome'
                }
            }
        }
    }
})
