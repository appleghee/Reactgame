import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '../game/Engine';
import { StatusType, ITEMS, ItemId } from '../game/Types';
import { SoundManager } from '../game/SoundManager';
import { Volume2, VolumeX } from 'lucide-react';

const CHAMPIONS = [
  { id: 'LyTin', name: 'Lý Tín', color: '#ef4444' },
  { id: 'HaoPhong', name: 'Hạo Phong', color: '#3b82f6' },
  { id: 'NhanKiet', name: 'Nhân Kiệt', color: '#10b981' },
  { id: 'TanVu', name: 'Tần Vũ', color: '#ec4899' },
  { id: 'LucQuang', name: 'Lục Quang', color: '#ea580c' },
  { id: 'LoiThan', name: 'Lôi Thần', color: '#eab308' },
  { id: 'TuMaY', name: 'Tư Mã Ý', color: '#6b21a8' },
  { id: 'PhongKich', name: 'Phong Kích', color: '#10b981' },
  { id: 'HacQuang', name: 'Hắc Quang', color: '#1e1b4b' },
  { id: 'VuDieuTinhQuang', name: 'Vũ Điệu Tinh Quang', color: '#f0abfc' },
  { id: 'NguyetQuangLo', name: 'Nguyệt Quang Lộ', color: '#fef08a' },
  { id: 'HuyetMa', name: 'Huyết Ma', color: '#8b0000' },
  { id: 'TuTu', name: 'Tử Tư', color: '#eab308' },
  { id: 'LyCuu', name: 'Lý Cửu', color: '#b91c1c' },
  { id: 'NganNgoc', name: 'Ngân Ngọc', color: '#3b82f6' },
  { id: 'VoCat', name: 'Vô Cát', color: '#1e1b4b' },
  { id: 'BachTieuNga', name: 'Bạch Tiểu Ngã', color: '#fef08a' },
  { id: 'VanCa', name: 'Vân Ca', color: '#fbbf24' }
];

