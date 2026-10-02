import { Book, BookCuriosityQuestion } from '../types.js';

export const BOOK_CURIOSITIES: Record<string, BookCuriosityQuestion[]> = {
  'de-men-phieu-luu-ky': [
    {
      id: 'dm-1',
      title: 'Chuyển biến tư tưởng nghĩa hiệp',
      tag: 'Tư duy phản biện',
      question: 'Khi Dế Mèn xả thân giải cứu Dế Trũi khỏi bầy Bọ Ngựa, bước ngoặt nhận thức sâu sắc nào đã đánh dấu sự đoạn tuyệt với lối sống tự mãn ban đầu?',
      mysteryClue: 'Sức mạnh thể chất chỉ thực sự có ý nghĩa khi gắn liền với trách nhiệm bảo vệ sinh mạng kẻ khác...',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Dế Mèn và hành trình tình bạn nghĩa hiệp',
      options: [
        'Nhận thức thực dụng rằng liên minh sức mạnh với các loài khác là điều kiện sống còn để chế ngự hiểm nguy sinh tồn tại đầm nước.',
        'Sự thức tỉnh rằng sức mạnh thể chất chỉ có giá trị khi phụng sự lẽ phải, bảo vệ kẻ yếu thế và kiến tạo tình bạn thủy chung.',
        'Nhu cầu khẳng định uy quyền cá nhân và tìm kiếm sự tán dương của cộng đồng nhằm khỏa lấp những mặc cảm tội lỗi trong quá khứ.',
        'Sự điều hướng ngẫu nhiên của bản năng sinh tồn khi bị hoàn cảnh khắc nghiệt dồn ép vào thế đối đầu sinh tử không thể né tránh.',
      ],
      correctOptionIndex: 1,
      answerExplanation: 'Hành động cứu Dế Trũi không đơn thuần là một cuộc ẩu đả, mà là bước ngoặt tâm lý vĩ đại: Dế Mèn đã chuyển hóa bản ngã kiêu ngạo thành lòng dũng cảm trượng nghĩa. Sức mạnh không còn dùng để ức hiếp kẻ khác mà để che chở cho bạn bè và bảo vệ công lý.',
      funFactOrQuote: 'Tô Hoài viết tác phẩm này khi mới 21 tuổi, lấy cảm hứng từ thiên nhiên và những trăn trở nhân sinh quanh làng Nghĩa Đô.',
    },
    {
      id: 'dm-2',
      title: 'Nghịch lý tự do & Trách nhiệm',
      tag: 'Triết lý nhân sinh',
      question: 'Dưới góc nhìn triết học nhân sinh, bi kịch cái chết của Dế Choắt đặt ra bài học phản biện sâu sắc nhất về giới hạn của sự tự do cá nhân như thế nào?',
      mysteryClue: 'Sự tự do vô trách nhiệm biến thành bạo lực vô hình đè nặng lên số phận người yếu thế...',
      imageUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Cú sốc thức tỉnh lương tri của Dế Mèn',
      options: [
        'Mọi hành vi tự do thiếu vắng trách nhiệm đạo đức đều biến thành bạo lực hủy hoại kẻ yếu; tự do đích thực phải gắn liền với sự thấu cảm.',
        'Quy luật cạnh tranh sinh tồn tự nhiên khắc nghiệt luôn tất yếu đào thải những cá thể yếu ớt, thụ động và thiếu năng lực phản kháng tự vệ.',
        'Sự ngộ nhận giữa lòng dũng cảm trượng nghĩa với thói ngạo mạn vị kỷ là mầm mống gieo rắc bi kịch không thể vãn hồi cho cộng đồng xung quanh.',
        'Những rủi ro sinh tồn trong thế giới tự nhiên chỉ mang tính ngẫu nhiên, không phản ánh sự suy thoái lương tri hay nhân cách của kẻ gây hại.',
      ],
      correctOptionIndex: 0,
      answerExplanation: 'Cái chết của Dế Choắt là bài học đường đời đầu tiên đầy máu và nước mắt. Tô Hoài chỉ ra nghịch lý: Sự tự do thiếu vắng trách nhiệm đạo đức sẽ trở thành thứ bạo lực tàn nhẫn đối với kẻ yếu thế. Lương tri chỉ thực sự hình thành khi con người biết đau trước nỗi đau do chính mình gây ra.',
      funFactOrQuote: 'Lời trăn trối của Dế Choắt trở thành kim chỉ nam giúp Mèn thức tỉnh và tu dưỡng nhân cách suốt cuộc đời.',
    },
  ],
  'hoang-tu-be': [
    {
      id: 'htb-1',
      title: 'Bí mật của Trái tim',
      tag: 'Triết lý nhận thức',
      question: 'Khi Con Cáo khẳng định "Điều cốt yếu thì vô hình đối với mắt trần", nhận định này lật tẩy căn bệnh nhận thức mang tính thời đại nào của xã hội người lớn?',
      mysteryClue: 'Sự tha hóa khi con người chỉ tin vào những thứ định lượng được bằng con số và thước đo vật chất...',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Hoàng Tử Bé và bài học thuần hóa',
      options: [
        'Xu hướng quy giản mọi giá trị cuộc sống vào những con số thực dụng, đánh mất năng lực rung cảm trước vẻ đẹp tinh thần và sự gắn kết vô hình.',
        'Sự thiếu hụt tư duy logic duy lý và phương pháp thực nghiệm khoa học khiến con người dễ rơi vào những ảo tưởng cảm xúc mơ hồ viển vông.',
        'Khủng hoảng niềm tin trong xã hội công nghiệp khiến cá nhân luôn có xu hướng hoài nghi mọi mối quan hệ tình cảm sâu sắc và bền vững.',
        'Sự bất lực của ngôn ngữ quy ước trong việc diễn đạt trọn vẹn những trải nghiệm bản thể phức tạp và thế giới nội tâm của mỗi con người.',
      ],
      correctOptionIndex: 0,
      answerExplanation: 'Saint-Exupéry châm biếm sâu sắc xã hội hiện đại: Người lớn chỉ hỏi một ngôi nhà giá bao nhiêu tiền, một người bạn kiếm được bao nhiêu thu nhập, mà quên mất màu sắc hoa trên ban công hay tiếng cười của tâm hồn. Điều cốt lõi (tình yêu, sự gắn kết, lòng trắc ẩn) luôn vô hình trước lăng kính thực dụng.',
      funFactOrQuote: 'Hoàng Tử Bé là một trong những kiệt tác văn học được dịch ra nhiều thứ tiếng nhất lịch sử nhân loại (hơn 500 ngôn ngữ).',
    },
    {
      id: 'htb-2',
      title: 'Bản chất sự gắn kết & Tình yêu',
      tag: 'Tư duy biểu tượng',
      question: 'Tại sao giữa vườn địa đàng 5.000 đóa hồng rực rỡ ở Trái Đất, đóa hoa trên tiểu hành tinh B612 vẫn là duy nhất đối với Hoàng Tử Bé? Quy luật tâm lý nào được giải mã ở đây?',
      mysteryClue: 'Giá trị của đối tượng không nằm ở bản thân nó, mà nằm ở thời gian và trách nhiệm ta trao cho nó...',
      imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Bông hồng kiêu sa trên tiểu tinh cầu B612',
      options: [
        'Chính thời gian dấn thân, sự tận tụy chăm sóc và trách nhiệm tình cảm đã kiến tạo nên giá trị độc bản vượt lên trên hình thức vật lý đơn thuần.',
        'Đặc tính cấu trúc sinh học độc nhất của loài hoa vũ trụ với bốn chiếc gai tự vệ tạo nên sự vượt trội so với các loài hoa thông thường.',
        'Tâm lý chiếm hữu độc quyền sinh ra từ nỗi cô đơn kéo dài thúc đẩy cá nhân phóng chiếu những ảo tưởng lý tưởng hóa lên đối tượng thân thuộc.',
        'Sự quyến luyến hoài niệm đối với quê hương quen thuộc khiến con người khó lòng dung nạp và đón nhận những vẻ đẹp mới mẻ của thế giới ngoại vi.',
      ],
      correctOptionIndex: 0,
      answerExplanation: '"Chính thời gian bạn bỏ ra cho bông hồng của bạn làm cho bông hồng của bạn trở nên quan trọng đến thế." Giá trị đích thực không đến từ sự độc quyền hay hình thức lộng lẫy, mà được kiến tạo từ sự hy sinh, gắn kết và trách nhiệm trọn đời giữa hai tâm hồn.',
      funFactOrQuote: 'Tác giả Saint-Exupéry lấy hình mẫu Bông Hồng kiêu kỳ nhưng dễ tổn thương từ người vợ Consuelo của ông.',
    },
  ],
  'sapiens-luoc-su-loai-nguoi': [
    {
      id: 'sap-1',
      title: 'Ảo tưởng trật tự xã hội',
      tag: 'Tư duy phản biện',
      question: 'Theo Yuval Noah Harari, tại sao "trật tự tưởng tượng" lại đóng vai trò quyết định đối với sự tồn vong và thống trị của loài Homo Sapiens?',
      mysteryClue: 'Những thứ không tồn tại trong thế giới sinh học lại liên kết hàng triệu con người...',
      imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Tiến hóa nhận thức của nhân loại',
      options: [
        'Sự vượt trội về cấu trúc cơ bắp và năng lực chịu đựng khí hậu khắc nghiệt cho phép loài người áp đảo các sinh vật khác.',
        'Khả năng cùng chia sẻ các niềm tin vô hình như tiền tệ, luật pháp và tôn giáo giúp hàng triệu cá thể xa lạ hợp tác bền vững.',
        'Bản năng lãnh thổ bầy đàn khép kín được di truyền qua gen giúp duy trì trật tự xã hội một cách tự động và ổn định.',
        'Sự phát triển của chữ viết và ghi chép số liệu thuần túy phục vụ việc kiểm soát thu thuế mà không liên quan đến tâm lý.',
      ],
      correctOptionIndex: 1,
      answerExplanation: 'Harari phân tích rằng sức mạnh độc nhất vô nhị của loài người nằm ở năng lực kiến tạo và cùng tin vào những "trật tự tưởng tượng" (imagined order). Khác với loài ong hay kiến chỉ hợp tác theo gen sinh học với số lượng nhỏ, con người có thể hợp tác linh hoạt quy mô hàng triệu người nhờ những câu chuyện huyền thoại chung.',
      funFactOrQuote: 'Sapiens đã được dịch ra hơn 65 ngôn ngữ và bán được hơn 25 triệu bản trên toàn cầu.',
    },
  ],
  'dac-nhan-tam': [
    {
      id: 'dnt-1',
      title: 'Nghịch lý thuyết phục & Bản ngã',
      tag: 'Tâm lý học hành vi',
      question: 'Theo Dale Carnegie, nguyên lý cốt lõi nào trong ứng xử giúp xoay chuyển tư duy của người khác mà không gây ra phản kháng hay thù hằn?',
      mysteryClue: 'Muốn người khác lắng nghe, hãy bắt đầu từ sự khao khát được công nhận của chính họ...',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      imageCaption: 'Nghệ thuật thấu hiểu tâm lý con người',
      options: [
        'Sử dụng các lập luận logic sắc bén và chứng cứ không thể chối cãi để bẻ gãy hoàn toàn quan điểm sai lầm của đối phương.',
        'Chạm vào khao khát khẳng định bản thân của đối phương bằng sự thấu cảm chân thành thay vì cố gắng giành phần thắng trong tranh luận.',
        'Tạo ra áp lực tâm lý từ sự đồng thuận của số đông xung quanh nhằm buộc đối phương phải nhượng bộ theo quy chuẩn tập thể.',
        'Duy trì thái độ im lặng phòng thủ và nhượng bộ mọi yêu cầu để bảo đảm mối quan hệ không rơi vào trạng thái xung đột.',
      ],
      correctOptionIndex: 1,
      answerExplanation: 'Dale Carnegie chỉ ra nghịch lý: Bạn không thể chiến thắng một cuộc tranh luận, vì nếu thua bạn đã thua, còn nếu thắng bạn làm tổn thương lòng tự trọng của đối phương và họ vẫn chống đối ngầm. Sức mạnh thuyết phục đích thực bắt nguồn từ sự thấu cảm, tôn trọng bản ngã và khơi gợi thiện chí từ bên trong họ.',
      funFactOrQuote: 'Đắc Nhân Tâm xuất bản lần đầu năm 1936 và liên tục nằm trong danh mục sách gối đầu giường về giao tiếp suốt gần một thế kỷ.',
    },
  ],
};

