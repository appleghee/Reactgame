import { Ball } from './Ball';
import { Vector2 } from './Vector2';
import { DamageType, StatusEffect, StatusType, FloatingText, FloatingTextType, ItemId } from './Types';

export class Champion extends Ball {
  name: string;
  baseMaxHp: number;
  hp: number;
  baseMaxArmor: number;
  armor: number;
  virtualHealth: number = 0;
  damageReduction: number = 0;
  statuses: StatusEffect[] = [];
  floatingTexts: FloatingText[] = [];
  buffTexts: { text: string, timer: number }[] = [];
  armorRegenTimer: number = 0;
  isDead: boolean = false;
  isGhost: boolean = false;
  isPlayer: boolean = false;
  items: ItemId[] = [];
  hacAnStacks: number = 0;
  khienThatTruyenCooldown: number = 0;
  hitFlashTimer: number = 0;
  baseAttackSpeed: number = 0;
  songDaoNganCDTimer: number = 0;
  songDaoBaoTapCDTimer: number = 0;
  songDaoBaoTapStacks: number = 0;
  conGianCuaDaHitTimer: number = 0;
  conGianCuaDaCDTimer: number = 0;
  truongHonMangCDTimer: number = 0;
  phaGiapStacks: number = 0;
  phaGiapTimer: number = 0;
  armorReductionTimer: number = 0;
  armorReductionValue: number = 0;

  aoChoangTruyenThuyetUsed: boolean = false;
  aoChoangTruyenThuyetActiveTimer: number = 0;
  aoChoangTruyenThuyetTickTimer: number = 0;

  ngocTuTuUsed: boolean = false;

  phuChuTrongSinhUsed: boolean = false;
  phuChuTrongSinhActiveTimer: number = 0;
  phuChuTrongSinhTickTimer: number = 0;
  phuChuTrongSinhBuffTimer: number = 0;

  nanhHungTanStacks: number = 0;
  nanhHungTanTimer: number = 0;

  truongHoangKimTimer: number = 0;
  truongHoangKimReady: boolean = false;

  giapPhanChanCDTimer: number = 0;
  khienNangLuongCDTimer: number = 0;
  khienNangLuongActiveTimer: number = 0;
  hacGiapCDTimer: number = 0;
  phuTruCuongHoaRegenTimer: number = 0;

  thuongXuyenPhaCDTimer: number = 0;
  thuongXuyenPhaActiveTimer: number = 0;
  vongCoLucBaoTickTimer: number = 0;
  ngocThucThanCDTimer: number = 0;
  ngocThucThanBuffTimer: number = 0;

  get maxHp(): number {
    let flatHp = 0;
    flatHp += 5000 * this.getItemCount(ItemId.THUONG_HAC_KIM);
    flatHp += 8000 * this.getItemCount(ItemId.AO_CHOANG_TRUYEN_THUYET);
    flatHp += 9000 * this.getItemCount(ItemId.PHU_CHU_TRONG_SINH);
    flatHp += 1200 * this.getItemCount(ItemId.TRUONG_HOANG_KIM);
    flatHp += 10000 * this.getItemCount(ItemId.NGOC_TU_TU);
    flatHp += 24000 * this.getItemCount(ItemId.KHIEN_NANG_LUONG);
    flatHp += 25000 * this.getItemCount(ItemId.HAC_GIAP);
    flatHp += 45000 * this.getItemCount(ItemId.PHU_TRU_CUONG_HOA);
    flatHp += 12000 * this.getItemCount(ItemId.VONG_CO_LUC_BAO);
    flatHp += 50000 * this.getItemCount(ItemId.CON_GIAN_CUA_DA);
    return this.baseMaxHp + flatHp;
  }

  constructor(x: number, y: number, radius: number, color: string, name: string, maxHp: number, maxArmor: number) {
    super(x, y, radius, color);
    this.name = name;
    this.baseMaxHp = maxHp;
    this.hp = this.maxHp;
    this.baseMaxArmor = maxArmor;
    this.armor = this.getMaxArmor();
  }

  hasItem(itemId: ItemId): boolean {
    return this.items.includes(itemId);
  }

  getItemCount(itemId: ItemId): number {
    return this.items.filter(i => i === itemId).length;
  }

  getPhysDamageMult(): number {
    return 1 + 0.40 * this.getItemCount(ItemId.PHUC_HOP_KIEM) + 0.60 * this.getItemCount(ItemId.THUONG_HAC_KIM) + 0.60 * this.getItemCount(ItemId.SONG_DAO_NGAN) + 0.50 * this.getItemCount(ItemId.THUONG_XUYEN_KHUNG) + 0.45 * this.getItemCount(ItemId.SONG_DAO_BAO_TAP) + 0.28 * this.getItemCount(ItemId.AO_CHOANG_TRUYEN_THUYET) + 0.45 * this.getItemCount(ItemId.NANH_HUNG_TAN) + 1.80 * this.getItemCount(ItemId.NANH_HOANG_DA) + (1200 / this.baseMaxHp) * this.getItemCount(ItemId.PHU_TRU_CUONG_HOA) + (780 / this.baseMaxHp) * this.getItemCount(ItemId.THUONG_XUYEN_PHA);
  }

  getMagDamageMult(): number {
    return 1 + 0.30 * this.getItemCount(ItemId.DAO_TRUY_HON) + 0.20 * this.getItemCount(ItemId.THUONG_HAC_KIM) + 0.70 * this.getItemCount(ItemId.TRUONG_HON_MANG) + 0.40 * this.getItemCount(ItemId.TRUONG_HOANG_KIM) + 0.50 * this.getItemCount(ItemId.CON_GIAN_CUA_DA);
  }

