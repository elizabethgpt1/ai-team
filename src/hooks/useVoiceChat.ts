import { useEffect, useRef, useState } from "react";

type QueueItem = {
  text: string;
  agentId: string;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

type UseVoiceChatProps = {
  onTranscript?: (text: string) => void;
};

export function useVoiceChat({ onTranscript }: UseVoiceChatProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const ttsQueueRef = useRef<QueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();

    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, 15000);
  };

  const stopTts = () => {
    stopRequestedRef.current = true;
    ttsQueueRef.current = [];

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.stop();
      stopTts();
    };
  }, []);

  const unlockAudio = async () => {
    try {
      const audio = new Audio(
        "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA"
      );
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;

      setAudioUnlocked(true);
      setAudioBlocked(false);
    } catch (error) {
      setAudioUnlocked(false);
    }
  };

  const speakText = async (text: string, agentId: string) => {
    if (!ttsEnabled) return;
    if (stopRequestedRef.current) return;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          agentId,
        }),
      });

      if (!res.ok) {
        console.error("TTS request failed");
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          reject(new Error("Audio playback failed"));
        };

        audio
          .play()
          .then(() => {
            setAudioBlocked(false);
          })
          .catch((error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.error("Speech playback error:", error);
      setAudioBlocked(true);
    }
  };

  const processQueue = async () => {
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;

    while (ttsQueueRef.current.length > 0) {
      if (stopRequestedRef.current) {
        break;
      }

      const item = ttsQueueRef.current.shift();

      if (!item) continue;

      await speakText(item.text, item.agentId);
    }

    isPlayingRef.current = false;
    stopRequestedRef.current = false;
  };

  const queueText = (text: string, agentId: string) => {
    if (!ttsEnabled) return;

    stopRequestedRef.current = false;
    ttsQueueRef.current.push({ text, agentId });
    void processQueue();
  };

  const startListening = () => {
    setMicDenied(false);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript;

      if (onTranscript) {
        onTranscript(transcript);
      }

      startSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setMicDenied(true);
      }

      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
    };

    try {
      recognition.start();
      setIsListening(true);
      startSilenceTimer();
    } catch (error) {
      setIsListening(false);
      clearSilenceTimer();
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleTts = async () => {
    if (ttsEnabled) {
      stopTts();
    }

    const nextValue = !ttsEnabled;
    setTtsEnabled(nextValue);

    if (nextValue) {
      stopRequestedRef.current = false;
      await unlockAudio();
    }
  };

  return {
    isListening,
    micDenied,
    speechSupported,
    ttsEnabled,
    audioUnlocked,
    audioBlocked,
    startListening,
    stopListening,
    toggleListening,
    unlockAudio,
    speakText,
    queueText,
    stopTts,
    toggleTts,
  };
}