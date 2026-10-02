import { Book, UniversalQuiz, CrosswordQuiz, MediaAnalysisQuiz, MultipleChoiceQuiz, TrueFalseQuiz, MatchingQuiz, FillBlankQuiz } from '../types.js';
import { shuffleQuizOptions } from '../components/BookQuizModal.js';

/**
 * Builds a comprehensive 10-question master challenge deck for any book in the library,
 * combining gamified learning with high-order critical reasoning across 7 diverse formats.
 * CRITICAL RULE: Each question uses a distinct, highly relevant, curated image asset — NEVER repeatedly reusing coverImage!
 */
export function buildTenQuestionMasterDeck(book: Book): UniversalQuiz[] {
  const authorQuote = book.authorDetails?.famousQuote || book.authorDetails?.quote;
  const firstChar = book.characters?.[0];

  // 1. SPECIFIC CURATED 10-QUESTION MASTER DECK FOR "DẾ MÈN PHIÊU LƯU KÝ"
  if (book.id === 'de-men-phieu-luu-ky') {
    const deck: UniversalQuiz[] = [
      // Q1: Media Analysis (AI Nhận diện tranh tư liệu sinh cảnh côn trùng bãi cỏ Tô Lịch)
      {
        id: `dm-media-1`,
        type: 'media_analysis',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1574786198875-49f5d09fe2d5?auto=format&fit=crop&w=1200&q=80',
        mediaCaption: 'Bản vẽ phục dựng sinh cảnh thiên nhiên và thế giới côn trùng bãi cỏ ven sông (Tư liệu lưu trữ văn học thiếu nhi)',
        analysisFocus: 'Dáng đứng vuốt râu đầy tự mãn, đôi càng gai sắc lẹm giương cao thách thức muôn loài trong sinh cảnh đồng cỏ hoang sơ',
        alternativeMedia: [
          {
            title: 'Tranh sinh cảnh côn trùng bãi cỏ',
            url: 'https://images.unsplash.com/photo-1574786198875-49f5d09fe2d5?auto=format&fit=crop&w=1200&q=80',
            caption: 'Bản vẽ phục dựng sinh cảnh côn trùng bãi cỏ ven sông Tô Lịch (Lưu trữ Văn học)',
          },
          {
            title: 'Cánh đồng quê & Bãi cỏ ven sông',
            url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            caption: 'Cánh đồng quê mênh mông — cái nôi của hành trình vượt thoát',
          },
          {
            title: 'Bản thảo sáng tác Tô Hoài 1941',
            url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
            caption: 'Bản thảo truyện ngắn "Con Dế Mèn" viết năm 1941 tại làng Nghĩa Đô',
          },
        ],
        question: 'Dưới góc nhìn phân tâm học và nghệ thuật biểu tượng trong bức ảnh tư liệu trên: Dụng ý khi Tô Hoài miêu tả cặp râu "rung rinh một điệu rất bướng" cùng đôi càng sắc bén phản ánh lỗ hổng nhận thức nào ở tuổi trẻ?',
        options: [
          'Sự nhầm lẫn tai hại giữa sức mạnh cơ bắp thể lý với bản lĩnh nhân cách đích thực, dẫn đến ảo tưởng quyền uy ngạo mạn.',
          'Nhu cầu sinh học tất yếu nhằm đánh dấu chủ quyền lãnh thổ trước sự xâm lấn của các giống loài săn mồi hung dữ xung quanh.',
          'Chiến lược ngụy trang tâm lý nhằm che giấu nỗi sợ hãi tự nhiên trước sự khắc nghiệt của thế giới hoang dã bao la bên ngoài.',
          'Sự học đòi mù quáng theo phong cách của các bậc võ tướng giang hồ mà chú dế từng nghe kể lại trong các tích truyện dân gian.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Tô Hoài sử dụng nghệ thuật nhân hóa bậc thầy để vạch trần căn bệnh muôn thuở của tuổi trẻ: Nhầm lẫn giữa vẻ hào nhoáng, sức mạnh hình thể bên ngoài với sự trưởng thành về nhân cách và đạo đức bên trong.',
        evidence: 'Trích chương 1 tác phẩm Dế Mèn Phiêu Lưu Ký của Tô Hoài.',
        didYouKnow: 'Tô Hoài viết tác phẩm này khi mới 21 tuổi, lấy cảm hứng từ cảnh vật và đời sống nông thôn quanh vùng bãi sông Tô Lịch.',
      },

      // Q2: Crossword Matrix (Ô chữ ma trận - Cụm từ khóa tổng)
      {
        id: `dm-crossword-2`,
        type: 'crossword',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ma Trận Ô Chữ: Giải Mã Cụm Từ Khóa Cốt Lõi',
        instruction: 'Trả lời các gợi ý hàng ngang để thu thập mảnh ghép chữ cái, hoặc bấm "Giải Mã Cụm Từ Khóa Tổng" bất cứ lúc nào!',
        masterKeyword: 'LƯƠNG TRI',
        masterClue: 'Kim chỉ nam đạo đức tối thượng mà Dế Choắt đã dùng cả sinh mạng để đánh thức trong tâm hồn Dế Mèn.',
        rows: [
          { id: 'r1', rowNumber: 1, clue: 'Kẻ thù nguy hiểm đã cướp đi sinh mạng Dế Choắt sau trò đùa dại dột của Dế Mèn (6 chữ cái)', answer: 'CHỊ CỐC', keyCharIndex: 0 },
          { id: 'r2', rowNumber: 2, clue: 'Người bạn kết nghĩa anh em đồng cam cộng khổ cùng Dế Mèn trên vạn dặm phiêu lưu (6 chữ cái)', answer: 'DẾ TRŨI', keyCharIndex: 4 },
          { id: 'r3', rowNumber: 3, clue: 'Nơi Dế Mèn sinh ra và bắt đầu cuộc đời tự lập bằng việc đào hang kiên cố (7 chữ cái)', answer: 'BỜ RUỘNG', keyCharIndex: 4 },
          { id: 'r4', rowNumber: 4, clue: 'Bậc tiền bối trầm tĩnh đã cắt cụt hai sợi râu kiêu ngạo để dạy Mèn bài học kiềm chế (7 chữ cái)', answer: 'XIẾN TÓC', keyCharIndex: 4 },
          { id: 'r5', rowNumber: 5, clue: 'Lý tưởng cao cả mà Dế Mèn và Dế Trũi tha thiết kêu gọi muôn loài chung tay xây dựng (8 chữ cái)', answer: 'NGHĨA HIỆP', keyCharIndex: 1 },
          { id: 'r6', rowNumber: 6, clue: 'Tâm trạng giày vò, ân hận tột cùng của Dế Mèn bên nấm mồ người bạn xấu số (6 chữ cái)', answer: 'ĂN NĂN', keyCharIndex: 0 },
          { id: 'r7', rowNumber: 7, clue: 'Phẩm chất mà Dế Mèn rèn luyện được sau khi trả giá cho thói tự cao tự đại (10 chữ cái)', answer: 'KHIÊM NHƯỜNG', keyCharIndex: 7 },
          { id: 'r8', rowNumber: 8, clue: 'Khát vọng chân chính thôi thúc đôi bạn dế vượt thoát khỏi lũy tre làng chật hẹp (4 chữ cái)', answer: 'TỰ DO', keyCharIndex: 3 },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Cánh đồng quê bao la — cái nôi của hành trình vượt thoát',
        explanation: 'Cụm từ khóa tổng "LƯƠNG TRI" chính là linh hồn xuyên suốt toàn bộ tác phẩm. Cái chết của Dế Choắt không phải là sự chấm dứt, mà là khởi đầu cho sự thức tỉnh lương tri của Dế Mèn.',
        evidence: 'Lời trăn trối của Dế Choắt: "Ở đời mà có thói hung hăng bậy bạ... thì sớm muộn cũng mang vạ vào mình".',
        didYouKnow: 'Cụm từ "Lương tri" là chìa khóa then chốt đưa tác phẩm vượt qua khuôn khổ truyện đồng thoại thiếu nhi để trở thành kiệt tác văn học nhân loại.',
      },

      // Q3: Multiple Choice Paradox (Nghịch lý Dế Choắt)
      {
        id: `dm-mc-3`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Bi kịch của Dế Choắt phản ánh nghịch lý tâm lý và quy luật thức tỉnh nhân cách nào sâu sắc nhất trong hành trình trưởng thành của Dế Mèn?',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Con đường mòn đất đỏ và hang dế đơn sơ nơi góc ruộng',
        clue: 'Sự va đập đau đớn giữa ảo tưởng tự mãn và sinh mạng của người láng giềng yếu thế...',
        options: [
          'Sự đối đầu tất yếu giữa lối sống an phận hèn nhát và tinh thần ưa mạo hiểm phiêu lưu của tuổi trẻ nhiệt huyết.',
          'Nghịch lý giữa ảo tưởng sức mạnh nông nổi và cái giá thức tỉnh lương tri bằng sinh mạng của đồng loại yếu thế.',
          'Khát vọng khẳng định uy quyền của loài côn trùng trước các mối đe dọa sinh tồn tự nhiên khắc nghiệt chốn thôn dã.',
          'Quy luật cạnh tranh sinh học lạnh lùng nơi kẻ yếu buộc phải nhường không gian sinh tồn cho những cá thể mạnh mẽ.',
        ],
        correctIndex: 1,
        explanation: 'Chính xác! Cái chết oan ức của Dế Choắt do trò đùa dại dột của Dế Mèn là cú sốc hiện sinh lớn nhất cuộc đời chú. Đây là bài học đường đời nghiệt ngã đánh đổi bằng máu, thức tỉnh lương tri và lòng trắc ẩn từ trong tâm khảm Dế Mèn.',
        evidence: 'Trích chương 1 tác phẩm Dế Mèn Phiêu Lưu Ký của Tô Hoài.',
      },

      // Q4: True/False Dialectic (Lý tưởng tự do)
      {
        id: `dm-tf-4`,
        type: 'true_false',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        statement: 'Theo tư tưởng của Tô Hoài, sự tự do thực sự của Dế Mèn chỉ được xác lập khi chú chiến thắng mọi đối thủ và đứng ở vị trí thống trị thế giới loài vật.',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Bầu trời và dãy núi non trùng điệp mở ra chân trời tự do đích thực',
        clue: 'Hãy nhớ lại mục tiêu cao nhất của chuyến phiêu lưu: Đứng trên đỉnh cao quyền lực hay xóa bỏ áp bức?',
        isTrue: false,
        explanation: 'Sai! Tô Hoài phê phán tư duy thống trị và khẳng định rằng tự do đích thực không phải là đè đầu cưỡi cổ kẻ khác, mà là năng lực giải phóng chính mình khỏi thói kiêu ngạo vị kỷ để chung sống hòa bình và bảo vệ công lý.',
        evidence: 'Khẩu hiệu kết nghĩa anh em muôn loài ở các chương cuối tác phẩm.',
      },

      // Q5: Quote Decryption (Lời trăn trối Dế Choắt)
      {
        id: `dm-mc-quote-5`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Khi phân tích lời trăn trối của Dế Choắt: "Ở đời mà có thói hung hăng bậy bạ, có óc mà không biết nghĩ, sớm muộn rồi cũng mang vạ vào mình", tầng nghĩa hàm ẩn sâu xa nhất là gì?',
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Ngòi bút và bản thảo đúc kết triết lý nhân sinh bất hủ',
        clue: 'Dế Choắt không hề oán trách hay nguyền rủa kẻ hại mình mà chỉ thức tỉnh Mèn...',
        options: [
          'Lời tha thứ đầy độ lượng biến nỗi đau thành bài học đạo đức giúp kẻ lầm lạc tự soi chiếu và thức tỉnh nhân cách.',
          'Sự bất lực tuyệt vọng của kẻ yếu thế khi không thể trả thù nên đành dùng lời lẽ luân lý để răn đe kẻ mạnh hơn.',
          'Quy tắc ứng xử ngoại giao khôn khéo nhằm tránh gây thêm thù oán cho gia đình và họ hàng loài dế sau khi qua đời.',
          'Một nhận định mang tính mê tín dị đoan về luật nhân quả luân hồi tiền định trong thế giới loài vật thôn dã.',
        ],
        correctIndex: 0,
        explanation: 'Vô cùng sâu sắc! Choắt không nguyền rủa hay oán hận, mà dùng hơi thở cuối cùng để trao cho Mèn một chiếc gương soi nhân cách. Chính sự vị tha đầy xót xa ấy đã trở thành nhát dao đâm trúng vào lòng tự trọng của Mèn, buộc chú phải thay đổi.',
        evidence: 'Trích đoạn Dế Choắt trút hơi thở cuối cùng trong vòng tay Dế Mèn.',
      },

      // Q6: Symbolic Matching
      {
        id: `dm-match-6`,
        type: 'matching',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ghép Nối Nhân Vật Và Chiều Sâu Biểu Tượng',
        instruction: 'Hãy nối các nhân vật trong tác phẩm với ý nghĩa biểu tượng và tư tưởng phản biện sâu sắc mà họ đại diện.',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Thế giới tự nhiên muôn hình vạn trạng và hành trình vạn dặm',
        pairs: [
          { id: 'p1', leftText: 'Dế Mèn', rightText: 'Hành trình vượt thoát bóng tối tự mãn để thức tỉnh lương tri và dấn thân vì tự do' },
          { id: 'p2', leftText: 'Dế Choắt', rightText: 'Tiếng kêu bi thương của thân phận yếu thế thức tỉnh trách nhiệm đạo đức cộng đồng' },
          { id: 'p3', leftText: 'Dế Trũi', rightText: 'Biểu tượng của tinh thần nghĩa hiệp, tình bạn gắn kết sinh tử không vụ lợi' },
          { id: 'p4', leftText: 'Xiến Tóc', rightText: 'Sự từng trải và trầm tĩnh của bậc tiền bối giúp ghìm cương những bồng bột tuổi trẻ' },
        ],
        explanation: 'Mỗi nhân vật dưới ngòi bút Tô Hoài là một mẫu hình tâm lý xã hội sống động, đại diện cho những va đập nhận thức trên hành trình hoàn thiện nhân cách con người.',
      },

      // Q7: Fill in the Blank
      {
        id: `dm-fill-7`,
        type: 'fill_blank',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Điền từ còn thiếu vào đúc kết tư tưởng thiêng liêng mà Dế Mèn đã chiêm nghiệm bên nấm mồ Dế Choắt:',
        sentenceWithBlank: 'Tôi đem xác Dế Choắt đến chôn vào một vùng cỏ xanh tốt. Tôi đắp thành nấm mộ to. Tôi đứng lặng giờ lâu, nghĩ về bài học [...] đầu tiên.',
        acceptedAnswers: ['đường đời', 'duong doi'],
        placeholder: 'Nhập cụm từ gồm 2 từ...',
        imageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Nấm mộ xanh yên bình giữa tĩnh lặng đồng quê',
        explanation: '"Bài học đường đời đầu tiên" là cột mốc phân định giữa hai giai đoạn cuộc đời Dế Mèn: Từ chú dế kiêu căng nông nổi trở thành người chiến sĩ quả cảm chiến đấu vì hòa bình.',
        evidence: 'Câu văn kết thúc chương 1 kiệt tác Dế Mèn Phiêu Lưu Ký.',
      },

      // Q8: Academic Critique (Bối cảnh 1941)
      {
        id: `dm-mc-academic-8`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Dưới góc độ phê bình văn học sử, việc Tô Hoài sáng tác "Dế Mèn Phiêu Lưu Ký" vào năm 1941 (thời kỳ thực dân phát xít chiếm đóng Việt Nam) mang thông điệp giải phóng ngầm ẩn nào?',
        imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Tư liệu văn học sử kháng chiến đầu thập niên 1940',
        clue: 'Khát vọng phá tan xiềng xích nô lệ và tinh thần đoàn kết chống áp bức của thanh niên yêu nước...',
        options: [
          'Khát vọng thức tỉnh thanh niên thoát khỏi sự ru ngủ của xã hội nô dịch, đoàn kết muôn người đứng lên giành quyền sống tự do.',
          'Lời kêu gọi thanh niên từ bỏ quê hương để đi chu du thiên hạ, tìm kiếm cuộc sống cá nhân thanh thản nơi đất khách quê người.',
          'Sự ca ngợi ngầm ẩn dành cho chính sách cai trị của chính quyền bảo hộ thông qua hình tượng các loài côn trùng có tổ chức.',
          'Một tác phẩm ngụ ngôn thuần túy phục vụ giải trí cho trẻ em thành thị, hoàn toàn tách biệt khỏi các biến động thời cuộc.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Đằng sau tấm áo đồng thoại côn trùng là tiếng kêu gọi tha thiết của Tô Hoài đối với thế hệ thanh niên Việt Nam thời thuộc địa: Hãy phá vỡ vỏ bọc tự ti hoặc tự mãn, đoàn kết lại để đấu tranh cho độc lập và công lý.',
        evidence: 'Các tài liệu nghiên cứu văn học sử của Viện Văn học Việt Nam.',
      },

      // Q9: Moral Dilemma
      {
        id: `dm-mc-dilemma-9`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Giả định nếu Dế Mèn không dũng cảm xông vào giải cứu Dế Trũi khỏi bầy bọ ngựa hung tợn mà chọn cách ẩn nấp an toàn, hệ quả tâm lý nào sẽ hủy hoại nhân cách của Mèn?',
        imageUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Vùng đầm lầy hiểm nguy và khoảnh khắc thử thách nhân cách',
        clue: 'Sự an toàn thể xác đổi lấy sự tha hóa và hèn nhát vĩnh viễn trong tâm hồn...',
        options: [
          'Mèn sẽ mãi mãi rơi vào sự tha hóa tâm hồn bởi thói hèn nhát ích kỷ, biến những ân hận với Dế Choắt thành lời nói suông.',
          'Mèn sẽ bảo toàn được thể lực hoàn hảo để tiếp tục các chuyến du ngoạn phong lưu mà không gặp phải bất kỳ rủi ro nào.',
          'Mèn sẽ được bầy bọ ngựa tôn sùng như một cá thể khôn ngoan và mời làm cố vấn quân sự chiến lược cho cộng đồng đầm nước.',
          'Mèn sẽ rèn luyện được đức tính thận trọng thực tế của người trưởng thành biết đặt sự an toàn của bản thân lên trên hết.',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Hành động cứu Trũi là phép thử sinh tử: Nếu Mèn hèn nhát bỏ mặc bạn, chú sẽ trượt dài trong sự tha hóa và không bao giờ tìm lại được lương tri đã đánh mất sau cái chết của Choắt.',
        evidence: 'Chương 4: Dế Mèn kết nghĩa anh em với Dế Trũi.',
      },

      // Q10: Modern Praxis
      {
        id: `dm-mc-modern-10`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Trong bối cảnh mạng xã hội hiện đại, hành vi trêu chọc Dế Choắt của Dế Mèn tương đương với hiện tượng tiêu cực nào đang gây tổn thương sâu sắc cho giới trẻ?',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Giới trẻ kết nối và văn hóa ứng xử trước không gian ảo',
        clue: 'Trò đùa vô tâm sau bàn phím có thể hủy hoại cuộc đời một con người ngoài đời thực...',
        options: [
          'Hành vi bạo lực mạng núp bóng những trò đùa cợt câu view vô trách nhiệm, đẩy người yếu thế vào bước đường cùng quẫn.',
          'Hiện tượng tranh luận học thuật lành mạnh trên các diễn đàn trực tuyến nhằm tìm kiếm chân lý khoa học đa chiều.',
          'Thói quen chia sẻ các trích dẫn văn học kinh điển nhằm lan tỏa giá trị nhân văn và tinh thần đọc sách sâu trong cộng đồng.',
          'Xu hướng kết nối bạn bè bốn phương để cùng thực hiện các dự án thiện nguyện bảo vệ môi trường và giúp đỡ trẻ em nghèo.',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Tô Hoài đã cảnh báo từ 80 năm trước: Sự vô cảm đội lốt trò đùa (bạo lực mạng, bắt nạt trực tuyến) có thể cướp đi sinh mạng của người khác. Tác phẩm là hồi chuông cảnh tỉnh cho văn hóa ứng xử văn minh hôm nay.',
        evidence: 'Bài học đúc kết thời đại từ kiệt tác Dế Mèn Phiêu Lưu Ký.',
      },
    ];

    return deck;
  }

  // 2. SPECIFIC CURATED 10-QUESTION MASTER DECK FOR "HOÀNG TỬ BÉ"
  if (book.id === 'hoang-tu-be') {
    const deck: UniversalQuiz[] = [
      // Q1: Media Analysis
      {
        id: `htb-media-1`,
        type: 'media_analysis',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        mediaCaption: 'Bản vẽ màu nước nguyên tác mô phỏng bầu trời đêm Sahara và các tiểu hành tinh (Lưu trữ Thư viện Morgan)',
        analysisFocus: 'Bức vẽ Con Trăn nuốt Con Voi bị người lớn nhìn nhầm thành Chiếc Mũ dạ thông thường',
        alternativeMedia: [
          {
            title: 'Tranh màu nước trăn nuốt voi',
            url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
            caption: 'Bản vẽ màu nước nguyên tác trăn nuốt voi bị người lớn nhìn nhầm thành chiếc mũ (Thư viện Morgan)',
          },
          {
            title: 'Tiểu hành tinh B612 & Vũ trụ',
            url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
            caption: 'Tiểu hành tinh B612 và không gian kỳ vĩ của vũ trụ bao la',
          },
          {
            title: 'Đóa hoa hồng có bốn chiếc gai',
            url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80',
            caption: 'Đóa hoa hồng kiêu kỳ duy nhất mà Hoàng Tử Bé dành trọn tình yêu',
          },
        ],
        question: 'Khi đối chiếu bức vẽ con trăn nuốt con voi với phản ứng của người lớn trong tư liệu gốc của Saint-Exupéry: Dụng ý triết học sâu sắc nhất về căn bệnh nhận thức của xã hội hiện đại là gì?',
        options: [
          'Sự xơ cứng của tư duy duy lý thực dụng khiến người lớn chỉ nhìn thấy vỏ bọc bề ngoài mà mất đi năng lực thấu cảm bản chất.',
          'Sự bất lực của kỹ thuật hội họa tả thực trong việc truyền tải các thông điệp khoa học sinh học về tập tính loài bò sát.',
          'Lời khuyên răn các bậc phụ huynh nên đầu tư cho con trẻ học vẽ theo các trường phái mỹ thuật hàn lâm từ sớm.',
          'Sự cảnh báo về những hiểm họa sinh thái tự nhiên khi con người xâm lấn môi trường sống của các loài động vật hoang dã.',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Bức vẽ là phép thử nhận thức: Người lớn chỉ thấy "chiếc mũ" (thứ quen thuộc, an toàn, định lượng được), trong khi tâm hồn trẻ thơ nhìn thấy "con trăn đang tiêu hóa một con voi" (thế giới bản thể diệu kỳ của trí tưởng tượng).',
        evidence: 'Trích chương 1 kiệt tác Hoàng Tử Bé.',
        didYouKnow: 'Bản thân tác giả Saint-Exupéry đã tự tay vẽ tất cả các tranh minh họa màu nước cho cuốn sách này khi sống lưu vong tại Mỹ.',
      },

      // Q2: Crossword Matrix
      {
        id: `htb-crossword-2`,
        type: 'crossword',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ma Trận Ô Chữ: Giải Mã Cốt Lõi Tình Yêu & Gắn Kết',
        instruction: 'Giải mã các hàng ngang để mở các chữ cái gợi ý, hoặc nhấn "Giải Mã Cụm Từ Khóa Tổng" bất cứ lúc nào!',
        masterKeyword: 'THUẦN HÓA',
        masterClue: 'Bí mật thiêng liêng mà Con Cáo đã trao tặng cho Hoàng Tử Bé tại Sa Mạc Sahara để thấu suốt bản chất tình yêu.',
        rows: [
          { id: 'r1', rowNumber: 1, clue: 'Loài cây khổng lồ có rễ ăn sâu đe dọa làm nổ tung tiểu hành tinh B612 nếu không nhổ sớm (6 chữ cái)', answer: 'BAOBAB', keyCharIndex: 0 },
          { id: 'r2', rowNumber: 2, clue: 'Sinh linh kiều diễm có bốn chiếc gai tự vệ mà Hoàng Tử Bé trao trọn cả trái tim (7 chữ cái)', answer: 'HOA HỒNG', keyCharIndex: 0 },
          { id: 'r3', rowNumber: 3, clue: 'Con vật thông thái đã dạy cho chú bé bài học "thấy rõ nhất bằng trái tim" (6 chữ cái)', answer: 'CON CÁO', keyCharIndex: 5 },
          { id: 'r4', rowNumber: 4, clue: 'Nơi người phi công gặp gỡ Hoàng Tử Bé sau sự cố máy bay hỏng động cơ (5 chữ cái)', answer: 'SA MẠC', keyCharIndex: 1 },
          { id: 'r5', rowNumber: 5, clue: 'Hành tinh nhỏ bé nơi ngự trị của vị vua quyền lực thích ban hành mệnh lệnh hợp lý (12 chữ cái)', answer: 'TIỂU TINH CẦU', keyCharIndex: 8 },
          { id: 'r6', rowNumber: 6, clue: 'Bức tranh mà Hoàng Tử Bé kiên quyết đòi người phi công vẽ vào chiếc hộp có 3 lỗ (7 chữ cái)', answer: 'CHÚ CỪU', keyCharIndex: 1 },
          { id: 'r7', rowNumber: 7, clue: 'Thước đo duy nhất mà xã hội người lớn dùng để đánh giá giá trị một ngôi nhà hay một người bạn (5 chữ cái)', answer: 'CON SỐ', keyCharIndex: 1 },
          { id: 'r8', rowNumber: 8, clue: 'Sinh vật mang nọc độc huyền bí đã giúp Hoàng Tử Bé trút bỏ thân xác nặng nề để trở về với đóa hoa (6 chữ cái)', answer: 'CON RẮN', keyCharIndex: 5 },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Tiểu hành tinh B612 lơ lửng giữa vũ trụ bao la',
        explanation: 'Từ khóa tổng "THUẦN HÓA" (tiếng Pháp: Apprivoiser) có nghĩa là "tạo dựng mối dây liên hệ". Khi thuần hóa một ai đó, họ trở thành duy nhất trên đời và ta gắn liền số phận, trách nhiệm của mình với họ.',
        evidence: 'Lời tạm biệt của Cáo: "Người ta chỉ thấy rõ bằng trái tim. Điều cốt yếu thì vô hình đối với mắt trần".',
        didYouKnow: 'Khái niệm "thuần hóa" trong cuốn sách là đóng góp triết học độc đáo của Saint-Exupéry về nghệ thuật yêu thương và gắn kết con người.',
      },

      // Q3: Paradox (5.000 đóa hồng)
      {
        id: `htb-mc-3`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Tại sao giữa vườn địa đàng 5.000 đóa hồng rực rỡ ở Trái Đất, đóa hoa trên tiểu hành tinh B612 vẫn là duy nhất đối với Hoàng Tử Bé? Quy luật tâm lý nào được giải mã ở đây?',
        imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Đóa hoa hồng kiêu kỳ duy nhất của Hoàng Tử Bé',
        clue: 'Giá trị của đối tượng không nằm ở bản thân nó, mà nằm ở thời gian và trách nhiệm ta trao cho nó...',
        options: [
          'Chính thời gian dấn thân, sự tận tụy chăm sóc và trách nhiệm tình cảm đã kiến tạo nên giá trị độc bản vượt lên trên hình thức vật lý đơn thuần.',
          'Đặc tính cấu trúc sinh học độc nhất của loài hoa vũ trụ với bốn chiếc gai tự vệ tạo nên sự vượt trội so với các loài hoa thông thường.',
          'Tâm lý chiếm hữu độc quyền sinh ra từ nỗi cô đơn kéo dài thúc đẩy cá nhân phóng chiếu những ảo tưởng lý tưởng hóa lên đối tượng thân thuộc.',
          'Sự quyến luyến hoài niệm đối với quê hương quen thuộc khiến con người khó lòng dung nạp và đón nhận những vẻ đẹp mới mẻ của thế giới ngoại vi.',
        ],
        correctIndex: 0,
        explanation: 'Rất sâu sắc! "Chính thời gian bạn bỏ ra cho bông hồng của bạn làm cho bông hồng của bạn trở nên quan trọng đến thế." Sự gắn kết và trách nhiệm biến cái phổ biến thành điều độc bản duy nhất.',
        evidence: 'Trích chương 20 và 21 Hoàng Tử Bé.',
      },

      // Q4: True/False (Chiếc hộp 3 lỗ)
      {
        id: `htb-tf-4`,
        type: 'true_false',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        statement: 'Theo triết lý của cuốn sách, chiếc hộp có 3 cái lỗ chứa đựng chú cừu hoàn hảo hơn bất kỳ bức vẽ cừu tả thực nào bởi vì nó tôn trọng sự tự do vô hạn của trí tưởng tượng.',
        imageUrl: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Chú cừu nhỏ gặm cỏ giữa thảo nguyên bao la',
        clue: 'Đối chiếu với lời reo mừng của Hoàng Tử Bé khi nhìn thấy chiếc hộp...',
        isTrue: true,
        explanation: 'Hoàn toàn chính xác! Bức vẽ tả thực đóng đinh đối tượng vào một hình thức cụ thể hữu hạn, trong khi chiếc hộp trao cho tâm hồn quyền năng sáng tạo vô hạn theo đúng ước nguyện của trái tim.',
        evidence: 'Chương 2 Hoàng Tử Bé.',
      },

      // Q5: Quote Decryption
      {
        id: `htb-mc-quote-5`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Khi Con Cáo dặn Hoàng Tử Bé: "Bạn trở nên có trách nhiệm vĩnh viễn với những gì bạn đã thuần hóa", nhận định này đặt ra thách thức đạo đức nào cho tình yêu thời hiện đại?',
        imageUrl: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Con Cáo sa mạc thông thái và bài học tình cảm sâu sắc',
        clue: 'Tình yêu đích thực đối lập với thói quen tiêu dùng chớp nhoáng và sự phản bội trách nhiệm...',
        options: [
          'Tình yêu chân chính không thể là một trò tiêu khiển chớp nhoáng mà đòi hỏi sự thủy chung, lòng kiên định và trách nhiệm bảo bọc suốt đời.',
          'Sự ràng buộc pháp lý chặt chẽ giữa hai cá nhân là điều kiện tiên quyết để duy trì sự ổn định kinh tế và địa vị xã hội cho gia đình.',
          'Mối quan hệ tình cảm chỉ nên duy trì chừng nào đối phương còn mang lại lợi ích cảm xúc hoặc giá trị thỏa mãn bản thân trước mắt.',
          'Trách nhiệm tình cảm là gánh nặng không cần thiết kìm hãm sự tự do cá nhân và năng lực khám phá các cơ hội trải nghiệm mới mẻ.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Saint-Exupéry phê phán thứ tình cảm "dùng một lần" của xã hội tiêu thụ. Thuần hóa đồng nghĩa với dấn thân trọn đời và chịu trách nhiệm với sinh mệnh của người mình yêu thương.',
        evidence: 'Lời dặn dò tâm huyết của Cáo tại chương 21.',
      },

      // Q6: Symbolic Matching
      {
        id: `htb-match-6`,
        type: 'matching',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ghép Nối Các Tiểu Tinh Cầu Với Thói Tật Xã Hội Người Lớn',
        instruction: 'Nối từng nhân vật trên các tiểu hành tinh với căn bệnh tâm lý của xã hội hiện đại mà họ đại diện.',
        imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Hệ thống các tiểu tinh cầu kỳ lạ trong vũ trụ',
        pairs: [
          { id: 'p1', leftText: 'Ông Vua', rightText: 'Ảo tưởng về quyền lực thống trị tuyệt đối và thói độc đoán mệnh lệnh' },
          { id: 'p2', leftText: 'Kẻ khoe khoang', rightText: 'Cơn khát được tung hô, tán thưởng mù quáng và sự trống rỗng nội tâm' },
          { id: 'p3', leftText: 'Doanh nhân', rightText: 'Căn bệnh nghiện sở hữu các con số và biến mọi giá trị thành tài sản' },
          { id: 'p4', leftText: 'Người thắp đèn', rightText: 'Sự tuân thủ quy tắc máy móc đến kiệt sức mà đánh mất ý nghĩa mục đích sống' },
        ],
        explanation: 'Mỗi tiểu tinh cầu là một bức tranh biếm họa sâu cay về sự tha hóa của con người trong vòng xoáy quyền lực, danh vọng và tiền tài.',
      },

      // Q7: Fill in the Blank
      {
        id: `htb-fill-7`,
        type: 'fill_blank',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Điền từ ngữ đắt giá nhất còn thiếu vào phát ngôn triết học kinh điển của Con Cáo:',
        sentenceWithBlank: 'Người ta chỉ thấy rõ bằng trái tim. Điều cốt yếu thì [...] đối với mắt trần.',
        acceptedAnswers: ['vô hình', 'vo hinh'],
        placeholder: 'Nhập từ khóa gồm 2 từ...',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Hoàng hôn sa mạc huyền ảo nơi cất giấu bí mật muôn đời',
        explanation: 'Từ "vô hình" khẳng định chân lý: Những giá trị thiêng liêng nhất của cuộc đời (tình yêu, tình bạn, lòng bao dung) không thể đo lường bằng thị giác hay con số vật chất.',
        evidence: 'Trích chương 21 tác phẩm Hoàng Tử Bé.',
      },

      // Q8: Academic Critique
      {
        id: `htb-mc-academic-8`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Trong bối cảnh Chiến tranh Thế giới thứ II đầy chết chóc và hủy diệt, việc Saint-Exupéry viết nên "Hoàng Tử Bé" mang sứ mệnh chữa lành tinh thần nào cho nhân loại?',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Máy bay thám hiểm cổ điển và bầu trời Thế chiến II',
        clue: 'Tác giả tìm kiếm chiếc phao cứu sinh cho phẩm giá con người khi văn minh châu Âu đứng trước nguy cơ sụp đổ...',
        options: [
          'Hồi sinh lòng trắc ẩn và sự ngây thơ thuần khiết của tâm hồn trẻ thơ như phương thuốc cứu rỗi nhân loại khỏi sự điên cuồng của hận thù.',
          'Cung cấp một cẩm nang kỹ thuật sinh tồn thực tế cho các phi công chiến đấu khi không may bị rơi máy bay trên sa mạc hiểm trở.',
          'Phân tích chi tiết các chiến thuật quân sự phòng không và nguyên lý vận hành khí động học của các loại phi cơ tiêm kích hiện đại.',
          'Xây dựng một tôn giáo thần bí mới mẻ dựa trên việc tôn sùng các vì sao và các thực thể ngoài vũ trụ để xoa dịu nỗi đau chiến tranh.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Giữa lúc nhân loại đang tàn sát lẫn nhau bằng đại bác và bom đạn, Saint-Exupéry nhắc nhở: Hãy cứu vớt "đứa trẻ" bên trong mỗi con người, bởi chỉ có tình yêu và sự thấu cảm mới chấm dứt được chiến tranh.',
        evidence: 'Lời đề tặng tác phẩm dành cho người bạn Léon Werth thời Thế chiến II.',
      },

      // Q9: Dilemma
      {
        id: `htb-mc-dilemma-9`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Tại sao Hoàng Tử Bé lại chấp nhận để con rắn vàng cắn mình ở cuối tác phẩm? Lựa chọn này phản ánh quan niệm hiện sinh nào về cái chết?',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Bãi cát sa mạc hoang vắng lúc chia ly',
        clue: 'Thể xác quá nặng nề để có thể bay về B612, chỉ có tình yêu thuần khiết là bất tử...',
        options: [
          'Cái chết không phải là sự kết thúc bi thảm mà là sự giải thoát của linh hồn khỏi lớp vỏ vật chất hữu hạn để đoàn tụ với tình yêu đích thực.',
          'Đó là một tai nạn bất cẩn đáng tiếc do chú bé thiếu kiến thức phòng vệ trước nọc độc nguy hiểm của loài bò sát sa mạc.',
          'Sự đầu hàng tuyệt vọng trước nỗi nhớ nhà và sự kiệt sức thể chất sau chuỗi ngày lang thang cô độc giữa sa mạc cát bỏng.',
          'Hành vi bồng bột nhằm chứng minh lòng dũng cảm phi thường trước mặt người phi công bạn thân trước khi chia tay.',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Cái chết của Hoàng Tử Bé được miêu tả nhẹ nhàng như một cái cây đổ xuống bãi cát: Thể xác chỉ là chiếc vỏ ngoài, sự dấn thân vì tình yêu và trách nhiệm mới là vĩnh hằng.',
        evidence: 'Chương 26: Lời từ biệt của Hoàng Tử Bé với người phi công.',
      },

      // Q10: Modern Praxis
      {
        id: `htb-mc-modern-10`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Hình tượng "tiểu tinh cầu của người thắp đèn" phản chiếu chính xác căn bệnh tâm lý nào của người lao động trong xã hội công nghệ 4.0 hôm nay?',
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Những cột đèn đô thị sáng rực trong guồng quay không ngừng nghỉ',
        clue: 'Hội chứng kiệt sức (burnout) khi con người chạy đua với deadline mà quên mất lý do mình bắt đầu...',
        options: [
          'Hội chứng kiệt sức (burnout) khi con người bị cuốn vào guồng quay công việc máy móc, không còn thời gian để ngắm sao và sống cho chính mình.',
          'Sự phát triển vượt bậc của năng lượng tái tạo giúp tự động hóa toàn bộ mạng lưới chiếu sáng công cộng tại các đô thị thông minh.',
          'Nhu cầu bức thiết trong việc nâng cao kỹ năng tin học và lập trình nhằm thích ứng với cuộc cách mạng trí tuệ nhân tạo toàn cầu.',
          'Xu hướng từ bỏ làm việc nhóm để chuyển sang mô hình kinh doanh cá nhân độc lập nhằm tối đa hóa thu nhập và quyền tự quyết.',
        ],
        correctIndex: 0,
        explanation: 'Rất sâu sắc! Hành tinh quay quá nhanh, mỗi phút là một ngày, người thắp đèn phải bật tắt liên tục mà không được ngủ một giây. Đó chính là bức tranh dự báo chính xác hội chứng kiệt sức (burnout) của con người hiện đại!',
        evidence: 'Chương 14: Tiểu tinh cầu thứ năm của người thắp đèn.',
      },
    ];

    return deck;
  }

  // 3. SPECIFIC CURATED 10-QUESTION MASTER DECK FOR "TRUYỆN KIỀU" (STK-006073)
  if (book.id === 'STK-006073' || book.id === 'truyen-kieu' || book.title.toUpperCase().includes('KIỀU')) {
    const deck: UniversalQuiz[] = [
      // Q1: Media Analysis
      {
        id: `kieu-media-1`,
        type: 'media_analysis',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
        mediaCaption: 'Tranh mộc bản dân gian cổ họa Thúy Kiều gảy đàn tỳ bà trong đêm trăng (Lưu trữ Bảo tàng Mỹ thuật Việt Nam)',
        analysisFocus: 'Dáng ngồi nghiêng cô đơn, ánh mắt trầm tư u uất và phím đàn tỳ bà buông khúc "Bạc mệnh" bi thương não nùng',
        alternativeMedia: [
          {
            title: 'Tranh cổ Kiều gảy đàn tỳ bà',
            url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
            caption: 'Tranh mộc bản dân gian cổ họa Thúy Kiều gảy đàn tỳ bà trong đêm trăng',
          },
          {
            title: 'Bản thảo chữ Nôm cổ bản 1866',
            url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
            caption: 'Bản thảo chữ Nôm Đoạn Trường Tân Thanh cổ bản lưu trữ tại Viện Nghiên cứu Hán Nôm',
          },
          {
            title: 'Cửa bể Lầu Ngưng Bích',
            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            caption: 'Khung cảnh Lầu Ngưng Bích: "Buồn trông cửa bể chiều hôm / Thuyền ai thấp thoáng cánh buồm xa xa"',
          },
        ],
        question: 'Dưới góc độ thi pháp học và triết học nhân sinh của Nguyễn Du qua bức họa mộc bản trên: Vì sao tiếng đàn tỳ bà của Thúy Kiều luôn gắn liền với bi kịch "tiếng đàn bạc mệnh" xuyên suốt 15 năm lưu lạc?',
        options: [
          'Tiếng đàn là hiện thân của tâm hồn quá đỗi nhạy cảm và tài hoa trác tuyệt, thách thức quy luật đố kỵ nghiệt ngã của tạo hóa phong kiến.',
          'Kỹ năng diễn tấu nhạc cụ cổ truyền của nhân vật chưa đạt đến chuẩn mực hàn lâm của cung đình nên mang âm hưởng sầu não dân gian.',
          'Chiến lược tâm lý nhằm tìm kiếm sự thương hại và cứu giúp của những bậc quyền quý giàu sang trong những hoàn cảnh hoạn nạn bế tắc.',
          'Sự sao chép vô thức những giai điệu tang lễ bi ai mà nàng từng nghe trong các buổi tế lễ cầu siêu thời thơ ấu bên gia đình.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! "Chữ tài liền với chữ tai một vần". Tiếng đàn của Kiều là sự thăng hoa tột đỉnh của cái đẹp và linh hồn nhạy cảm, nhưng trong xã hội phong kiến tàn bạo, tài hoa và sắc đẹp tột cùng lại trở thành đối tượng bị vùi dập tàn nhẫn nhất.',
        evidence: 'Nguyễn Du viết: "Cung thương lầu bậc ngũ âm / Nghề riêng ăn đứt hồ cầm một trương... Một thiên bạc mệnh lại càng não nhân".',
        didYouKnow: 'Nguyễn Du sáng tác Truyện Kiều dựa trên cốt truyện Kim Vân Kiều Truyện của Thanh Tâm Tài Nhân, nhưng đã biến tác phẩm thành bản cáo trạng nhân văn vĩ đại của dân tộc.',
      },

      // Q2: Crossword Matrix
      {
        id: `kieu-crossword-2`,
        type: 'crossword',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ma Trận Ô Chữ: Giải Mã Chân Lý "Chữ Tâm" Nguyễn Du',
        instruction: 'Giải mã các hàng ngang để thu thập chữ cái, hoặc bấm "Giải Mã Cụm Từ Khóa Tổng" bất cứ lúc nào!',
        masterKeyword: 'CHỮ TÂM',
        masterClue: 'Đúc kết đạo đức và triết lý tối thượng mà đại thi hào Nguyễn Du khẳng định có sức nặng "kia mới bằng ba chữ tài".',
        rows: [
          { id: 'kr1', rowNumber: 1, clue: 'Người tình phong nhã đã cùng Thúy Kiều thề nguyền gắn bó dưới ánh trăng Thanh Minh (8 chữ cái)', answer: 'KIM TRỌNG', keyCharIndex: 0 },
          { id: 'kr2', rowNumber: 2, clue: 'Nơi Thúy Kiều bị giam lỏng, gửi gắm nỗi nhớ thương cha mẹ và người yêu qua cảnh vật (11 chữ cái)', answer: 'LẦU NGƯNG BÍCH', keyCharIndex: 7 },
          { id: 'kr3', rowNumber: 3, clue: 'Người anh hùng đầu đội trời chân đạp đất đã đem lại tự do và giúp Kiều báo ân báo oán (6 chữ cái)', answer: 'TỪ HẢI', keyCharIndex: 1 },
          { id: 'kr4', rowNumber: 4, clue: 'Đức tính cao cả thôi thúc Thúy Kiều chấp nhận bán mình chuộc cha và trao duyên lại cho Thúy Vân (8 chữ cái)', answer: 'LÒNG HIẾU', keyCharIndex: 3 },
          { id: 'kr5', rowNumber: 5, clue: 'Dòng sông oan nghiệt nơi Kiều gieo mình tự vẫn trước khi được sư Giác Duyên cứu vớt (10 chữ cái)', answer: 'TIỀN ĐƯỜNG', keyCharIndex: 0 },
          { id: 'kr6', rowNumber: 6, clue: 'Tên chữ Hán nguyên tác thể hiện tiếng kêu đứt ruột đầy xót thương cho thân phận phụ nữ (17 chữ cái)', answer: 'ĐOẠN TRƯỜNG TÂN THANH', keyCharIndex: 12 },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Lối xưa hoa cỏ và dấu chân mùa xuân Thanh Minh',
        explanation: 'Cụm từ khóa tổng "CHỮ TÂM" là tư tưởng nhân văn sáng chói nhất của Truyện Kiều. Nguyễn Du khẳng định: Tài năng rất đáng quý, nhưng tấm lòng nhân ái, sự thấu cảm nỗi đau con người mới là giá trị trường tồn muôn thuở.',
        evidence: 'Hai câu thơ kết truyện: "Thiện căn ở tại lòng ta / Chữ tâm kia mới bằng ba chữ tài".',
        didYouKnow: 'Truyện Kiều gồm đúng 3.254 câu thơ lục bát, đã được dịch ra hơn 30 thứ tiếng trên thế giới.',
      },

      // Q3: Paradox (Trao duyên)
      {
        id: `kieu-mc-3`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Trong trích đoạn "Trao Duyên", nghịch lý tâm lý giằng xé dữ dội nhất trong tâm hồn Thúy Kiều khi trao lại kỷ vật tình yêu cho Thúy Vân là gì?',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Ánh trăng thề nguyền và kỷ vật ngọc vàng trao gửi',
        clue: 'Nàng trao duyên nhưng tình cảm tha thiết trong tim thì không thể nào trao gửi được...',
        options: [
          'Nàng gửi gắm được nghĩa vụ hôn nhân cho em gái nhưng lại rơi vào nỗi đau tột cùng vì tình yêu sâu đậm trong tim vĩnh viễn không thể trao đi.',
          'Sự tính toán vụ lợi nhằm bảo đảm tài sản thừa kế cho gia đình sau khi bản thân phải dấn thân vào chốn phong trần gió bụi.',
          'Nỗi uất hận thù hằn đối với người tình vì chàng đã vắng mặt đúng vào thời điểm gia đình nàng gặp cơn biến cố gia biến ngặt nghèo.',
          'Sự thỏa mãn nhẹ nhõm vì đã trút bỏ hoàn toàn gánh nặng lời hứa thề nguyền để toàn tâm toàn ý thực hiện đạo hiếu chuộc cha.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! "Trao duyên" là một trong những bi kịch nội tâm xé lòng nhất thi ca nhân loại: Kiều trao được cái "duyên" phận thể lý, nhưng cái "tình" thiêng liêng với Kim Trọng thì vẫn rỉ máu và bám riết theo nàng suốt cuộc đời.',
        evidence: '"Duyên này thì giữ, vật này của chung... Trông ra ngọn cỏ lá cây / Thấy hiu hiu gió thì hay chị về".',
      },

      // Q4: True/False (Chữ Tài & Chữ Mệnh)
      {
        id: `kieu-tf-4`,
        type: 'true_false',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        statement: 'Theo thế giới quan của Nguyễn Du trong Truyện Kiều, số phận con người hoàn toàn bị định mệnh mù quáng chi phối và mọi nỗ lực gìn giữ phẩm giá đều trở nên vô nghĩa.',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Cánh buồm xa trên mặt nước Lầu Ngưng Bích',
        clue: 'Hãy nhớ lại quan niệm về "Thiện căn ở tại lòng ta" và sức mạnh vượt lên nghịch cảnh của Kiều...',
        isTrue: false,
        explanation: 'Sai! Dù chịu ảnh hưởng của thuyết mệnh trời, Nguyễn Du đặt "chữ tâm" cao hơn định mệnh. Phẩm giá trong sạch và lòng nhân ái của Kiều đã chiến thắng mọi bùn nhơ nhục nhằn của xã hội phong kiến tàn bạo.',
        evidence: '"Xưa nay nhân định thắng thiên cũng nhiều" và "Chữ tâm kia mới bằng ba chữ tài".',
      },

      // Q5: Quote Decryption
      {
        id: `kieu-mc-quote-5`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Khi phân tích hai câu thơ kết của Nguyễn Du: "Bất tri tam bách dư niên hậu / Thiên hạ hà nhân khấp Tố Như?", khát vọng hiện sinh sâu thẳm nhất của thi nhân là gì?',
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Tập thơ chữ Hán cổ và tâm tư của thi hào Nguyễn Du',
        clue: 'Nỗi khao khát tìm kiếm một tâm hồn đồng điệu thấu hiểu nỗi đau thân phận con người...',
        options: [
          'Khát vọng tìm kiếm tấm lòng tri âm thấu hiểu nỗi đau đớn nhân sinh vượt qua ranh giới thời gian hàng trăm năm sau của hậu thế.',
          'Mong muốn được lưu danh thiên cổ để con cháu đời sau phải xây dựng các đền miếu nguy nga tưởng nhớ công trạng của bản thân.',
          'Nỗi lo âu về việc các bản thảo thơ ca của mình sẽ bị thất lạc hoặc tiêu hủy do các biến cố chiến tranh tao loạn thời đại.',
          'Sự kiêu ngạo khẳng định rằng tài năng thơ lục bát của mình sẽ không bao giờ có bất kỳ thi sĩ nào có thể vượt qua nổi.',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Tiếng khóc của Nguyễn Du là tiếng khóc cho thân phận con người: Ông mong mỏi hơn ba trăm năm sau, hậu thế vẫn còn biết rung cảm, biết rơi lệ trước nỗi đau của đồng loại.',
        evidence: 'Bài thơ chữ Hán "Độc Tiểu Thanh Ký" của Nguyễn Du.',
      },

      // Q6: Symbolic Matching
      {
        id: `kieu-match-6`,
        type: 'matching',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        title: 'Ghép Nối Biểu Tượng Nghệ Thuật Trong Truyện Kiều',
        instruction: 'Nối từng hình tượng nghệ thuật độc đáo với chiều sâu triết lý và ngụ ngôn mà Nguyễn Du gửi gắm.',
        imageUrl: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Hoa sen nở thanh khiết bên ao nước đình làng',
        pairs: [
          { id: 'kp1', leftText: 'Khúc đàn tỳ bà', rightText: 'Tiếng kêu xé lòng của tài năng và vẻ đẹp bị xã hội vùi dập' },
          { id: 'kp2', leftText: 'Trăng đêm Thanh Minh', rightText: 'Biểu tượng cho tình yêu tự nguyện, trong sáng và lời thề thủy chung' },
          { id: 'kp3', leftText: 'Cửa biển Lầu Ngưng Bích', rightText: 'Nỗi cô đơn bơ vơ và tương lai mờ mịt của thân phận lưu lạc' },
          { id: 'kp4', leftText: 'Thanh gươm Từ Hải', rightText: 'Khát vọng công lý quật khởi, đạp đổ mọi áp bức bất công xã hội' },
        ],
        explanation: 'Hệ thống biểu tượng trong Truyện Kiều đạt đến đỉnh cao mẫu mực của thi pháp văn học cổ điển Việt Nam.',
      },

      // Q7: Fill in the Blank
      {
        id: `kieu-fill-7`,
        type: 'fill_blank',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Điền từ ngữ đắt giá nhất còn thiếu trong câu thơ đúc kết tư tưởng nhân văn cao đẹp của tác phẩm:',
        sentenceWithBlank: 'Thiện căn ở tại lòng ta, Chữ [...] kia mới bằng ba chữ tài.',
        acceptedAnswers: ['tâm', 'tam'],
        placeholder: 'Nhập 1 từ khóa...',
        imageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Dòng sông Tiền Đường sương khói và sự thức tỉnh lương tri',
        explanation: '"Chữ tâm" là ánh sáng cứu rỗi cuộc đời Kiều và cũng là di sản đạo đức lớn nhất mà Nguyễn Du để lại cho hậu thế.',
        evidence: 'Câu thơ 3.252 trong kiệt tác Truyện Kiều.',
      },

      // Q8: Academic Critique
      {
        id: `kieu-mc-academic-8`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Dưới góc độ phê bình văn học hiện đại, vì sao Truyện Kiều được tôn vinh là bản cáo trạng xã hội đanh thép nhất văn học trung đại Việt Nam?',
        imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Tư liệu nghiên cứu thi pháp Truyện Kiều tại Viện Văn học',
        clue: 'Sức mạnh tàn bạo của đồng tiền và sự mục ruỗng của bộ máy quan lại phong kiến...',
        options: [
          'Vạch trần bản chất tàn nhẫn của thế lực đồng tiền và sự tha hóa của quan lại phong kiến đã chà đạp trắng trợn lên phẩm giá con người.',
          'Ca ngợi các chính sách thuế khóa và trật tự luân lý phong kiến như là mô hình xã hội lý tưởng cần được bảo tồn nguyên vẹn.',
          'Tập trung miêu tả các phong tục mê tín dị đoan nhằm truyền bá thuyết định mệnh luân hồi thụ động trong quần chúng lao động nghèo.',
          'Phê phán những người phụ nữ có học thức và tài năng nghệ thuật vì cho rằng họ chính là nguyên nhân gây ra các xáo trộn gia đình.',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! "Trong tay đã sẵn đồng tiền / Dầu lòng đổi trắng thay đen khó gì". Đồng tiền và quan lại ăn đút lót đã biến con người thành món hàng buôn bán. Đó là bản cáo trạng đanh thép nhất thời đại.',
        evidence: 'Nghiên cứu văn học sử của học giả Đặng Thai Mai và Hoài Thanh.',
      },

      // Q9: Dilemma
      {
        id: `kieu-mc-dilemma-9`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Khi đối mặt với việc cha và em trai bị giam cầm tra tấn, hành động bán mình chuộc cha của Kiều đặt ra bài học nhân văn sâu sắc nào về sự hi sinh?',
        imageUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Cơn bão tố gia biến ập xuống mái nhà êm ấm',
        clue: 'Lòng hiếu thảo và sự dũng cảm dám gánh vác trách nhiệm cứu vớt gia đình...',
        options: [
          'Sự hi sinh vị tha cao cả khi dám đánh đổi hạnh phúc và tuổi xuân cá nhân để bảo vệ sinh mạng và phẩm giá của những người thân yêu.',
          'Sự đầu hàng mù quáng trước hoàn cảnh nghịch cảnh do thiếu kỹ năng thương lượng kinh tế với bọn sai nha sai phái phong kiến.',
          'Hành động bồng bột nông nổi của người thiếu nữ mới lớn chưa lường hết được những cay đắng nhục nhằn nơi chốn phong trần lầu xanh.',
          'Lựa chọn mang tính toán chiến lược nhằm tìm kiếm cơ hội du ngoạn khám phá các vùng đất mới xa xôi ngoài kinh thành phồn hoa.',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Hành động bán mình của Kiều là sự thăng hoa tột cùng của chữ Hiếu và lòng vị tha: Nàng chấp nhận gánh chịu mọi đau đớn về mình để cứu cha và em.',
        evidence: '"Hạt mưa nghiêng ngả biết vào tay ai... Để lời thề hải minh sơn / Làm con trước phải đền ơn sinh thành".',
      },

      // Q10: Modern Praxis
      {
        id: `kieu-mc-modern-10`,
        type: 'multiple_choice',
        bookId: book.id,
        bookTitle: book.title,
        category: book.category,
        question: 'Trong xã hội hiện đại coi trọng vật chất và danh vọng hôm nay, thông điệp "Chữ tâm kia mới bằng ba chữ tài" mang giá trị soi chiếu cấp thiết nào?',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        imageCaption: 'Con người thời hiện đại và hành trình thức tỉnh nhân phẩm',
        clue: 'Tài năng không có đạo đức và lòng trắc ẩn có thể trở thành tai họa cho xã hội...',
        options: [
          'Nhắc nhở con người rằng tài năng công nghệ hay tri thức nếu thiếu đi cái tâm nhân ái và đạo đức thì có thể trở thành công cụ hủy diệt.',
          'Khuyên răn giới trẻ nên từ bỏ việc rèn luyện chuyên môn học vấn để chỉ tập trung vào các hoạt động tu thiền tĩnh tâm trong rừng sâu.',
          'Khẳng định rằng bằng cấp học vị và thu nhập tài chính là thước đo duy nhất để đánh giá phẩm giá một con người trong thời đại số.',
          'Kêu gọi xóa bỏ hoàn toàn các trường đào tạo năng khiếu nghệ thuật vì nghệ thuật không mang lại các giá trị thặng dư kinh tế trực tiếp.',
        ],
        correctIndex: 0,
        explanation: 'Rất sâu sắc! Một chuyên gia công nghệ hay nhà khoa học tài ba nếu thiếu "chữ tâm" có thể tạo ra những thuật toán độc hại. Lòng nhân ái và đạo đức luôn là kim chỉ nam tối thượng của văn minh nhân loại.',
        evidence: 'Đúc kết thời đại từ tư tưởng bất hủ của đại thi hào Nguyễn Du.',
      },
    ];

    return deck;
  }

  // 4. GENERIC 10-QUESTION MASTER DECK FOR ANY OTHER BOOK IN THE LIBRARY
  // Curated, diverse imagery matching each question's intellectual motif — NEVER repeatedly reusing coverImage!
  const defaultDeck: UniversalQuiz[] = [
    // Q1: Media Analysis (Archival Museum Artifact / Vintage Edition)
    {
      id: `${book.id}-q1-media`,
      type: 'media_analysis',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
      mediaCaption: `Bản thảo lưu trữ, kính lúp và dấu ấn thời gian gắn liền với tác phẩm "${book.title}" (${book.author})`,
      analysisFocus: `Sắc thái thị giác của trang sách cổ, kính quang học và bút tích ghi chép phản ánh chiều sâu tư tưởng thể loại ${book.category}`,
      alternativeMedia: [
        {
          title: 'Bản thảo & Kính lúp cổ bản',
          url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
          caption: `Bản thảo lưu trữ, kính lúp và dấu ấn thời gian gắn liền với tác phẩm "${book.title}" (${book.author})`,
        },
        {
          title: 'Mê cung thư viện tri thức',
          url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
          caption: 'Hành lang thư viện và mê cung tri thức lưu giữ tinh hoa nhân loại',
        },
        {
          title: 'Bàn viết học thuật & Bút tích',
          url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
          caption: `Bút tích và di sản tư tưởng chiều sâu của tác giả ${book.author}`,
        },
      ],
      question: `Quan sát tư liệu hình ảnh lưu trữ học thuật trên: Dưới lăng kính phản biện của tác giả ${book.author}, biểu tượng lăng kính quang học và trang sách mở ra chân trời tư tưởng khai phóng nào cho người đọc?`,
      options: [
        'Sự đối thoại đa chiều giữa hiện thực khách quan và thế giới nội tâm sâu lắng nhằm kích thích độc giả tự phản tư phẩm giá.',
        'Sự tái hiện máy móc các quy ước thẩm mỹ truyền thống nhằm phục vụ mục đích quảng bá thương mại tức thời cho nhà xuất bản.',
        'Ý định áp đặt một hệ quy chiếu đạo đức bảo thủ bắt buộc người đọc phải tuân phục tuyệt đối theo giáo điều có sẵn.',
        'Nỗ lực làm mờ ranh giới giữa tri thức chân chính và các quan niệm suy diễn tùy tiện để tạo sự tò mò nhất thời.',
      ],
      correctIndex: 0,
      explanation: `Tác phẩm "${book.title}" của ${book.author} là một cánh cửa mở ra thế giới tư tưởng: Nó không chỉ ghi chép sự kiện bề mặt mà cung cấp lăng kính giúp độc giả nhìn thấu bản chất của vấn đề.`,
      evidence: `Tư tưởng chủ đạo tác phẩm: "${book.message || 'Mỗi cuốn sách là một thế giới thu nhỏ.'}"`,
      didYouKnow: `Tác phẩm hiện được xếp tại khu vực ${book.shelfLocation || 'Kệ sách nghiên cứu & đọc sâu'}.`,
    },

    // Q2: Crossword Matrix
    {
      id: `${book.id}-q2-crossword`,
      type: 'crossword',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      title: `Ma Trận Ô Chữ: Mở Khóa Tư Tưởng Cốt Lõi "${book.title}"`,
      instruction: 'Giải mã các hàng ngang để tích lũy chữ cái, hoặc bấm "Giải Mã Cụm Từ Khóa Tổng" bất cứ khi nào bạn nhận ra!',
      masterKeyword: (book.themes[0] || 'TRI THỨC').toUpperCase(),
      masterClue: `Giá trị cốt lõi làm nên sức sống trường tồn của tác phẩm "${book.title}" (Tác giả: ${book.author}).`,
      rows: [
        { id: 'gr1', rowNumber: 1, clue: `Thể loại chính mà cuốn sách "${book.title}" đại diện trong thư viện`, answer: book.category.toUpperCase().replace(/[^A-ZÀ-Ỹ0-9]/gi, '').slice(0, 8) || 'VĂN HỌC', keyCharIndex: 0 },
        { id: 'gr2', rowNumber: 2, clue: `Tên người sáng tạo nên thế giới nghệ thuật và tư tưởng tác phẩm (${book.author})`, answer: book.author.toUpperCase().replace(/[^A-ZÀ-Ỹ0-9]/gi, '').slice(0, 8) || 'TÁC GIẢ', keyCharIndex: 1 },
        { id: 'gr3', rowNumber: 3, clue: `Đích đến cao nhất mà người đọc hướng tới khi tiếp nhận tác phẩm này`, answer: 'THỨC TỈNH', keyCharIndex: 2 },
        { id: 'gr4', rowNumber: 4, clue: `Năng lực mà cuốn sách bồi đắp mạnh mẽ nhất cho người đọc hiện đại`, answer: 'PHẢN BIỆN', keyCharIndex: 1 },
        { id: 'gr5', rowNumber: 5, clue: `Phẩm chất cốt lõi giúp con người chuyển hóa tri thức thành hành động`, answer: 'BẢN LĨNH', keyCharIndex: 0 },
      ],
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Hành lang thư viện và mê cung tri thức của nhân loại`,
      explanation: `Cụm từ khóa tổng đại diện cho thông điệp xuyên suốt: "${book.message}". Đây là sợi chỉ đỏ kết nối các bài học của cuốn sách.`,
      evidence: `Đúc kết cốt lõi: "${book.keyTakeaways[0] || book.message}"`,
      didYouKnow: authorQuote ? `Tác giả từng nhắn nhủ: "${authorQuote}"` : 'Đọc sâu một cuốn sách là đặt mình vào những chân trời suy tư mới mẻ.',
    },

    // Q3: Multiple Choice Paradox
    {
      id: `${book.id}-q3-paradox`,
      type: 'multiple_choice',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: `Nghịch lý hiện sinh và thách thức tư duy sâu sắc nhất mà tác giả ${book.author} đặt ra trong "${book.title}" là gì?`,
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Con đường mở ra chân trời suy tư đa chiều`,
      clue: 'Đối chiếu giữa sự giằng xé nội tâm và các định kiến xã hội được tác phẩm mổ xẻ...',
      options: [
        'Sự thỏa hiệp an toàn với các quy chuẩn định sẵn của số đông nhằm duy trì trạng thái ổn định và tránh va chạm xã hội.',
        'Sự thức tỉnh nội tâm và lòng quả cảm vượt lên các định kiến thời đại để gìn giữ nhân cách cao đẹp và lẽ sống chân chính.',
        'Khát vọng khẳng định quyền lực cá nhân bằng cách khước từ mọi nghĩa vụ luân lý và trách nhiệm tình cảm đối với cộng đồng xung quanh.',
        'Quan niệm định mệnh buông xuôi rằng toàn bộ số phận con người hoàn toàn do các biến cố lịch sử khách quan tiền định chi phối.',
      ],
      correctIndex: 1,
      explanation: `Tác phẩm "${book.title}" phân tích sâu sắc rằng: "${book.message}". Vẻ đẹp nhân văn chỉ thực sự tỏa sáng khi con người dám đối diện với nghịch cảnh và chịu trách nhiệm với tự do của chính mình.`,
      evidence: `Tư tưởng chủ đạo trong "${book.title}": "${book.message}"`,
      didYouKnow: authorQuote ? `Tác giả gửi gắm: "${authorQuote}"` : 'Sách mở ra góc nhìn đa chiều về cuộc sống.',
    },

    // Q4: True/False Dialectic
    {
      id: `${book.id}-q4-tf`,
      type: 'true_false',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      statement: `Trong "${book.title}", tác giả ${book.author} khẳng định rằng sự trưởng thành đích thực đòi hỏi con người phải vượt qua nỗi sợ sai lầm và dám chấp nhận thử thách để thấu cảm vạn vật.`,
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Không gian đọc sách tĩnh lặng để soi chiếu nội tâm',
      clue: 'Đối chiếu với hành trình chuyển biến nhận thức và các thử thách trong cuốn sách...',
      isTrue: true,
      explanation: `Chính xác! Tác giả ${book.author} khẳng định rằng sự thông thái không đến từ sự bất khả xâm phạm hay khép kín bản thân, mà đến từ trải nghiệm dấn thân, đối diện với tổn thương để thấu hiểu sâu sắc bản chất cuộc đời.`,
      evidence: `Thông điệp đúc kết: "${book.message}"`,
    },

    // Q5: Quote Decryption
    {
      id: `${book.id}-q5-quote`,
      type: 'multiple_choice',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: authorQuote
        ? `Khi phân tích câu nói để đời của tác giả ${book.author}: "${authorQuote}", tầng nghĩa triết học sâu sắc nào phản ánh tư tưởng tác phẩm?`
        : `Khi phân tích thông điệp then chốt của "${book.title}": "${book.message}", tầng nghĩa nhân văn nào có sức lay động nhất?`,
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `Ngòi bút và bản thảo gắn liền với dòng chảy tư tưởng của tác giả`,
      clue: 'Quan sát sự đối lập giữa bề mặt câu chữ và chiều sâu nhận thức nhân sinh...',
      options: [
        'Khẳng định năng lực tự chủ và lòng trắc ẩn của con người là đòn bẩy duy nhất để vượt qua khủng hoảng tinh thần thời đại.',
        'Kêu gọi con người từ bỏ mọi nỗ lực phấn đấu cá nhân để phó mặc toàn bộ cuộc đời cho sự may rủi ngẫu nhiên của hoàn cảnh.',
        'Tập trung tối đa vào việc tích lũy của cải vật chất và địa vị xã hội như là thước đo duy nhất để đo lường thành công.',
        'Xây dựng các rào cản phòng vệ tâm lý khép kín nhằm bảo vệ bản ngã tránh khỏi những tác động tiêu cực từ cộng đồng xung quanh.',
      ],
      correctIndex: 0,
      explanation: `Rất sâu sắc! Phát ngôn này đúc kết tinh hoa tư tưởng của ${book.author}: Chân lý cuộc sống đòi hỏi con người phải thấu hiểu chính mình và dũng cảm theo đuổi những giá trị bền vững.`,
      evidence: authorQuote || book.message,
    },

    // Q6: Matching Concepts
    {
      id: `${book.id}-q6-match`,
      type: 'matching',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      title: `Ghép Nối Cấu Trúc Tư Tưởng Tác Phẩm "${book.title}"`,
      instruction: 'Nối từng khía cạnh nội dung với ý nghĩa phản biện và bài học nhân sinh tương ứng.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Cây tri thức và mạng lưới tư tưởng kết nối',
      pairs: [
        { id: 'mp1', leftText: 'Thông điệp cốt lõi', rightText: `"${book.message.slice(0, 60)}..."` },
        { id: 'mp2', leftText: 'Bài học then chốt 1', rightText: `"${(book.keyTakeaways[0] || 'Rèn luyện tư duy độc lập').slice(0, 60)}..."` },
        { id: 'mp3', leftText: 'Bài học then chốt 2', rightText: `"${(book.keyTakeaways[1] || 'Nuôi dưỡng lòng trắc ẩn').slice(0, 60)}..."` },
        { id: 'mp4', leftText: 'Chủ đề tư tưởng', rightText: `#${book.themes.slice(0, 2).join(' • #')}` },
      ],
      explanation: 'Sự liên kết chặt chẽ giữa các luận điểm và bài học tạo nên cấu trúc tri thức vững chắc cho cuốn sách.',
    },

    // Q7: Fill in the Blank
    {
      id: `${book.id}-q7-fill`,
      type: 'fill_blank',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: `Điền từ khóa chỉ phẩm chất then chốt được tôi luyện qua tác phẩm "${book.title}":`,
      sentenceWithBlank: `Giá trị lớn nhất của cuốn sách là giúp người đọc bồi đắp [...] và năng lực tư duy độc lập trước các biến động cuộc sống.`,
      acceptedAnswers: ['bản lĩnh', 'ban linh', 'trí tuệ', 'tri tue', 'lương tri', 'luong tri'],
      placeholder: 'Nhập từ khóa phẩm chất...',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Cuốn sách mở ra ánh sáng trí tuệ',
      explanation: 'Cuốn sách không chỉ cung cấp thông tin mà rèn luyện bản lĩnh tinh thần giúp người đọc vững vàng vượt qua thử thách.',
      evidence: book.keyTakeaways[0] || book.message,
    },

    // Q8: Academic Critique
    {
      id: `${book.id}-q8-academic`,
      type: 'multiple_choice',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: `Dưới lăng kính phê bình hiện đại, sức sống bền bỉ làm nên vị thế của "${book.title}" trong dòng sách ${book.category} bắt nguồn từ yếu tố nào?`,
      imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Phòng đọc học thuật của các viện nghiên cứu kinh điển',
      clue: 'Khả năng kích thích người đọc tự chất vấn và tái định hình thế giới quan...',
      options: [
        'Năng lực bóc tách những mâu thuẫn nhận thức sâu kín và mở ra không gian cho các cuộc đối thoại tư tưởng đa chiều.',
        'Việc tập trung vào những tình tiết giật gân bề mặt nhằm thỏa mãn trí tò mò nhất thời và thị hiếu dễ dãi của số đông.',
        'Sự áp đặt một bộ giáo điều luân lý cứng nhắc bắt buộc người đọc phải chấp nhận một cách thụ động không có phản biện.',
        'Sự sao chép rập khuôn các công thức kể chuyện kinh điển mà không đưa ra bất kỳ phát hiện hay suy luận mới mẻ nào.',
      ],
      correctIndex: 0,
      explanation: 'Một tác phẩm có sức sống lâu bền luôn thách thức lối mòn tư duy và kích thích độc giả không ngừng suy ngẫm, phản tư.',
      evidence: `Thể loại sách: ${book.category} tại Thư viện Thông Minh.`,
    },

    // Q9: Hypothetical Dilemma
    {
      id: `${book.id}-q9-dilemma`,
      type: 'multiple_choice',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: firstChar
        ? `Khi đặt nhân vật ${firstChar.name} vào tình huống phải lựa chọn giữa an toàn cá nhân và trách nhiệm đạo đức, bài học nào được tác giả gửi gắm?`
        : `Nếu đặt độc giả vào tình thế đối mặt với sự bất công xã hội, bài học then chốt nào trong "${book.title}" chỉ dẫn hành động đúng đắn?`,
      imageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Con đường dẫn lối giữa những lựa chọn nhân sinh',
      clue: 'Hành động đúng đắn xuất phát từ lòng kiên định với các nguyên tắc nhân văn...',
      options: [
        'Giữ vững lòng chính trực và can đảm hành động vì lẽ phải, dẫu phải chấp nhận những thiệt thòi trước mắt về quyền lợi.',
        'Chọn cách im lặng thỏa hiệp để bảo vệ sự an toàn cá nhân và tối đa hóa các cơ hội thăng tiến địa vị trong xã hội.',
        'Chuyển giao toàn bộ trách nhiệm giải quyết vấn đề cho các tổ chức cộng đồng mà không cần cá nhân phải can thiệp.',
        'Áp dụng các biện pháp cực đoan mang tính bạo lực để giải quyết mâu thuẫn mà không cần cân nhắc đến hậu quả nhân văn.',
      ],
      correctIndex: 0,
      explanation: 'Tác phẩm khẳng định: Phẩm giá con người được đo lường chính vào những thời điểm phải đưa ra quyết định đạo đức khó khăn nhất.',
      evidence: book.message,
    },

    // Q10: Cognitive Transformation
    {
      id: `${book.id}-q10-modern`,
      type: 'multiple_choice',
      bookId: book.id,
      bookTitle: book.title,
      category: book.category,
      question: `Trong thời đại bùng nổ thông tin và sự chi phối của trí tuệ nhân tạo ngày nay, giá trị soi chiếu quan trọng nhất từ "${book.title}" là gì?`,
      imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'Tầm nhìn thời đại số kết nối tri thức và tương lai',
      clue: 'Biến việc đọc sách thành năng lực tư duy độc lập và thấu cảm sâu sắc...',
      options: [
        'Rèn luyện năng lực tư duy phản biện độc lập và bảo vệ lòng trắc ẩn để không bị tha hóa thành những cỗ máy vô cảm.',
        'Thay thế hoàn toàn việc đọc sách sâu bằng các tóm tắt nhanh của công nghệ nhằm tiết kiệm tối đa thời gian biểu cá nhân.',
        'Thụ động tiếp nhận các luồng thông tin tràn lan trên mạng xã hội mà không cần đối chiếu hay kiểm chứng nguồn tư liệu.',
        'Hạn chế tiếp xúc với các ý kiến trái chiều nhằm duy trì sự tự tin tuyệt đối vào các quan điểm nhận thức cá nhân có sẵn.',
      ],
      correctIndex: 0,
      explanation: 'Xuất sắc! Đọc sách không phải để tích lũy dữ liệu thụ động, mà để tôi luyện lăng kính tư duy độc lập, giữ cho trái tim luôn biết rung cảm và trí óc luôn biết phản tư.',
      evidence: `Đúc kết thời đại từ cuốn sách "${book.title}" (${book.author}).`,
    },
  ];

  return defaultDeck;
}
