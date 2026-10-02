export interface Character {
  id: string;
  name: string;
  role: string;
  description?: string;
  avatar?: string;
  avatarUrl?: string;
  personality?: string;
  symbolicMeaning?: string;
  keyQuote?: string;
  quote?: string;
}

export interface AuthorDetails {
  name: string;
  years?: string;
  country?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  biography?: string;
  writingStyle?: string;
  style?: string;
  majorWorks?: string[];
  famousQuote?: string;
  quote?: string;
}

export interface StoryArcPhase {
  phase: 'Mở đầu' | 'Biến cố' | 'Cao trào' | 'Mở nút & Kết thúc' | string;
  title: string;
  description: string;
  stage?: string;
}

export interface PlotSynopsis {
  overview: string;
  arc: StoryArcPhase[];
  keyEvents?: string[];
}

export interface HistoricalContext {
  period: string;
  creationCircumstance: string;
  societalImpact: string;
}

export interface Book {
  id: string;
  isbn: string;
  libraryCode?: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: string;
  description: string;
  summary: string;
  keyTakeaways: string[];
  themes: string[];
  message: string;
  targetAge: string;
  shelfLocation?: string;
  coverImage: string;
  barcodeImage?: string;
  aiContext: string;
  characters?: Character[];
  authorDetails?: AuthorDetails;
  plotSynopsis?: PlotSynopsis;
  historicalContext?: HistoricalContext;
  rating: number;
  pageCount?: number;
  views: number;
  scanCount: number;
  featured?: boolean;
  curiosities?: BookCuriosityQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface BookCuriosityQuestion {
  id: string;
  title: string;
  tag: string;
  question: string;
  mysteryClue: string;
  imageUrl: string;
  imageCaption: string;
  options: string[];
  correctOptionIndex: number;
  answerExplanation: string;
  funFactOrQuote: string;
}

// Quiz & Learning Hub Types
export type QuizType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank';

export interface MultipleChoiceQuiz {
  id: string;
  type: 'multiple_choice';
  bookId?: string;
  bookTitle?: string;
  category: string;
  question: string;
  imageUrl: string;
  imageCaption?: string;
  clue?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
}

export interface TrueFalseQuiz {
  id: string;
  type: 'true_false';
  bookId?: string;
  bookTitle?: string;
  category: string;
  statement: string;
  imageUrl: string;
  imageCaption?: string;
  clue?: string;
  isTrue: boolean;
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
}

export interface MatchingPairItem {
  id: string;
  leftText: string;
  leftSubtitle?: string;
  rightText: string;
  rightSubtitle?: string;
}

export interface MatchingQuiz {
  id: string;
  type: 'matching';
  bookId?: string;
  bookTitle?: string;
  category: string;
  title: string;
  instruction: string;
  imageUrl: string;
  imageCaption?: string;
  pairs: MatchingPairItem[];
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
}

export interface FillBlankQuiz {
  id: string;
  type: 'fill_blank';
  bookId?: string;
  bookTitle?: string;
  category: string;
  question: string;
  sentenceWithBlank: string; // e.g. "Điều cốt yếu thì [...] đối với mắt trần"
  acceptedAnswers: string[]; // e.g. ["vô hình", "vo hinh"]
  placeholder?: string;
  imageUrl: string;
  imageCaption?: string;
  clue?: string;
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
}

export interface CrosswordRow {
  id: string;
  rowNumber: number;
  clue: string;
  answer: string; // Words (e.g. "NGHIAHIEP", "DETRUI", "TRUONGTHANH")
  keyCharIndex: number; // Index in answer that maps to the Master Keyword
}

export interface CrosswordQuiz {
  id: string;
  type: 'crossword';
  bookId?: string;
  bookTitle?: string;
  category: string;
  title: string;
  instruction: string;
  masterKeyword: string; // CỤM TỪ KHÓA TỔNG (e.g. "LƯƠNG TRI", "THUẦN HÓA", "TƯỞNG TƯỢNG")
  masterClue: string; // Gợi ý tư tưởng cốt lõi mở khóa từ khóa tổng
  rows: CrosswordRow[];
  imageUrl?: string;
  imageCaption?: string;
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
}

export interface MediaAnalysisQuiz {
  id: string;
  type: 'media_analysis';
  bookId?: string;
  bookTitle?: string;
  category: string;
  question: string;
  mediaType: 'image' | 'video_documentary';
  mediaUrl: string;
  mediaCaption: string;
  analysisFocus: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  evidence?: string;
  didYouKnow?: string;
  clue?: string;
  alternativeMedia?: {
    title: string;
    url: string;
    caption: string;
  }[];
}

export type UniversalQuiz =
  | MultipleChoiceQuiz
  | TrueFalseQuiz
  | MatchingQuiz
  | FillBlankQuiz
  | CrosswordQuiz
  | MediaAnalysisQuiz;

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  gradient: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  isStreaming?: boolean;
}

export interface DailyScanStat {
  date: string;
  scans: number;
  searches: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  totalBooks: number;
  totalScans: number;
  totalQueries: number;
  totalViews: number;
  dailyScans: DailyScanStat[];
  categoryStats: CategoryStat[];
  topBooks: {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    category: string;
    scanCount: number;
    views: number;
  }[];
}

export interface DeviceStatus {
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'standby' | 'scanning';
  batteryLevel?: number;
  lastHeartbeat: string;
  firmwareVersion: string;
}

export interface PersonalityRecommendation {
  book: Book;
  matchScore: number;
  matchReason: string;
  highlightQuoteOrLesson: string;
}

export interface PersonalityMatchInput {
  target: 'self' | 'friend';
  targetName?: string;
  personalityTraits: string[];
  customPersonality?: string;
  favoriteGenres: string[];
  readingGoal?: string;
}
