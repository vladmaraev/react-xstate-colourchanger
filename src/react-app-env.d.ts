/// <reference types="react-scripts" />
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        webkitSpeechGrammarList: any;
        webkitSpeechRecognitionEvent: any;
    }
};
declare module 'react-speech-kit';
