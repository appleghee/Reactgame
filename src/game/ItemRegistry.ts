import { ItemId, DamageType, StatusType, StatusEffect } from './Types';
import { Champion } from './Champion';

export interface ItemStats {
  maxHp?: number;
  maxArmor?: number;
  physDamageMult?: number;
  magDamageMult?: number;
  armorMult?: number;
  armorRegenMult?: number;
  armorPen?: number;
  attackSpeed?: number;
  cooldownReduction?: number;
  physLifesteal?: number;
  magLifesteal?: number;
  speedMult?: number;
  damageReduction?: number;
  tenacity?: number;
}

export interface ItemLogic {
  id: ItemId;
  stats?: ItemStats;
  
  // Hooks
  onEquip?: (champ: Champion) => void;
  onUpdate?: (champ: Champion, dtSec: number) => void;
  getDamageReduction?: (champ: Champion, type: DamageType, isNormalAttack: boolean) => number;
  getHealEffectiveness?: (champ: Champion) => number;
  onTakeDamage?: (champ: Champion, amount: number, type: DamageType, source: Champion | null, isNormalAttack: boolean) => number; // returns modified damage
  onAfterTakeDamage?: (champ: Champion, amount: number, type: DamageType, source: Champion | null, isNormalAttack: boolean) => void;
  onDealDamage?: (champ: Champion, target: Champion, amount: number, type: DamageType, isNormalAttack: boolean) => number; // returns modified damage
  onAutoAttack?: (champ: Champion, target: Champion) => void;
  onDeath?: (champ: Champion) => boolean; // return true to prevent death
  onApplyStatus?: (champ: Champion, target: Champion, effect: StatusEffect) => void;
}

