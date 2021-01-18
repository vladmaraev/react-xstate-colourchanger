/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: string;
    nluData: any;
    ttsAgenda: string
}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'MATCH' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'SPEAK', value: string };


interface DMContext extends SDSContext {
    person: string,
}
