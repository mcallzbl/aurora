import { defineStore } from 'pinia'
import { AuroraDia } from '@/utils/aurora-dia'
import type { DiaConfig } from '@/utils/aurora-dia'

export const useDiaStore = defineStore('diaStore', {
  state: () => {
    return {
      dia: new AuroraDia(),
      aurora_bot: {
        enable: true,
        locale: 'zh-CN',
        bot_type: 'dia'
      }
    }
  },
  actions: {
    initializeBot(configs: DiaConfig): void {
      this.dia.installSoftware(configs)
      this.dia.on()
    }
  }
})
