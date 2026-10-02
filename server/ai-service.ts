import { GoogleGenAI } from '@google/genai';
import { Book, BookCuriosityQuestion } from '../src/types.js';
import { getCuriositiesForBook } from '../src/data/bookCuriosities.js';

export interface AIResponse {
  answer: string;
  provider: 'gemini' | 'rag-fallback';
  model: string;
  sources: string[];
}

export class AIService {
  private geminiClient: GoogleGenAI | null = null;
  private hasApiKey = false;

  constructor() {
    this.getGeminiClient();
  }

  private getGeminiClient(): GoogleGenAI | null {
    if (this.geminiClient) return this.geminiClient;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
      try {
        this.geminiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        this.hasApiKey = true;
        console.log('✅ Google Gemini API client initialized successfully for THƯ VIỆN THÔNG MINH.');
        return this.geminiClient;
      } catch (err) {
        console.error('Failed to initialize GoogleGenAI client:', err);
        this.geminiClient = null;
        this.hasApiKey = false;
      }
    } else {
      console.log('No GEMINI_API_KEY configured. THƯ VIỆN THÔNG MINH using Grounded Local RAG Provider.');
    }
    return null;
  }

  public isGeminiAvailable(): boolean {
    return !!this.getGeminiClient();
  }

  /**
   * Generates a grounded response about a specific book using Google Gemini or Grounded Local RAG
   */
  public async chatAboutBook(book: Book, question: string): Promise<AIResponse> {
    // 1. Build Grounded Book Context
    const bookContext = this.buildBookContext(book);

    // 2. Call Google Gemini Chatbot
    const client = this.getGeminiClient();
    if (client) {
      const isQuoteInquiry = /câu nói|trích dẫn|câu trích|lời thoại|tuyên ngôn|phát ngôn|đoạn trích|".+"|“.*”|'.*'|triết lý|thông điệp/i.test(question);

      const systemPrompt = `Bạn là Chuyên gia Cố vấn Văn học & Tư duy Phản biện Sâu sắc của Thư viện Thông minh (sử dụng mô hình Google Gemini).

NGUYÊN TẮC PHÂN TÍCH & SUY LUẬN BẮT BUỘC:
${isQuoteInquiry ? `ĐẶC BIỆT KHI PHÂN TÍCH MỘT CÂU NÓI, LỜI THOẠI, TRÍCH DẪN HOẶC THÔNG ĐIỆP:
- Phải đưa ra câu trả lời THẬT CHI TIẾT, ĐẦY ĐỦ CÁC YẾU TỐ THÔNG TIN ĐƯỢC AI PHÂN TÍCH VÀ SUY LUẬN RA. Tuyệt đối KHÔNG trả lời hời hợt, ngắn ngủn hay dễ đoán.
- Bắt buộc phải triển khai phân tích mạch lạc theo các mục sau:
  📍 1. Bối cảnh & Tọa độ phát ngôn: Tình huống cụ thể trong tác phẩm, tâm thế, mâu thuẫn nội tâm của nhân vật/tác giả khi phát ngôn câu nói này.
  🔬 2. Bóc tách Tầng nghĩa & Nghệ thuật ngôn từ: Phân tích nghĩa bề mặt, ẩn dụ biểu tượng, các thủ pháp nghệ thuật, tu từ đắt giá.
  💡 3. Suy luận Mới & Góc nhìn Đa chiều (Tư duy phản biện): Đưa ra các luận điểm, phát hiện mới mẻ mà đa số độc giả thường bỏ qua; chỉ ra các nghịch lý tư tưởng và chiều sâu triết học.
  🌟 4. Ý nghĩa Nhân sinh & Sự soi chiếu Thời đại: Liên hệ thực tiễn với đời sống hiện đại, đúc rút bài học định hướng tư duy hành động sâu sắc cho học sinh và độc giả.
  ❓ 5. Câu hỏi Tư duy Phản biện Gợi mở: 1-2 câu hỏi thách thức tư duy logic để độc giả tiếp tục chiêm nghiệm.` : `- Trả lời ĐẦY ĐỦ, ĐÀO SÂU PHÂN TÍCH VÀ ĐƯA RA CÁC SUY LUẬN MỚI giàu hàm lượng tri thức, logic sắc bén.
- Tuyệt đối không trả lời chung chung, không chào hỏi rườm rà (không "Xin chào", không "Chào bạn/em"), đi thẳng vào câu trả lời với các đề mục rõ ràng, thuyết phục.`}

THÔNG TIN TÁC PHẨM TRONG THƯ VIỆN:
${bookContext}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}`;

      // Try gemini-3.8-flash first for superior analytical depth and reasoning with Google Search Grounding
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 25000)
        );

        const apiPromise = client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: systemPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const answerText = response.text?.trim();

        if (answerText) {
          const webQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
          return {
            answer: answerText,
            provider: 'gemini',
            model: 'Google Gemini 3.8 Flash (Grounded Search)',
            sources: [
              `Mô hình: Google Gemini 3.8 Flash`,
              `Công nghệ: Google Search Grounding`,
              `Tác phẩm: ${book.title}`,
              `Tác giả: ${book.author}`,
              ...(webQueries.length > 0 ? [`Tìm kiếm đối chiếu: ${webQueries.slice(0, 2).join(', ')}`] : []),
            ],
          };
        }
      } catch (err: any) {
        console.warn('Gemini 3.8 flash call issue, trying gemini-3.1-flash-lite fallback:', err?.message || err);

        // Fallback to gemini-3.1-flash-lite
        try {
          const timeoutFallback = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini fallback timeout')), 22000)
          );

          const fallbackPromise = client.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: systemPrompt,
          });

          const fallbackRes = await Promise.race([fallbackPromise, timeoutFallback]);
          const answerText = fallbackRes.text?.trim();

          if (answerText) {
            return {
              answer: answerText,
              provider: 'gemini',
              model: 'Google Gemini 3.1 Flash Lite',
              sources: [
                `Mô hình: Google Gemini AI (Flash Lite)`,
                `Dữ liệu Thư viện: ${book.title}`,
                `Tác giả: ${book.author}`,
              ],
            };
          }
        } catch (subErr: any) {
          console.warn('Gemini models unavailable, switching to local RAG fallback:', subErr?.message || subErr);
        }
      }
    }

    // 3. Fallback to Grounded RAG Provider
    return this.generateRAGFallback(book, question);
  }

  private buildBookContext(book: Book): string {
    const charactersInfo = book.characters && book.characters.length > 0
      ? book.characters.map((c) => `- ${c.name} (${c.role}): ${c.description}`).join('\n')
      : 'Tác phẩm nghiên cứu/chuyên khảo, không xây dựng nhân vật hư cấu.';

    return `TÊN SÁCH: ${book.title}
TÁC GIẢ: ${book.author}
THỂ LOẠI: ${book.category}
NĂM XUẤT BẢN: ${book.year} | NXB: ${book.publisher}
MÃ ISBN: ${book.isbn}
VỊ TRÍ KỆ SÁCH: ${book.shelfLocation}
ĐỘ TUỔI KHUYẾN NGHỊ: ${book.targetAge}

TÓM TẮT:
${book.summary}

THÔNG ĐIỆP CỐT LÕI:
${book.message}

CHỦ ĐỀ:
${book.themes.join(', ')}

BÀI HỌC THEN CHỐT:
${book.keyTakeaways.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

NHÂN VẬT / ĐỐI TƯỢNG:
${charactersInfo}

NGỮ CẢNH CHI TIẾT:
${book.aiContext}`;
  }

  /**
   * High-quality Grounded RAG Fallback with direct on-point answer generation
   */
  private generateRAGFallback(book: Book, question: string): AIResponse {
    const qLower = question.toLowerCase().trim();

    // 0. Comprehensive Quote & Deep Analytical Deduction Handler
    const isQuoteQuery = /câu nói|trích dẫn|câu trích|lời thoại|tuyên ngôn|phát ngôn|triết lý để đời/i.test(qLower) ||
      question.includes('"') || question.includes('“') || question.includes('«');

    if (isQuoteQuery) {
      // Find matching quote from author, character or book message
      const authorQuote = book.authorDetails?.famousQuote || book.authorDetails?.quote;
      const matchingChar = book.characters?.find(c => {
        const cQuote = (c.keyQuote || c.quote || '').toLowerCase();
        return (cQuote && qLower.includes(cQuote.slice(0, 20))) || qLower.includes(c.name.toLowerCase());
      });
      const charQuote = matchingChar?.keyQuote || matchingChar?.quote;

      let targetQuote = '';
      let subject = '';

      if (charQuote && matchingChar) {
        targetQuote = charQuote;
        subject = `nhân vật ${matchingChar.name} (${matchingChar.role})`;
      } else if (authorQuote && (qLower.includes('tác giả') || qLower.includes(book.author.toLowerCase()) || qLower.includes(authorQuote.toLowerCase().slice(0, 20)))) {
        targetQuote = authorQuote;
        subject = `tác giả ${book.author}`;
      } else {
        targetQuote = book.message;
        subject = `tác phẩm "${book.title}" (${book.author})`;
      }

      const answer = `### 📜 GIẢI MÃ CHUYÊN SÂU & SUY LUẬN MỚI TỪ CÂU NÓI:
*"${targetQuote}"*
*(Gắn liền với ${subject})*

---

#### 1. 📍 Bối cảnh & Tọa độ phát ngôn
- **Hoàn cảnh ra đời:** Câu nói xuất hiện tại thời khắc nút thắt tư tưởng trong tác phẩm "${book.title}". Đây là thời điểm mà các xung đột nội tâm và thử thách hiện sinh được đẩy lên cao độ.
- **Tâm thế & Động lực:** Câu nói không đơn thuần là một lời đúc kết bề mặt, mà phát xuất từ sự giằng xé giữa thực tại khốc liệt và khát vọng vươn tới chân lý của ${subject}.

#### 2. 🔬 Bóc tách Tầng nghĩa & Nghệ thuật biểu đạt
- **Nghĩa hiển ngôn (Bề mặt):** Trực tiếp diễn tả quy luật cuộc sống: ${book.summary.slice(0, 180)}...
- **Nghĩa hàm ẩn (Tầng sâu & Biểu tượng):** Từ ngữ mang tính gợi mở đa tầng, sử dụng nghệ thuật tương phản giữa cái hữu hạn của cá nhân và chiều sâu vô hạn của nhận thức. Mỗi từ ngữ là một ẩn dụ về lòng kiên định, sự thấu cảm và tự do đích thực.

#### 3. 💡 Suy luận Mới & Góc nhìn Đa chiều (Tư duy đột phá)
- **Nghịch lý tư tưởng:** Người đọc thường chỉ thấy vế tích cực, nhưng câu nói ẩn chứa một nghịch lý sâu xa: *Để đạt được sự thấu cảm và trí tuệ chân thật, người ta buộc phải đi qua những tổn thương hoặc chấp nhận từ bỏ vùng an toàn của định kiến.*
- **Suy luận mở rộng:** Trong hệ quy chiếu xã hội hiện đại, phát ngôn này là một lời cảnh tỉnh mạnh mẽ trước lối sống vội vã, học vẹt và sự chai sạn cảm xúc do bão hòa thông tin số.

#### 4. 🌟 Ý nghĩa Nhân sinh & Sự soi chiếu Thời đại
- **Giá trị thức tỉnh:** Định hướng cho học sinh và người trẻ bản lĩnh sống tự chủ, rèn luyện năng lực phản tư (self-reflection) và không bị tha hóa bởi những ảo tưởng nhất thời.
- **Hành động chuyển hóa:** ${book.keyTakeaways?.[0] || 'Chuyển hóa tri thức thành hành động cụ thể, gìn giữ lòng nhân ái và tinh thần độc lập tư duy.'}

#### 5. ❓ Câu hỏi Thách thức Tư duy Độc giả
- *Nếu đặt tiền đề của câu nói này vào một tình huống đạo đức đối nghịch trong thực tế ngày nay, liệu nguyên lý trên có còn giữ nguyên tính tuyệt đối, hay cần một góc nhìn uyển chuyển hơn?*`;

      return {
        answer,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Analytical Deduction Engine',
        sources: [
          `Phân tích chuyên sâu: ${book.title}`,
          `Tác giả: ${book.author}`,
          `Tư liệu triết học thư viện`,
        ],
      };
    }

    // 1. Specific Character Query (e.g. "cáo", "dế mèn", "choắt", "trũi", "bông hồng", etc.)
    if (book.characters && book.characters.length > 0) {
      const matchedChar = book.characters.find(c => {
        const nameLower = c.name.toLowerCase();
        // check word parts of character name
        return qLower.includes(nameLower) || 
               nameLower.split(/\s+/).some(part => part.length > 2 && qLower.includes(part));
      });

      if (matchedChar) {
        return {
          answer: `### 🎭 PHÂN TÍCH NHÂN VẬT & SUY LUẬN TÂM LÝ: **${matchedChar.name}**\n\n` +
            `• **Vai trò trong cốt truyện:** ${matchedChar.role}\n` +
            `• **Mô tả & Đặc điểm:** ${matchedChar.description}\n` +
            (matchedChar.symbolicMeaning ? `• **Ý nghĩa biểu tượng văn học:** ${matchedChar.symbolicMeaning}\n` : '') +
            (matchedChar.keyQuote || matchedChar.quote ? `• **Câu nói then chốt:** *"${matchedChar.keyQuote || matchedChar.quote}"*\n` : '') +
            `• **Suy luận chuyên sâu:** Nhân vật ${matchedChar.name} là mắt xích phản ánh bước ngoặt nhận thức của toàn bộ tác phẩm, đại diện cho những trăn trở về số phận và nhân cách con người.`,
          provider: 'rag-fallback',
          model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
          sources: [`Hồ sơ nhân vật: ${matchedChar.name}`, `Tác phẩm: ${book.title}`],
        };
      }
    }

    // 2. Author / Year / Publisher Query
    if (qLower.includes('tác giả') || qLower.includes('ai viết') || qLower.includes('ai sáng tác')) {
      return {
        answer: `Tác phẩm **"${book.title}"** do tác giả **${book.author}** sáng tác, xuất bản lần đầu năm **${book.year}** qua ${book.publisher}.\n\n` +
          (book.authorDetails?.bio ? `**Tiểu sử tác giả:** ${book.authorDetails.bio}\n\n` : '') +
          (book.authorDetails?.famousQuote || book.authorDetails?.quote ? `**Triết lý để đời:** *"${book.authorDetails.famousQuote || book.authorDetails.quote}"*` : ''),
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
        sources: [`Hồ sơ tác giả: ${book.author}`],
      };
    }

    if (qLower.includes('năm') || qLower.includes('khi nào') || qLower.includes('xuất bản')) {
      return {
        answer: `Cuốn sách **"${book.title}"** được xuất bản vào năm **${book.year}** bởi nhà xuất bản **${book.publisher}**.`,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
        sources: [`Thông tin xuất bản: ${book.title}`],
      };
    }

    // 3. Location / Shelf
    if (qLower.includes('vị trí') || qLower.includes('kệ') || qLower.includes('ở đâu') || qLower.includes('tìm ở')) {
      return {
        answer: `Cuốn sách đang được xếp tại: **${book.shelfLocation}** (Mã ISBN: \`${book.isbn}\`).`,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
        sources: [`Sơ đồ thư viện: ${book.shelfLocation}`],
      };
    }

    // 4. Character List Query
    if (qLower.includes('nhân vật') || qLower.includes('tuyến nhân vật') || qLower.includes('ai tham gia')) {
      if (book.characters && book.characters.length > 0) {
        const list = book.characters.map(c => `• **${c.name}** (${c.role}): ${c.description}${c.keyQuote || c.quote ? ` — *" ${c.keyQuote || c.quote} "*` : ''}`).join('\n\n');
        return {
          answer: `### 👥 TUYẾN NHÂN VẬT & CHIỀU SÂU BIỂU TƯỢNG TRONG "${book.title}":\n\n${list}`,
          provider: 'rag-fallback',
          model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
          sources: [`Danh sách nhân vật: ${book.title}`],
        };
      } else {
        return {
          answer: `Cuốn sách **"${book.title}"** thuộc thể loại **${book.category}**, tập trung phân tích khoa học và tư liệu thực tế, không có tuyến nhân vật hư cấu.`,
          provider: 'rag-fallback',
          model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
          sources: [`Thể loại sách: ${book.category}`],
        };
      }
    }

    // 5. Lessons / Takeaways Query
    if (qLower.includes('bài học') || qLower.includes('học được gì') || qLower.includes('ý nghĩa') || qLower.includes('thông điệp')) {
      const lessons = book.keyTakeaways.map((t, i) => `${i + 1}. **${t}**`).join('\n');
      return {
        answer: `### 💎 THÔNG ĐIỆP CỐT LÕI & BÀI HỌC SUY LUẬN MỚI:\n\n` +
          `**Thông điệp chủ đạo:**\n*"${book.message}"*\n\n` +
          `**Các bài học then chốt & Khai mở tư duy:**\n${lessons}\n\n` +
          `💡 *Suy luận phản biện:* Giá trị của cuốn sách nằm ở chỗ không trao cho ta câu trả lời có sẵn, mà trao cho ta lăng kính để tự soi chiếu và chất vấn các quan niệm rập khuôn hàng ngày.`,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
        sources: [`Bài học & Thông điệp: ${book.title}`],
      };
    }

    // 6. Summary / Plot Query
    if (qLower.includes('tóm tắt') || qLower.includes('nội dung chính') || qLower.includes('kể về') || qLower.includes('cốt truyện')) {
      const climaxPhase = book.plotSynopsis?.arc?.find(a => a.phase.includes('Cao trào'));
      return {
        answer: `### 📖 TÓM TẮT & DIỄN BIẾN TRỌNG TÂM CỦA "${book.title}":\n\n${book.summary}\n\n` +
          (climaxPhase ? `**Cao trào tác phẩm:** ${climaxPhase.description}\n\n` : '') +
          `**Thông điệp đúc kết:** "${book.message}"`,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
        sources: [`Tóm lược tác phẩm: ${book.title}`],
      };
    }

    // 7. Discussion Questions
    if (qLower.includes('câu hỏi') || qLower.includes('ôn tập') || qLower.includes('thảo luận') || qLower.includes('tư duy')) {
      return {
        answer: `### 🧠 3 CÂU HỎI TƯ DUY PHẢN BIỆN & SUY LUẬN MỚI VỀ "${book.title}":\n\n` +
          `1. **Nghịch lý hiện sinh:** Đằng sau thông điệp *"${book.message}"*, nghịch lý lớn nhất mà con người phải đối mặt khi hiện thực hóa bài học này trong đời sống hiện đại là gì?\n\n` +
          `2. **Động cơ nhân vật & Góc nhìn đối lập:** Luận điểm hoặc quyết định gây tranh cãi nhất của ${book.characters?.[0]?.name || book.author} phản ánh mâu thuẫn xã hội nào sâu sắc nhất?\n\n` +
          `3. **Tư duy phản biện tương lai:** Nếu đặt những triết lý trong cuốn sách vào khao khát khẳng định bản thân của thế hệ trẻ ngày nay, giá trị nào cần được tái định nghĩa lại?`,
        provider: 'rag-fallback',
        model: 'THƯ VIỆN THÔNG MINH Critical Thinking Engine',
        sources: [`Gợi ý thảo luận & Tư duy: ${book.title}`],
      };
    }

    // 8. General search within aiContext / summary
    return {
      answer: `Về câu hỏi của bạn đối với cuốn sách **"${book.title}"**:\n\n${book.summary}\n\n` +
        `**Thông điệp cốt lõi:** "${book.message}"\n\n` +
        `💡 *Gợi ý:* Bạn có thể bấm vào các câu nói nổi tiếng của tác giả hoặc nhân vật để yêu cầu AI phân tích đa chiều và đưa ra các suy luận mới!`,
      provider: 'rag-fallback',
      model: 'THƯ VIỆN THÔNG MINH Grounded Engine',
      sources: [`Dữ liệu thư viện: ${book.title}`],
    };
  }

  /**
   * Matches and recommends books tailored to an individual reader's personality & preferences
   */
  public async matchBooksByPersonality(
    input: {
      target: string;
      targetName?: string;
      personalityTraits: string[];
      customPersonality?: string;
      favoriteGenres: string[];
      readingGoal?: string;
    },
    allBooks: Book[]
  ): Promise<{
    recommendations: Array<{
      bookId: string;
      matchScore: number;
      matchReason: string;
      highlightQuoteOrLesson: string;
    }>;
    aiComment: string;
    provider: string;
  }> {
    const isGifting = input.target === 'friend';
    const targetLabel = isGifting
      ? (input.targetName ? `bạn "${input.targetName}"` : 'người bạn / người thân được tặng')
      : 'bạn';

    const booksSummary = allBooks.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      themes: b.themes,
      summary: b.summary.slice(0, 160) + '...',
      message: b.message,
      keyTakeaways: b.keyTakeaways.slice(0, 2),
    }));

    const client = this.getGeminiClient();
    if (client) {
      try {
        const prompt = `Bạn là Chuyên gia Tư vấn Đọc sách & Tâm lý học đường của Thư viện Thông Minh.
Nhiệm vụ của bạn: Dựa trên tính cách và sở thích cá nhân dưới đây, hãy chọn ra 3 đến 4 cuốn sách phù hợp nhất từ kho sách của thư viện.

THÔNG TIN ĐỐI TƯỢNG VÀ TÍNH CÁCH:
- Đối tượng: ${isGifting ? 'Chọn sách tặng bạn bè/người thân' : 'Chọn cho bản thân'} (${targetLabel})
- Các nét tính cách nổi bật: ${input.personalityTraits.join(', ') || 'Chưa nêu cụ thể'}
${input.customPersonality ? `- Mô tả thêm về tính cách: "${input.customPersonality}"` : ''}
- Thể loại yêu thích: ${input.favoriteGenres.join(', ') || 'Đa dạng thể loại'}
- Mục tiêu đọc sách: ${input.readingGoal || 'Mở rộng thế giới quan và thư giãn'}

DANH MỤC CÁC CUỐN SÁCH CÓ TRONG THƯ VIỆN (Chỉ được chọn sách có id trong danh sách này):
${JSON.stringify(booksSummary, null, 2)}

YÊU CẦU ĐẦU RA:
Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không bao gồm markdown \`\`\`json thừa), có cấu trúc:
{
  "aiComment": "Lời nhận xét và nhắn nhủ ấm áp, cá nhân hóa (2-3 câu) về nét tính cách này và phong cách đọc sách phù hợp.",
  "recommendations": [
    {
      "bookId": "id_chính_xác_của_cuốn_sách_trong_danh_mục",
      "matchScore": 95,
      "matchReason": "Giải thích chi tiết 2 câu vì sao cuốn sách này chạm đúng tính cách/tâm lý của ${targetLabel}.",
      "highlightQuoteOrLesson": "Một bài học hoặc câu trích dẫn đắt giá nhất trong cuốn sách dành riêng cho ${targetLabel}."
    }
  ]
}`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 22000)
        );

        const apiPromise = client.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });

        const res = await Promise.race([apiPromise, timeoutPromise]);
        const text = res.text?.trim() || '';

        // Clean possible markdown code fence
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          // Validate valid bookIds
          const validRecs = parsed.recommendations.filter((r: any) =>
            allBooks.some((b) => b.id === r.bookId)
          );

          if (validRecs.length > 0) {
            return {
              recommendations: validRecs.slice(0, 4),
              aiComment: parsed.aiComment || `Dựa trên phân tích nét tính cách và sở thích của ${targetLabel}, đây là những tác phẩm có tần số cảm xúc đồng điệu nhất.`,
              provider: 'Google Gemini 3.1 Flash Lite',
            };
          }
        }
      } catch (err) {
        console.warn('Gemini personality match issue, using smart local matcher fallback:', err);
      }
    }

    // Smart Local Fallback Matcher
    return this.fallbackPersonalityMatch(input, allBooks, targetLabel);
  }

  /**
   * Smart deterministic local algorithm for personality-based matching
   */
  private fallbackPersonalityMatch(
    input: {
      target: string;
      personalityTraits: string[];
      customPersonality?: string;
      favoriteGenres: string[];
      readingGoal?: string;
    },
    allBooks: Book[],
    targetLabel: string
  ): {
    recommendations: Array<{
      bookId: string;
      matchScore: number;
      matchReason: string;
      highlightQuoteOrLesson: string;
    }>;
    aiComment: string;
    provider: string;
  } {
    const traitsText = (
      input.personalityTraits.join(' ') +
      ' ' +
      (input.customPersonality || '') +
      ' ' +
      (input.readingGoal || '')
    ).toLowerCase();

    const scored = allBooks.map((book) => {
      let score = 70; // baseline score

      // Category matching
      if (input.favoriteGenres.length > 0) {
        const catMatch = input.favoriteGenres.some(
          (g) =>
            book.category.toLowerCase().includes(g.toLowerCase()) ||
            g.toLowerCase().includes(book.category.toLowerCase())
        );
        if (catMatch) score += 15;
      }

      // Trait matching with book themes and context
      const bookContext = (
        book.themes.join(' ') +
        ' ' +
        book.summary +
        ' ' +
        book.message
      ).toLowerCase();

      if (traitsText.includes('trầm') || traitsText.includes('nội tâm') || traitsText.includes('suy ngẫm')) {
        if (bookContext.includes('trưởng thành') || bookContext.includes('triết lý') || bookContext.includes('tự nhận thức')) {
          score += 8;
        }
      }

      if (traitsText.includes('khoa học') || traitsText.includes('logic') || traitsText.includes('thực tế')) {
        if (book.category.toLowerCase().includes('khoa học') || bookContext.includes('vũ trụ') || bookContext.includes('tư duy')) {
          score += 9;
        }
      }

      if (traitsText.includes('năng động') || traitsText.includes('ngoại') || traitsText.includes('thử thách')) {
        if (bookContext.includes('phiêu lưu') || bookContext.includes('khám phá') || bookContext.includes('lý tưởng')) {
          score += 8;
        }
      }

      if (traitsText.includes('áp lực') || traitsText.includes('chữa lành') || traitsText.includes('bình yên')) {
        if (bookContext.includes('yêu thương') || bookContext.includes('bình yên') || bookContext.includes('nhân ái') || bookContext.includes('hạnh phúc')) {
          score += 9;
        }
      }

      if (traitsText.includes('nghệ thuật') || traitsText.includes('cảm xúc') || traitsText.includes('lãng mạn')) {
        if (bookContext.includes('tình bạn') || bookContext.includes('tình cảm') || bookContext.includes('trái tim')) {
          score += 8;
        }
      }

      // Bound score between 86 and 98
      const finalScore = Math.min(98, Math.max(86, score));

      return {
        book,
        score: finalScore,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 4);

    const recs = top.map((item) => {
      const b = item.book;
      let reason = `Tác phẩm "${b.title}" mang thông điệp "${b.message}", hoàn toàn tương thích với nét tính cách ${input.personalityTraits[0] || 'sâu sắc'} của ${targetLabel}.`;
      if (b.themes.length > 0) {
        reason += ` Chủ đề #${b.themes.slice(0, 2).join(', #')} sẽ mang lại nhiều góc nhìn sâu lắng.`;
      }

      const quote = b.keyTakeaways[0] || b.message;

      return {
        bookId: b.id,
        matchScore: item.score,
        matchReason: reason,
        highlightQuoteOrLesson: quote,
      };
    });

    return {
      recommendations: recs,
      aiComment: `Dựa trên nét tính cách và sở thích được lựa chọn, Thư viện Thông Minh đã chọn lọc các tác phẩm có sự giao thoa tư tưởng mạnh mẽ nhất với ${targetLabel}.`,
      provider: 'THƯ VIỆN THÔNG MINH Grounded Engine',
    };
  }

  /**
   * Generates or fetches curiosity-sparking questions for a specific book combining vivid context and mysteries.
   */
  public async generateBookCuriosities(book: Book): Promise<{
    curiosities: BookCuriosityQuestion[];
    provider: string;
  }> {
    const defaultCuriosities = getCuriositiesForBook(book);
    const client = this.getGeminiClient();

    if (!client) {
      return {
        curiosities: defaultCuriosities,
        provider: 'THƯ VIỆN THÔNG MINH Grounded Engine',
      };
    }

    try {
      const bookContext = this.buildBookContext(book);
      const prompt = `Bạn là Chuyên gia Cố vấn Văn học & Khảo cứu Tri thức Độc giả của Thư viện trường học.
Hãy sử dụng công cụ Google Search để tìm kiếm các bài phê bình học thuật, bối cảnh sáng tác, phân tích triết học và tiếp nhận độc giả đa chiều về cuốn sách "${book.title}" của tác giả ${book.author}.
Sau đó, hãy TỔNG HỢP và CHUYỂN ĐỔI các phát hiện đó thành 2 CÂU HỎI TÒ MÒ & SUY LUẬN MỚI mang tính TƯ DUY PHÂN TÍCH MẠNH MẼ.

QUY TẮC BẮT BUỘC ĐỂ KHÔNG BỊ DỄ ĐOÁN (CỰC KỲ QUAN TRỌNG):
1. ⚖️ LUẬT CÂN BẰNG ĐỘ DÀI TUYỆT ĐỐI (EQUAL LENGTH RULE):
   - Cả 4 phương án trong "options" BẮT BUỘC PHẢI CÓ SỐ LƯỢNG TỪ GẦN NHƯ Y HỆT NHAU (từ 22 đến 26 từ mỗi phương án).
   - Tuyệt đối KHÔNG ĐƯỢC để đáp án đúng dài hơn hay ngắn hơn các đáp án sai!
   - Sử dụng cùng phong cách học thuật, giọng điệu triết lý phân tích sắc sảo cho cả 4 phương án.
2. 🧠 TẤT CẢ CÁC PHƯƠNG ÁN SAI ĐỀU PHẢI LÀ CÁC TRƯỜNG PHÁI TƯ TƯỞNG CÓ LÝ HOẶC NGỘ NHẬN PHỔ BIẾN:
   - Tuyệt đối không dùng các câu ngô nghê, lộ liễu, dễ đoán mò. Người đọc phải suy luận sâu sắc mới chọn đúng.
3. 🎲 PHÂN BỔ ĐÁP ÁN ĐÚNG NGẪU NHIÊN: correctOptionIndex phân bổ ngẫu nhiên ở 0, 1, 2, hoặc 3.
4. 🔬 GIẢI MÃ SUY LUẬN MỚI: answerExplanation phân tích chi tiết chuỗi lập luận logic, chỉ ra điểm then chốt và điểm ngụy biện.

THÔNG TIN TÁC PHẨM CUNG CẤP:
${bookContext}

YÊU CẦU TRẢ VỀ:
CHỈ trả về JSON mảng nguyên bản (không markdown codeblock, không bọc \`\`\`json) theo đúng schema:
[
  {
    "id": "gemini-q1",
    "title": "Tiêu đề tư duy sắc sảo (dưới 10 chữ)",
    "tag": "Nghịch lý triết học" | "Bí ẩn nhân văn" | "Suy luận tâm lý" | "Tư duy phản biện",
    "question": "Nội dung câu hỏi phân tích gợi mở tư duy mới?",
    "mysteryClue": "Manh mối suy luận sắc sảo gợi mở góc nhìn đa chiều...",
    "imageUrl": "${book.coverImage}",
    "imageCaption": "Chú thích hình ảnh liên quan đến chiều sâu tác phẩm",
    "options": [
      "Luận điểm triết học A từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học B từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học C từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học D từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục"
    ],
    "correctOptionIndex": 1,
    "answerExplanation": "Phân tích giải mã chi tiết, suy luận sâu sắc các tầng ý nghĩa...",
    "funFactOrQuote": "Trích dẫn đắt giá hoặc suy luận đòn bẩy tư duy từ tác phẩm"
  }
]`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Curiosity generation timeout')), 25000)
      );

      const apiPromise = client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const rawText = response.text?.trim() || '';

      let cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure valid fields
        const validCuriosities: BookCuriosityQuestion[] = parsed.map((item, idx) => ({
          id: item.id || `gemini-q-${Date.now()}-${idx}`,
          title: item.title || `Bí mật trong ${book.title}`,
          tag: item.tag || 'Tư duy phản biện',
          question: item.question || `Điều đặc biệt nào ẩn giấu trong ${book.title}?`,
          mysteryClue: item.mysteryClue || 'Hãy suy ngẫm về các nghịch lý tư tưởng của tác giả...',
          imageUrl: defaultCuriosities[idx]?.imageUrl || book.coverImage,
          imageCaption: item.imageCaption || `Khám phá chi tiết trong tác phẩm ${book.title}`,
          options: Array.isArray(item.options) && item.options.length >= 2 ? item.options : ['Đúng', 'Sai'],
          correctOptionIndex: typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : 0,
          answerExplanation: item.answerExplanation || book.message,
          funFactOrQuote: item.funFactOrQuote || (book.keyTakeaways[0] || book.message),
        }));

        return {
          curiosities: validCuriosities,
          provider: 'Google Gemini 3.8 Flash (Grounded Search)',
        };
      }
    } catch (err) {
      console.warn('Gemini curiosity generation failed, falling back to curated curiosities:', err);
    }

    return {
      curiosities: defaultCuriosities,
      provider: 'THƯ VIỆN THÔNG MINH Curated Engine',
    };
  }

  /**
   * Generates dynamic, randomized quiz questions (Multiple Choice, True/False, Mystery)
   * tailored to a specific book using Google Gemini with high-order critical thinking and novel deductions.
   */
  public async generateDynamicBookQuiz(book: Book): Promise<{
    questions: any[];
    provider: string;
  }> {
    // Helper to get curated thematic image (never reusing coverImage)
    const getThematicImage = (index: number): { url: string; caption: string } => {
      const category = (book.category || '').toLowerCase();
      const title = (book.title || '').toLowerCase();

      // Specific known masterpieces
      if (title.includes('kiều') || book.id === 'truyen-kieu-1784' || book.isbn === 'STK-006073') {
        const kieuImages = [
          { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80', caption: 'Tranh cổ Thúy Kiều gảy đàn tỳ bà dưới ánh trăng' },
          { url: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?auto=format&fit=crop&w=1200&q=80', caption: 'Lối xưa hoa cỏ tiết Thanh Minh và lời thề nguyền Kim - Kiều' },
          { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', caption: 'Cửa biển Lầu Ngưng Bích sóng vỗ mây trôi u uất' },
          { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80', caption: 'Bản thảo chữ Nôm Đoạn Trường Tân Thanh cổ bản 1866' },
        ];
        return kieuImages[index % kieuImages.length];
      }

      if (title.includes('dế mèn') || book.id === 'de-men-phieu-luu-ky') {
        const deMenImages = [
          { url: 'https://images.unsplash.com/photo-1574786198875-49f5d09fe2d5?auto=format&fit=crop&w=1200&q=80', caption: 'Bản vẽ sinh cảnh đồng cỏ ven sông Tô Lịch (Tư liệu lưu trữ)' },
          { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', caption: 'Cánh đồng lúa và bãi cỏ hoang sơ chốn thôn dã' },
          { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', caption: 'Chân trời tự do và khát vọng phiêu lưu muôn loài' },
        ];
        return deMenImages[index % deMenImages.length];
      }

      if (title.includes('hoàng tử bé') || book.id === 'hoang-tu-be') {
        const htbImages = [
          { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80', caption: 'Bản vẽ màu nước bầu trời sa mạc Sahara (Nguyên tác Saint-Exupéry)' },
          { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', caption: 'Tiểu hành tinh B612 lơ lửng giữa dải ngân hà' },
          { url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80', caption: 'Đóa hoa hồng kiêu kỳ duy nhất của Hoàng Tử Bé' },
        ];
        return htbImages[index % htbImages.length];
      }

      // By category:
      if (category.includes('khoa học') || category.includes('công nghệ')) {
        const sciImages = [
          { url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80', caption: 'Phòng thí nghiệm khoa học và dấu mốc khai phá tri thức' },
          { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', caption: 'Vũ trụ học và các cấu trúc vật lý lượng tử' },
          { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', caption: 'Mạch vi xử lý và bước nhảy công nghệ hiện đại' },
        ];
        return sciImages[index % sciImages.length];
      }

      if (category.includes('triết học') || category.includes('tâm lý') || category.includes('kỹ năng')) {
        const philImages = [
          { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', caption: 'Khoảng lặng chiêm nghiệm về ý nghĩa tồn tại và tâm thức' },
          { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80', caption: 'Bàn đọc sách cổ kính soi chiếu tư tưởng nhân văn' },
          { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80', caption: 'Ngọn đèn soi rọi những trang sách khai sáng tư duy' },
        ];
        return philImages[index % philImages.length];
      }

      // General Literary & History Arts
      const genImages = [
        { url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80', caption: `Tư liệu lưu trữ cổ bản và kính quang học nghiên cứu "${book.title}"` },
        { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80', caption: `Thư viện cổ điển và hành lang lưu giữ tinh hoa tri thức nhân loại` },
        { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80', caption: `Bản thảo bút tích và ngòi bút của tác giả ${book.author}` },
        { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80', caption: `Không gian nghiên cứu học thuật của các viện kinh điển` },
      ];
      return genImages[index % genImages.length];
    };

    const client = this.getGeminiClient();

    if (client) {
      try {
        const bookContext = this.buildBookContext(book);
        const sampleImage1 = getThematicImage(0);
        const sampleImage2 = getThematicImage(1);
        const sampleImage3 = getThematicImage(2);

        const prompt = `Bạn là Chuyên gia Thẩm định Văn học, Triết học & Trí tuệ Phản biện của Thư viện Quốc gia.
Hãy sử dụng công cụ tìm kiếm Google Search để kiểm tra, đối chiếu các bài phê bình văn học chuyên sâu, tiếp nhận tác phẩm, tranh luận học thuật và chiều sâu biểu tượng về cuốn sách "${book.title}" của tác giả ${book.author}.
Sau đó, hãy TỔNG HỢP, SUY LUẬN và CHUYỂN ĐỔI các phát hiện đó thành 3 CÂU HỎI TRẮC NGHIỆM MANG TÍNH TƯ DUY PHẢN BIỆN MẠNH MẼ, HẤP DẪN ĐỘC GIẢ.
LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG sử dụng ảnh bìa lặp đi lặp lại. Hãy sử dụng các hình ảnh tư liệu, tranh nghệ thuật hoặc bản thảo lưu trữ tương ứng.

QUY TẮC BẮT BUỘC ĐỂ KHÔNG BỊ DỄ ĐOÁN (CỰC KỲ QUAN TRỌNG):
1. ⚖️ ĐỘ DÀI CÁC PHƯƠNG ÁN BẮT BUỘC PHẢI ĐỒNG ĐỀU NHAU (EQUAL LENGTH RULE):
   - BẮT BUỘC cả 4 phương án A, B, C, D phải có số lượng từ tương đương nhau (khoảng 22 đến 26 từ mỗi phương án, chênh lệch không quá 2 từ).
   - TUYỆT ĐỐI KHÔNG ĐƯỢC để đáp án đúng dài vượt trội hay ngắn hơn các đáp án sai khiến người đọc đoán mò!
   - Sử dụng cùng một cấu trúc ngữ pháp học thuật, giọng điệu triết lý sâu sắc cho cả 4 phương án.
2. 🧠 TẤT CẢ CÁC PHƯƠNG ÁN SAI (DISTRACTORS) PHẢI LÀ NHỮNG LUẬN ĐIỂM HỌC THUẬT CÓ LÝ HOẶC NGỘ NHẬN PHỔ BIẾN:
   - Các phương án sai không được là các câu ngô nghê, phản logic hay dễ dàng loại trừ. Chúng phải đại diện cho các trường phái tư tưởng khác nhau (chủ nghĩa duy lý, thuyết thực dụng, chủ nghĩa hiện sinh bi quan, hoặc thuyết định mệnh).
   - Người đọc bắt buộc phải hiểu sâu tinh thần tác phẩm và suy luận phản biện thì mới chọn đúng được.
3. 🎲 VỊ TRÍ ĐÁP ÁN ĐÚNG PHẢI PHÂN BỔ NGẪU NHIÊN:
   - "correctIndex" phải phân bổ ngẫu nhiên ở 0, 1, 2, hoặc 3 (không dồn vào 0 hay 1).
4. 🔬 NỘI DUNG MỔ XẺ SUY LUẬN MỚI:
   - Mổ xẻ mâu thuẫn nhận thức, nghịch lý giữa tự do và trách nhiệm, bản chất sự gắn kết, hoặc sự tha hóa trong xã hội hiện đại.
   - Phần "explanation" phải phân tích rõ vì sao phương án đúng là đáp án chính xác, đồng thời chỉ ra điểm ngụy biện tinh vi của các phương án còn lại.
   - Phần "didYouKnow" cung cấp một phát hiện tư liệu mới lạ từ nghiên cứu tác phẩm và kiểm tra thực tế trên Google.

THÔNG TIN TÁC PHẨM CUNG CẤP:
${bookContext}

YÊU CẦU TRẢ VỀ:
CHỈ trả về JSON mảng nguyên bản (không dùng markdown codeblock, không \`\`\`json) theo đúng schema:
[
  {
    "id": "gemini-quiz-mc-1",
    "type": "multiple_choice",
    "question": "Câu hỏi phân tích tình huống / nghịch lý tư tưởng đòi hỏi suy luận cao?",
    "clue": "Manh mối tư duy phản biện gợi ý hướng suy luận...",
    "imageUrl": "${sampleImage1.url}",
    "imageCaption": "${sampleImage1.caption}",
    "options": [
      "Luận điểm triết học A từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học B từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học C từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Luận điểm triết học D từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục"
    ],
    "correctIndex": 1,
    "explanation": "Lời giải thích cặn kẽ chuỗi lập luận và suy luận mới...",
    "didYouKnow": "Góc nhìn sâu sắc hoặc trích dẫn đắt giá...",
    "surpriseMotif": "star"
  },
  {
    "id": "gemini-quiz-tf-2",
    "type": "true_false",
    "statement": "Một nhận định mang tính triết lý / phân tích biểu tượng sâu sắc về tác phẩm...",
    "clue": "Manh mối đối chiếu tư tưởng cốt lõi...",
    "imageUrl": "${sampleImage2.url}",
    "imageCaption": "${sampleImage2.caption}",
    "isTrue": true,
    "explanation": "Giải thích chi tiết vì sao nhận định này phản ánh đúng/sai tầng nghĩa ẩn dụ...",
    "didYouKnow": "Sự thật bất ngờ về tư tưởng của tác giả...",
    "surpriseMotif": "butterfly"
  },
  {
    "id": "gemini-quiz-curiosity-3",
    "type": "multiple_choice",
    "question": "Câu hỏi giải mã câu nói đắt giá hoặc nghịch lý biểu tượng then chốt?",
    "clue": "Manh mối giải mã tầng sâu tác phẩm...",
    "imageUrl": "${sampleImage3.url}",
    "imageCaption": "${sampleImage3.caption}",
    "options": [
      "Góc nhìn phản biện A từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Góc nhìn phản biện B từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Góc nhìn phản biện C từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục",
      "Góc nhìn phản biện D từ 22 đến 25 từ phân tích góc nhìn sâu sắc và có sức thuyết phục"
    ],
    "correctIndex": 2,
    "explanation": "Giải mã chi tiết các tầng nghĩa tư tưởng...",
    "didYouKnow": "Chiêm nghiệm sâu sắc rút ra từ tác phẩm...",
    "surpriseMotif": "feather"
  }
]`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Dynamic quiz timeout')), 25000)
        );

        const apiPromise = client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const rawText = response.text?.trim() || '';
        let cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          cleaned = arrayMatch[0];
        }
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed) && parsed.length > 0) {
          // Guarantee that no question repeatedly uses coverImage
          const sanitizedQuestions = parsed.map((q, idx) => {
            if (!q.imageUrl || q.imageUrl === book.coverImage) {
              const thematic = getThematicImage(idx);
              return {
                ...q,
                imageUrl: thematic.url,
                imageCaption: q.imageCaption || thematic.caption,
              };
            }
            return q;
          });

          return {
            questions: sanitizedQuestions,
            provider: 'Google Gemini 3.8 Flash (Grounded Search)',
          };
        }
      } catch (err) {
        console.warn('Gemini dynamic quiz generation error, using fallback:', err);
      }
    }

    // Fallback: Create dynamic grounded questions with rigorous critical thinking & strictly balanced option lengths
    const char = book.characters?.[0];
    const authorQuote = book.authorDetails?.famousQuote || book.authorDetails?.quote;
    const img1 = getThematicImage(0);
    const img2 = getThematicImage(1);
    const img3 = getThematicImage(2);

    const fallbackQuestions = [
      {
        id: `fb-mc-${book.id}-1`,
        type: 'multiple_choice',
        question: `Nghịch lý hiện sinh và suy luận triết học sâu sắc nhất được đúc kết từ tác phẩm "${book.title}" là gì?`,
        clue: 'Hãy suy ngẫm về sự giằng xé giữa thực tại khắc nghiệt và lý tưởng nội tâm của tác phẩm...',
        imageUrl: img1.url,
        imageCaption: img1.caption,
        options: [
          'Sự thỏa hiệp an toàn với các quy chuẩn định sẵn của số đông nhằm duy trì trạng thái ổn định và tránh va chạm xã hội.',
          'Sự thức tỉnh nội tâm và lòng quả cảm vượt lên các định kiến thời đại để gìn giữ nhân cách cao đẹp và lẽ sống chân chính.',
          'Khát vọng khẳng định quyền lực cá nhân bằng cách khước từ mọi nghĩa vụ luân lý và trách nhiệm tình cảm đối với cộng đồng xung quanh.',
          'Quan niệm định mệnh buông xuôi rằng toàn bộ số phận con người hoàn toàn do các biến cố lịch sử khách quan tiền định chi phối.',
        ],
        correctIndex: 1,
        explanation: `Chính xác! Tác phẩm "${book.title}" phân tích sâu sắc rằng: "${book.message}". Vẻ đẹp nhân văn chỉ thực sự tỏa sáng khi con người dám đối diện với nghịch cảnh và chịu trách nhiệm với sự tự do của chính mình.`,
        didYouKnow: authorQuote ? `Tác giả ${book.author} từng khẳng định: "${authorQuote}"` : (book.keyTakeaways[0] || 'Mỗi cuốn sách là một cuộc đối thoại khai phóng tư duy.'),
        surpriseMotif: 'star',
      },
      {
        id: `fb-tf-${book.id}-2`,
        type: 'true_false',
        statement: `Trong "${book.title}", tác giả ${book.author} khẳng định rằng sự trưởng thành đích thực đòi hỏi con người phải vượt qua nỗi sợ thất bại và dám chấp nhận những tổn thương của lòng trắc ẩn.`,
        clue: 'Đối chiếu với diễn biến tư tưởng và thông điệp hành động của tác phẩm...',
        imageUrl: img2.url,
        imageCaption: img2.caption,
        isTrue: true,
        explanation: `Hoàn toàn chính xác! Xuyên suốt tác phẩm, tác giả làm nổi bật chân lý: Trưởng thành không phải là xây dựng một vỏ bọc chai sạn, mà là mở rộng dung lượng của trái tim để thấu cảm và hành động vì lý tưởng cao đẹp.`,
        didYouKnow: `Cuốn sách thuộc mảng ${book.category} tại Thư viện, luôn nằm trong danh mục sách khơi dậy cảm hứng đọc sâu.`,
        surpriseMotif: 'butterfly',
      },
      {
        id: `fb-mc-${book.id}-3`,
        type: 'multiple_choice',
        question: char
          ? `Khi phân tích bước ngoặt tâm lý của nhân vật ${char.name} (${char.role}), dụng ý nghệ thuật và suy luận mới nào phản ánh sâu sắc nhất tư tưởng của ${book.author}?`
          : `Dưới lăng kính tư duy phản biện, bài học then chốt nào trong "${book.title}" giúp người trẻ giải quyết khủng hoảng nhận thức trong xã hội hiện đại?`,
        clue: 'Quan sát sự biến chuyển nội tâm từ ngộ nhận ban đầu đến sự thức tỉnh lương tri...',
        imageUrl: img3.url,
        imageCaption: img3.caption,
        options: [
          'Ưu tiên tối đa các lợi ích thực dụng trước mắt và kỹ năng thích nghi mà xem nhẹ các nguyên tắc đạo đức nhân văn cốt lõi.',
          'Duy trì sự đồng thuận thụ động với môi trường xung quanh nhằm giữ gìn cảm giác an toàn và trạng thái tâm lý ổn định tạm thời.',
          'Sự va đập giữa ảo tưởng bản thân và thực tế nghiệt ngã là phép thử tất yếu để khai mở sự khiêm nhường và lòng trắc ẩn.',
          'Tách rời việc bồi đắp tri thức lý thuyết khỏi năng lực thấu hiểu cảm xúc và tinh thần trách nhiệm đối với số phận con người xã hội.',
        ],
        correctIndex: 2,
        explanation: char
          ? `Tuyệt vời! Nhân vật ${char.name} không phải là hình tượng tĩnh, mà đại diện cho quá trình tự thức tỉnh đầy đau đớn nhưng khai phóng của con người khi học cách thấu hiểu chính mình và vạn vật.`
          : `Tuyệt vời! Bài học then chốt: "${book.keyTakeaways[0] || book.message}" đòi hỏi người đọc phải biến tri thức thành năng lực tư duy độc lập chứ không dừng lại ở việc đọc sách thụ động.`,
        didYouKnow: book.keyTakeaways[1] || 'Đọc sâu một cuốn sách là đặt mình vào những chân trời suy tư mới mẻ.',
        surpriseMotif: 'flower',
      },
    ];

    return {
      questions: fallbackQuestions,
      provider: 'THƯ VIỆN THÔNG MINH Grounded Engine',
    };
  }

  /**
   * Automatically complete book details from cover image, barcode image, title, author, publisher
   * Uses Google Search grounding to gather real, accurate, in-depth literary information from reputable web sources.
   */
  public async autoCompleteBookDetails(input: {
    title?: string;
    author?: string;
    publisher?: string;
    category?: string;
    coverImage?: string;
    barcodeImage?: string;
    isbn?: string;
  }): Promise<{
    title: string;
    author: string;
    publisher: string;
    category: string;
    year: number;
    pageCount: number;
    shelfLocation: string;
    description: string;
    summary: string;
    message: string;
    themes: string[];
    keyTakeaways: string[];
    targetAge: string;
    isbn: string;
    characters?: Array<{
      id: string;
      name: string;
      role: string;
      description?: string;
      personality?: string;
      symbolicMeaning?: string;
      keyQuote?: string;
    }>;
    plotSynopsis?: {
      overview: string;
      arc: Array<{
        phase: 'Mở đầu' | 'Biến cố' | 'Cao trào' | 'Mở nút & Kết thúc';
        title: string;
        description: string;
      }>;
      keyEvents?: string[];
    };
    authorDetails?: {
      name: string;
      years?: string;
      country?: string;
      bio?: string;
      writingStyle?: string;
      majorWorks?: string[];
      famousQuote?: string;
    };
    historicalContext?: {
      period: string;
      creationCircumstance: string;
      societalImpact: string;
    };
    sources?: Array<{ title?: string; uri?: string }>;
    provider: string;
  }> {
    const client = this.getGeminiClient();

    if (client) {
      try {
        const contents: any[] = [];

        // Attach cover image if valid base64
        if (input.coverImage && input.coverImage.startsWith('data:image/')) {
          const [header, data] = input.coverImage.split(',');
          const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
          contents.push({
            inlineData: {
              data,
              mimeType,
            },
          });
        }

        // Attach barcode image if valid base64
        if (input.barcodeImage && input.barcodeImage.startsWith('data:image/')) {
          const [header, data] = input.barcodeImage.split(',');
          const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
          contents.push({
            inlineData: {
              data,
              mimeType,
            },
          });
        }

        const promptText = `Bạn là một thủ thư chuyên nghiệp, nhà nghiên cứu văn học và chuyên gia phân tích sách hàng đầu.
BẠN HÃY SỬ DỤNG CÔNG CỤ TÌM KIẾM GOOGLE SEARCH ĐỂ TRA CỨU TỪ NHỮNG NGUỒN VÀ TRANG WEB UY TÍN NHẤT (Wikipedia, GoodReads, các trang phê bình văn học, báo văn nghệ, nhà xuất bản chính thống, NXB Kim Đồng, NXB Trẻ, Tiki, Fahasa...) về cuốn sách này.
TUYỆT ĐỐI KHÔNG BỊA ĐẶT NỘI DUNG SƠ SÀI HAY SAI LỆCH! Hãy phân tích và thu thập đầy đủ, chính xác từng nhân vật, cốt truyện, diễn biến và bài học.

Dữ liệu đầu vào:
- Tên sách: "${input.title || '(Nhận diện từ ảnh bìa hoặc tra cứu)'}"
- Tác giả: "${input.author || '(Nhận diện từ ảnh bìa hoặc tra cứu)'}"
- Nhà xuất bản: "${input.publisher || ''}"
- Thể loại: "${input.category || ''}"
- Mã ISBN: "${input.isbn || ''}"

YÊU CẦU ĐẦU RA:
Hãy tìm kiếm trên web và trả về DUY NHẤT một chuỗi JSON hợp lệ (không bao bọc trong code block, không giải thích ngoài JSON) theo đúng định dạng sau:
{
  "title": "Tên chuẩn xác và đầy đủ của tác phẩm",
  "author": "Tên tác giả chính xác",
  "publisher": "Tên nhà xuất bản uy tín (ví dụ: NXB Kim Đồng, NXB Trẻ, NXB Văn Học, NXB Hội Nhà Văn, NXB Tổng hợp TPHCM...)",
  "category": "Văn học | Khoa học | Địa lý | Tâm lý | Lịch sử | Công nghệ | Nghệ thuật | Triết học",
  "year": 2020,
  "pageCount": 260,
  "shelfLocation": "Kệ A2 - Tầng 1",
  "description": "Đoạn giới thiệu đầy đủ, hấp dẫn về tác phẩm, vị thế văn học, giải thưởng đạt được nếu có (khoảng 3-5 câu).",
  "summary": "Tóm tắt chi tiết, chính xác nội dung toàn bộ cuốn sách từ mở đầu đến kết thúc (khoảng 6-10 câu văn chuẩn xác, không viết hời hợt).",
  "message": "Thông điệp cốt lõi, bài học nhân sinh và giá trị triết lý sâu sắc nhất tác phẩm gửi gắm.",
  "themes": ["Chủ đề chính 1", "Chủ đề chính 2", "Chủ đề chính 3"],
  "keyTakeaways": [
    "Bài học cốt lõi 1 từ cuốn sách",
    "Bài học cốt lõi 2 từ cuốn sách",
    "Bài học cốt lõi 3 từ cuốn sách"
  ],
  "targetAge": "Học sinh THCS, THPT & Độc giả mọi lứa tuổi",
  "isbn": "978604xxxxxxx",
  "plotSynopsis": {
    "overview": "Tổng quan toàn bộ cốt truyện, bối cảnh không gian thời gian và động lực chính của câu chuyện.",
    "arc": [
      {
        "phase": "Mở đầu",
        "title": "Tên giai đoạn mở đầu",
        "description": "Chi tiết hoàn cảnh xuất phát điểm, bối cảnh và nguyên cớ khởi phát."
      },
      {
        "phase": "Biến cố",
        "title": "Tên sự kiện biến cố bước ngoặt",
        "description": "Các thử thách, xung đột nảy sinh và ngã rẽ câu chuyện."
      },
      {
        "phase": "Cao trào",
        "title": "Tên điểm nút cao trào",
        "description": "Xung đột kịch tính nhất, tình huống thử thách đỉnh điểm của tác phẩm."
      },
      {
        "phase": "Mở nút & Kết thúc",
        "title": "Tên hồi kết",
        "description": "Cách giải quyết xung đột, số phận các nhân vật và dư âm đọng lại."
      }
    ],
    "keyEvents": [
      "Sự kiện then chốt 1 trong cốt truyện",
      "Sự kiện then chốt 2 trong cốt truyện",
      "Sự kiện then chốt 3 trong cốt truyện",
      "Sự kiện then chốt 4 trong cốt truyện"
    ]
  },
  "characters": [
    {
      "id": "char-1",
      "name": "Tên nhân vật chính/quan trọng 1",
      "role": "Vai trò (Nhân vật chính / Đối kháng / Dẫn dắt / Bạn đồng hành...)",
      "description": "Mô tả chi tiết xuất thân, ngoại hình và vai trò trong tác phẩm",
      "personality": "Tính cách, nội tâm sâu sắc của nhân vật",
      "symbolicMeaning": "Ý nghĩa biểu tượng văn học của nhân vật này",
      "keyQuote": "Câu nói hoặc hành động kinh điển đáng nhớ của nhân vật"
    },
    {
      "id": "char-2",
      "name": "Tên nhân vật quan trọng 2",
      "role": "Vai trò của nhân vật 2",
      "description": "Mô tả chi tiết về nhân vật 2",
      "personality": "Tính cách và chuyển biến tâm lý",
      "symbolicMeaning": "Ý nghĩa biểu tượng của nhân vật 2",
      "keyQuote": "Câu nói hoặc chi tiết tiêu biểu của nhân vật 2"
    },
    {
      "id": "char-3",
      "name": "Tên nhân vật 3",
      "role": "Vai trò của nhân vật 3",
      "description": "Mô tả chi tiết về nhân vật 3",
      "personality": "Tính cách của nhân vật 3",
      "symbolicMeaning": "Ý nghĩa của nhân vật 3",
      "keyQuote": "Câu nói hoặc chi tiết tiêu biểu"
    }
  ],
  "authorDetails": {
    "name": "Tên đầy đủ của tác giả",
    "years": "Năm sinh – Năm mất (hoặc Năm sinh nếu còn sống)",
    "country": "Quốc gia của tác giả",
    "bio": "Tiểu sử chi tiết, sự nghiệp văn học và các cống hiến lớn của tác giả.",
    "writingStyle": "Phong cách sáng tác đặc trưng (ngôn từ, bút pháp, thủ pháp nghệ thuật).",
    "majorWorks": ["Tác phẩm lớn 1", "Tác phẩm lớn 2", "Tác phẩm lớn 3"],
    "famousQuote": "Câu danh ngôn bất hủ của tác giả."
  },
  "historicalContext": {
    "period": "Thời kỳ lịch sử tác phẩm ra đời",
    "creationCircumstance": "Hoàn cảnh sáng tác và bối cảnh xã hội tác động tới tác phẩm",
    "societalImpact": "Tầm ảnh hưởng xã hội, sự đón nhận của độc giả và giải thưởng."
  }
}`;

        contents.push(promptText);

        const response = await client.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        // Extract grounded sources if available
        const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Array<{ title?: string; uri?: string }> = [];
        if (Array.isArray(searchChunks)) {
          for (const chunk of searchChunks) {
            if ((chunk as any)?.web?.uri) {
              sources.push({
                title: (chunk as any).web.title || 'Nguồn tra cứu uy tín',
                uri: (chunk as any).web.uri,
              });
            }
          }
        }

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          const validCharacters = Array.isArray(parsed.characters) && parsed.characters.length > 0
            ? parsed.characters.map((c: any, idx: number) => ({
                id: c.id || `char-${idx + 1}`,
                name: c.name || `Nhân vật ${idx + 1}`,
                role: c.role || 'Nhân vật trong tác phẩm',
                description: c.description || '',
                personality: c.personality || c.description || '',
                symbolicMeaning: c.symbolicMeaning || '',
                keyQuote: c.keyQuote || '',
              }))
            : undefined;

          const validPlot = parsed.plotSynopsis && typeof parsed.plotSynopsis === 'object'
            ? {
                overview: parsed.plotSynopsis.overview || parsed.summary || parsed.description || '',
                arc: Array.isArray(parsed.plotSynopsis.arc) && parsed.plotSynopsis.arc.length > 0
                  ? parsed.plotSynopsis.arc
                  : [
                      {
                        phase: 'Mở đầu' as const,
                        title: 'Khởi đầu tác phẩm',
                        description: parsed.description || 'Bối cảnh ban đầu',
                      },
                      {
                        phase: 'Biến cố' as const,
                        title: 'Biến cố & Thử thách',
                        description: 'Các sự kiện phát triển làm nảy sinh xung đột.',
                      },
                      {
                        phase: 'Cao trào' as const,
                        title: 'Cao trào kịch tính',
                        description: 'Điểm nút cao nhất của câu chuyện.',
                      },
                      {
                        phase: 'Mở nút & Kết thúc' as const,
                        title: 'Kết thúc & Dư âm',
                        description: parsed.message || 'Kết quả và bài học sâu sắc.',
                      },
                    ],
                keyEvents: Array.isArray(parsed.plotSynopsis.keyEvents)
                  ? parsed.plotSynopsis.keyEvents
                  : parsed.keyTakeaways || [],
              }
            : undefined;

          return {
            title: parsed.title || input.title || 'Sách mới',
            author: parsed.author || input.author || 'Đang cập nhật',
            publisher: parsed.publisher || input.publisher || 'Nhà xuất bản Tri thức',
            category: parsed.category || input.category || 'Văn học',
            year: Number(parsed.year) || new Date().getFullYear(),
            pageCount: Number(parsed.pageCount) || 250,
            shelfLocation: parsed.shelfLocation || 'Kệ A1 - Tầng 2',
            description: parsed.description || `Giới thiệu tác phẩm ${parsed.title || input.title}.`,
            summary: parsed.summary || parsed.description || 'Nội dung tóm tắt của tác phẩm.',
            message: parsed.message || 'Mở một cuốn sách, mở ra một chân trời mới.',
            themes: Array.isArray(parsed.themes) ? parsed.themes : ['Đọc sách', 'Tri thức'],
            keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : ['Rút ra bài học cuộc sống sâu sắc'],
            targetAge: parsed.targetAge || 'Học sinh & Bạn đọc',
            isbn: parsed.isbn || input.isbn || `978604${Math.floor(1000000 + Math.random() * 9000000)}`,
            characters: validCharacters,
            plotSynopsis: validPlot,
            authorDetails: parsed.authorDetails || undefined,
            historicalContext: parsed.historicalContext || undefined,
            sources: sources.length > 0 ? sources : undefined,
            provider: 'Google Gemini 3.8 Flash (Tra cứu Google Search trực tiếp)',
          };
        }
      } catch (err) {
        console.warn('Gemini autoCompleteBookDetails error, using intelligent fallback:', err);
      }
    }

    // Heuristic Fallback Generator
    const rawTitle = input.title?.trim() || 'Tác phẩm văn học chọn lọc';
    const rawAuthor = input.author?.trim() || 'Tác giả đương đại';
    const rawPublisher = input.publisher?.trim() || 'NXB Trẻ';
    const detectedCategory = input.category || 'Văn học';
    const randomIsbn = input.isbn || `978604${Math.floor(1000000 + Math.random() * 9000000)}`;

    return {
      title: rawTitle,
      author: rawAuthor,
      publisher: rawPublisher,
      category: detectedCategory,
      year: new Date().getFullYear() - 1,
      pageCount: 280,
      shelfLocation: 'Kệ B2 - Tầng 1',
      description: `"${rawTitle}" của tác giả ${rawAuthor} là một tác phẩm giàu giá trị nhân văn và tri thức, được xuất bản bởi ${rawPublisher}. Cuốn sách mở ra góc nhìn sâu sắc về cuộc sống, khơi gợi lòng đam mê khám phá và hoàn thiện bản thân cho độc giả.`,
      summary: `Tác phẩm dẫn dắt người đọc qua từng trang sách bằng lối hành văn tinh tế, khắc họa chân thực những trải nghiệm và bài học sâu sắc. Qua từng diễn biến, tác giả gửi gắm nhiều chiêm nghiệm quý báu về con người, thời đại và khát vọng vươn lên.`,
      message: `Mỗi cuốn sách là một người bạn đồng hành, giúp ta thấu hiểu cuộc sống và nuôi dưỡng tâm hồn cao đẹp.`,
      themes: [detectedCategory, 'Tri thức', 'Khám phá', 'Nhân sinh'],
      keyTakeaways: [
        'Nuôi dưỡng tư duy phản biện và lòng nhân ái trong đời sống',
        'Biết trân trọng những bài học từ thử thách và trải nghiệm',
        'Không ngừng học hỏi và làm mới bản thân mỗi ngày',
      ],
      targetAge: 'Học sinh THPT & Bạn đọc',
      isbn: randomIsbn,
      characters: [
        {
          id: 'char-1',
          name: 'Nhân vật chính',
          role: 'Trung tâm câu chuyện',
          description: `Đại diện cho linh hồn tư tưởng và hành trình vượt qua thử thách trong "${rawTitle}".`,
          personality: 'Nghị lực, ham học hỏi và trắc ẩn',
          symbolicMeaning: 'Biểu tượng cho khát vọng hoàn thiện bản thân',
          keyQuote: 'Tri thức là chìa khóa mở lối tương lai.',
        },
      ],
      plotSynopsis: {
        overview: `Toàn bộ diễn biến của "${rawTitle}" phản ánh hành trình khám phá, đối mặt với thử thách và trưởng thành của các nhân vật.`,
        arc: [
          {
            phase: 'Mở đầu',
            title: 'Khởi đầu hành trình',
            description: `Giới thiệu hoàn cảnh xuất phát điểm và các động lực ban đầu của "${rawTitle}".`,
          },
          {
            phase: 'Biến cố',
            title: 'Biến cố & Thử thách nhận thức',
            description: 'Các sự kiện phát triển đẩy nhân vật vào những lựa chọn quyết định.',
          },
          {
            phase: 'Cao trào',
            title: 'Điểm nút cao trào',
            description: 'Thời điểm xung đột đạt đỉnh điểm, tạo nên bước ngoặt tư tưởng sâu sắc.',
          },
          {
            phase: 'Mở nút & Kết thúc',
            title: 'Mở nút & Bài học nhân văn',
            description: 'Các vấn đề được thấu suốt, để lại dư âm suy ngẫm cho người đọc.',
          },
        ],
        keyEvents: [
          'Khởi đầu bối cảnh câu chuyện',
          'Xuất hiện thử thách lớn',
          'Vượt qua bước ngoặt nhận thức',
          'Đúc kết thông điệp nhân văn',
        ],
      },
      provider: 'Hệ thống Gợi ý Thông minh Thư viện',
    };
  }

  /**
   * Reads barcode / ISBN digits from an image (using Gemini Vision OCR + multi-model fallback + regex)
   */
  public async readBarcodeFromImage(imageBase64: string): Promise<{
    detected: boolean;
    isbn?: string;
    rawText?: string;
    bookTitle?: string;
    confidence?: string;
    isBusy?: boolean;
    message?: string;
  }> {
    const client = this.getGeminiClient();

    if (client && imageBase64) {
      let cleanBase64 = imageBase64;
      let mimeType = 'image/jpeg';

      if (imageBase64.startsWith('data:image/')) {
        const [header, data] = imageBase64.split(',');
        mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
        cleanBase64 = data;
      }

      const prompt = `Bạn là hệ thống máy quét OCR mã vạch sách chuyên dụng siêu tốc.
Nhiệm vụ: Phân tích hình ảnh mã vạch, tem sách, hoặc bìa sau của sách và trích xuất dãy số mã vạch (ISBN-13, EAN-13, EAN-8, UPC-A, Code-128, ISBN-10).
Chi tiết cần tìm và phân tích:
1. Dãy số in bên dưới hoặc bên trên các vạch đen mã vạch (thường là 13 chữ số bắt đầu bằng 978, 979, 893... hoặc 10 chữ số, 12 chữ số).
2. Dòng chữ ghi "ISBN", "ISBN-13:", "Mã vạch:" hoặc các cụm số phân cách bằng dấu gạch ngang (ví dụ: 978-604-2-17192-2).
3. Tiêu đề cuốn sách nếu nhìn thấy được.

Trả về DUY NHẤT một đối tượng JSON thuần túy (không dùng markdown, không có chữ thừa bên ngoài):
{
  "detected": true,
  "isbn": "9786042171922",
  "rawText": "978-604-2-17192-2",
  "bookTitle": "Tên sách nếu đọc được",
  "confidence": "high"
}
Nếu hình ảnh không chứa mã vạch hoặc hoàn toàn không đọc được số, trả về:
{"detected": false}`;

      // Multi-model vision OCR for high precision barcode detection
      const candidateModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'];

      for (const modelName of candidateModels) {
        try {
          const timeoutPromise = new Promise<{ text: string }>((resolve) =>
            setTimeout(() => resolve({ text: '{"detected":false}' }), 15000)
          );

          const apiPromise = client.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              prompt,
            ],
            config: {
              temperature: 0.0,
            },
          });

          const response: any = await Promise.race([apiPromise, timeoutPromise]);
          const raw = response.text || '';
          const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              const rawIsbn = parsed.isbn || parsed.barcode || parsed.code || parsed.number;
              if (rawIsbn) {
                const cleanDigits = String(rawIsbn).replace(/[^0-9X]/gi, '').toUpperCase();
                if (cleanDigits.length >= 8) {
                  return {
                    detected: true,
                    isbn: cleanDigits,
                    rawText: parsed.rawText || String(rawIsbn),
                    bookTitle: parsed.bookTitle || undefined,
                    confidence: parsed.confidence || 'high',
                  };
                }
              }
            } catch {
              // Ignore JSON parse error, proceed to regex
            }
          }

          // Direct regex fallback on model output
          const isbnRegexMatch = raw.match(/(?:97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9]|893[-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9]|[0-9]{13}|893[0-9]{10}|[0-9]{9}[0-9X])/i);
          if (isbnRegexMatch) {
            const cleanIsbn = isbnRegexMatch[0].replace(/[^0-9X]/gi, '').toUpperCase();
            if (cleanIsbn.length >= 8) {
              return {
                detected: true,
                isbn: cleanIsbn,
                rawText: isbnRegexMatch[0],
                confidence: 'medium',
              };
            }
          }
        } catch (err: any) {
          console.warn(`[AI Barcode OCR] Issue calling ${modelName}:`, err?.message || err);
        }
      }
    }

    return { detected: false };
  }
}

export const aiService = new AIService();
