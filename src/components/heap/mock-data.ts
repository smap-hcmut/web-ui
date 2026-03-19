import { HeapNode } from './types';

export const heapData: HeapNode[] = [
  {
    id: 'camp-1',
    type: 'campaign',
    name: 'Thời sự Quốc tế 2026',
    description: 'Chiến dịch theo dõi tin tức thời sự quốc tế nóng nhất',
    metrics: { mentions: 58200, engagement: 7300000, sentiment: 68, childCount: 2 },
    children: [
      {
        id: 'proj-1',
        type: 'project',
        name: 'Iran Chiến tranh',
        description: 'Theo dõi phản hồi về chiến sự Iran trên mạng xã hội',
        metrics: { mentions: 42100, engagement: 5800000, sentiment: 65, childCount: 3 },
        children: [
          {
            id: 'kw-1',
            type: 'keyword',
            name: '#chientranh',
            metrics: { mentions: 18500, engagement: 3200000, sentiment: 62, childCount: 245 },
            children: [
              {
                id: 'post-1',
                type: 'post',
                platform: 'tiktok',
                author: 'baohatinh',
                name: 'Tên lửa Iran vượt phòng không Israel',
                content: 'Giây phút tên lửa Iran vượt qua lưới phòng không Israel #tinnong #chientranh #iran #israel',
                metrics: { mentions: 3652, engagement: 145300, sentiment: 58 },
                children: [
                  { id: 'cmt-1', type: 'comment', author: 'user627676255', name: 'Hồng Ngọc', content: 'Lý do gì mà 2 nước chiến tranh vậy mn. ko biết nên hỏi ạ', metrics: { engagement: 130, sentiment: 50 } },
                  { id: 'cmt-2', type: 'comment', author: 'nana1.tiktok.com1', name: 'Tina - repair paint', content: 'Nước Mỹ mượn lý do giải phóng dân Iran, Mỹ nói giải cứu dân Iran khỏi chế độ độc tài 47 năm.', metrics: { engagement: 239, sentiment: 35 } },
                  { id: 'cmt-3', type: 'comment', author: 'huong.happy95', name: 'Huong Tomi', content: 'Đấy là cách nhìn cảm tính của người Việt Nam nhé. Chiến tranh này chỉ là một cái cớ rất nhỏ để Mỹ Tạo khủng hoảng thế giới.', metrics: { engagement: 15, sentiment: 40 } },
                  { id: 'cmt-4', type: 'comment', author: 'tuanminh9374', name: '1989🍀', content: 'Nó cũng nói vậy khi muốn chiến VN', metrics: { engagement: 5, sentiment: 30 } },
                ],
              },
              {
                id: 'post-2',
                type: 'post',
                platform: 'tiktok',
                author: 'vutrunews.official',
                name: 'Iran đi vào lịch sử',
                content: 'Iran chính thức đi vào lịch sử, khi một mình vã 15 nước trong 1 ngày tuyên bố không đàm phán với Mỹ #iran #israel #war',
                metrics: { mentions: 637, engagement: 89900, sentiment: 60 },
                children: [
                  { id: 'cmt-5', type: 'comment', author: 'dyfdjy9jqyhm', name: 'Yêu Nước online ❤ 🇻🇳', content: 'Mỹ chỉ ăn hiếp nước nhỏ thôi', metrics: { engagement: 15, sentiment: 28 } },
                  { id: 'cmt-6', type: 'comment', author: 'binhiuai13', name: 'Bynhh🍦', content: 'Nhi hát 50k nhạc thôi là tụi nớ hết chiến tranh vì quá hay', metrics: { engagement: 0, sentiment: 70 } },
                ],
              },
              {
                id: 'post-3',
                type: 'post',
                platform: 'tiktok',
                author: 'tintucchinhtriquansu',
                name: 'Cuộc chiến Mỹ với Iran',
                content: 'CUỘC CHIẾN MỸ VỚI IRAN ĐÃ BẮT ĐẦU #thoisu #thoisu24h #tintuc24h #tinnong',
                metrics: { mentions: 29, engagement: 2396, sentiment: 55 },
                children: [],
              },
              {
                id: 'post-4',
                type: 'post',
                platform: 'tiktok',
                author: 'plxh.vn',
                name: 'Tên lửa Iran qua mặt đánh chặn',
                content: 'Khoảnh khắc tên lửa Iran qua mặt hơn 10 tên lửa đánh chặn #tintuc #tinnong #tinthegioi #chientranh',
                metrics: { mentions: 420, engagement: 35200, sentiment: 52 },
                children: [],
              },
            ],
          },
          {
            id: 'kw-2',
            type: 'keyword',
            name: 'chien su o iran',
            metrics: { mentions: 12800, engagement: 1450000, sentiment: 64, childCount: 156 },
            children: [
              {
                id: 'post-5',
                type: 'post',
                platform: 'tiktok',
                author: 'toancanh60s',
                name: 'Cập nhật chiến sự Trung Đông',
                content: 'Cập nhật tình hình chiến sự tại Trung Đông. Thời sự sáng 05.00 ngày 05/3/2026 #chientranh #iran',
                metrics: { mentions: 15, engagement: 329, sentiment: 60 },
                children: [
                  { id: 'cmt-7', type: 'comment', author: 'user2261530225337', name: 'Yugioh Việt Nam Thanh', content: 'Thế giới sẽ hòa bình nếu trên trái đất còn 1 ng 🥺', metrics: { engagement: 1, sentiment: 45 } },
                ],
              },
            ],
          },
          {
            id: 'kw-3',
            type: 'keyword',
            name: '#iran',
            metrics: { mentions: 8900, engagement: 980000, sentiment: 58, childCount: 189 },
            children: [
              { id: 'post-6', type: 'post', platform: 'tiktok', author: 'baohatinh', name: 'Iran phòng không Israel', content: 'Giây phút tên lửa Iran vượt qua lưới phòng không Israel', metrics: { mentions: 3652, engagement: 145300, sentiment: 58 }, children: [] },
              { id: 'post-7', type: 'post', platform: 'tiktok', author: 'vutrunews.official', name: 'Iran vs 15 nước', content: 'Iran chính thức đi vào lịch sử khi một mình vã 15 nước', metrics: { mentions: 637, engagement: 89900, sentiment: 60 }, children: [] },
            ],
          },
        ],
      },
      {
        id: 'proj-2',
        type: 'project',
        name: 'Tin Tức 24h',
        description: 'Theo dõi tin tức nóng 24h trên các nền tảng',
        metrics: { mentions: 16100, engagement: 1500000, sentiment: 72, childCount: 3 },
        children: [
          {
            id: 'kw-4',
            type: 'keyword',
            name: '#tinnong24h',
            metrics: { mentions: 8200, engagement: 720000, sentiment: 70, childCount: 320 },
            children: [
              { id: 'post-8', type: 'post', platform: 'tiktok', author: 'baohatinh', name: 'Tin nóng quốc tế', content: 'Giây phút tên lửa Iran vượt qua lưới phòng không Israel #tinnong #tinnong24h', metrics: { mentions: 3652, engagement: 145300, sentiment: 58 }, children: [] },
            ],
          },
          {
            id: 'kw-5',
            type: 'keyword',
            name: '#tintuc24h',
            metrics: { mentions: 5400, engagement: 480000, sentiment: 72, childCount: 210 },
            children: [
              { id: 'post-9', type: 'post', platform: 'tiktok', author: 'tintucchinhtriquansu', name: 'Thời sự 24h', content: 'CUỘC CHIẾN MỸ VỚI IRAN ĐÃ BẮT ĐẦU #thoisu #tintuc24h', metrics: { mentions: 29, engagement: 2396, sentiment: 55 }, children: [] },
            ],
          },
          {
            id: 'kw-6',
            type: 'keyword',
            name: '#socialnews',
            metrics: { mentions: 4200, engagement: 350000, sentiment: 74, childCount: 95 },
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'camp-2',
    type: 'campaign',
    name: 'Trending Văn hóa & Giải trí',
    description: 'Chiến dịch theo dõi xu hướng văn hóa giải trí trên TikTok',
    metrics: { mentions: 28500, engagement: 3200000, sentiment: 82, childCount: 2 },
    children: [
      {
        id: 'proj-3',
        type: 'project',
        name: 'Nhạc Việt Trending',
        description: 'Theo dõi các bài hát và xu hướng âm nhạc Việt',
        metrics: { mentions: 18900, engagement: 2100000, sentiment: 85, childCount: 3 },
        children: [
          {
            id: 'kw-7',
            type: 'keyword',
            name: '#camonnguoidathuccungtoi',
            metrics: { mentions: 8200, engagement: 920000, sentiment: 88, childCount: 180 },
            children: [
              {
                id: 'post-10',
                type: 'post',
                platform: 'tiktok',
                author: 'lamentlove',
                name: 'Cảm Ơn Người Đã Thức Cùng Tôi',
                content: 'Cảm Ơn Người Đã Thức Cùng Tôi // Phùng Khánh Linh #camonnguoidathuccungtoi #phungkhanhlinh #lyrics #fyp',
                metrics: { mentions: 35, engagement: 6178, sentiment: 92 },
                children: [
                  { id: 'cmt-8', type: 'comment', author: 'xunu.190899', name: 'Thu Huyền', content: 'Phim hay mà ít suất chiếu quá. Thêm suất chiếu nha. Cần nhiều bạn trẻ biết hơn về bộ phim này', metrics: { engagement: 73, sentiment: 85 } },
                  { id: 'cmt-9', type: 'comment', author: 'sonkhanhtieududu', name: 'sonkhanhtieududu', content: 'Vần cả tiếng anh cũng vậy', metrics: { engagement: 60, sentiment: 80 } },
                  { id: 'cmt-10', type: 'comment', author: 'duonggnek69', name: 'duonggnek69', content: 'Với tớ hoặc với nhiều người khác nó là một lời tri ân cuộc đời ❤', metrics: { engagement: 25, sentiment: 95 } },
                ],
              },
            ],
          },
          {
            id: 'kw-8',
            type: 'keyword',
            name: '#phungkhanhlinh',
            metrics: { mentions: 6500, engagement: 680000, sentiment: 86, childCount: 120 },
            children: [
              { id: 'post-11', type: 'post', platform: 'tiktok', author: 'lamentlove', name: 'Lyrics PKL', content: 'Cảm Ơn Người Đã Thức Cùng Tôi // Phùng Khánh Linh', metrics: { mentions: 35, engagement: 6178, sentiment: 92 }, children: [] },
              { id: 'post-12', type: 'post', platform: 'youtube', author: 'MusicVN', name: 'PKL MV reaction', content: 'Reaction MV Phùng Khánh Linh mới nhất', metrics: { mentions: 1200, engagement: 8500, sentiment: 88 }, children: [] },
            ],
          },
          {
            id: 'kw-9',
            type: 'keyword',
            name: '#lyrics',
            metrics: { mentions: 4200, engagement: 380000, sentiment: 82, childCount: 95 },
            children: [
              { id: 'post-13', type: 'post', platform: 'tiktok', author: 'lamentlove', name: 'Lyrics video trending', content: 'Cảm Ơn Người Đã Thức Cùng Tôi lyrics #fyp #xh', metrics: { mentions: 35, engagement: 6178, sentiment: 90 }, children: [] },
            ],
          },
        ],
      },
      {
        id: 'proj-4',
        type: 'project',
        name: 'TikTok Trends VN',
        description: 'Theo dõi xu hướng nổi bật trên TikTok Việt Nam',
        metrics: { mentions: 9600, engagement: 1100000, sentiment: 78, childCount: 3 },
        children: [
          {
            id: 'kw-10',
            type: 'keyword',
            name: '#fyp',
            metrics: { mentions: 12500, engagement: 580000, sentiment: 80, childCount: 450 },
            children: [
              { id: 'post-14', type: 'post', platform: 'tiktok', author: 'lamentlove', name: 'FYP trending music', content: 'Cảm Ơn Người Đã Thức Cùng Tôi #fyp #xh', metrics: { mentions: 35, engagement: 6178, sentiment: 92 }, children: [] },
            ],
          },
          {
            id: 'kw-11',
            type: 'keyword',
            name: '#tiktoknews',
            metrics: { mentions: 5200, engagement: 420000, sentiment: 72, childCount: 180 },
            children: [
              { id: 'post-15', type: 'post', platform: 'tiktok', author: 'baohatinh', name: 'TikTok News Iran', content: 'Giây phút tên lửa Iran vượt qua lưới phòng không Israel #tiktoknews', metrics: { mentions: 3652, engagement: 145300, sentiment: 58 }, children: [] },
            ],
          },
          {
            id: 'kw-12',
            type: 'keyword',
            name: '#xh',
            metrics: { mentions: 3800, engagement: 290000, sentiment: 78, childCount: 120 },
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'camp-3',
    type: 'campaign',
    name: 'Công nghệ & Sản phẩm',
    description: 'Theo dõi xu hướng công nghệ và review sản phẩm',
    metrics: { mentions: 15200, engagement: 1800000, sentiment: 74, childCount: 2 },
    children: [
      {
        id: 'proj-5',
        type: 'project',
        name: 'iPhone 17 Tracking',
        description: 'Theo dõi phản hồi về iPhone 17 Pro Max trên mạng xã hội',
        metrics: { mentions: 9800, engagement: 1200000, sentiment: 76, childCount: 2 },
        children: [
          {
            id: 'kw-13',
            type: 'keyword',
            name: 'iphone 17 promax',
            metrics: { mentions: 6200, engagement: 780000, sentiment: 78, childCount: 85 },
            children: [
              { id: 'post-16', type: 'post', platform: 'tiktok', author: 'tech_daily_vn', name: 'iPhone 17 Pro Max leak', content: 'Rò rỉ iPhone 17 Pro Max - thiết kế hoàn toàn mới #iphone17 #apple', metrics: { mentions: 2800, engagement: 42000, sentiment: 82 }, children: [] },
              { id: 'post-17', type: 'post', platform: 'youtube', author: 'TechReviewVN', name: 'So sánh iPhone 17 vs 16', content: 'So sánh chi tiết iPhone 17 Pro Max vs iPhone 16 Pro Max', metrics: { mentions: 1500, engagement: 18000, sentiment: 75 }, children: [] },
            ],
          },
          {
            id: 'kw-14',
            type: 'keyword',
            name: '#apple',
            metrics: { mentions: 3600, engagement: 420000, sentiment: 74, childCount: 62 },
            children: [
              { id: 'post-18', type: 'post', platform: 'facebook', author: 'Apple Fan VN', name: 'Apple event 2026', content: 'Tổng hợp sự kiện Apple 2026 - iPhone 17 chính thức ra mắt', metrics: { mentions: 1800, engagement: 12000, sentiment: 80 }, children: [] },
            ],
          },
        ],
      },
      {
        id: 'proj-6',
        type: 'project',
        name: 'VinFast Monitor',
        description: 'Theo dõi thương hiệu VinFast trên mạng xã hội',
        metrics: { mentions: 5400, engagement: 600000, sentiment: 72, childCount: 2 },
        children: [
          {
            id: 'kw-15',
            type: 'keyword',
            name: '#VinFast',
            metrics: { mentions: 3200, engagement: 380000, sentiment: 73, childCount: 110 },
            children: [
              { id: 'post-19', type: 'post', platform: 'tiktok', author: 'auto_review_vn', name: 'Review VF8 2026', content: 'Trải nghiệm thực tế VF8 sau 6 tháng sử dụng, có đáng mua?', metrics: { mentions: 2400, engagement: 18500, sentiment: 78 }, children: [] },
              { id: 'post-20', type: 'post', platform: 'facebook', author: 'VinFast Community', name: 'Hội VF8 Owners', content: 'Buổi giao lưu offline của các chủ xe VF8 tại Hà Nội', metrics: { mentions: 920, engagement: 5600, sentiment: 85 }, children: [] },
            ],
          },
          {
            id: 'kw-16',
            type: 'keyword',
            name: '#VF8',
            metrics: { mentions: 2200, engagement: 220000, sentiment: 70, childCount: 45 },
            children: [
              { id: 'post-21', type: 'post', platform: 'youtube', author: 'TechAutoVN', name: 'VF8 vs BYD Atto 3', content: 'Video so sánh chi tiết giữa VinFast VF8 và BYD Atto 3', metrics: { mentions: 1800, engagement: 12300, sentiment: 68 }, children: [] },
            ],
          },
        ],
      },
    ],
  },
];
