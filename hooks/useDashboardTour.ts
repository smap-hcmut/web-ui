import { useCallback } from 'react'
import { driver, Driver } from 'driver.js'

export const useDashboardTour = () => {
  const startTour = useCallback(() => {
    // Delay để đảm bảo page đã render
    setTimeout(() => {
      const steps: any[] = [
        {
          element: '#dashboard-sidebar',
          popover: {
            title: 'Thanh điều khiển',
            description: 'Xem các nguồn dữ liệu đang kết nối (Facebook, TikTok, YouTube) và các cảnh báo gần đây về thương hiệu.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#metrics-section',
          popover: {
            title: 'Chỉ số tổng quan',
            description: 'Các chỉ số quan trọng: Share of Voice (tỷ lệ thảo luận), Net Sentiment (cảm xúc ròng), Total Mentions (tổng lượt nhắc), Engagement Rate (tỷ lệ tương tác).',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#unified-chart',
          popover: {
            title: 'Biểu đồ phân tích tổng hợp',
            description: 'Biểu đồ thể hiện xu hướng thảo luận, cảm xúc và các sự kiện khủng hoảng theo thời gian. Di chuột để xem chi tiết từng điểm dữ liệu.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#competitor-chart',
          popover: {
            title: 'So sánh đối thủ',
            description: 'So sánh Share of Voice giữa thương hiệu của bạn và các đối thủ cạnh tranh. Nhấn vào từng cột để xem chi tiết.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#platform-distribution',
          popover: {
            title: 'Phân bố nền tảng',
            description: 'Xem tỷ lệ thảo luận trên từng nền tảng mạng xã hội (Facebook, TikTok, YouTube).',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#topic-cloud',
          popover: {
            title: 'Chủ đề nổi bật',
            description: 'Word cloud hiển thị các chủ đề được thảo luận nhiều nhất. Kích thước chữ thể hiện mức độ phổ biến. Nhấn vào chủ đề để xem chi tiết.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#viral-posts',
          popover: {
            title: 'Bài viết viral',
            description: 'Danh sách các bài viết có lượng tương tác cao nhất. Bạn có thể sắp xếp và lọc theo các tiêu chí khác nhau.',
            side: 'top',
            align: 'center'
          }
        }
      ]

      // Filter out steps with elements that don't exist
      const validSteps = steps.filter(step => {
        if (!step.element) return true
        return document.querySelector(step.element)
      })

      if (validSteps.length === 0) return

      const driverObj: Driver = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        stagePadding: 10,
        popoverClass: 'dashboard-tour-popover',
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Hoàn thành',
        progressText: '{{current}} / {{total}}',
        steps: validSteps
      })

      driverObj.drive()
    }, 500)
  }, [])

  return { startTour }
}
