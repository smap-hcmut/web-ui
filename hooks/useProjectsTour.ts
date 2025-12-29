import { useEffect, useCallback } from 'react'
import { driver, Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export const useProjectsTour = () => {
  const startTour = useCallback(() => {
    const driverObj: Driver = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      stagePadding: 10,
      popoverClass: 'projects-tour-popover',
      nextBtnText: 'Tiếp theo',
      prevBtnText: 'Quay lại',
      doneBtnText: 'Hoàn thành',
      progressText: '{{current}} / {{total}}',
      steps: [
        {
          element: '#projects-header',
          popover: {
            title: 'Trang Quản lý Dự án',
            description: 'Đây là nơi bạn quản lý tất cả các dự án giám sát thương hiệu và phân tích đối thủ cạnh tranh.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#create-project-btn',
          popover: {
            title: 'Tạo Dự án Mới',
            description: 'Nhấn vào đây để tạo một dự án mới. Bạn sẽ được hướng dẫn qua các bước thiết lập thương hiệu và đối thủ cạnh tranh.',
            side: 'left',
            align: 'center'
          }
        },
        {
          element: '#search-projects',
          popover: {
            title: 'Tìm kiếm Dự án',
            description: 'Sử dụng thanh tìm kiếm để nhanh chóng tìm dự án theo tên.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#filter-status',
          popover: {
            title: 'Lọc theo Trạng thái',
            description: 'Lọc danh sách dự án theo trạng thái: Hoàn thành, Đang xử lý, hoặc Bản nháp.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#projects-grid',
          popover: {
            title: 'Danh sách Dự án',
            description: 'Tất cả dự án của bạn được hiển thị ở đây. Nhấn vào một dự án để xem chi tiết dashboard và phân tích.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '.project-card:first-child',
          popover: {
            title: 'Thẻ Dự án',
            description: 'Mỗi thẻ hiển thị thông tin tổng quan: tên dự án, trạng thái, số thương hiệu, số đối thủ và ngày tạo. Nhấn vào menu (⋮) để xem hoặc xóa dự án.',
            side: 'right',
            align: 'center'
          }
        }
      ]
    })

    driverObj.drive()
  }, [])

  return { startTour }
}