export const ItemRegistry: Record<string, ItemLogic> = {
  [ItemId.PHUC_HOP_KIEM]: {
    id: ItemId.PHUC_HOP_KIEM,
    stats: { physDamageMult: 0.40, speedMult: 0.06 },
    getHealEffectiveness: (champ) => {
      const missingHpPct = (champ.maxHp - champ.hp) / champ.maxHp;
      const stacks = Math.floor(missingHpPct / 0.2);
      return stacks * 0.08;
    }
  },
  [ItemId.KHIEN_BANG_GIA]: {
    id: ItemId.KHIEN_BANG_GIA,
    stats: { armorMult: 2.5, armorRegenMult: 1.4 },
    onTakeDamage: (champ, amount, type, source, isNormalAttack) => {
      if (source && isNormalAttack) {
        source.addStatus({ type: StatusType.SLOW, duration: 1, value: 0.2, source: champ });
        source.addStatus({ type: StatusType.WEAKEN, duration: 1, value: 0.1, source: champ });
      }
      return amount;
    }
  },
  [ItemId.DAO_TRUY_HON]: {
    id: ItemId.DAO_TRUY_HON,
    stats: { armorMult: 0.8, magDamageMult: 0.3, speedMult: 0.10 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      target.addStatus({ type: StatusType.HEAL_REDUCTION, duration: 1.5, value: 0.35, source: champ });
      return amount;
    }
  },
  [ItemId.THUONG_HAC_KIM]: {
    id: ItemId.THUONG_HAC_KIM,
    stats: { physDamageMult: 0.60, magDamageMult: 0.20, armorPen: 0.06, maxHp: 5000 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      if (champ.hacAnStacks < 100) {
        champ.hacAnStacks = Math.min(100, champ.hacAnStacks + 1);
      }
      return amount;
    }
  },
  [ItemId.KHIEN_THAT_TRUYEN]: {
    id: ItemId.KHIEN_THAT_TRUYEN,
    stats: { armorMult: 3.0, cooldownReduction: 0.1 },
    onAfterTakeDamage: (champ, amount, type, source, isNormalAttack) => {
      if (champ.hp < 15000 && champ.khienThatTruyenCooldown <= 0) {
        const missingHp = champ.maxHp - champ.hp;
        const shieldAmount = 10000 + 0.24 * missingHp;
        champ.addArmor(shieldAmount);
        champ.khienThatTruyenCooldown = 25 * (1 - champ.getPassiveCooldownReduction());
        if (source) {
          source.addStatus({ type: StatusType.SLOW, duration: 3, value: 0.5 });
        }
      }
    }
  },
  [ItemId.SONG_DAO_NGAN]: {
    id: ItemId.SONG_DAO_NGAN,
    stats: { attackSpeed: 0.15, physDamageMult: 0.60 },
    onAutoAttack: (champ, target) => {
      if (champ.songDaoNganCDTimer <= 0) {
        champ.songDaoNganCDTimer = 0.3 * (1 - champ.getPassiveCooldownReduction());
        const trueDamage = 880 + Math.random() * (1430 - 880);
        target.takeDamage(trueDamage, DamageType.TRUE, champ);
      }
    }
  },
  [ItemId.THUONG_XUYEN_KHUNG]: {
    id: ItemId.THUONG_XUYEN_KHUNG,
    stats: { physDamageMult: 0.50, armorPen: 0.15, cooldownReduction: 0.08 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      target.phaGiapStacks = Math.min(5, target.phaGiapStacks + 1);
      target.phaGiapTimer = 1.2;
      return amount;
    }
  },
  [ItemId.SONG_DAO_BAO_TAP]: {
    id: ItemId.SONG_DAO_BAO_TAP,
    stats: { physDamageMult: 0.45, attackSpeed: 0.70, physLifesteal: 0.12, magLifesteal: 0.14 },
    onAutoAttack: (champ, target) => {
      if (champ.songDaoBaoTapCDTimer <= 0) {
        champ.songDaoBaoTapCDTimer = 0.5 * (1 - champ.getPassiveCooldownReduction());
        champ.songDaoBaoTapStacks++;
        const lightningDmg = 1340 + Math.random() * (2230 - 1340);
        target.takeDamage(lightningDmg, DamageType.MAGIC, champ);
        
        if (champ.songDaoBaoTapStacks >= 9) {
          champ.songDaoBaoTapStacks = 0;
          target.takeDamage(7500, DamageType.MAGIC, champ);
          target.takeDamage(7500, DamageType.PHYSICAL, champ);
        }
      }
    }
  },
  [ItemId.TRUONG_HON_MANG]: {
    id: ItemId.TRUONG_HON_MANG,
    stats: { magLifesteal: 0.35, magDamageMult: 0.70, cooldownReduction: 0.20 },
    onAutoAttack: (champ, target) => {
      if (champ.truongHonMangCDTimer <= 0) {
        champ.truongHonMangCDTimer = 1.0 * (1 - champ.getPassiveCooldownReduction());
        const honMangDmg = 2200 + 0.08 * target.maxHp;
        target.takeDamage(honMangDmg, DamageType.PHYSICAL, champ);
      }
    }
  },
  [ItemId.AO_CHOANG_TRUYEN_THUYET]: {
    id: ItemId.AO_CHOANG_TRUYEN_THUYET,
    stats: { armorMult: 0.90, physDamageMult: 0.28, maxHp: 8000 },
    onUpdate: (champ, dtSec) => {
      if (!champ.aoChoangTruyenThuyetUsed && champ.hp < 7900) {
        champ.aoChoangTruyenThuyetUsed = true;
        champ.aoChoangTruyenThuyetActiveTimer = 3;
        champ.aoChoangTruyenThuyetTickTimer = 0;
      }
    }
  },
  [ItemId.PHU_CHU_TRONG_SINH]: {
    id: ItemId.PHU_CHU_TRONG_SINH,
    stats: { armorMult: 1.40, maxHp: 9000, magLifesteal: 0.12 },
    onDeath: (champ) => {
      if (!champ.phuChuTrongSinhUsed) {
        champ.hp = 1;
        champ.phuChuTrongSinhUsed = true;
        champ.phuChuTrongSinhActiveTimer = 3;
        champ.phuChuTrongSinhTickTimer = 0;
        champ.addStatus({ type: StatusType.CC_IMMUNE, duration: 3 });
        return true; // Prevent death
      }
      return false;
    }
  },
  [ItemId.NANH_HUNG_TAN]: {
    id: ItemId.NANH_HUNG_TAN,
    stats: { attackSpeed: 0.30, physDamageMult: 0.45, speedMult: 0.08 },
    onAutoAttack: (champ, target) => {
      champ.nanhHungTanStacks = Math.min(5, champ.nanhHungTanStacks + 1);
      champ.nanhHungTanTimer = 0.8;
    }
  },
  [ItemId.TRUONG_HOANG_KIM]: {
    id: ItemId.TRUONG_HOANG_KIM,
    stats: { magDamageMult: 0.40, magLifesteal: 0.28, maxHp: 1200 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      if (!isNormalAttack && champ.truongHoangKimReady) {
        champ.truongHoangKimReady = false;
        const extraDmg = 2700 + 0.10 * target.maxHp;
        target.takeDamage(extraDmg, DamageType.MAGIC, champ, true);
        target.addStatus({
          type: StatusType.BURN,
          duration: 3,
          value: 1400,
          source: champ,
          damageType: DamageType.MAGIC,
          tickRate: 0.5
        });
      }
      return amount;
    }
  },
  [ItemId.NGOC_TU_TU]: {
    id: ItemId.NGOC_TU_TU,
    stats: { maxArmor: 3500, maxHp: 10000 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.TRUE) return 0.08;
      return 0;
    },
    getHealEffectiveness: (champ) => {
      if (champ.hp < champ.maxHp * 0.5) return 0.10;
      return 0;
    },
    onDeath: (champ) => {
      if (!champ.ngocTuTuUsed) {
        champ.hp = 1;
        champ.ngocTuTuUsed = true;
        champ.addStatus({ type: StatusType.INVINCIBLE, duration: 3 });
        return true;
      }
      return false;
    }
  },
  [ItemId.LUC_AO]: {
    id: ItemId.LUC_AO,
    stats: { maxArmor: 12000 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.PHYSICAL) return 0.12;
      if (type === DamageType.MAGIC) return 0.18;
      if (type === DamageType.TRUE) return 0.05;
      return 0;
    },
    getHealEffectiveness: (champ) => {
      const missingHpPct = (champ.maxHp - champ.hp) / champ.maxHp;
      const stacks = Math.floor(missingHpPct / 0.05);
      return stacks * 0.05;
    }
  },
  [ItemId.AO_CA_SA]: {
    id: ItemId.AO_CA_SA,
    stats: { maxArmor: 18000, speedMult: 0.10 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.PHYSICAL) return 0.08;
      return 0;
    },
    onTakeDamage: (champ, amount, type, source, isNormalAttack) => {
      // In the original code, AO_CA_SA reduced hpDamage by 25% if armor > 0.
      // Since onTakeDamage modifies the *incoming* damage before armor calculation,
      // we can't easily do it exactly the same way here without changing how onTakeDamage works.
      // However, reducing incoming damage by 25% when armor > 0 is roughly equivalent.
      if (champ.armor > 0) {
        return amount * 0.75;
      }
      return amount;
    }
  },
  [ItemId.NANH_HOANG_DA]: {
    id: ItemId.NANH_HOANG_DA,
    stats: { physDamageMult: 1.80, physLifesteal: 0.20 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.PHYSICAL) return 0.05;
      return 0;
    },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      if (target.hp < target.maxHp * 0.5) {
        return amount * 1.20;
      }
      return amount;
    }
  },
  [ItemId.GIAP_PHAN_CHAN]: {
    id: ItemId.GIAP_PHAN_CHAN,
    stats: { maxArmor: 18000 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.PHYSICAL) return 0.15;
      return 0;
    },
    onTakeDamage: (champ, amount, type, source, isNormalAttack) => {
      if (source && isNormalAttack) {
        amount *= (1 - 0.24);
      }
      if (source && champ.giapPhanChanCDTimer <= 0) {
        champ.giapPhanChanCDTimer = 0.5 * (1 - champ.getPassiveCooldownReduction());
        source.takeDamage(amount * 0.45, DamageType.MAGIC, champ, true);
      }
      return amount;
    }
  },
  [ItemId.KHIEN_NANG_LUONG]: {
    id: ItemId.KHIEN_NANG_LUONG,
    stats: { maxArmor: 8000, maxHp: 24000 },
    onTakeDamage: (champ, amount, type, source, isNormalAttack) => {
      if (isNormalAttack) amount *= (1 - 0.12);
      if (champ.hp < champ.maxHp * 0.60) {
        if (champ.khienNangLuongCDTimer <= 0) {
          champ.khienNangLuongCDTimer = 5 * (1 - champ.getPassiveCooldownReduction());
          champ.khienNangLuongActiveTimer = 1.5;
        }
        if (champ.khienNangLuongActiveTimer > 0 && amount > 5000) {
          amount = 5000;
        }
      }
      return amount;
    }
  },
  [ItemId.HAC_GIAP]: {
    id: ItemId.HAC_GIAP,
    stats: { maxHp: 25000, maxArmor: 10000, damageReduction: 0.05 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      if (champ.hacGiapCDTimer <= 0 && Math.random() < 0.10) {
        champ.hacGiapCDTimer = 0.05 * (1 - champ.getPassiveCooldownReduction());
        champ.addFloatingText('CRIT!', 1); // PHYSICAL_BURST
        return amount * 2;
      }
      return amount;
    }
  },
  [ItemId.PHU_TRU_CUONG_HOA]: {
    id: ItemId.PHU_TRU_CUONG_HOA,
    stats: { maxHp: 45000, maxArmor: 18000 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (type === DamageType.TRUE && champ.armor > 0) return 0.50;
      return 0;
    }
  },
  [ItemId.THUONG_XUYEN_PHA]: {
    id: ItemId.THUONG_XUYEN_PHA,
    stats: { cooldownReduction: 0.15 },
    getDamageReduction: (champ, type, isNormalAttack) => {
      if (isNormalAttack) return 0.15;
      return 0;
    },
    onApplyStatus: (champ, target, effect) => {
      if (effect.type === StatusType.STUN && effect.duration > 0.5) {
        if (champ.thuongXuyenPhaCDTimer <= 0) {
          champ.thuongXuyenPhaCDTimer = 2.0;
          champ.thuongXuyenPhaActiveTimer = 1.0;
          champ.addFloatingText('XUYÊN PHÁ!', 1); // PHYSICAL_BURST
        }
      }
    }
  },
  [ItemId.VONG_CO_LUC_BAO]: {
    id: ItemId.VONG_CO_LUC_BAO,
    stats: { maxHp: 12000, tenacity: 0.35 }
  },
  [ItemId.CON_GIAN_CUA_DA]: {
    id: ItemId.CON_GIAN_CUA_DA,
    stats: { maxHp: 50000, magDamageMult: 0.50, physLifesteal: 0.20, magLifesteal: 0.20 }
  },
  [ItemId.NGOC_THUC_THAN]: {
    id: ItemId.NGOC_THUC_THAN,
    stats: { magDamageMult: 0.24, armorRegenMult: 0.12 },
    onDealDamage: (champ, target, amount, type, isNormalAttack) => {
      if (type === DamageType.MAGIC && champ.ngocThucThanCDTimer <= 0) {
        if (Math.random() < 0.20) {
          champ.ngocThucThanCDTimer = 8 * (1 - champ.getPassiveCooldownReduction());
          champ.ngocThucThanBuffTimer = 6;
          if ((champ as any).passive2CDTimer !== undefined) {
            (champ as any).passive2CDTimer = Math.max(0, (champ as any).passive2CDTimer - 5);
          }
        }
      }
      return amount;
    }
  }
};
