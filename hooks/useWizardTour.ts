import { useCallback } from 'react'
import { driver, Driver } from 'driver.js'

export const useWizardTour = () => {
  const startWizardTour = useCallback((currentStep: number) => {
    // Delay để đảm bảo modal đã render
    setTimeout(() => {
      let steps: any[] = []

      switch (currentStep) {
        case 1:
          steps = [
            {
              element: '#wizard-step-indicator',
              popover: {
                title: 'Các bước tạo Project',
                description: 'Wizard gồm 5 bước: Thông tin cơ bản → Thương hiệu → Đối thủ → Xem trước → Xác nhận. Bạn có thể quay lại các bước trước bất cứ lúc nào.',
                side: 'bottom',
                align: 'center'
              }
            },
            {
              element: '#project-name-input',
              popover: {
                title: 'Tên Project',
                description: 'Đặt tên cho project của bạn. Ví dụ: "Phân tích thương hiệu Coffee 2024"',
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#project-description-input',
              popover: {
                title: 'Mô tả Project',
                description: 'Mô tả ngắn gọn mục đích của project (không bắt buộc).',
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#date-range-section',
              popover: {
                title: 'Khoảng thời gian phân tích',
                description: 'Chọn khoảng thời gian bạn muốn thu thập và phân tích dữ liệu. Lưu ý: không được chọn ngày trong tương lai.',
                side: 'top',
                align: 'center'
              }
            }
          ]
          break

        case 2:
          steps = [
            {
              element: '#add-brand-btn',
              popover: {
                title: 'Thêm Thương hiệu',
                description: 'Nhấn để thêm thương hiệu của bạn. Bạn có thể thêm nhiều thương hiệu cùng lúc.',
                side: 'left',
                align: 'center'
              }
            },
            {
              element: '.brand-card:first-child',
              popover: {
                title: 'Thông tin Thương hiệu',
                description: 'Nhập tên thương hiệu và các từ khóa liên quan. Từ khóa giúp hệ thống tìm kiếm nội dung về thương hiệu của bạn trên mạng xã hội.',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '.ai-generate-btn:first-of-type',
              popover: {
                title: 'Tạo từ khóa bằng AI',
                description: 'Nhấn nút này để AI tự động gợi ý các từ khóa phù hợp dựa trên tên thương hiệu.',
                side: 'left',
                align: 'center'
              }
            }
          ]
          break

        case 3:
          steps = [
            {
              element: '#add-competitor-btn',
              popover: {
                title: 'Thêm Đối thủ cạnh tranh',
                description: 'Thêm các đối thủ để so sánh với thương hiệu của bạn. Hệ thống sẽ phân tích và so sánh hiệu suất giữa các bên.',
                side: 'left',
                align: 'center'
              }
            },
            {
              element: '.competitor-card:first-child',
              popover: {
                title: 'Thông tin Đối thủ',
                description: 'Tương tự như thương hiệu, nhập tên và từ khóa cho đối thủ. AI cũng có thể hỗ trợ tạo từ khóa.',
                side: 'right',
                align: 'start'
              }
            }
          ]
          break

        case 4:
          steps = [
            {
              element: '#preview-trigger-btn',
              popover: {
                title: 'Xem trước dữ liệu',
                description: 'Nhấn để hệ thống thu thập mẫu dữ liệu dựa trên các từ khóa đã nhập. Quá trình này có thể mất vài giây.',
                side: 'bottom',
                align: 'center'
              }
            },
            {
              element: '#preview-content',
              popover: {
                title: 'Kết quả Preview',
                description: 'Xem trước các nội dung sẽ được thu thập. Kiểm tra xem từ khóa có đúng không trước khi tạo project.',
                side: 'top',
                align: 'center'
              }
            }
          ]
          break

        case 5:
          steps = [
            {
              element: '#summary-section',
              popover: {
                title: 'Tổng kết Project',
                description: 'Kiểm tra lại toàn bộ thông tin project trước khi tạo.',
                side: 'top',
                align: 'center'
              }
            },
            {
              element: '#create-project-final-btn',
              popover: {
                title: 'Tạo Project',
                description: 'Nhấn để tạo project. Hệ thống sẽ bắt đầu thu thập và phân tích dữ liệu ngay sau khi tạo.',
                side: 'top',
                align: 'center'
              }
            }
          ]
          break
      }

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
        popoverClass: 'wizard-tour-popover',
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Hoàn thành',
        progressText: '{{current}} / {{total}}',
        steps: validSteps
      })

      driverObj.drive()
    }, 300)
  }, [])

  return { startWizardTour }
}
