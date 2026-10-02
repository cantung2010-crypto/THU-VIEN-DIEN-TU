import { Book } from '../types.js';

export interface DetailedCharacter {
  id?: string;
  name: string;
  role: string;
  description: string;
  avatarUrl?: string;
  avatar?: string;
  personality?: string;
  symbolicMeaning?: string;
  keyQuote?: string;
  quote?: string;
  traits?: string[];
}

export interface HistoricalContext {
  period: string;
  creationCircumstance: string;
  societalImpact: string;
}

export interface AuthorDetails {
  name: string;
  years?: string;
  country?: string;
  avatarUrl?: string;
  avatar?: string;
  biography?: string;
  bio?: string;
  writingStyle?: string;
  style?: string;
  majorWorks?: string[];
  quote?: string;
  famousQuote?: string;
}

export interface PlotSynopsis {
  overview: string;
  arc: Array<{ stage: string; title: string; description: string; phase?: string }>;
  keyEvents?: string[];
}

export interface EnrichedBookDetails {
  detailedCharacters?: DetailedCharacter[];
  historicalContext?: HistoricalContext;
  authorDetails?: AuthorDetails;
  plotSynopsis?: PlotSynopsis;
}

export const BOOK_DETAILED_INSIGHTS: Record<string, EnrichedBookDetails> = {
  'de-men-phieu-luu-ky': {
    authorDetails: {
      name: 'Tô Hoài',
      years: '1920 - 2014',
      country: 'Việt Nam',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      biography: 'Nhà văn Tô Hoài (tên thật là Nguyễn Sen) là cây đại thụ của nền văn học thiếu nhi Việt Nam, tác giả của hàng trăm tác phẩm gắn liền với đời sống làng quê Bắc Bộ.',
      writingStyle: 'Ngôn từ phong phú, đậm chất dân dã, nhân cách hóa loài vật tinh tế và tràn ngập tình yêu thiên nhiên.',
      majorWorks: ['Dế Mèn Phiêu Lưu Ký', 'O Chuột', 'Vợ Chồng A Phủ', 'Cát Bụi Chân Ai'],
      famousQuote: 'Viết cho thiếu nhi phải bằng cái nhìn trong sáng, phát hiện cái hay cái đẹp của cuộc đời để giáo dục lòng nhân ái.',
    },
    historicalContext: {
      period: 'Thời kỳ 1941 - Trước Cách mạng Tháng Tám',
      creationCircumstance: 'Tác phẩm được sáng tác khi nhà văn mới 21 tuổi, lấy bối cảnh vùng quê ven sông Đáy và làng Nghĩa Đô thân thương.',
      societalImpact: 'Cuốn sách thiếu nhi được dịch ra nhiều thứ tiếng nhất của Việt Nam, nuôi dưỡng tâm hồn của hàng triệu thế hệ độc giả.',
    },
    detailedCharacters: [
      {
        name: 'Dế Mèn',
        role: 'Nhân vật chính xưng Tôi',
        description: 'Chàng dế khỏe mạnh, ban đầu kiêu căng xốc nổi, sau trải qua biến cố đã thức tỉnh và trở thành hiệp sĩ chuộng hòa bình.',
        traits: ['Cường tráng', 'Dũng cảm', 'Trọng nghĩa khí', 'Biết sửa sai'],
      },
      {
        name: 'Dế Choắt',
        role: 'Người bạn láng giềng xấu số',
        description: 'Chàng dế gầy gò ốm yếu, nạn nhân của trò đùa nông nổi, để lại bài học thức tỉnh suốt đời cho Dế Mèn.',
        traits: ['Hiền lành', 'Yếu đuối', 'Bao dung', 'Thật thà'],
      },
      {
        name: 'Dế Trũi',
        role: 'Người anh em kết nghĩa sinh tử',
        description: 'Võ sĩ dế gan dạ, tính tình bộc trực, trung kiên và luôn đồng cam cộng khổ cùng Dế Mèn.',
        traits: ['Nghĩa hiệp', 'Kiên cường', 'Trung thành', 'Chân thành'],
      },
    ],
    plotSynopsis: {
      overview: 'Hành trình từ một chú dế kiêu ngạo gây họa đến chàng dũng sĩ phiêu lưu bốn bể truyền bá lý tưởng muôn loài kết nghĩa anh em.',
      arc: [
        { stage: 'Khởi đầu', title: 'Bài học đường đời đầu tiên', description: 'Tính kiêu ngạo của Dế Mèn dẫn tới cái chết thương tâm của Dế Choắt.' },
        { stage: 'Phát triển', title: 'Kết nghĩa Dế Trũi', description: 'Dế Mèn cứu Dế Trũi khỏi bầy bọ ngựa, hai người kết nghĩa cùng ngao du sơn thủy.' },
        { stage: 'Đỉnh cao', title: 'Lạc mất và hội ngộ', description: 'Trải qua nhiều kiếp nạn, hai anh em tìm lại nhau và giương cao ngọn cờ hòa bình muôn loài.' },
      ],
      keyEvents: [
        'Dế Mèn cà khịa chị Cốc và cái chết của Dế Choắt',
        'Cuộc đọ sức với bầy Bọ Ngựa và giải cứu Dế Trũi',
        'Vượt qua Tổng Châu Chấu và truyền bá hòa bình',
      ],
    },
  },
  'hoang-tu-be': {
    authorDetails: {
      name: 'Antoine de Saint-Exupéry',
      years: '1900 - 1944',
      country: 'Pháp',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      biography: 'Nhà văn kiêm phi công tiên phong người Pháp, tác giả của những kiệt tác văn chương tràn đầy tinh thần nhân bản và chất thơ vũ trụ.',
      writingStyle: 'Văn phong thơ mộng, ẩn dụ triết học thâm thúy, nhẹ nhàng mà lay động sâu xa tâm khảm con người.',
      majorWorks: ['Hoàng Tử Bé (Le Petit Prince)', 'Bay Đêm', 'Cõi Người Ta', 'Phi Công Thời Chiến'],
      famousQuote: 'Người ta chỉ thấy rõ bằng trái tim, điều cốt yếu thì vô hình đối với mắt trần.',
    },
    historicalContext: {
      period: 'Chiến tranh thế giới thứ hai (1943)',
      creationCircumstance: 'Được viết tại New York trong thời gian Saint-Exupéry lưu vong vì Thế chiến, khi tâm hồn ông trĩu nặng âu lo về số phận nhân loại.',
      societalImpact: 'Tác phẩm được dịch sang hơn 500 thứ tiếng, trở thành biểu tượng toàn cầu về tình yêu thương, sự gắn kết và tinh thần thơ trẻ.',
    },
    detailedCharacters: [
      {
        name: 'Hoàng Tử Bé',
        role: 'Nhân vật trung tâm biểu tượng',
        description: 'Cậu bé đến từ tiểu hành tinh B612 với mái tóc vàng và chiếc khăn choàng, đại diện cho sự thuần khiết và chân lý tâm hồn.',
        traits: ['Trong sáng', 'Kiên trì', 'Nhạy cảm', 'Tận tụy'],
      },
      {
        name: 'Con Cáo',
        role: 'Người thầy triết học',
        description: 'Sinh vật sa mạc dạy cho Hoàng Tử Bé bản chất của sự thuần hóa, giá trị của thời gian và trách nhiệm gắn kết.',
        traits: ['Khôn ngoan', 'Chân thành', 'Sâu sắc'],
      },
      {
        name: 'Bông Hồng',
        role: 'Người yêu thương kiêu kỳ',
        description: 'Bông hoa duy nhất trên B612, có 4 chiếc gai tự vệ, mong manh nhưng yêu thương Hoàng Tử Bé vô bờ.',
        traits: ['Kiêu hãnh', 'Mong manh', 'Chân thành'],
      },
    ],
    plotSynopsis: {
      overview: 'Cuộc gặp gỡ kỳ diệu giữa viên phi công gặp nạn trên sa mạc Sahara và Hoàng Tử Bé từ tiểu tinh cầu B612.',
      arc: [
        { stage: 'Khởi đầu', title: 'Gặp gỡ giữa sa mạc', description: 'Phi công hỏng máy bay nghe tiếng cậu bé tóc vàng đòi vẽ một con cừu.' },
        { stage: 'Phát triển', title: 'Hành trình qua các tiểu hành tinh', description: 'Hoàng Tử Bé kể về những người lớn kỳ quặc mà cậu gặp trước khi tới Trái Đất.' },
        { stage: 'Đỉnh cao', title: 'Bí mật của Cáo và sự chia ly', description: 'Cậu thấu hiểu bí mật tình yêu dành cho Bông Hồng và quyết định trở về với bụi sao.' },
      ],
      keyEvents: [
        'Vẽ con cừu trong chiếc hộp có ba cái lỗ',
        'Hành trình thăm tiểu hành tinh của Vua, Kẻ khoe khoang, Doanh nhân',
        'Thuần hóa Con Cáo và bài học về đôi mắt trái tim',
      ],
    },
  },
};