  getArmorMult(): number {
    return 1 + 2.50 * this.getItemCount(ItemId.KHIEN_BANG_GIA) + 0.80 * this.getItemCount(ItemId.DAO_TRUY_HON) + 3.00 * this.getItemCount(ItemId.KHIEN_THAT_TRUYEN) + 0.90 * this.getItemCount(ItemId.AO_CHOANG_TRUYEN_THUYET) + 1.40 * this.getItemCount(ItemId.PHU_CHU_TRONG_SINH);
  }

  getArmorRegenMult(): number {
    return 1 + 1.40 * this.getItemCount(ItemId.KHIEN_BANG_GIA);
  }

  getArmorPen(): number {
    return 0.06 * this.getItemCount(ItemId.THUONG_HAC_KIM) + 0.15 * this.getItemCount(ItemId.THUONG_XUYEN_KHUNG);
  }

  getAttackSpeed(): number {
    return this.baseAttackSpeed + 0.15 * this.getItemCount(ItemId.SONG_DAO_NGAN) + 0.70 * this.getItemCount(ItemId.SONG_DAO_BAO_TAP) + 0.30 * this.getItemCount(ItemId.NANH_HUNG_TAN) + 0.10 * this.nanhHungTanStacks;
  }

  getPassiveCooldownReduction(): number {
    let cdr = 0;
    if (this.hasItem(ItemId.KHIEN_THAT_TRUYEN)) cdr += 0.1;
    cdr += 0.08 * this.getItemCount(ItemId.THUONG_XUYEN_KHUNG);
    cdr += 0.20 * this.getItemCount(ItemId.TRUONG_HON_MANG);
    cdr += 0.15 * this.getItemCount(ItemId.THUONG_XUYEN_PHA);
    return Math.min(0.4, cdr); // Cap at 40% CDR
  }

  getCooldownMultiplier(): number {
    return 1 / (1 - this.getPassiveCooldownReduction());
  }

  getMaxArmor(): number {
    let flatArmor = 0;
    flatArmor += 3500 * this.getItemCount(ItemId.NGOC_TU_TU);
    flatArmor += 12000 * this.getItemCount(ItemId.LUC_AO);
    flatArmor += 18000 * this.getItemCount(ItemId.AO_CA_SA);
    flatArmor += 18000 * this.getItemCount(ItemId.GIAP_PHAN_CHAN);
    flatArmor += 8000 * this.getItemCount(ItemId.KHIEN_NANG_LUONG);
    flatArmor += 10000 * this.getItemCount(ItemId.HAC_GIAP);
    flatArmor += 18000 * this.getItemCount(ItemId.PHU_TRU_CUONG_HOA);
    return (this.baseMaxArmor + flatArmor) * this.getArmorMult();
  }

  getDamageDealtMult(): number {
    let mult = 1;
    for (const s of this.statuses) {
      if (s.type === StatusType.WEAKEN && s.value) {
        mult *= (1 - s.value);
      }
    }
    if (this.hacAnStacks >= 100) {
      mult *= 1.3;
    }
    if (this.thuongXuyenPhaActiveTimer > 0) {
      mult *= 3.0; // +200% damage = 300% total
    }
    return mult;
  }

  hasStatus(type: StatusType): boolean {
    return this.statuses.some(s => s.type === type);
  }

  addStatus(effect: StatusEffect) {
    if (effect.type === StatusType.STUN || effect.type === StatusType.SLOW) {
      if (this.hasStatus(StatusType.CC_IMMUNE) || this.hasStatus(StatusType.INVINCIBLE)) return;
      
      // Tenacity from Vong Co Luc Bao
      if (this.hasItem(ItemId.VONG_CO_LUC_BAO)) {
        effect.duration *= (1 - 0.35);
      }
    }
    if (effect.type === StatusType.SUPPRESS) {
      if (this.hasStatus(StatusType.INVINCIBLE)) return;
    }
    
    // Thương Xuyên Phá: If stunning an enemy for more than 0.5s
    if (effect.type === StatusType.STUN && effect.duration > 0.5 && effect.source instanceof Champion) {
      if (effect.source.hasItem(ItemId.THUONG_XUYEN_PHA) && effect.source.thuongXuyenPhaCDTimer <= 0) {
        effect.source.thuongXuyenPhaCDTimer = 2.0;
        effect.source.thuongXuyenPhaActiveTimer = 1.0;
        effect.source.addFloatingText('XUYÊN PHÁ!', FloatingTextType.PHYSICAL_BURST);
      }
    }

    const existing = this.statuses.find(s => s.type === effect.type && s.value === effect.value && s.source === effect.source);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
      return;
    }

