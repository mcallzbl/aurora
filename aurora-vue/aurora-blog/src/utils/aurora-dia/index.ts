import { i18n } from '@/locales'

// interface AWFConfig {
//   resourcePath: string
// }

// export class AuroraWaifu {
//   configs: AWFConfig = {
//     resourcePath: '/'
//   }
//
//   constructor(options?: AWFConfig) {
//     if (options?.resourcePath) this.configs.resourcePath = options.resourcePath
//     Promise.all([this.injectResources('live2d.min.js')]).then(() => {
//       new AuroraBotSoftware({
//         apiPath: 'https://cdn.jsdelivr.net/gh/fghrsh/live2d_api/',
//         locale: 'en',
//         containerId: 'waifu-tips',
//         messageId: 'waifu-tips'
//       })
//     })
//   }
//
//   async injectResources(url: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const tag = document.createElement('script')
//       tag.src = this.configs.resourcePath + url
//       tag.onload = () => resolve(url)
//       tag.onerror = () => reject(url)
//       document.head.appendChild(tag)
//     })
//   }
// }

// Typed structures for Dia i18n
export interface BotTip {
  selector: string
  text: string | string[]
}

export interface NthWeekdayRule {
  type: 'nth-weekday'
  month: number // 1-12
  weekday: number // 0=Sun..6=Sat
  nth: number // 1..5
}
export interface DiaEvent {
  date?: string
  rule?: NthWeekdayRule
  text: string | string[]
}

export interface DiaI18n {
  messages: string[]
  console: string
  copy: string
  visibility_change: string
  welcome: { [key: string]: string | string[] }
  referrer: Record<string, string>
  mouseover: BotTip[]
  click: BotTip[]
  events: DiaEvent[]
}

export interface DiaConfig {
  locale: string
  tips?: { [key: string]: { selector: string; text: string | string[] } }
}

export class AuroraDia {
  configs: DiaConfig = {
    locale: 'en',
    tips: {}
  }
  software = new AuroraBotSoftware()
  eyesAnimationTimer: number | undefined = undefined
  eyesController: AbortController | undefined = undefined

  installSoftware(configs: DiaConfig): void {
    if (configs) {
      this.configs.locale = configs.locale
      this.configs.tips = configs.tips
    }
    // Reuse existing software instance to avoid duplicate listeners/timers
    this.software.config = {
      ...this.software.config,
      locale: this.configs.locale,
      botScript: this.configs.tips,
      containerId: 'Aurora-Dia--tips-wrapper',
      messageId: 'Aurora-Dia--tips'
    }
  }

  on(): void {
    this.software.load()
    this.activateMotion()
  }

  destroy(): void {
    // cleanup software timers and listeners
    this.software.cleanup()
    // abort eyes listeners and timers
    if (this.eyesController) {
      this.eyesController.abort()
      this.eyesController = undefined
    }
    if (this.eyesAnimationTimer) {
      clearTimeout(this.eyesAnimationTimer)
      this.eyesAnimationTimer = undefined
    }
  }

  activateMotion(): void {
    const leftEye = document.getElementById('Aurora-Dia--left-eye')
    const rightEye = document.getElementById('Aurora-Dia--right-eye')
    const eyesEl = document.getElementById('Aurora-Dia--eyes')
    if (!(leftEye instanceof HTMLElement && rightEye instanceof HTMLElement && eyesEl instanceof HTMLElement)) return

    // Abort previous listeners if any
    if (this.eyesController) this.eyesController.abort()
    this.eyesController = new AbortController()
    const signal = this.eyesController.signal

    let rafId: number | null = null
    const handleMove = (evt: MouseEvent) => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        clearTimeout(this.eyesAnimationTimer)
        eyesEl.classList.add('moving')
        const rect = eyesEl.getBoundingClientRect()
        const x = -(rect.left - evt.clientX) / 100
        const y = -(rect.top - evt.clientY) / 120
        leftEye.style.transform = `translateY(${y}px) translateX(${x}px)`
        rightEye.style.transform = `translateY(${y}px) translateX(${x}px)`
        this.eyesAnimationTimer = window.setTimeout(() => {
          leftEye.style.transform = `translateY(0) translateX(0)`
          rightEye.style.transform = `translateY(0) translateX(0)`
          eyesEl.classList.remove('moving')
        }, 2000)
      })
    }
    document.addEventListener('mousemove', handleMove, { signal })
  }
}