const CHAMPION_DETAILS: Record<string, any> = {
  'LyTin': {
    hp: '85,000',
    armor: '6,000',
    skills: [
      'Nội tại 1: Tích luỹ dấu ấn, gây sát thương vật lý và hồi máu dựa trên máu đã mất.',
      'Nội tại 2: Gây sát thương thiêu đốt và làm chậm kẻ địch xung quanh.',
      'Nội tại 4: Chuyển hóa giáp thành tinh thể pha lê xoay quanh người.',
      'Chiêu cuối: Quay Jackpot nhận ngẫu nhiên hiệu ứng (Hồi máu, Sát thương chuẩn, Giáp).'
    ]
  },
  'HaoPhong': {
    hp: '60,000',
    armor: '8,000',
    skills: [
      'Nội tại 1: Đẩy lùi kẻ địch ra xa.',
      'Nội tại 2: Vung quạt gây sát thương diện rộng.',
      'Nội tại 4: Triệu hồi các trận đồ ngũ giác giáng sét liên tục.',
      'Chiêu cuối: Tăng tốc độ đánh và sát thương.'
    ]
  },
  'NhanKiet': {
    hp: '55,000',
    armor: '12,000',
    skills: [
      'Nội tại 1: Phóng phi tiêu liên tục đuổi theo mục tiêu.',
      'Nội tại 2: Dịch chuyển tức thời đến vị trí an toàn.',
      'Nội tại 3: Gây nổ sát thương diện rộng.',
      'Chiêu cuối: Vô địch tạm thời và xả đạn liên tục.'
    ]
  },
  'TanVu': {
    hp: '65,000',
    armor: '3,000',
    skills: [
      'Nội tại 1: Lướt tới kẻ địch, hất tung và làm choáng.',
      'Nội tại 2: Tạo khiên bảo vệ và phản sát thương.',
      'Nội tại 3: Đập đất tạo vùng sát thương diện rộng.',
      'Chiêu cuối: Hóa khổng lồ, tăng sát thương, hồi máu và gây sát thương diện rộng.'
    ]
  },
  'LucQuang': {
    hp: '80,000',
    armor: '5,000',
    skills: [
      'Nội tại 1: Phóng quả cầu lửa gây sát thương và thiêu đốt.',
      'Nội tại 2: Tàng hình, tăng tốc chạy và hồi máu.',
      'Nội tại 3: Đặt bẫy độc gây sát thương và làm chậm.',
      'Chiêu cuối: Tạo đám mây độc khổng lồ rút máu liên tục.'
    ]
  },
  'LoiThan': {
    hp: '60,000',
    armor: '15,000',
    skills: [
      'Nội tại 1: Phóng tia sét gây sát thương phép.',
      'Nội tại 2: Lướt đi kèm hiệu ứng điện làm choáng.',
      'Nội tại 3: Phóng tia sét lan truyền.',
      'Chiêu cuối: Gọi bão sấm sét diện rộng.'
    ]
  },
  'TuMaY': {
    hp: '65,000',
    armor: '45,000',
    skills: [
      'Nội tại 1: Bắn liên hoàn đạn ma thuật.',
      'Nội tại 3: Đẩy lùi kẻ địch và gây nổ sát thương phép.',
      'Nội tại 4: Bắn đạn vòng cung 2 bên.',
      'Nội tại 5: Tạo vùng nổ chậm gây choáng.',
      'Chiêu cuối: Hồi 50% máu, tăng 70% giáp và 50% miễn thương khi máu dưới 50%.'
    ]
  },
  'PhongKich': {
    hp: '32,000',
    armor: '2,000',
    skills: [
      'Nội tại 1: Mỗi đòn đánh bắn thêm 2 mũi tên nhỏ. Trúng 3 mũi tên tạo 1 tầng Phong Ấn.',
      'Nội tại 2: Tiêu hao 3 tầng Phong Ấn để gây thêm STVL, STP, STC và làm chậm địch, tăng tốc chạy bản thân.',
      'Nội tại 3: Di chuyển liên tục 1.5s giúp đòn đánh tiếp theo xuyên 100% giáp và hồi máu.',
      'Nội tại 4: Máu dưới 30% tạo khiên 9,500, khi còn khiên nhận 70% miễn thương và tăng tốc chạy.',
      'Chiêu cuối: Biến dạng Gió Lốc (Miễn Nhiễm), tăng tốc chạy/bắn, bắn thêm 6 mũi tên, giảm hồi chiêu khi trúng Phong Ấn.'
    ]
  },
  'HacQuang': {
    hp: '75,000',
    armor: '15,000',
    skills: [
      'Nội tại 1 (Hố Đen): Mỗi đòn đánh thứ 2 gây sát thương chuẩn bằng 8% máu tối đa của địch và hút địch lại gần.',
      'Nội tại 2 (Vụ Nổ Big Bang): Bắn một quả cầu năng lượng. Khi nổ tạo ra Vùng Hư Không làm chậm và gây sát thương liên tục.',
      'Nội tại 3 (Bẻ Cong Không Gian): Né tránh mọi đòn đánh trong 3s. Mỗi đòn né được tích 1 điểm. Hết thời gian bắn tên lửa đuổi theo địch dựa trên số điểm tích được.',
      'Nội tại 4 (Trọng Lực Đảo Ngược): Hất tung địch xung quanh. Nếu địch rơi vào Vùng Hư Không sẽ bị choáng thêm 2.5s và nhận sát thương chuẩn.',
      'Nội tại 5 (Hấp Thụ Hư Không): Khi máu dưới 70%, hấp thụ các Vùng Hư Không xung quanh để hồi 25% máu mỗi vùng và nhận trạng thái Vô Địch trong 2.5s.',
      'Nội tại 6 (Bước Nhảy Không Gian): Dịch chuyển ra sau địch. Nếu đáp xuống Vùng Hư Không, hồi lại chiêu này. Đòn đánh tiếp theo sẽ dịch chuyển đến mục tiêu và gây lượng lớn sát thương.',
      'Chiêu cuối (Nhật Thực Toàn Phần): Bao trùm bản đồ trong bóng tối, hút nhẹ địch, giảm 70% thời gian hồi chiêu và miễn nhiễm khống chế. Khi kết thúc gây sát thương chuẩn dựa trên máu đã mất của địch.'
    ]
  },
  'VuDieuTinhQuang': {
    hp: '110,000',
    armor: '3,500',
    skills: [
      'Nội tại 1: Di chuyển liên tục hoặc dùng kỹ năng tích 1 tầng Vũ Điệu (tối đa 5). Mỗi tầng tăng 6% tốc chạy, 2% tốc đánh, 8% miễn sát thương chuẩn. Đủ 5 tầng tiêu hao để tạo vệt sáng làm chậm 99% và hồi 5% máu tối đa.',
      'Nội tại 2: Di chuyển 5 đơn vị tạo khiên 8,000 (tối đa 3 lớp). Có khiên giảm 30% sát thương nhận vào. Khiên vỡ gây 6,000 sát thương phép xung quanh.',
      'Nội tại 3: Dùng 3 kỹ năng trong 4s sẽ cường hóa trong 5s. Đánh thường bắn thêm 2 tia sáng gây sát thương phép và hồi máu. Giảm 50% hồi chiêu Nội tại 2.',
      'Chiêu cuối: Biến thân Tinh Quang Tối Thượng (8s). Miễn khống, tăng 50% tốc chạy, tạo khiên 25,000. Lướt qua địch (tối đa 3 lần) gây sát thương chuẩn và làm mới khiên. Có khiên giảm 40% sát thương. Đánh thường cường hóa gây sát thương chuẩn. Vô địch nhưng nhận phản hệ 50% nếu không gây đủ 55% máu địch.'
    ]
  },
  'NguyetQuangLo': {
    hp: '48,000',
    armor: '1,000',
    skills: [
      'Nội tại 1: Bắn ra 1 vòng cung ánh sáng gây sát thương phép và tích 1 dấu ấn. Nơi đi qua tạo hình chữ nhật trên đất 1.2s, địch chạm vào nhận sát thương phép và làm chậm 50% trong 0.5s.',
      'Nội tại 2: Lướt về hướng ngẫu nhiên (không thể chọn mục tiêu). Nếu địch có dấu ấn ở gần, bắn ra 2-14 tinh thể ánh sáng tùy dấu ấn. Tinh thể bay chậm, đuổi theo địch gây sát thương phép.',
      'Chiêu cuối: Mở lãnh địa ánh sáng vàng dịu (8s). Bản thân giảm 40% tốc độ nhưng không thể bị giảm thêm, tăng 25% Miễn thương. Mỗi tinh thể bay vào địch sẽ hồi máu cho bản thân.'
    ]
  },
  'HuyetMa': {
    hp: '100,000',
    armor: '15,000',
    skills: [
      'Tốc đánh: 25% | Sát thương đánh thường [STVL]: 45-80',
      'Nội tại 1 (Hồi 0.1s): Mỗi 5 lần đánh thường bắn ra 1 huyết tinh thể lớn đuổi theo mục tiêu, gây 980-1180 STVL/STP/STC ngẫu nhiên.',
      'Nội tại 2 (Hồi 0s): Mỗi 10 lần đánh thường tăng 30% Hút máu vật lí/phép trong 3s và hồi lập tức 3200 (+8% Máu đã mất) Giáp.',
      'Nội tại 3 (Hồi 24s - Kéo dài 8s): Cường hóa giúp mỗi đòn đánh thường gây tích dồn 0.02s choáng, gây cùng lúc 3 loại sát thương STVL/STP/STC. Kèm theo 30% STC giúp hồi 100 (+1% Máu đã mất) Giáp. Gây thêm 150 STVL & STP, tăng 20% tốc đánh, 20% miễn thương từ đánh thường và sát thương nhận vào không quá 4500.'
    ]
  },
  'TuTu': {
    hp: '38,000',
    armor: '4,000',
    skills: [
      'Nội tại 1 (Hồi 6s): Tạo ra 3 quả cầu vàng xoay quanh bản thân.',
      'Nội tại 2 (Hồi 12s): Miễn thương STVL và tạo ra 6 quả cầu.',
      'Nội tại 3 (Hồi 14s): Miễn thương STP, tăng 100% hồi phục và tạo ra 12 quả cầu.',
      'Chiêu cuối (Hồi 15s): GĐ 1 bắn tam giác vàng giảm tốc về 0, gây sát thương lớn và hồi máu, mở khóa GĐ 2 và giảm 40% hồi chiêu nội tại 1-2. GĐ 2 bắn 3 tứ giác vàng giảm hồi phục và giáp địch, giảm hồi chiêu cuối.'
    ]
  },
  'LyCuu': {
    hp: '150,000',
    armor: '12,000',
    skills: [
      'Nội tại 1 (Hồi 2.5s): Mỗi 6 đòn đánh nhận 1 đòn cường hóa gây STVL/STC, hồi máu, tăng 55% miễn thương (0.65s), tăng 10% tầm đánh và công vật lý (3s).',
      'Nội tại 2 (Hồi 1s): Tăng 80% tốc chạy (0.2s) và 800 giáp ảo. Nếu bị khống chế, hóa giải và tích 1-2 ấn Long Nộ (tối đa 6). Mỗi ấn tăng STVL, 3% miễn thương, 15% tầm đánh.',
      'Nội tại 3 (Hồi 7s): Xoay thương gây STVL (+4% máu tối đa địch), tăng 150% tốc đánh và 100% hút máu vật lý trong 3.5s.',
      'Chiêu cuối (Hồi 14s): Nện thương hất tung địch 1s, gây STVL (+12% máu đã mất địch). Trong 5s tiếp theo, 20% sát thương gây ra chuyển thành STC.'
    ]
  },
  'NganNgoc': {
    hp: '37,000',
    armor: '3,000',
    skills: [
      'Nội tại: Đánh thường phóng Lam giáo gây STVL.',
      'Chiêu 1: Ném Thần Trượng Định Mệnh gây STP. Ném thêm trượng phụ vào mục tiêu có Dấu Ấn ở phía trước.',
      'Chiêu 2: Dịch chuyển, tăng giáp và STP. Hồi máu và tạo Máu Ảo. Càng đông địch hồi càng nhiều.',
      'Chiêu 3: Tỏa ánh sáng xanh dừng thời gian địch. Tạm thời giảm mạnh hồi chiêu 1 và 2, tăng hút máu phép, giảm STVL nhận vào và miễn khống.'
    ]
  },
  'VoCat': {
    hp: '62,000',
    armor: '12,000',
    skills: [
      'Nội tại: Gây sát thương tích ấn Ma Quân (4 tầng nổ gây STVL + % máu tối đa, hồi máu và giáp).',
      'Chiêu 1: Vung đao gây STVL (+% máu hiện tại). Địch dính ấn Ma Quân sẽ bị choáng và nhận thêm sát thương.',
      'Chiêu 2: Tung trảo gây STVL, làm chậm và giảm hồi phục. Tái kích hoạt để biến đến cạnh mục tiêu gây STVL (+% máu đã mất).',
      'Chiêu cuối: Miễn khống, nhận 68% miễn thương và cưỡi ngựa. Đánh thường gây STVL diện rộng và tích Ma Uy (tăng thời gian bất tử và chuyển STVL thành STC). Nếu chết khi đang cưỡi ngựa sẽ vào trạng thái bất tử 3s.'
    ]
  },
  'BachTieuNga': {
    hp: '50,000',
    armor: '5,000',
    skills: [
      'Nội tại (Trời Phạt): Chiêu trúng đích khắc dấu ấn. 4 tầng bùng nổ hồi máu (theo máu đã mất), gây STC diện rộng (theo máu hiện tại bản thân) và làm chậm 70% trong 2s.',
      'Chiêu 1 (Con Đường Sám Hối): Vẽ đường ánh sáng gây STP. Thoáng chốc sau bùng nổ gây sát thương gấp đôi.',
      'Chiêu 2 (Đôi Cánh Thuần Khiết): Lướt (miễn chọn) và bắn 3 luồng ánh sáng gây STP. Trúng địch giảm 1s hồi chiêu 2.',
      'Chiêu cuối (Đại Phán Xét): Tạo pháp trận gây STP lúc xuất hiện và biến mất. Trong vùng hiệu lực, hồi chiêu nhanh gấp đôi.'
    ]
  },
  'VanCa': {
    hp: '58,000',
    armor: '11,200',
    skills: [
      'Nội tại: 15% chí mạng cơ bản (x1.8 sát thương). Tích 5 tầng Long Ấn hồi 60% chiêu 1-2 và tăng 40% tốc chạy.',
      'Chiêu 1: Giải khống, tăng 70% tốc chạy. Đòn đánh tiếp theo gây thêm sát thương (+15% máu đã mất), làm chậm 50% và giảm 30% giáp. Chí mạng reset chiêu.',
      'Chiêu 2: Quét thương gây sát thương diện rộng. Tăng 20% tốc đánh và 45% hút máu. Đánh thường giảm hồi chiêu này.',
      'Chiêu cuối: Cường hóa 4.5s: Đánh thường gây thêm sát thương, chuyển 30% sang sát thương chuẩn, nhận 25% miễn thương và hồi phục máu.'
    ]
  }
};