    this.statuses.push(effect);
  }

  addFloatingText(text: string, type: FloatingTextType) {
    const isBurst = type === FloatingTextType.PHYSICAL_BURST || type === FloatingTextType.MAGIC_BURST || type === FloatingTextType.TRUE;
    const maxLife = isBurst ? 1.5 : 0.8;
    
    this.floatingTexts.push({
      text,
      type,
      x: this.pos.x + (Math.random() * 40 - 20),
      y: this.pos.y - this.radius - (Math.random() * 20),
      vx: (Math.random() * 20 - 10),
      vy: -30 - Math.random() * 20,
      life: maxLife,
      maxLife
    });
  }

  addBuffText(text: string, timer: number) {
    const existing = this.buffTexts.find(b => b.text === text);
    if (existing) {
      existing.timer = Math.max(existing.timer, timer);
    } else {
      this.buffTexts.push({ text, timer });
    }
  }

  getDamageReduction(type: DamageType, isNormalAttack: boolean = false): number {
    let dr = this.damageReduction;
    if (this.phuChuTrongSinhBuffTimer > 0) {
      dr += 0.20;
    }
    dr += this.nanhHungTanStacks * 0.01;

    if (this.hasItem(ItemId.NGOC_TU_TU) && type === DamageType.TRUE) {
      dr += 0.08;
    }
    if (this.hasItem(ItemId.LUC_AO)) {
      if (type === DamageType.PHYSICAL) dr += 0.12;
      else if (type === DamageType.MAGIC) dr += 0.18;
      else if (type === DamageType.TRUE) dr += 0.05;
    }
    if (this.hasItem(ItemId.AO_CA_SA) && type === DamageType.PHYSICAL) {
      dr += 0.08;
    }
    if (this.hasItem(ItemId.NANH_HOANG_DA) && type === DamageType.PHYSICAL) {
      dr += 0.05;
    }
    if (this.hasItem(ItemId.GIAP_PHAN_CHAN) && type === DamageType.PHYSICAL) {
      dr += 0.15;
    }
    if (this.hasItem(ItemId.THUONG_XUYEN_PHA) && isNormalAttack) {
      dr += 0.15;
    }
    if (this.hasItem(ItemId.HAC_GIAP)) {
      dr += 0.05;
    }
    if (this.hasItem(ItemId.PHU_TRU_CUONG_HOA) && type === DamageType.TRUE && this.armor > 0) {
      dr += 0.50;
    }

    return Math.min(1, dr);
  }

  triggerAutoAttackEffects(target: Champion) {
    if (this.hasItem(ItemId.NANH_HUNG_TAN)) {
      this.nanhHungTanStacks = Math.min(5, this.nanhHungTanStacks + 1);
      this.nanhHungTanTimer = 0.8;
    }

    if (this.hasItem(ItemId.SONG_DAO_NGAN) && this.songDaoNganCDTimer <= 0) {
      this.songDaoNganCDTimer = 0.3 * (1 - this.getPassiveCooldownReduction());
      const trueDamage = 880 + Math.random() * (1430 - 880);
      target.takeDamage(trueDamage, DamageType.TRUE, this);
    }

    if (this.hasItem(ItemId.SONG_DAO_BAO_TAP) && this.songDaoBaoTapCDTimer <= 0) {
      this.songDaoBaoTapCDTimer = 0.5 * (1 - this.getPassiveCooldownReduction());
      this.songDaoBaoTapStacks++;
      const lightningDmg = 1340 + Math.random() * (2230 - 1340);
      target.takeDamage(lightningDmg, DamageType.MAGIC, this);
      
      if (this.songDaoBaoTapStacks >= 9) {
        this.songDaoBaoTapStacks = 0;
        target.takeDamage(7500, DamageType.MAGIC, this);
        target.takeDamage(7500, DamageType.PHYSICAL, this);
      }
    }

    if (this.hasItem(ItemId.TRUONG_HON_MANG) && this.truongHonMangCDTimer <= 0) {
      this.truongHonMangCDTimer = 1.0 * (1 - this.getPassiveCooldownReduction());
      const honMangDmg = 2200 + 0.08 * target.maxHp;
      target.takeDamage(honMangDmg, DamageType.PHYSICAL, this);
    }
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    if (this.hasStatus(StatusType.INVINCIBLE) || this.hasStatus(StatusType.IMMUNE) || this.hasStatus(StatusType.UNTARGETABLE)) return;
    if (this.phuChuTrongSinhActiveTimer > 0 && type === DamageType.MAGIC) return;

    let finalDamage = amount * (1 - this.getDamageReduction(type, isNormalAttack));
    
    // Item: Giáp Phản Chấn & Khiên Năng lượng (Damage reduction from auto-attacks)
    if (isNormalAttack) {
      if (this.hasItem(ItemId.GIAP_PHAN_CHAN)) finalDamage *= (1 - 0.24);
      if (this.hasItem(ItemId.KHIEN_NANG_LUONG)) finalDamage *= (1 - 0.12);
    }

    if (source) {
      if (!isNormalAttack && !isStatusDamage && source.hasItem(ItemId.CON_GIAN_CUA_DA)) {
        if (source.conGianCuaDaHitTimer > 0 && source.conGianCuaDaCDTimer <= 0) {
          const s = source as any;
          if (s.passive1Timer !== undefined) s.passive1Timer *= 0.5;
          if (s.passive2Timer !== undefined) s.passive2Timer *= 0.5;
          if (s.passive3Timer !== undefined) s.passive3Timer *= 0.5;
          if (s.passive4Timer !== undefined) s.passive4Timer *= 0.5;
          if (s.passive5Timer !== undefined) s.passive5Timer *= 0.5;
          if (s.p1CDTimer !== undefined) s.p1CDTimer *= 0.5;
          if (s.p2CDTimer !== undefined) s.p2CDTimer *= 0.5;
          if (s.p3CDTimer !== undefined) s.p3CDTimer *= 0.5;
          if (s.p4CDTimer !== undefined) s.p4CDTimer *= 0.5;
          if (s.p5CDTimer !== undefined) s.p5CDTimer *= 0.5;
          if (s.p6CDTimer !== undefined) s.p6CDTimer *= 0.5;
          if (s.passive1CDTimer !== undefined) s.passive1CDTimer *= 0.5;
          if (s.passive2CDTimer !== undefined) s.passive2CDTimer *= 0.5;
          if (s.passive3CDTimer !== undefined) s.passive3CDTimer *= 0.5;
          if (s.passive4CDTimer !== undefined) s.passive4CDTimer *= 0.5;
          if (s.passive5CDTimer !== undefined) s.passive5CDTimer *= 0.5;
          if (s.ultCDTimer !== undefined) s.ultCDTimer *= 0.5;
          if (s.ultCooldown !== undefined) s.ultCooldown *= 0.5;
          if (s.ultTimer !== undefined) s.ultTimer *= 0.5;
          source.conGianCuaDaCDTimer = 1.0;
          source.addFloatingText('CUỒNG NỘ!', FloatingTextType.HEAL);
        }
        source.conGianCuaDaHitTimer = 0.8;
      }

      // Item: Hắc Giáp (Critical Strike)
      if (source.hasItem(ItemId.HAC_GIAP) && source.hacGiapCDTimer <= 0) {
        if (Math.random() < 0.10) {
          finalDamage *= 2;
          source.hacGiapCDTimer = 0.05 * (1 - source.getPassiveCooldownReduction());
          // Reduce passive cooldown by 5%
          const cdr = 0.95;
          source.khienThatTruyenCooldown *= cdr;
          source.songDaoNganCDTimer *= cdr;
          source.songDaoBaoTapCDTimer *= cdr;
          source.truongHonMangCDTimer *= cdr;
          source.giapPhanChanCDTimer *= cdr;
          source.khienNangLuongCDTimer *= cdr;
          
          // Try to reduce common timer names in subclasses
          const s = source as any;
          if (s.passive1Timer !== undefined) s.passive1Timer *= cdr;
          if (s.passive2Timer !== undefined) s.passive2Timer *= cdr;
          if (s.passive3Timer !== undefined) s.passive3Timer *= cdr;
          if (s.passive4Timer !== undefined) s.passive4Timer *= cdr;
          if (s.passive5Timer !== undefined) s.passive5Timer *= cdr;
          if (s.p1CDTimer !== undefined) s.p1CDTimer *= cdr;
          if (s.p2CDTimer !== undefined) s.p2CDTimer *= cdr;
          if (s.p3CDTimer !== undefined) s.p3CDTimer *= cdr;
          if (s.p4CDTimer !== undefined) s.p4CDTimer *= cdr;
          if (s.p5CDTimer !== undefined) s.p5CDTimer *= cdr;
          if (s.p6CDTimer !== undefined) s.p6CDTimer *= cdr;
          if (s.passive1CDTimer !== undefined) s.passive1CDTimer *= cdr;
          if (s.passive3CDTimer !== undefined) s.passive3CDTimer *= cdr;
          if (s.passive4CDTimer !== undefined) s.passive4CDTimer *= cdr;
          if (s.passive5CDTimer !== undefined) s.passive5CDTimer *= cdr;
          if (s.ultCDTimer !== undefined) s.ultCDTimer *= cdr;
          if (s.ultCooldown !== undefined) s.ultCooldown *= cdr;
          
          source.addFloatingText('CRIT!', FloatingTextType.PHYSICAL_BURST);
        }
      }

      if (!isStatusDamage && source.hasItem(ItemId.TRUONG_HOANG_KIM) && source.truongHoangKimReady) {
        source.truongHoangKimReady = false;
        const extraDmg = 2700 + 0.10 * this.maxHp;
        // Apply extra magic damage
        this.takeDamage(extraDmg, DamageType.MAGIC, source, true);
        this.addStatus({
          type: StatusType.BURN,
          duration: 3,
          value: 1400,
          source: source,
          damageType: DamageType.MAGIC,
          tickRate: 0.5
        });
      }

      if (type === DamageType.PHYSICAL) {
        finalDamage *= source.getPhysDamageMult();
      } else if (type === DamageType.MAGIC) {
        finalDamage *= source.getMagDamageMult();
      }
      
      finalDamage *= source.getDamageDealtMult();
      
      if (source.hasItem(ItemId.NANH_HOANG_DA) && this.hp < this.maxHp * 0.5) {
        finalDamage *= 1.20;
      }
      
      if ((source as any).lyCuuUltTimer > 0 && type !== DamageType.TRUE && !(source as any)._isConvertingDamage) {
        (source as any)._isConvertingDamage = true;
        const trueDmg = finalDamage * 0.2;
        finalDamage *= 0.8;
        this.takeDamage(trueDmg, DamageType.TRUE, source, isStatusDamage, isNormalAttack);
        (source as any)._isConvertingDamage = false;
      }
      
      if (source.hasItem(ItemId.DAO_TRUY_HON)) {
        this.addStatus({ type: StatusType.HEAL_REDUCTION, duration: 1.5, value: 0.35, source: source });
      }

      if (source.hasItem(ItemId.THUONG_HAC_KIM) && source.hacAnStacks < 100) {
        source.hacAnStacks = Math.min(100, source.hacAnStacks + 1);
      }

      if (source.hasItem(ItemId.THUONG_XUYEN_KHUNG)) {
        this.phaGiapStacks = Math.min(5, this.phaGiapStacks + 1);
        this.phaGiapTimer = 1.2;
      }
      
      if (this.hasItem(ItemId.KHIEN_BANG_GIA)) {
        source.addStatus({ type: StatusType.SLOW, duration: 1, value: 0.2, source: this });
        source.addStatus({ type: StatusType.WEAKEN, duration: 1, value: 0.1, source: this });
      }

      // Item: Giáp Phản Chấn (Reflection)
      if (this.hasItem(ItemId.GIAP_PHAN_CHAN) && this.giapPhanChanCDTimer <= 0) {
        this.giapPhanChanCDTimer = 0.5 * (1 - this.getPassiveCooldownReduction());
        source.takeDamage(finalDamage * 0.45, DamageType.MAGIC, this, true);
      }
    }

    // Item: Khiên Năng lượng (Damage Cap)
    if (this.hasItem(ItemId.KHIEN_NANG_LUONG) && this.hp < this.maxHp * 0.60) {
      if (this.khienNangLuongCDTimer <= 0) {
        this.khienNangLuongCDTimer = 5 * (1 - this.getPassiveCooldownReduction());
        this.khienNangLuongActiveTimer = 1.5;
      }
      if (this.khienNangLuongActiveTimer > 0 && finalDamage > 5000) {
        finalDamage = 5000;
      }
    }

    let actualDamageDealt = 0;
    let armorBroken = false;
    let armorPen = (source ? source.getArmorPen() : 0) + 0.04 * this.phaGiapStacks + this.armorReductionValue;
    armorPen = Math.min(1, armorPen);

    if (type === DamageType.TRUE) {
      let hpDamage = finalDamage;
      if (this.hasItem(ItemId.AO_CA_SA) && this.armor > 0) {
        hpDamage *= 0.75;
      }
      
      if (this.virtualHealth > 0) {
        if (this.virtualHealth >= hpDamage) {
          this.virtualHealth -= hpDamage;
          hpDamage = 0;
        } else {
          hpDamage -= this.virtualHealth;
          this.virtualHealth = 0;
        }
      }
      this.hp -= hpDamage;
      actualDamageDealt = finalDamage;
    } else {
      let ignoredArmor = this.armor * armorPen;
      let effectiveArmor = this.armor - ignoredArmor;
      
      let armorDmgMult = type === DamageType.MAGIC ? 1.8 : 1.0;
      let hpDmgMult = type === DamageType.MAGIC ? 0.8 : 1.0;
      
      let damageToEffectiveArmor = finalDamage * armorDmgMult;
      
      if (this.armor > 0) {
        if (effectiveArmor >= damageToEffectiveArmor) {
          // Sát thương bị hấp thụ hoàn toàn bởi phần giáp hiệu lực
          this.armor -= damageToEffectiveArmor;
          actualDamageDealt += finalDamage;
        } else {
          // Phá vỡ phần giáp hiệu lực
          let remainingBaseDamage = finalDamage - (effectiveArmor / armorDmgMult);
          actualDamageDealt += finalDamage;
          
          this.armor = ignoredArmor; // Phần giáp bị bỏ qua vẫn còn lại
          
          // Lượng sát thương dư thừa đánh vào máu
          let hpDamage = remainingBaseDamage * hpDmgMult;
          if (this.hasItem(ItemId.AO_CA_SA)) {
            hpDamage *= 0.75;
          }
          
          if (this.virtualHealth > 0) {
            if (this.virtualHealth >= hpDamage) {
              this.virtualHealth -= hpDamage;
              hpDamage = 0;
            } else {
              hpDamage -= this.virtualHealth;
              this.virtualHealth = 0;
            }
          }
          this.hp -= hpDamage;
          
          if (this.armor <= 0) {
            armorBroken = true;
          }
        }
      } else {
        // Không có giáp, đánh thẳng vào máu
        let hpDamage = finalDamage * hpDmgMult;
        if (this.virtualHealth > 0) {
          if (this.virtualHealth >= hpDamage) {
            this.virtualHealth -= hpDamage;
            hpDamage = 0;
          } else {
            hpDamage -= this.virtualHealth;
            this.virtualHealth = 0;
          }
        }
        this.hp -= hpDamage;
        actualDamageDealt += finalDamage;
      }
    }

    if (actualDamageDealt > 0) {
      this.hitFlashTimer = 0.1;
    }

    if (armorBroken) {
      this.addFloatingText("🛡️ VỠ", FloatingTextType.ARMOR_BREAK);
    }

    if (actualDamageDealt > 0) {
      if (source && !source.isDead) {
        if (type === DamageType.PHYSICAL && isNormalAttack) {
          const lifesteal = source.getPhysLifesteal();
          if (lifesteal > 0) {
            source.heal(actualDamageDealt * lifesteal);
          }
        } else if (type === DamageType.MAGIC && !isNormalAttack) {
          const lifesteal = source.getMagLifesteal();
          if (lifesteal > 0) {
            source.heal(actualDamageDealt * lifesteal);
          }
        }
      }
      
      const isBurst = actualDamageDealt > this.maxHp * 0.05 || actualDamageDealt > 3000;
      let textType = FloatingTextType.PHYSICAL;
      if (type === DamageType.PHYSICAL) textType = isBurst ? FloatingTextType.PHYSICAL_BURST : FloatingTextType.PHYSICAL;
      if (type === DamageType.MAGIC) textType = isBurst ? FloatingTextType.MAGIC_BURST : FloatingTextType.MAGIC;
      if (type === DamageType.TRUE) textType = FloatingTextType.TRUE;

      const displayDamage = Math.round(actualDamageDealt);
      if (displayDamage > 0) {
        this.addFloatingText(`-${displayDamage}`, textType);
      }
    }

    if (this.hasStatus(StatusType.UNDYING) && this.hp < 1) {
      this.hp = 1;
    }

    if (this.hp < 15000 && this.hasItem(ItemId.KHIEN_THAT_TRUYEN) && this.khienThatTruyenCooldown <= 0) {
      const missingHp = this.maxHp - this.hp;
      const shieldAmount = 10000 + 0.24 * missingHp;
      this.addArmor(shieldAmount);
      this.khienThatTruyenCooldown = 25 * (1 - this.getPassiveCooldownReduction());
      if (source) {
        source.addStatus({ type: StatusType.SLOW, duration: 3, value: 0.5 });
      }
    }

    if (this.hp <= 0) {
      if (this.hasItem(ItemId.NGOC_TU_TU) && !this.ngocTuTuUsed) {
        this.hp = 1;
        this.ngocTuTuUsed = true;
        this.addStatus({ type: StatusType.INVINCIBLE, duration: 3 });
      } else if (this.hasItem(ItemId.PHU_CHU_TRONG_SINH) && !this.phuChuTrongSinhUsed) {
        this.hp = 1;
        this.phuChuTrongSinhUsed = true;
        this.phuChuTrongSinhActiveTimer = 3;
        this.phuChuTrongSinhTickTimer = 0;
        this.addStatus({ type: StatusType.CC_IMMUNE, duration: 3 });
      } else {
        this.hp = 0;
        this.isDead = true;
      }
    }
  }

  getHealEffectiveness(): number {
    let mult = 1;
    
    if (this.hasItem(ItemId.PHUC_HOP_KIEM)) {
      const missingHpPct = (this.maxHp - this.hp) / this.maxHp;
      const stacks = Math.floor(missingHpPct / 0.2);
      mult += stacks * 0.08;
    }

    if (this.hasItem(ItemId.NGOC_TU_TU) && this.hp < this.maxHp * 0.5) {
      mult += 0.10;
    }

    if (this.hasItem(ItemId.LUC_AO)) {
      const missingHpPct = (this.maxHp - this.hp) / this.maxHp;
      const stacks = Math.floor(missingHpPct / 0.05);
      mult += stacks * 0.05;
    }
    
    let reduction = 0;
    for (const s of this.statuses) {
      if (s.type === StatusType.HEAL_REDUCTION && s.value && s.value > reduction) {
        reduction = s.value;
      }
    }
    
    return mult * (1 - reduction);
  }

  getPhysLifesteal(): number {
    let ls = 0.12 * this.getItemCount(ItemId.SONG_DAO_BAO_TAP) + 0.05 * this.nanhHungTanStacks + 0.20 * this.getItemCount(ItemId.NANH_HOANG_DA) + 0.20 * this.getItemCount(ItemId.CON_GIAN_CUA_DA);
    if (this.aoChoangTruyenThuyetActiveTimer > 0) ls += 0.60;
    return Math.min(1.0, ls);
  }

  getMagLifesteal(): number {
    let ls = 0.14 * this.getItemCount(ItemId.SONG_DAO_BAO_TAP) + 0.35 * this.getItemCount(ItemId.TRUONG_HON_MANG) + 0.12 * this.getItemCount(ItemId.PHU_CHU_TRONG_SINH) + 0.28 * this.getItemCount(ItemId.TRUONG_HOANG_KIM) + 0.20 * this.getItemCount(ItemId.CON_GIAN_CUA_DA);
    if (this.aoChoangTruyenThuyetActiveTimer > 0) ls += 0.60;
    return Math.min(1.0, ls);
  }

  heal(amount: number) {
    if (this.isDead) return;
    
    const effectiveAmount = amount * this.getHealEffectiveness();
    
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + effectiveAmount);
    const healed = this.hp - oldHp;
    if (healed > 0) {
      this.addFloatingText(`+${Math.round(healed)}`, FloatingTextType.HEAL);
    }
  }

  addArmor(amount: number) {
    if (this.isDead) return;
    const effectiveAmount = amount * this.getHealEffectiveness();
    this.armor = Math.min(this.getMaxArmor(), this.armor + effectiveAmount);
  }

  breakArmor(amount: number) {
    if (this.isDead) return;
    const oldArmor = this.armor;
    this.armor = Math.max(0, this.armor - amount);
    if (oldArmor > 0 && this.armor === 0) {
      this.addFloatingText("🛡️ VỠ", FloatingTextType.ARMOR_BREAK);
    }
  }

  getSpeedMultiplier(): number {
    if (this.hasStatus(StatusType.STUN) || this.hasStatus(StatusType.SUPPRESS)) return 0;
    let maxSlow = 0;
    for (const s of this.statuses) {
      if (s.type === StatusType.SLOW && s.value && s.value > maxSlow) {
        maxSlow = s.value;
      }
    }
    
    let itemSpeedMult = 1 + 0.06 * this.getItemCount(ItemId.PHUC_HOP_KIEM) + 0.10 * this.getItemCount(ItemId.DAO_TRUY_HON) + 0.08 * this.getItemCount(ItemId.NANH_HUNG_TAN) + 0.10 * this.getItemCount(ItemId.AO_CA_SA);
    
    return Math.max(0, 1 - maxSlow) * itemSpeedMult;
  }

  onTouchEnemy(enemy: Champion) {
    // Override in subclasses
  }

  updateChampion(dtSec: number, dtFrames: number) {
    if (this.isDead) return;

    if (this.khienThatTruyenCooldown > 0) {
      this.khienThatTruyenCooldown -= dtSec;
    }

    if (this.songDaoNganCDTimer > 0) {
      this.songDaoNganCDTimer -= dtSec;
    }

    if (this.songDaoBaoTapCDTimer > 0) {
      this.songDaoBaoTapCDTimer -= dtSec;
    }

    if (this.conGianCuaDaHitTimer > 0) {
      this.conGianCuaDaHitTimer -= dtSec;
    }

    if (this.conGianCuaDaCDTimer > 0) {
      this.conGianCuaDaCDTimer -= dtSec;
    }

    if (this.truongHonMangCDTimer > 0) {
      this.truongHonMangCDTimer -= dtSec;
    }

    if (this.giapPhanChanCDTimer > 0) {
      this.giapPhanChanCDTimer -= dtSec;
    }

    if (this.khienNangLuongCDTimer > 0) {
      this.khienNangLuongCDTimer -= dtSec;
    }

    if (this.khienNangLuongActiveTimer > 0) {
      this.khienNangLuongActiveTimer -= dtSec;
    }

    if (this.hacGiapCDTimer > 0) {
      this.hacGiapCDTimer -= dtSec;
    }

    if (this.thuongXuyenPhaCDTimer > 0) {
      this.thuongXuyenPhaCDTimer -= dtSec;
    }

    if (this.thuongXuyenPhaActiveTimer > 0) {
      this.thuongXuyenPhaActiveTimer -= dtSec;
    }

    if (this.vongCoLucBaoTickTimer > 0) {
      // Handled in the item logic check below, but let's keep it consistent
    }
    
    if (this.ngocThucThanCDTimer > 0) {
      this.ngocThucThanCDTimer -= dtSec;
    }
    
    if (this.ngocThucThanBuffTimer > 0) {
      this.ngocThucThanBuffTimer -= dtSec;
    }
    
    // Vòng Cổ Lục Bảo
    if (this.hasItem(ItemId.VONG_CO_LUC_BAO)) {
      this.vongCoLucBaoTickTimer += dtSec;
      if (this.vongCoLucBaoTickTimer >= 0.5) {
        this.vongCoLucBaoTickTimer = 0;
        // Find nearby enemies (within 3 units - assuming radius units or similar)
        // In this game, 3 units might be small, let's check radius. Champion radius is ~20-30.
        // Let's use a reasonable range, say radius * 5.
        const range = 150; // Roughly 3 units in game scale if 1 unit ~ 50px
        if ((this as any).engine) {
          const engine = (this as any).engine;
          const enemies = engine.champions.filter((c: Champion) => c !== this && !c.isDead);
          for (const enemy of enemies) {
            const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
            if (dist <= range) {
              enemy.takeDamage(1200, DamageType.MAGIC, this, true);
              enemy.addStatus({ type: StatusType.HEAL_REDUCTION, duration: 3, value: 0.6, source: this });
              // Also reduce armor regen effectiveness (simulated by heal reduction)
            }
          }
        }
      }
    }

    // Phù Trú Cường Hóa
    if (this.hasItem(ItemId.PHU_TRU_CUONG_HOA)) {
      this.phuTruCuongHoaRegenTimer += dtSec;
      const armorPct = this.armor / this.getMaxArmor();
      const regenInterval = 1.0 - (1.0 - armorPct) * 0.5; // 1.0s down to 0.5s
      if (this.phuTruCuongHoaRegenTimer >= regenInterval) {
        this.phuTruCuongHoaRegenTimer = 0;
        const missingHp = this.maxHp - this.hp;
        const regenAmount = 1000 + 0.10 * missingHp;
        this.addArmor(regenAmount);
      }
    }

    if (this.phaGiapTimer > 0) {
      this.phaGiapTimer -= dtSec;
      if (this.phaGiapTimer <= 0) {
        this.phaGiapStacks = 0;
      }
    }

    if (this.armorReductionTimer > 0) {
      this.armorReductionTimer -= dtSec;
      if (this.armorReductionTimer <= 0) {
        this.armorReductionValue = 0;
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dtSec;
    }

    // Áo Choàng Truyền Thuyết
    if (this.hasItem(ItemId.AO_CHOANG_TRUYEN_THUYET) && !this.aoChoangTruyenThuyetUsed && this.hp < 7900) {
      this.aoChoangTruyenThuyetUsed = true;
      this.aoChoangTruyenThuyetActiveTimer = 3;
      this.aoChoangTruyenThuyetTickTimer = 0;
    }

    if (this.aoChoangTruyenThuyetActiveTimer > 0) {
      this.aoChoangTruyenThuyetActiveTimer -= dtSec;
      this.aoChoangTruyenThuyetTickTimer -= dtSec;
      if (this.aoChoangTruyenThuyetTickTimer <= 0) {
        this.aoChoangTruyenThuyetTickTimer = 0.5;
        const missingHp = this.maxHp - this.hp;
        const shieldAmount = 3200 + 0.08 * missingHp;
        this.armor = Math.min(this.getMaxArmor() * 2, this.armor + shieldAmount); // Cap armor to prevent infinite stacking
        this.addFloatingText(`+${Math.round(shieldAmount)} GIÁP`, FloatingTextType.HEAL);
      }
    }

    // Phù Chú Trọng Sinh
    if (this.phuChuTrongSinhActiveTimer > 0) {
      this.phuChuTrongSinhActiveTimer -= dtSec;
      this.phuChuTrongSinhTickTimer -= dtSec;
      
      // Stand still
      this.vel.x = 0;
      this.vel.y = 0;

      if (this.phuChuTrongSinhTickTimer <= 0) {
        this.phuChuTrongSinhTickTimer = 0.5;
        this.heal(5700 + 0.16 * this.maxHp);
      }

      if (this.phuChuTrongSinhActiveTimer <= 0) {
        this.phuChuTrongSinhBuffTimer = 6;
        // Reset all cooldowns (handled in subclasses if possible, or we reset common ones here)
        // Since we can't easily access subclass specific cooldowns, we'll reset what we can and maybe add a flag
        (this as any).passive1CDTimer = 0;
        (this as any).passive2CDTimer = 0;
        (this as any).passive3CDTimer = 0;
        (this as any).passive4CDTimer = 0;
        (this as any).passive5CDTimer = 0;
        (this as any).ultCDTimer = 0;
      }
    }

    if (this.phuChuTrongSinhBuffTimer > 0) {
      this.phuChuTrongSinhBuffTimer -= dtSec;
    }

    // Nanh Hung Tàn
    if (this.nanhHungTanTimer > 0) {
      this.nanhHungTanTimer -= dtSec;
      if (this.nanhHungTanTimer <= 0) {
        this.nanhHungTanStacks = 0;
      }
    }

    // Trượng Hoàng Kim
    if (this.hasItem(ItemId.TRUONG_HOANG_KIM)) {
      if (!this.truongHoangKimReady) {
        this.truongHoangKimTimer += dtSec;
        if (this.truongHoangKimTimer >= 5) {
          this.truongHoangKimReady = true;
          this.truongHoangKimTimer = 0;
        }
      }
    }

    // Armor regen
    this.armorRegenTimer += dtSec;
    if (this.armorRegenTimer >= 3) {
      if (this.armor < this.getMaxArmor()) {
        this.armor = Math.min(this.getMaxArmor(), this.armor + 500 * this.getArmorRegenMult());
      }
      this.armorRegenTimer = 0;
    }

    // Status effects
    for (let i = this.statuses.length - 1; i >= 0; i--) {
      let s = this.statuses[i];
      s.duration -= dtSec;

      if (s.type === StatusType.BURN) {
        s.tickTimer = (s.tickTimer || 0) + dtSec;
        const rate = s.tickRate || 1;
        if (s.tickTimer >= rate) {
          this.takeDamage(s.damage || s.value || 0, s.damageType !== undefined ? s.damageType : DamageType.MAGIC, s.source, true);
          s.tickTimer -= rate;
        }
      }

      if (s.duration <= 0) {
        this.statuses.splice(i, 1);
      }
    }

    if (this.hasStatus(StatusType.STUN) || this.hasStatus(StatusType.SUPPRESS)) {
      this.vel.x = 0;
      this.vel.y = 0;
    }

    // Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      let ft = this.floatingTexts[i];
      ft.life -= dtSec;
      ft.x += ft.vx * dtSec;
      ft.y += ft.vy * dtSec;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Buff texts
    for (let i = this.buffTexts.length - 1; i >= 0; i--) {
      this.buffTexts[i].timer -= dtSec;
      if (this.buffTexts[i].timer <= 0) {
        this.buffTexts.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    // Hit flash
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlashTimer * 5})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
    }

    super.draw(ctx);
    this.drawUI(ctx);
  }

  drawUI(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    const barWidth = 60;
    const barHeight = 8;
    const yOffset = this.radius + 15;

    const totalMax = this.maxHp + this.getMaxArmor() + this.virtualHealth;
    
    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(this.pos.x - barWidth / 2, this.pos.y - yOffset, barWidth, barHeight);
    
    let currentX = this.pos.x - barWidth / 2;

    // HP Bar fill
    const hpWidth = barWidth * (this.hp / totalMax);
    ctx.fillStyle = '#22c55e'; // Green
    ctx.fillRect(currentX, this.pos.y - yOffset, hpWidth, barHeight);
    currentX += hpWidth;

    // Virtual Health fill
    if (this.virtualHealth > 0) {
      const vhWidth = barWidth * (this.virtualHealth / totalMax);
      const grad = ctx.createLinearGradient(currentX, 0, currentX + vhWidth, 0);
      grad.addColorStop(0, '#22c55e'); // Green
      grad.addColorStop(1, '#3b82f6'); // Blue
      ctx.fillStyle = grad;
      ctx.fillRect(currentX, this.pos.y - yOffset, vhWidth, barHeight);
      currentX += vhWidth;
    }

    // Armor Bar fill
    const armorWidth = barWidth * (this.armor / totalMax);
    ctx.fillStyle = '#9ca3af'; // Gray
    ctx.fillRect(currentX, this.pos.y - yOffset, armorWidth, barHeight);

    // Draw border for the whole bar
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.pos.x - barWidth / 2, this.pos.y - yOffset, barWidth, barHeight);

    // Phá Giáp Stacks
    if (this.phaGiapStacks > 0) {
      const stackWidth = barWidth / 5;
      for (let i = 0; i < this.phaGiapStacks; i++) {
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fillRect(this.pos.x - barWidth / 2 + i * stackWidth, this.pos.y - yOffset + barHeight + 2, stackWidth - 1, 3);
      }
    }

    // Buff Texts
    let buffY = this.pos.y - yOffset - 25;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (const buff of this.buffTexts) {
      ctx.fillStyle = '#60a5fa'; // blue-400
      ctx.fillText(`${buff.text} (${buff.timer.toFixed(1)}s)`, this.pos.x, buffY);
      buffY -= 12;
    }

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.name, this.pos.x, buffY);
    ctx.shadowBlur = 0;

    // Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      
      let fontSize = 16;
      let fontStr = 'bold 16px "Cinzel", serif';
      
      switch (ft.type) {
        case FloatingTextType.PHYSICAL:
          ctx.fillStyle = '#ef4444'; // red-500
          break;
        case FloatingTextType.PHYSICAL_BURST:
          ctx.fillStyle = '#dc2626'; // red-600
          fontSize = 24;
          fontStr = '900 24px "Cinzel", serif';
          break;
        case FloatingTextType.MAGIC:
          ctx.fillStyle = '#a855f7'; // purple-500
          break;
        case FloatingTextType.MAGIC_BURST:
          const grad = ctx.createLinearGradient(ft.x, ft.y - 20, ft.x, ft.y);
          grad.addColorStop(0, '#d946ef'); // fuchsia-500
          grad.addColorStop(1, '#7e22ce'); // purple-700
          ctx.fillStyle = grad;
          fontSize = 24;
          fontStr = '900 24px "Cinzel", serif';
          break;
        case FloatingTextType.TRUE:
          ctx.fillStyle = '#ffffff';
          fontSize = 22;
          fontStr = '900 22px "Cinzel", serif';
          break;
        case FloatingTextType.HEAL:
          ctx.fillStyle = '#22c55e'; // green-500
          fontSize = 18;
          fontStr = 'bold 18px "Cinzel", serif';
          break;
        case FloatingTextType.ARMOR_BREAK:
          ctx.fillStyle = '#eab308'; // yellow-500
          fontSize = 20;
          fontStr = 'bold 20px "Cinzel", serif';
          break;
      }

      ctx.font = fontStr;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      
      ctx.restore();
    }
  }
}