interface ABConfig {
  botScript?: { [key: string]: { selector: string; text: string | string[] } }
  apiPath?: string
  botId?: string
  containerId: string
  messageId: string
  locale: string
}

type BotLocales = Record<string, DiaI18n>

function defaultDia(): DiaI18n {
  return {
    messages: [],
    console: '',
    copy: '',
    visibility_change: '',
    welcome: {},
    referrer: {},
    mouseover: [],
    click: [],
    events: []
  }
}

class AuroraBotSoftware {
  config: ABConfig = {
    botScript: {},
    containerId: '',
    messageId: '',
    botId: 'Aurora-Dia',
    locale: 'en'
  }
  messageCacheKey = '__AURORA_BOT_MESSAGE__'
  mouseoverEventCacheKey = '__AURORA_BOT_MOUSE_OVER__'
  userAction = false
  userActionTimer: number | undefined = undefined
  messageTimer: number | undefined = undefined
  activityIntervalId: number | undefined = undefined
  controller: AbortController | undefined = undefined
  messages: string[] = []
  locales: BotLocales = {}
  botTips: DiaI18n & Record<string, any> = defaultDia()

  constructor(configs?: ABConfig) {
    if (configs) {
      this.config = {
        botScript: configs.botScript ? configs.botScript : this.config.botScript,
        containerId: configs.containerId ? configs.containerId : '',
        messageId: configs.messageId ? configs.messageId : '',
        botId: 'Aurora-Dia',
        locale: configs.locale ? configs.locale : 'en'
      }
    }
  }

  load() {
    this.cleanup()

    this.loadLocaleMessages()
    this.injectBotScripts()
    this.messages = Array.isArray(this.botTips?.messages) ? this.botTips.messages : []
    // manage listeners via AbortController to avoid leaks
    this.controller = new AbortController()
    const signal = this.controller.signal
    window.addEventListener('mousemove', () => (this.userAction = true), { signal })
    window.addEventListener('keydown', () => (this.userAction = true), { signal })
    sessionStorage.removeItem(this.messageCacheKey)
    sessionStorage.removeItem(this.mouseoverEventCacheKey)

    this.activityIntervalId = window.setInterval(() => {
      if (this.userAction) {
        this.userAction = false
        if (this.userActionTimer) clearInterval(this.userActionTimer)
        this.userActionTimer = undefined
      } else if (!this.userActionTimer) {
        this.userActionTimer = window.setInterval(() => {
          this.showMessage(this.randomSelection(this.messages), 6000, 9)
        }, 20000)
      }
    }, 1000)

    this.registerEventListener(signal)
    setTimeout(() => {
      this.showWelcomeMessage()
    }, 3000)
  }

