import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  SpeechRecognitionConstructorLike,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from '@/interface/speech'

interface SpeechRecognitionOptions {
  lang?: string
  onFinal?: (text: string) => void
  onInterim?: (text: string) => void
}

function speechConstructor(): SpeechRecognitionConstructorLike | undefined {
  if (typeof window === 'undefined') return undefined
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

function errorText(event: SpeechRecognitionErrorEventLike) {
  switch (event.error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风权限被拒绝，请在浏览器设置中允许后重试。'
    case 'audio-capture':
      return '没有检测到可用的麦克风，请检查设备。'
    case 'no-speech':
      return '没有听到声音，请靠近麦克风再试一次。'
    case 'network':
      return '语音识别网络异常，请稍后重试。'
    case 'language-not-supported':
      return '当前浏览器不支持中文语音识别。'
    default:
      return event.message || '语音输入失败，请稍后重试。'
  }
}

/**
 * 浏览器原生语音识别封装。Chrome / Edge 可直接使用；不支持的浏览器
 * 会返回 supported=false，调用方保留手动输入路径。
 */
export function useSpeechRecognition({
  lang = 'zh-CN',
  onFinal,
  onInterim,
}: SpeechRecognitionOptions = {}) {
  const [supported, setSupported] = useState(() => Boolean(speechConstructor()))
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const activeRef = useRef(false)
  const restartTimerRef = useRef<number | null>(null)
  const onFinalRef = useRef(onFinal)
  const onInterimRef = useRef(onInterim)

  useEffect(() => {
    onFinalRef.current = onFinal
    onInterimRef.current = onInterim
  }, [onFinal, onInterim])

  const clearRestart = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    clearRestart()
    setListening(false)
    onInterimRef.current?.('')
    recognitionRef.current?.stop()
  }, [clearRestart])

  const start = useCallback(() => {
    const Constructor = speechConstructor()
    if (!Constructor) {
      setSupported(false)
      setError(
        '当前浏览器不支持语音输入，请使用 Chrome / Edge，或直接手动输入。'
      )
      return
    }

    clearRestart()
    setError('')
    recognitionRef.current?.abort()

    const recognition = new Constructor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current?.(text.trim())
        } else {
          interim += text
        }
      }
      onInterimRef.current?.(interim.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'aborted') return
      activeRef.current = false
      setListening(false)
      onInterimRef.current?.('')
      setError(errorText(event))
    }

    recognition.onend = () => {
      if (!activeRef.current) {
        setListening(false)
        onInterimRef.current?.('')
        return
      }
      // Chrome 在静音一段时间后会结束识别，保持录音状态时自动续接。
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null
        if (!activeRef.current) return
        try {
          recognition.start()
        } catch {
          activeRef.current = false
          setListening(false)
        }
      }, 250)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      activeRef.current = true
      setListening(true)
    } catch {
      activeRef.current = false
      setListening(false)
      setError('语音输入启动失败，请稍后重试。')
    }
  }, [clearRestart, lang])

  useEffect(() => {
    return () => {
      activeRef.current = false
      clearRestart()
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [clearRestart])

  return {
    supported,
    listening,
    error,
    start,
    stop,
    clearError: () => setError(''),
  }
}
