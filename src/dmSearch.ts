import { MachineConfig, send, assign, Action } from "xstate";

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

const saySnippet: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `${context.snippet}`
}))

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
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

const proxyUrl = "https://cors-anywhere.herokuapp.com/";
const duckQuery = (query: string) =>
    fetch(new Request(proxyUrl+`https://api.duckduckgo.com/?q=${query}&format=json&skip_disambig=1`,
		      {headers: { 'Origin': 'http://localhost:3000' }})).then(data => data.json());

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
		RECOGNISED: {
		    target: 'query',
		    actions: assign((context) => { return { query: context.recResult } }),
                }
            },
	    ...promptAndAsk("What are you looking for?")
	},
	query: {
	    invoke: {
		id: 'duck',
                src: (context, event) => duckQuery(context.query),
                onDone: {
                    target: 'answer',
                    actions: [assign((context, event) => { return {snippet: event.data.AbstractText }}),
			      (context:SDSContext, event:any) => console.log(event.data)]
                },
		onError: {
                    target: 'welcome',
		    actions: (context,event) => console.log(event.data)
                }
            }
	},
        answer: {
	    entry: saySnippet,
	    on: { ENDSPEECH: 'init' }
	}
    }})


// S: What are you looking for?
// U: Gothenburg
// S: <smth from wikipedia>