  cleanup() {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer)
      this.messageTimer = undefined
    }
    if (this.userActionTimer) {
      clearInterval(this.userActionTimer)
      this.userActionTimer = undefined
    }
    if (this.activityIntervalId) {
      clearInterval(this.activityIntervalId)
      this.activityIntervalId = undefined
    }
    if (this.controller) {
      this.controller.abort()
      this.controller = undefined
    }
  }

  injectBotScripts() {
    let botScriptKeys: string[] = []
    const botScript = this.config.botScript
    // Prefer project i18n's `dia` namespace; fallback to bundled JSON
    const siteLocale = this.config.locale === 'zh' ? 'zh' : 'en'
    const siteMsg = i18n.global.getLocaleMessage(siteLocale) as unknown as { dia?: DiaI18n }
    const i18nDia = siteMsg?.dia
    const base = defaultDia()
    if (i18nDia) {
      try {
        const clone = JSON.parse(JSON.stringify(i18nDia))
        Object.assign(base, clone)
      } catch {
        // Fallback to shallow assign if deep-clone fails (e.g., proxies)
        Object.assign(base, i18nDia as any)
      }
    }
    this.botTips = base

    if (botScript !== undefined) {
      botScriptKeys = Object.keys(botScript)

      if (botScriptKeys.length > 0) {
        botScriptKeys.forEach((key) => {
          ;(this.botTips as unknown as Record<string, unknown>)[key] = botScript[key]
        })
      }
    }
  }

  registerEventListener(signal?: AbortSignal) {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'F12') this.showMessage(this.botTips.console, 6000, 9)
    }
    document.addEventListener('keydown', onKeydown, { signal })
    document.addEventListener('copy', () => {
      this.showMessage(this.botTips.copy, 6000, 9)
    }, { signal })
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.showMessage(this.botTips.visibility_change, 6000, 9)
    }, { signal })
    if (this.botTips.mouseover && this.botTips.mouseover.length > 0) {
      document.addEventListener('mouseover', (event) => {
        for (const mouseoverEvents of this.botTips.mouseover) {
          const selector = mouseoverEvents.selector
          const raw = mouseoverEvents.text
          event.preventDefault()
          if (event.target && event.target instanceof HTMLElement) {
            if (!event.target.matches(selector)) continue
            // Avoid message keep popping.
            if (
              sessionStorage.getItem(this.mouseoverEventCacheKey) &&
              sessionStorage.getItem(this.mouseoverEventCacheKey) === selector
            )
              return

            let sel = this.randomSelection(raw)
            sel = sel.replace('{text}', event.target.innerText)
            this.showMessage(sel, 4000, 8)
            sessionStorage.setItem(this.mouseoverEventCacheKey, selector)
            window.setTimeout(() => {
              sessionStorage.removeItem(this.mouseoverEventCacheKey)
            }, 4000)
            return
          }
        }
      }, { signal })
    }
    if (this.botTips.click && this.botTips.click.length > 0) {
      document.addEventListener('click', (event) => {
        if (event.target && event.target instanceof HTMLElement)
          for (const mouseoverEvents of this.botTips.click) {
            const selector = mouseoverEvents.selector
            const raw = mouseoverEvents.text
            if (event.target && event.target instanceof HTMLElement) {
              if (!event.target.matches(selector)) continue
              let sel = this.randomSelection(raw)
              sel = sel.replace('{text}', event.target.innerText)
              this.showMessage(sel, 4000, 8)
              return
            }
          }
      }, { signal })
    }
    if (this.botTips.events && this.botTips.events.length > 0) {
      this.botTips.events.forEach((event: DiaEvent) => {
        const now = new Date()
        const curM = now.getMonth() + 1
        const curD = now.getDate()

        let matched = false
        // Computed rule: nth weekday of month (e.g., Mother's Day, Father's Day)
        if (event.rule && event.rule.type === 'nth-weekday') {
          const { month, weekday, nth } = event.rule
          const day = this.nthWeekdayOfMonth(now.getFullYear(), month, weekday, nth)
          if (day && curM === month && curD === day) matched = true
        } else if (event.date) {
          // Fixed date or range (MM/DD or MM/DD-MM/DD)
          const [after, beforeRaw] = event.date.split('-')
          const before = beforeRaw || after
          const [aMStr, aDStr] = after.split('/')
          const [bMStr, bDStr] = before.split('/')
          const aM = parseInt(aMStr, 10)
          const aD = parseInt(aDStr, 10)
          const bM = parseInt(bMStr, 10)
          const bD = parseInt(bDStr, 10)
          if (
            Number.isFinite(aM) &&
            Number.isFinite(aD) &&
            Number.isFinite(bM) &&
            Number.isFinite(bD) &&
            aM <= curM && curM <= bM &&
            aD <= curD && curD <= bD
          ) matched = true
        }

        if (matched) {
          const text = this.randomSelection(event.text)
          const msg = text.replace('{year}', String(now.getFullYear()))
          this.messages.push(msg)
        }
      })
    }
  }

  private nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): number | null {
    // month: 1-12, weekday: 0=Sunday..6=Saturday
    const first = new Date(year, month - 1, 1)
    const firstWeekday = first.getDay()
    let day = 1 + ((7 + weekday - firstWeekday) % 7) + (nth - 1) * 7
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day > daysInMonth) return null
    return day
  }

  showWelcomeMessage() {
    let text: string
    if (location.pathname === '/') {
      const now = new Date().getHours()
      let candidate: string | string[]
      if (now > 5 && now <= 7) candidate = this.botTips['welcome']['5_7']
      else if (now > 7 && now <= 11) candidate = this.botTips['welcome']['7_11']
      else if (now > 11 && now <= 13) candidate = this.botTips['welcome']['11_13']
      else if (now > 13 && now <= 17) candidate = this.botTips['welcome']['13_17']
      else if (now > 17 && now <= 19) candidate = this.botTips['welcome']['17_19']
      else if (now > 19 && now <= 21) candidate = this.botTips['welcome']['19_21']
      else if (now > 21 && now <= 23) candidate = this.botTips['welcome']['21_23']
      else candidate = this.botTips['welcome']['24']
      text = this.randomSelection(candidate)
    } else if (document.referrer !== '') {
      const referrer = new URL(document.referrer),
        domain = referrer.hostname.split('.')[1]
      if (location.hostname === referrer.hostname)
        text = this.botTips['referrer']['self'].replace('[PLACEHOLDER]', document.title.split(' - ')[0])
      else if (domain === 'baidu')
        text = this.botTips['referrer']['baidu'].replace(
          '[PLACEHOLDER]',
          referrer.search.split('&wd=')[1].split('&')[0]
        )
      else if (domain === 'so')
        text = this.botTips['referrer']['so'].replace('[PLACEHOLDER]', referrer.search.split('&q=')[1].split('&')[0])
      else if (domain === 'google')
        text = this.botTips['referrer']['google'].replace('[PLACEHOLDER]', document.title.split(' - ')[0])
      else text = this.botTips['referrer']['site'].replace('[PLACEHOLDER]', referrer.hostname)
    } else {
      text = this.botTips['referrer']['other'].replace('[PLACEHOLDER]', document.title.split(' - ')[0])
    }
    this.showMessage(text, 7000, 8)
  }

  loadLocaleMessages() {
    // Deprecated: We now use project i18n's `dia` namespace.
    this.locales = {}
  }

  showMessage(text: string, timeout: number, priority: number) {
    const cacheMessage = sessionStorage.getItem(this.messageCacheKey) ?? ''
    const currentPriority = cacheMessage ? parseInt(cacheMessage, 10) : -1
    if (!text || currentPriority > priority) return
    if (this.messageTimer) {
      clearTimeout(this.messageTimer)
      this.messageTimer = undefined
    }
    sessionStorage.setItem(this.messageCacheKey, String(priority))
    text = this.randomSelection(text)
    if (text === 'showQuote') {
      this.showQuote()
      return
    }
    const tipsContainerEl = document.getElementById(this.config.containerId)
    const tipsEl = document.getElementById(this.config.messageId)
    const diaEl = this.config.botId ? document.getElementById(this.config.botId) : null
    if (tipsEl && tipsContainerEl) {
      tipsEl.innerHTML = text
      tipsContainerEl.classList.add('active')
      diaEl?.classList.add('active')
      this.messageTimer = window.setTimeout(() => {
        sessionStorage.removeItem(this.messageCacheKey)
        tipsContainerEl.classList.remove('active')
        diaEl?.classList.remove('active')
      }, timeout)
    }
  }

  randomSelection(obj: string[] | string): string {
    return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : (obj as string)
  }

  showQuote() {
    if (this.config.locale === 'zh' || this.config.locale === 'cn') {
      this.getHitokoto()
    } else {
      this.getTheySaidSo()
    }
  }

  async getHitokoto() {
    try {
      const response = await fetch('https://v1.hitokoto.cn')
      if (!response.ok) throw new Error('Failed to fetch hitokoto')
      const result = await response.json()
      this.showMessage(result.hitokoto, 6000, 9)
    } catch (e) {
      console.error('hitokoto error', e)
    }
  }

  async getTheySaidSo() {
    try {
      const response = await fetch('https://quotes.rest/qod?language=en')
      if (!response.ok) throw new Error('Failed to fetch quotes')
      const result = await response.json()
      const quote = result?.contents?.quotes?.[0]?.quote
      if (quote) this.showMessage(quote, 6000, 9)
    } catch (e) {
      console.error('quotes error', e)
    }
  }
}
