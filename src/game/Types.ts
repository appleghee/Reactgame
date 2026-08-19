export enum DamageType {
  PHYSICAL,
  MAGIC,
  TRUE
}

export enum StatusType {
  STUN,
  SUPPRESS,
  SLOW,
  BURN,
  INVINCIBLE,
  UNDYING,
  IMMUNE,
  STEALTH,
  CC_IMMUNE,
  HEAL_REDUCTION,
  WEAKEN,
  UNTARGETABLE
}

export const ItemId = {
  PHUC_HOP_KIEM: 'PHUC_HOP_KIEM',
  KHIEN_BANG_GIA: 'KHIEN_BANG_GIA',
  DAO_TRUY_HON: 'DAO_TRUY_HON',
  THUONG_HAC_KIM: 'THUONG_HAC_KIM',
  KHIEN_THAT_TRUYEN: 'KHIEN_THAT_TRUYEN',
  SONG_DAO_NGAN: 'SONG_DAO_NGAN',
  THUONG_XUYEN_KHUNG: 'THUONG_XUYEN_KHUNG',
  SONG_DAO_BAO_TAP: 'SONG_DAO_BAO_TAP',
  TRUONG_HON_MANG: 'TRUONG_HON_MANG',
  AO_CHOANG_TRUYEN_THUYET: 'AO_CHOANG_TRUYEN_THUYET',
  PHU_CHU_TRONG_SINH: 'PHU_CHU_TRONG_SINH',
  NANH_HUNG_TAN: 'NANH_HUNG_TAN',
  TRUONG_HOANG_KIM: 'TRUONG_HOANG_KIM',
  NGOC_TU_TU: 'NGOC_TU_TU',
  LUC_AO: 'LUC_AO',
  AO_CA_SA: 'AO_CA_SA',
  NANH_HOANG_DA: 'NANH_HOANG_DA',
  GIAP_PHAN_CHAN: 'GIAP_PHAN_CHAN',
  KHIEN_NANG_LUONG: 'KHIEN_NANG_LUONG',
  HAC_GIAP: 'HAC_GIAP',
  PHU_TRU_CUONG_HOA: 'PHU_TRU_CUONG_HOA',
  THUONG_XUYEN_PHA: 'THUONG_XUYEN_PHA',
  VONG_CO_LUC_BAO: 'VONG_CO_LUC_BAO',
  CON_GIAN_CUA_DA: 'CON_GIAN_CUA_DA',
  NGOC_THUC_THAN: 'NGOC_THUC_THAN'
} as const;

