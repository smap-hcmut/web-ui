import { useCallback } from 'react'
import { driver, Driver } from 'driver.js'

export const useTrendTour = () => {
  const startTour = useCallback(() => {
    setTimeout(() => {
      const steps: any[] = [
        {
          element: '#trend-header',
          popover: {
            title: 'Trend Analysis',
            description: 'Trang phân tích xu hướng giúp bạn khám phá các chủ đề, hashtag và bài viết đang hot trên mạng xã hội.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#trend-search',
          popover: {
            title: 'Tìm kiếm',
            description: 'Tìm kiếm nhanh các chủ đề, hashtag hoặc bài viết theo từ khóa.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#trend-view-mode',
          popover: {
            title: 'Chế độ xem',
            description: 'Chuyển đổi giữa 3 chế độ: Topics (chủ đề), Hashtags, và Posts (bài viết).',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#trend-refresh',
          popover: {
            title: 'Làm mới dữ liệu',
            description: 'Nhấn để cập nhật dữ liệu xu hướng mới nhất từ các nền tảng.',
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '#trend-data-source',
          popover: {
            title: 'Nguồn dữ liệu',
            description: 'Hiển thị trạng thái dữ liệu: Live Data (dữ liệu thực) hoặc No Data (chưa có dữ liệu).',
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '#trend-sort',
          popover: {
            title: 'Sắp xếp',
            description: 'Sắp xếp kết quả theo: Volume (số lượng), Delta (thay đổi), Confidence (độ tin cậy), hoặc Sentiment (cảm xúc).',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#trend-metrics',
          popover: {
            title: 'Chỉ số tổng quan',
            description: 'Các chỉ số thống kê tổng quan về xu hướng: tổng số topics, hashtags, posts và engagement.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#trend-content',
          popover: {
            title: 'Danh sách xu hướng',
            description: 'Danh sách các chủ đề/hashtag/bài viết đang trending. Nhấn vào từng item để xem chi tiết.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#trend-filters-btn',
          popover: {
            title: 'Bộ lọc nâng cao',
            description: 'Mở panel bộ lọc để lọc theo nền tảng, khoảng thời gian, sentiment và nhiều tiêu chí khác.',
            side: 'left',
            align: 'center'
          }
        }
      ]

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
        popoverClass: 'trend-tour-popover',
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
