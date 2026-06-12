'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type GoogleCredentialResponse = {
  credential?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            ux_mode?: 'popup' | 'redirect'
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              type?: 'standard' | 'icon'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

type GoogleAuthButtonProps = {
  mode: 'login' | 'signup'
  name?: string
  phone?: string
  userType?: 'customer' | 'salon_owner'
  disabled?: boolean
  disabledLabel?: string
  onError: (message: string) => void
}

const GOOGLE_SCRIPT_ID = 'google-identity-services'

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
}

export default function GoogleAuthButton({
  mode,
  name,
  phone,
  userType,
  disabled,
  disabledLabel,
  onError,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const { continueWithGoogle } = useAuth()
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    let cancelled = false

    if (!clientId || disabled || !containerRef.current) {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      return
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return
        }

        containerRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async (response) => {
            if (!response.credential) {
              onError('Google did not return a sign-in credential')
              return
            }

            setAuthLoading(true)
            onError('')

            try {
              await continueWithGoogle(response.credential, {
                mode,
                name,
                phone,
                userType,
              })
            } catch (error) {
              onError(error instanceof Error ? error.message : 'Google authentication failed')
            } finally {
              setAuthLoading(false)
            }
          },
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          width: 336,
        })
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : 'Failed to load Google sign-in')
      })

    return () => {
      cancelled = true
    }
  }, [clientId, continueWithGoogle, disabled, mode, name, onError, phone, userType])

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-500"
      >
        Google sign-in unavailable
      </button>
    )
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-500"
      >
        {disabledLabel || 'Continue with Google'}
      </button>
    )
  }

  return (
    <div className="flex min-h-10 w-full justify-center">
      {authLoading ? (
        <button
          type="button"
          disabled
          className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-300"
        >
          Connecting to Google...
        </button>
      ) : (
        <div ref={containerRef} className="min-h-10 w-full" />
      )}
    </div>
  )
}