export type ItemId = typeof ItemId[keyof typeof ItemId];

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  descriptionLines?: string[];
  icon: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  [ItemId.PHUC_HOP_KIEM]: {
    id: ItemId.PHUC_HOP_KIEM,
    name: 'Phức Hợp Kiếm',
    description: '+25% STVL, +6% Tốc độ. Nội tại: +8% Hồi phục mỗi 20% Máu đã mất.',
    descriptionLines: [
      '+25% Sát thương vật lý',
      '+6% Tốc độ di chuyển',
      'Nội tại duy nhất: +8% Hồi phục mỗi 20% Máu đã mất'
    ],
    icon: '🗡️'
  },
  [ItemId.KHIEN_BANG_GIA]: {
    id: ItemId.KHIEN_BANG_GIA,
    name: 'Khiên Băng Giá',
    description: '+250% Giáp, +140% Tốc độ hồi giáp. Nội tại: Kẻ địch tấn công bị giảm 20% tốc độ và 10% sát thương trong 1s.',
    descriptionLines: [
      '+250% Giáp',
      '+140% Tốc độ hồi giáp',
      'Nội tại duy nhất: Kẻ địch tấn công bị giảm 20% tốc độ và 10% sát thương trong 1s'
    ],
    icon: '🛡️'
  },
  [ItemId.DAO_TRUY_HON]: {
    id: ItemId.DAO_TRUY_HON,
    name: 'Dao Truy Hồn',
    description: '+80% Giáp, +30% STP, +10% Tốc độ. Nội tại: Gây sát thương giảm 35% hồi phục của địch trong 1.5s.',
    descriptionLines: [
      '+80% Giáp',
      '+30% Sát thương phép',
      '+10% Tốc độ di chuyển',
      'Nội tại duy nhất: Gây sát thương giảm 35% hồi phục của địch trong 1.5s'
    ],
    icon: '🔪'
  },
  [ItemId.THUONG_HAC_KIM]: {
    id: ItemId.THUONG_HAC_KIM,
    name: 'Thương Hắc Kim',
    description: '+40% STVL, +20% STP, +6% Xuyên giáp, +5000 Máu. Nội tại: Tích 100 hắc ấn tăng 30% sát thương.',
    descriptionLines: [
      '+40% Sát thương vật lý',
      '+20% Sát thương phép',
      '+6% Xuyên giáp',
      '+5000 Máu tối đa',
      'Nội tại duy nhất: Mọi sát thương gây ra tích 1 điểm Hắc Ấn. Khi đủ 100 Hắc Ấn, tăng 30% sát thương gây ra (tối đa tích 1 lần)'
    ],
    icon: '🔱'
  },
  [ItemId.KHIEN_THAT_TRUYEN]: {
    id: ItemId.KHIEN_THAT_TRUYEN,
    name: 'Khiên Thất Truyền',
    description: '+300% Giáp, 10% giảm hồi nội tại. Nội tại Băng thể: Máu < 15000 tạo giáp và làm chậm địch.',
    descriptionLines: [
      '+300% Giáp',
      '10% Giảm hồi nội tại',
      'Nội tại duy nhất - Băng thể: Khi máu dưới 15000 sẽ tạo 1 lớp giáp 10,000 (+24% máu đã mất) đồng thời giảm 50% tốc chạy trong 3s. Hồi 25s'
    ],
    icon: '💠'
  },
  [ItemId.SONG_DAO_NGAN]: {
    id: ItemId.SONG_DAO_NGAN,
    name: 'Song Đao Ngắn',
    description: '+15% Tốc đánh, +40% Sát thương vật lý. Nội tại Bạo Phát: Đòn đánh thường gây thêm 880-1430 Sát thương chuẩn (Hồi 0.3s).',
    descriptionLines: [
      '+15% Tốc đánh',
      '+40% Sát thương vật lý',
      'Nội tại duy nhất - Bạo Phát: Đòn đánh thường gây thêm 880-1430 Sát thương chuẩn. Hồi 0.3s'
    ],
    icon: '⚔️'
  },
  [ItemId.THUONG_XUYEN_KHUNG]: {
    id: ItemId.THUONG_XUYEN_KHUNG,
    name: 'Thương Xuyên Khung',
    description: '+35% Sát thương vật lý, +15% Xuyên Giáp, +8% Giảm hồi chiêu. Nội tại Phá giáp: Mỗi đòn tấn công giảm 4% Giáp địch trong 1.2s (tối đa 5 dấu ấn).',
    descriptionLines: [
      '+35% Sát thương vật lý',
      '+15% Xuyên Giáp',
      '+8% Giảm hồi chiêu',
      'Nội tại duy nhất - Phá giáp: Mỗi đòn tấn công sẽ tích 1 dấu ấn - mỗi dấu ấn sẽ khiến giảm hiệu quả 4% Giáp của địch trong 1.2s (tối đa cộng dồn 5 dấu ấn)'
    ],
    icon: '🏹'
  },
  [ItemId.SONG_DAO_BAO_TAP]: {
    id: ItemId.SONG_DAO_BAO_TAP,
    name: 'Song Đao Bão Táp',
    description: '+30% STVL, +70% Tốc đánh, +12% Hút máu VL, +14% Hút máu phép. Nội tại Bão Táp: Đánh thường bắn tia sét.',
    descriptionLines: [
      '+30% Sát thương vật lý',
      '+70% Tốc đánh',
      '+12% Hút máu vật lý',
      '+14% Hút máu phép',
      'Nội tại duy nhất - Bão Táp - Hồi 0.5s: Mỗi đòn đánh thường sẽ bắn thêm 1 tia sét gây 1340-2230 Sát thương phép, đủ 9 tia sét sẽ nổ 7500 Sát thương phép trộn sát thương vật lý'
    ],
    icon: '⚡'
  },
  [ItemId.TRUONG_HON_MANG]: {
    id: ItemId.TRUONG_HON_MANG,
    name: 'Trượng Hỗn Mang',
    description: '+35% Hút máu phép, +70% Sát thương phép, -20% Giảm hồi chiêu. Nội tại Hỗn mang: Đánh thường gây thêm sát thương.',
    descriptionLines: [
      '+35% Hút máu phép',
      '+70% Sát thương phép',
      '-20% Giảm hồi chiêu',
      'Nội tại duy nhất - Hỗn mang: Đòn đánh thường sau 1s sẽ gây 2200 Sát thương vật lý (+8% Máu tối đa địch)'
    ],
    icon: '🔮'
  },
  [ItemId.AO_CHOANG_TRUYEN_THUYET]: {
    id: ItemId.AO_CHOANG_TRUYEN_THUYET,
    name: 'Áo Choàng Truyền Thuyết',
    description: '+90% Giáp, +28% Sát thương vật lí, +8000 Máu tối đa. Phản Công: Khi máu dưới 7900 tạo giáp và tăng hút máu.',
    descriptionLines: [
      '+90% Giáp',
      '+28% Sát thương vật lí',
      '+8000 Máu tối đa',
      'Nội tại duy nhất - Phản Công:',
      'Khi máu dưới 7900 sẽ lập tức tạo ra 3200 (+8% Máu đã mất bản thân) giáp mỗi 0.5s trong 3s',
      'và tăng 60% hút máu vật lý-phép trong 3s. Dùng 1 lần.'
    ],
    icon: '🧥'
  },
  [ItemId.PHU_CHU_TRONG_SINH]: {
    id: ItemId.PHU_CHU_TRONG_SINH,
    name: 'Phù Chú Trọng Sinh',
    description: '+140% Giáp, +9000 Máu tối đa, +12% Hút máu phép. Trọng Sinh: Khi chết đứng yên hồi máu và miễn nhiễm sát thương phép.',
    descriptionLines: [
      '+140% Giáp',
      '+9000 Máu tối đa',
      '+12% Hút máu phép',
      'Nội tại - Trọng Sinh - Một lần sử dụng:',
      'Khi chết sẽ đứng yên tại chỗ miễn khống và chỉ miễn nhiễm với mọi sát thương phép,',
      'đồng thời hồi 5700 Máu (16% Máu tối đa bản thân) mỗi 0.5s - Trong 3s.',
      'Sau 3s sẽ Hồi tất cả chiêu thức và tăng 20% Miễn thương trong 6s.'
    ],
    icon: '📜'
  },
  [ItemId.NANH_HUNG_TAN]: {
    id: ItemId.NANH_HUNG_TAN,
    name: 'Nanh Hung Tàn',
    description: '+30% Tốc đánh, +45% Sát thương vật lý, +8% tốc độ. Hung tàn: Đánh thường tích dấu ấn tăng tốc đánh, hút máu và miễn thương.',
    descriptionLines: [
      '+30% Tốc đánh',
      '+45% Sát thương vật lý',
      '+8% tốc độ',
      'Nội tại duy nhất - Hung tàn:',
      'Mỗi đòn đánh thường sẽ tích 1 dấu ấn và duy trì trong 0.8s,',
      'nếu tiếp tục trong 0.8s chưa hết thì sẽ tiếp tục tích (tối đa 5 dấu ấn).',
      'Mỗi dấu ấn giúp tăng 10% tốc đánh và 5% hút máu vật lý kèm theo 1% miễn thương.'
    ],
    icon: '🦷'
  },
  [ItemId.TRUONG_HOANG_KIM]: {
    id: ItemId.TRUONG_HOANG_KIM,
    name: 'Trượng Hoàng Kim',
    description: '+40% Sát thương phép, +28% Hút máu phép, +1200 Máu tối đa. Bùng nổ: Cứ sau 5s nhận 1 lần tấn công cường hóa.',
    descriptionLines: [
      '+40% Sát thương phép',
      '+28% Hút máu phép',
      '+1200 Máu tối đa',
      'Nội tại duy nhất - Bùng nổ:',
      'Cứ sau 5s sẽ nhận 1 lần tấn công cường hóa,',
      'lần tấn công cường hóa sẽ cường hóa 1 lần đánh thường hoặc chiêu thức,',
      'đòn cường hóa sẽ tăng 2700 (+10% Máu tối đa địch) Sát thương phép kèm theo đốt 1400 Sát thương phép mỗi 0.5s trong 3s.'
    ],
    icon: '👑'
  },
  [ItemId.NGOC_TU_TU]: {
    id: ItemId.NGOC_TU_TU,
    name: 'Ngọc Từ Tử',
    description: '+3500 Giáp, +10,000 Máu tối đa, +8% Miễn thương đối với STC. Từ chối Tử Thần: Dưới 50% Máu tăng 10% hiệu quả hồi phục, khi đạt ngưỡng tử nhận Vô Địch 1.5s -> 3.0s.',
    descriptionLines: [
      '+3500 Giáp',
      '+10,000 Máu tối đa',
      '+8% Miễn thương đối với STC',
      'Nội tại duy nhất - Từ chối Tử Thần:',
      'Khi dưới 50% Máu sẽ được tăng 10% hiệu quả hồi phục,',
      'khi máu đạt ngưỡng tử sẽ cung cấp trạng thái Vô Địch trong 1.5s -> 3.0s.'
    ],
    icon: '🔮'
  },
  [ItemId.LUC_AO]: {
    id: ItemId.LUC_AO,
    name: 'Lục Áo',
    description: '+12,000 Giáp, +12% Miễn thương STVL, +18% Miễn thương STP, +5% Miễn thương STC. Phù hộ rừng xanh: Mất 5% máu tăng 5% hiệu quả hồi phục.',
    descriptionLines: [
      '+12,000 Giáp',
      '+12% Miễn thương đối với STVL',
      '+18% Miễn thương đối với STP',
      '+5% Miễn thương đối với STC',
      'Nội tại duy nhất - Phù hộ rừng xanh:',
      'Cứ mỗi 5% máu mất đi sẽ tăng 5% hiệu quả hồi phục',
      '(nếu hồi lại 5% máu thì cũng tương tự mất 5% hiệu quả hồi phục).'
    ],
    icon: '🧥'
  },
  [ItemId.AO_CA_SA]: {
    id: ItemId.AO_CA_SA,
    name: 'Áo cà sa',
    description: '+18,000 Giáp, +10% Tốc độ, +8% Miễn thương STVL. Đức tính: Nếu còn giáp thì máu sẽ được tăng 25% Miễn thương.',
    descriptionLines: [
      '+18,000 Giáp',
      '+10% Tốc độ',
      '+8% Miễn thương đối với STVL',
      'Nội tại duy nhất - Đức tính:',
      'Nếu còn giáp thì máu sẽ được tăng 25% Miễn thương.'
    ],
    icon: '🥻'
  },
  [ItemId.NANH_HOANG_DA]: {
    id: ItemId.NANH_HOANG_DA,
    name: 'Nanh Hoang Dã',
    description: '+180% Sát thương vật lý, +20% Hút máu vật lý, +5% Miễn thương STVL. Săn Mồi: Mục tiêu dưới 50% máu gây thêm 20% sát thương.',
    descriptionLines: [
      '+180% Sát thương vật lý',
      '+20% Hút máu vật lý',
      '+5% Miễn thương đối với STVL',
      'Nội tại duy nhất - Săn Mồi:',
      'Nếu mục tiêu dưới 50% máu thì sẽ gây thêm 20% sát thương.'
    ],
    icon: '🐺'
  },
  [ItemId.GIAP_PHAN_CHAN]: {
    id: ItemId.GIAP_PHAN_CHAN,
    name: 'Giáp Phản Chấn',
    description: '+18,000 Giáp, +15% Miễn thương STVL, -24% ST đánh thường. Phản đòn: Phản 45% sát thương thành STP.',
    descriptionLines: [
      '+18,000 Giáp tối đa',
      '+15% Miễn thương đối với STVL',
      '-24% Sát thương từ đánh thường của địch',
      'Nội tại duy nhất - Phản đòn - Hồi 0.5s: Mọi nguồn sát thương gây ra từ địch sẽ bị phản lại 45% thành STP'
    ],
    icon: '🛡️'
  },
  [ItemId.KHIEN_NANG_LUONG]: {
    id: ItemId.KHIEN_NANG_LUONG,
    name: 'Khiên Năng lượng',
    description: '+8,000 Giáp, +24,000 Máu, -12% ST đánh thường. Khiên Tụ Năng: Dưới 60% máu, sát thương > 5000 giảm xuống 5000.',
    descriptionLines: [
      '+8,000 Giáp tối đa',
      '+24,000 Máu tối đa',
      '-12% Sát thương từ đánh thường',
      'Nội tại duy nhất - Khiên Tụ Năng - Hồi 5s - Kéo dài 1.5s: Khi dưới 60% máu thì mọi sát thương quá 5000 Sẽ bị giảm xuống dưới 5000'
    ],
    icon: '🔋'
  },
  [ItemId.HAC_GIAP]: {
    id: ItemId.HAC_GIAP,
    name: 'Hắc Giáp',
    description: '+25,000 Máu, +10,000 Giáp, +5% Miễn thương. Chí mạng: 10% chí mạng x2 sát thương và giảm 5% hồi nội tại.',
    descriptionLines: [
      '+25,000 Máu tối đa',
      '+10,000 Giáp tối đa',
      '+5% Miễn Thương mọi nguồn',
      'Nội tại duy nhất - Chí mạng - Hồi 0.05s: Mỗi đòn tấn công có 10% chí mạng sẽ khiến đòn tấn công gây x2 sát thương và giảm 5% hồi nội tại'
    ],
    icon: '🖤'
  },
  [ItemId.PHU_TRU_CUONG_HOA]: {
    id: ItemId.PHU_TRU_CUONG_HOA,
    name: 'Phù Trú Cường Hóa',
    description: '+45,000 Máu, +18,000 Giáp, +1,200 Công VL. Cường hóa: Hồi giáp mỗi 1s-0.5s, miễn 50% STC khi còn giáp.',
    descriptionLines: [
      '+45,000 Máu tối đa',
      '+18,000 Giáp tối đa',
      '+1,200 Công vật lí',
      'Nội tại duy nhất - Cường hóa: mỗi 1s sẽ hồi 1000 Giáp (+10% Máu đã mất bản thân) và càng ít giáp hồi càng nhanh và nhanh tối đa là 0.5s, khi còn giáp sẽ được miễn 50% STC'
    ],
    icon: '📜'
  },
  [ItemId.THUONG_XUYEN_PHA]: {
    id: ItemId.THUONG_XUYEN_PHA,
    name: 'Thương xuyên phá',
    description: '+780 Công VL, +15% Giảm hồi nội tại, +15% Miễn thương đánh thường. Nội tại: Choáng địch >0.5s tăng 200% sát thương.',
    descriptionLines: [
      '+780 Công vật lí',
      '+15% Giảm hồi nội tại',
      '+15% Miễn thương từ đánh thường',
      'Nội tại duy nhất - Hồi 2s - Kéo dài 1s: Nếu làm choáng địch hơn 0.5s thì mọi nguồn sát thương của bản thân sẽ được tăng thêm 200% tạm thời'
    ],
    icon: '🔱'
  },
  [ItemId.VONG_CO_LUC_BAO]: {
    id: ItemId.VONG_CO_LUC_BAO,
    name: 'Vòng cổ lục bảo',
    description: '+12,000 Máu, +35% Kháng khống. Nội tại Tróc nã: Đốt địch xung quanh 1200 STP, giảm 60% hồi phục/hồi giáp.',
    descriptionLines: [
      '+12,000 Máu tối đa',
      '+35% kháng khống (ví dụ như làm chậm, choáng, trói, ...)',
      'Nội tại duy nhất - Tróc nã: Quanh 3 đơn vị bản thân sẽ liên tục 0.5s đốt địch, gây 1200 STP và giảm 60% Hồi phục và hồi giáp trong 3s'
    ],
    icon: '📿'
  },
  [ItemId.CON_GIAN_CUA_DA]: {
    id: ItemId.CON_GIAN_CUA_DA,
    name: 'Cơn giận của đá',
    description: '+50,000 Máu, +50% STP, +20% Hút máu. Nội tại Cuồng nộ Tróc nã: Giảm 50% hồi chiêu nếu dùng nội tại trúng địch 2 lần trong 0.8s.',
    descriptionLines: [
      '+50.000 Máu tối đa',
      '+50% STP Toàn diện',
      '+20% Hút máu toàn diện',
      'Nội tại duy nhất - Cuồng nộ Tróc nã: Nếu dùng Nội tại lên địch mà 0.8s sau lại tung nội tại trúng địch thì chiêu đó sẽ được giảm 50% hồi chiêu'
    ],
    icon: '🪨'
  },
  [ItemId.NGOC_THUC_THAN]: {
    id: ItemId.NGOC_THUC_THAN,
    name: 'Ngọc thức thần',
    description: '+24% STP Toàn diện, +12% Lượng giáp hồi. Nội tại Bùng nổ: Gây STP có 20% giảm 5s hồi chiêu nội tại 2 kéo dài 6s.',
    descriptionLines: [
      '+24% STP Toàn diện',
      '+12% Lượng giáp hồi',
      'Nội tại - Bùng nổ - 8s Hồi: Riêng nội tại 2, khi gây STP thì sẽ có 20% tỉ lệ giảm 5s hồi chiêu cho nội tại 2 kéo dài 6s'
    ],
    icon: '🔮'
  }
};

export interface StatusEffect {
  type: StatusType;
  duration: number;
  value?: number;
  source?: any;
  tickTimer?: number;
  damage?: number;
  damageType?: DamageType;
  tickRate?: number;
}

export enum FloatingTextType {
  PHYSICAL,
  PHYSICAL_BURST,
  MAGIC,
  MAGIC_BURST,
  TRUE,
  HEAL,
  ARMOR_BREAK
}

export interface FloatingText {
  text: string;
  type: FloatingTextType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}