export function getCuriositiesForBook(book: Book): BookCuriosityQuestion[] {
  if (book.curiosities && book.curiosities.length > 0) {
    return book.curiosities;
  }

  if (BOOK_CURIOSITIES[book.id]) {
    return BOOK_CURIOSITIES[book.id];
  }

  // Generate rigorous, strictly balanced analytical questions for any book in the library
  return [
    {
      id: `default-${book.id}-1`,
      title: `Nghịch lý tư tưởng trong "${book.title}"`,
      tag: 'Tư duy phản biện',
      question: `Nghịch lý hiện sinh và thách thức tư duy sâu sắc nhất mà tác giả ${book.author} đặt ra trong "${book.title}" là gì?`,
      mysteryClue: 'Đối chiếu giữa sự giằng xé nội tâm và các định kiến xã hội được tác phẩm mổ xẻ...',
      imageUrl: book.coverImage,
      imageCaption: `Tác phẩm: ${book.title}`,
      options: [
        'Sự thỏa hiệp an toàn với các quy chuẩn định sẵn của số đông nhằm duy trì trạng thái ổn định và tránh va chạm xã hội.',
        'Sự thức tỉnh nội tâm và lòng quả cảm vượt lên các định kiến thời đại để gìn giữ nhân cách cao đẹp và lẽ sống chân chính.',
        'Khát vọng khẳng định quyền lực cá nhân bằng cách khước từ mọi nghĩa vụ luân lý và trách nhiệm tình cảm đối với cộng đồng xung quanh.',
        'Quan niệm định mệnh buông xuôi rằng toàn bộ số phận con người hoàn toàn do các biến cố lịch sử khách quan tiền định chi phối.',
      ],
      correctOptionIndex: 1,
      answerExplanation: `Tác phẩm "${book.title}" thách thức lối mòn tư duy: "${book.message}". Vẻ đẹp tư tưởng tỏa sáng ở chỗ con người không chấp nhận buông xuôi trước hoàn cảnh mà dám chịu trách nhiệm với tự do của chính mình.`,
      funFactOrQuote: `Cuốn sách thuộc thể loại ${book.category} tại Thư viện, liên tục gợi mở những góc nhìn thảo luận sâu sắc.`,
    },
    {
      id: `default-${book.id}-2`,
      title: `Bóc tách chiều sâu tác phẩm`,
      tag: 'Suy luận mới',
      question: `Dưới lăng kính phản biện hiện đại, giá trị bền vững làm nên sức sống của "${book.title}" nằm ở năng lực nào?`,
      mysteryClue: 'Không trao cho người đọc câu trả lời có sẵn, mà trao cho họ lăng kính để tự chất vấn...',
      imageUrl: book.coverImage,
      imageCaption: `Tác giả: ${book.author}`,
      options: [
        'Khả năng bóc tách mâu thuẫn nhân sinh và kích thích người đọc tự phản tư, phá vỡ các khuôn mẫu nhận thức sáo rỗng.',
        'Việc tập trung vào các tình tiết ly kỳ giật gân bề mặt nhằm thỏa mãn trí tò mò tức thời và nhu cầu giải trí nhất thời.',
        'Xây dựng các giáo điều luân lý cứng nhắc áp đặt người đọc phải phục tùng một cách thụ động không có quyền phản biện.',
        'Ghi chép thuần túy các sự kiện mô tả khách quan mà không gợi mở bất kỳ góc nhìn triết học hay suy luận nhân sinh nào.',
      ],
      correctOptionIndex: 0,
      answerExplanation: 'Một tác phẩm lớn không giáo điều mà mở ra không gian cho những đối thoại tư tưởng. Nó trao cho người đọc chiếc chìa khóa để tự khai phóng tư duy và soi chiếu lại chính mình.',
      funFactOrQuote: `Tác phẩm của ${book.author} luôn là nguồn cảm hứng mạnh mẽ cho tinh thần đọc sâu và độc lập tư duy.`,
    },
  ];
}