export function getEnrichedBookDetails(book: Book): EnrichedBookDetails {
  const staticInsight: Partial<EnrichedBookDetails> = BOOK_DETAILED_INSIGHTS[book.id] || {};
  const staticAd: Partial<AuthorDetails> = staticInsight.authorDetails || {};
  const staticPs: Partial<PlotSynopsis> = staticInsight.plotSynopsis || {};
  const staticHc: Partial<HistoricalContext> = staticInsight.historicalContext || {};

  // 1. Detailed Characters: Always prioritize what is saved in book.characters
  let detailedCharacters: DetailedCharacter[] = [];
  if (Array.isArray(book.characters) && book.characters.length > 0) {
    detailedCharacters = book.characters.map((c, idx) => ({
      id: c.id || `char-${idx}-${c.name}`,
      name: c.name,
      role: c.role || 'Nhân vật',
      description: c.description || 'Nhân vật trong tác phẩm.',
      avatarUrl: c.avatarUrl || c.avatar,
      avatar: c.avatarUrl || c.avatar,
      personality: c.personality,
      symbolicMeaning: c.symbolicMeaning,
      keyQuote: c.keyQuote || c.quote,
      quote: c.keyQuote || c.quote,
      traits: c.personality ? [c.personality] : undefined,
    }));
  } else if (staticInsight.detailedCharacters && staticInsight.detailedCharacters.length > 0) {
    detailedCharacters = staticInsight.detailedCharacters.map((c, idx) => ({
      ...c,
      id: c.id || `static-char-${idx}-${c.name}`,
      keyQuote: c.keyQuote || c.quote,
    }));
  } else {
    detailedCharacters = [
      {
        id: 'char-main-default',
        name: 'Nhân vật chính',
        role: 'Trung tâm câu chuyện',
        description: `Dẫn dắt người đọc khám phá thế giới trong cuốn "${book.title}".`,
      },
    ];
  }

  // 2. Author Details: Always prioritize what is saved in book.authorDetails
  let authorDetails: AuthorDetails;
  if (book.authorDetails && (book.authorDetails.name || book.authorDetails.bio || book.authorDetails.biography || book.authorDetails.writingStyle)) {
    const ad = book.authorDetails;
    authorDetails = {
      name: ad.name || staticAd.name || book.author,
      years: ad.years || staticAd.years || `${book.year || 'Thế kỷ XX'}`,
      country: ad.country || staticAd.country || 'Việt Nam',
      avatarUrl: ad.avatarUrl || ad.avatar || staticAd.avatarUrl || staticAd.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      avatar: ad.avatarUrl || ad.avatar || staticAd.avatarUrl || staticAd.avatar,
      biography: ad.bio || ad.biography || staticAd.biography || staticAd.bio || `Tác giả ${book.author} là người sáng tác tác phẩm "${book.title}".`,
      bio: ad.bio || ad.biography || staticAd.biography || staticAd.bio,
      writingStyle: ad.writingStyle || ad.style || staticAd.writingStyle || staticAd.style || 'Văn phong truyền cảm, tư duy sâu sắc và giàu giá trị biểu đạt.',
      style: ad.writingStyle || ad.style || staticAd.writingStyle || staticAd.style,
      majorWorks: ad.majorWorks || staticAd.majorWorks || [book.title],
      famousQuote: ad.famousQuote || ad.quote || staticAd.famousQuote || staticAd.quote || book.message || 'Mỗi cuốn sách là một thế giới thu nhỏ, mở ra chân trời hiểu biết.',
      quote: ad.famousQuote || ad.quote || staticAd.famousQuote || staticAd.quote || book.message,
    };
  } else if (staticInsight.authorDetails) {
    authorDetails = staticInsight.authorDetails;
  } else {
    authorDetails = {
      name: book.author,
      years: `${book.year || 'Thế kỷ XX'}`,
      country: 'Việt Nam / Thế giới',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      biography: `Tác giả ${book.author} là người chấp bút cho tác phẩm "${book.title}", mang lại nhiều giá trị văn hóa và tư tưởng sâu sắc.`,
      writingStyle: 'Văn phong chặt chẽ, tư duy sắc bén và giàu giá trị biểu đạt.',
      majorWorks: [book.title],
      famousQuote: book.message || 'Mỗi cuốn sách là một thế giới thu nhỏ, mở ra chân trời hiểu biết và tôi luyện phẩm giá con người.',
    };
  }

  // 3. Plot Synopsis: Always prioritize what is saved in book.plotSynopsis
  let plotSynopsis: PlotSynopsis;
  if (book.plotSynopsis && (book.plotSynopsis.overview || (Array.isArray(book.plotSynopsis.arc) && book.plotSynopsis.arc.length > 0))) {
    const ps = book.plotSynopsis;
    plotSynopsis = {
      overview: ps.overview || staticPs.overview || book.summary || book.description,
      arc: Array.isArray(ps.arc) && ps.arc.length > 0
        ? ps.arc.map((a) => ({
            stage: a.phase || 'Diễn biến',
            phase: a.phase || 'Diễn biến',
            title: a.title || a.phase || 'Giai đoạn',
            description: a.description || '',
          }))
        : (staticPs.arc || [
            { stage: 'Mở đầu', phase: 'Mở đầu', title: 'Mở đầu câu chuyện', description: book.summary || 'Giới thiệu bối cảnh và khởi đầu câu chuyện.' },
            { stage: 'Biến cố', phase: 'Biến cố', title: 'Biến cố & Thử thách', description: 'Các xung đột và bước ngoặt diễn ra trong tác phẩm.' },
            { stage: 'Cao trào', phase: 'Cao trào', title: 'Điểm nút cao trào', description: 'Đỉnh điểm kịch tính của tác phẩm.' },
            { stage: 'Mở nút & Kết thúc', phase: 'Mở nút & Kết thúc', title: 'Hồi kết & Bài học', description: book.message || 'Khẳng định giá trị nhân văn và thông điệp trường tồn.' },
          ]),
      keyEvents: Array.isArray(ps.keyEvents) && ps.keyEvents.length > 0
        ? ps.keyEvents
        : staticPs.keyEvents || book.keyTakeaways || ['Khởi đầu hành trình', 'Đối diện biến cố', 'Đúc kết bài học nhân sinh'],
    };
  } else if (staticInsight.plotSynopsis) {
    plotSynopsis = staticInsight.plotSynopsis;
  } else {
    plotSynopsis = {
      overview: book.summary || book.description,
      arc: [
        { stage: 'Mở đầu', phase: 'Mở đầu', title: 'Mở đầu câu chuyện', description: book.summary || 'Giới thiệu bối cảnh, nhân vật và sự kiện khởi xướng.' },
        { stage: 'Biến cố', phase: 'Biến cố', title: 'Biến cố & Thử thách', description: 'Các xung đột và bước ngoặt diễn ra trong tác phẩm.' },
        { stage: 'Cao trào', phase: 'Cao trào', title: 'Điểm nút cao trào', description: 'Đỉnh điểm kịch tính và mâu thuẫn được đẩy lên cao.' },
        { stage: 'Mở nút & Kết thúc', phase: 'Mở nút & Kết thúc', title: 'Hồi kết & Bài học', description: book.message || 'Khẳng định giá trị nhân văn và thông điệp trường tồn.' },
      ],
      keyEvents: book.keyTakeaways || ['Khởi đầu hành trình', 'Đối diện biến cố', 'Đúc kết bài học nhân sinh'],
    };
  }

  // 4. Historical Context: Always prioritize what is saved in book.historicalContext
  let historicalContext: HistoricalContext;
  if (book.historicalContext && (book.historicalContext.period || book.historicalContext.creationCircumstance || book.historicalContext.societalImpact)) {
    const hc = book.historicalContext;
    historicalContext = {
      period: hc.period || staticHc.period || `Thời kỳ xuất bản năm ${book.year || ''}`,
      creationCircumstance: hc.creationCircumstance || staticHc.creationCircumstance || `Tác phẩm được sáng tác và xuất bản năm ${book.year || 'thời kỳ cận hiện đại'}.`,
      societalImpact: hc.societalImpact || staticHc.societalImpact || 'Tác phẩm được đông đảo độc giả đón nhận và có giá trị giáo dục, lan tỏa tri thức tích cực.',
    };
  } else if (staticInsight.historicalContext) {
    historicalContext = staticInsight.historicalContext;
  } else {
    historicalContext = {
      period: `Thời kỳ xuất bản năm ${book.year || 'trước đây'}`,
      creationCircumstance: `Tác phẩm ra đời trong bối cảnh xã hội chuyển mình, phản ánh tư tưởng tiến bộ của ${book.author}.`,
      societalImpact: 'Tác phẩm được đón nhận rộng rãi và truyền cảm hứng cho nhiều thế hệ độc giả.',
    };
  }

  return {
    detailedCharacters,
    authorDetails,
    plotSynopsis,
    historicalContext,
  };
}