const getStatusName = (type: StatusType) => {
  switch (type) {
    case StatusType.STUN: return 'Choáng';
    case StatusType.SUPPRESS: return 'Áp Chế';
    case StatusType.SLOW: return 'Làm Chậm';
    case StatusType.BURN: return 'Thiêu Đốt';
    case StatusType.INVINCIBLE: return 'Vô Địch';
    case StatusType.UNDYING: return 'Bất Tử';
    case StatusType.IMMUNE: return 'Miễn Nhiễm';
    case StatusType.STEALTH: return 'Tàng Hình';
    case StatusType.CC_IMMUNE: return 'Miễn Khống';
    case StatusType.HEAL_REDUCTION: return 'Giảm Hồi Phục';
    case StatusType.WEAKEN: return 'Suy Yếu';
    default: return 'Unknown';
  }
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [champs, setChamps] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [p1Champ, setP1Champ] = useState('LyTin');
  const [p2Champ, setP2Champ] = useState('HaoPhong');
  const [showChampInfo, setShowChampInfo] = useState(false);
  
  const [p1Items, setP1Items] = useState<ItemId[]>([]);
  const [p2Items, setP2Items] = useState<ItemId[]>([]);

  const addItem = (player: 1 | 2, item: ItemId) => {
    if (player === 1) {
      if (p1Items.length < 5) setP1Items([...p1Items, item]);
    } else {
      if (p2Items.length < 5) setP2Items([...p2Items, item]);
    }
  };

  const removeItem = (player: 1 | 2, index: number) => {
    if (player === 1) {
      const newItems = [...p1Items];
      newItems.splice(index, 1);
      setP1Items(newItems);
    } else {
      const newItems = [...p2Items];
      newItems.splice(index, 1);
      setP2Items(newItems);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current);
    engine.init(p1Champ, p2Champ, p1Items, p2Items);
    engineRef.current = engine;

    let frameId: number;
    const updateUI = () => {
      if (engineRef.current) {
        setChamps(engineRef.current.champions.map(c => ({
          name: c.name,
          hp: Math.max(0, Math.round(c.hp)),
          maxHp: c.maxHp,
          armor: Math.max(0, Math.round(c.armor)),
          maxArmor: c.getMaxArmor(),
          isDead: c.isDead,
          color: c.color,
          statuses: c.statuses.map(s => getStatusName(s.type)),
          items: c.items
        })));
      }
      frameId = requestAnimationFrame(updateUI);
    };
    updateUI();

    return () => {
      engine.destroy();
      cancelAnimationFrame(frameId);
    };
  }, [gameState, p1Champ, p2Champ]);

  const toggleSound = () => {
    const isEnabled = SoundManager.toggle();
    setSoundEnabled(isEnabled);
  };

  const startGame = () => {
    setGameState('playing');
    SoundManager.init();
    SoundManager.playGameStart();
    SoundManager.playAmbientDrone();
  };

  const backToMenu = () => {
    setGameState('menu');
  };

  const renderItemShop = (player: 1 | 2, items: ItemId[]) => (
    <div className="mt-4 md:mt-6 flex flex-col items-center gap-3 w-full">
      <h3 className="text-xs md:text-sm text-slate-400 uppercase tracking-widest font-bold">Trang bị ({items.length}/5)</h3>
      <div className="flex gap-2 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            onClick={() => removeItem(player, i)}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border ${i < items.length ? 'border-indigo-500 bg-indigo-500/20 cursor-pointer hover:bg-red-900/40 hover:border-red-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'border-slate-700 bg-slate-900/80 shadow-inner'} flex items-center justify-center text-xl md:text-2xl transition-all duration-200`}
            title={i < items.length ? "Nhấn để gỡ bỏ" : ""}
          >
            {i < items.length ? ITEMS[items[i]].icon : ''}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {Object.values(ITEMS).map(item => (
          <button
            key={item.id}
            onClick={() => addItem(player, item.id)}
            disabled={items.length >= 5}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 group relative shadow-md"
          >
            <span className="text-xl md:text-2xl drop-shadow-md">{item.icon}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 md:w-72 p-4 bg-slate-950/95 backdrop-blur-md text-slate-300 text-xs md:text-sm rounded-xl border border-indigo-900/50 opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <div className="font-black text-indigo-400 mb-2 text-sm md:text-base uppercase tracking-wider border-b border-slate-800 pb-2">{item.name}</div>
              {item.descriptionLines ? (
                <ul className="space-y-1.5 list-disc pl-4 text-left">
                  {item.descriptionLines.map((line, idx) => (
                    <li key={idx} className={line.includes('Nội tại') ? 'text-amber-400 mt-2 font-bold' : 'text-slate-400'}>
                      <span className="-ml-1">{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-400 text-left">{item.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-900 overflow-hidden touch-none relative">
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-start md:justify-center bg-slate-950 overflow-y-auto py-8 px-4">
          {/* Background Grid & Stars */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 50%)`
          }}></div>

          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 mb-8 md:mb-12 text-center tracking-widest uppercase float-effect" style={{ textShadow: '0 0 20px rgba(192, 132, 252, 0.4)' }}>
              Đấu Trường Hắc Ám
            </h1>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-8 w-full max-w-5xl justify-center">
            <div className="flex flex-col items-center gap-4 w-full md:w-1/2 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-indigo-900/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              <h2 className="text-xl md:text-2xl text-indigo-200 font-bold tracking-wider uppercase mb-2">Người chơi 1</h2>
              <div className="flex flex-row flex-wrap justify-center gap-3">
                {CHAMPIONS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setP1Champ(c.id)}
                    className={`px-4 py-2 md:px-6 md:py-3 rounded-lg border-2 transition-all duration-300 text-sm md:text-base font-bold tracking-wide bg-slate-900/80 hover:bg-slate-800 ${p1Champ === c.id ? 'shadow-[0_0_15px_currentColor] scale-105' : 'opacity-80'}`}
                    style={{ borderColor: c.color, color: c.color, textShadow: p1Champ === c.id ? `0 0 10px ${c.color}` : 'none' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-900/50 to-transparent my-2"></div>
              {renderItemShop(1, p1Items)}
            </div>
            
            <div className="hidden md:flex items-center justify-center">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent"></div>
            </div>
            
            <div className="flex flex-col items-center gap-4 w-full md:w-1/2 bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-purple-900/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
              <h2 className="text-xl md:text-2xl text-purple-200 font-bold tracking-wider uppercase mb-2">Người chơi 2</h2>
              <div className="flex flex-row flex-wrap justify-center gap-3">
                {CHAMPIONS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setP2Champ(c.id)}
                    className={`px-4 py-2 md:px-6 md:py-3 rounded-lg border-2 transition-all duration-300 text-sm md:text-base font-bold tracking-wide bg-slate-900/80 hover:bg-slate-800 ${p2Champ === c.id ? 'shadow-[0_0_15px_currentColor] scale-105' : 'opacity-80'}`}
                    style={{ borderColor: c.color, color: c.color, textShadow: p2Champ === c.id ? `0 0 10px ${c.color}` : 'none' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-900/50 to-transparent my-2"></div>
              {renderItemShop(2, p2Items)}
            </div>
          </div>
          
          <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
            <button 
              onClick={startGame}
              disabled={!p1Champ || !p2Champ}
              className="px-12 py-4 md:px-16 md:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl text-xl md:text-2xl transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-105 uppercase tracking-widest border border-indigo-400/50 shrink-0 glow-effect disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Huyết Chiến
            </button>
            <button 
              onClick={() => setShowChampInfo(true)}
              className="px-8 py-3 md:px-10 md:py-4 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-lg transition-all duration-300 border border-indigo-500/30 hover:border-indigo-400/60 uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
            >
              Thông tin Tướng
            </button>
          </div>

          {showChampInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
              <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.3)] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-indigo-900/50 bg-slate-900/80">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest">
                    Thông tin Tướng
                  </h2>
                  <button 
                    onClick={() => setShowChampInfo(false)}
                    className="text-slate-400 hover:text-white transition-colors p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CHAMPIONS.map(c => {
                      const details = CHAMPION_DETAILS[c.id];
                      if (!details) return null;
                      return (
                        <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                          <div className="flex items-center gap-3 mb-4 border-b border-slate-700/50 pb-3">
                            <div className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: c.color, color: c.color }}></div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider" style={{ textShadow: `0 0 10px ${c.color}` }}>{c.name}</h3>
                          </div>
                          <div className="flex gap-4 mb-4 text-sm font-mono font-bold">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400">SINH MỆNH</span>
                              <span className="text-emerald-400">{details.hp}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400">HỘ GIÁP</span>
                              <span className="text-amber-400">{details.armor}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {details.skills.map((skill: string, idx: number) => {
                              const [title, ...rest] = skill.split(':');
                              return (
                                <div key={idx} className="text-sm">
                                  <span className="text-indigo-300 font-bold">{title}:</span>
                                  <span className="text-slate-300">{rest.join(':')}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
          />
          
          {/* Back to menu button */}
          <button 
            onClick={backToMenu}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-full backdrop-blur-sm border border-white/10 transition-colors text-sm font-bold"
          >
            ĐỔI TƯỚNG
          </button>

          {/* Sound Toggle Button */}
          <button 
            onClick={toggleSound}
            className="absolute bottom-4 right-4 z-50 p-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-full backdrop-blur-sm border border-white/10 transition-colors"
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          {/* Real-time UI Overlay */}
          <div className="absolute top-0 left-0 right-0 p-2 md:p-4 flex justify-between pointer-events-none z-40">
            {champs.map((champ, idx) => {
              const isLeft = idx === 0;
              const bgColor = isLeft ? 'bg-red-950/40' : 'bg-slate-900/80';
              const borderColor = isLeft ? 'border-red-900/50' : 'border-indigo-900/50';
              
              return (
              <div key={idx} className={`${bgColor} backdrop-blur-md p-3 md:p-4 rounded-xl border ${borderColor} w-40 md:w-64 flex flex-col gap-2 md:gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden`}>
                <div className="flex items-center justify-center gap-2 md:gap-3 border-b border-slate-800/50 pb-1 md:pb-2">
                  <span className="text-white font-black tracking-widest uppercase text-sm md:text-lg" style={{ textShadow: `0 0 10px ${champ.color}` }}>{champ.name}</span>
                </div>
                
                <div className="flex flex-col gap-1 md:gap-1.5">
                  <div className="flex justify-between text-[10px] md:text-xs text-emerald-400 font-mono font-bold">
                    <span>SINH MỆNH</span>
                    <span>{Math.floor(champ.hp).toLocaleString()} / {Math.floor(champ.maxHp).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 md:h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full transition-all duration-150 relative" style={{ width: `${Math.max(0, (champ.hp / champ.maxHp) * 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 md:gap-1.5">
                  <div className="flex justify-between text-[10px] md:text-xs text-amber-400 font-mono font-bold">
                    <span>HỘ GIÁP</span>
                    <span>{Math.floor(champ.armor).toLocaleString()} / {Math.floor(champ.maxArmor).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 md:h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-150" style={{ width: `${Math.max(0, (champ.armor / Math.max(champ.maxArmor, champ.armor)) * 100)}%` }}></div>
                  </div>
                </div>

                {champ.statuses.length > 0 && (
                  <div className="flex flex-wrap gap-1 md:gap-1.5 mt-0.5 md:mt-1">
                    {Array.from(new Set(champ.statuses)).map((status: any, i) => (
                      <span key={i} className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-600 uppercase tracking-wider font-bold shadow-sm">
                        {status}
                      </span>
                    ))}
                  </div>
                )}

                {champ.items && champ.items.length > 0 && (
                  <div className="flex gap-1 md:gap-1.5 mt-0.5 md:mt-1 pt-1 md:pt-2 border-t border-slate-800/50">
                    {champ.items.map((itemId: ItemId, i: number) => (
                      <div key={i} className="w-5 h-5 md:w-7 md:h-7 rounded bg-slate-900 border border-indigo-900/50 flex items-center justify-center text-[10px] md:text-sm shadow-inner" title={ITEMS[itemId].name}>
                        {ITEMS[itemId].icon}
                      </div>
                    ))}
                    {champ.hacAnStacks > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-[10px] md:text-xs font-bold text-purple-400 bg-purple-950/50 px-1.5 md:px-2 rounded border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        <span>🔱</span>
                        <span>{champ.hacAnStacks}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {champ.isDead && (
                  <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <div className="text-red-500 text-xl md:text-3xl font-black tracking-widest uppercase animate-pulse" style={{ textShadow: '0 0 20px rgba(239,68,68,0.8)' }}>TỬ TRẬN</div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </>
      )}
    </div>
  );
};
