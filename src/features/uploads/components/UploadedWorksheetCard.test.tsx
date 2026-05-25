import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { UploadedWorksheetCard } from './UploadedWorksheetCard'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { UserUpload } from '@/types/userUpload'

const upload: UserUpload = {
  id: 'upload-test-1',
  userId: 'user-1',
  title: 'Long Division Practice',
  categoryId: 'cat-3',
  subcategoryId: 'sub-3-1',
  level: 'Intermediate',
  schoolGrade: '4',
  content: 'Solve the problems.',
  answerSheet: { id: 'ans-upload-test-1', content: '1. 12 r 3' },
  originalImageDataUrl: '',
  createdAt: '2026-01-01T00:00:00Z',
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

describe('UploadedWorksheetCard', () => {
  it('should_render_upload_title', () => {
    renderWithProviders(<UploadedWorksheetCard upload={upload} />)
    expect(screen.getByText('Long Division Practice')).toBeInTheDocument()
  })

  it('should_link_card_to_upload_detail', () => {
    renderWithProviders(<UploadedWorksheetCard upload={upload} />)
    const cardLink = screen.getByRole('link', { name: /long division practice/i })
    expect(cardLink).toHaveAttribute('href', '/my-uploads/upload-test-1')
  })

  it('should_navigate_to_my_uploads_when_my_upload_pill_clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <UploadedWorksheetCard upload={upload} />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/browse'] } },
    )

    const pill = screen.getByRole('button', { name: /my upload/i })
    await user.click(pill)

    expect(screen.getByTestId('location')).toHaveTextContent('/my-uploads')
    expect(screen.getByTestId('location')).not.toHaveTextContent('/my-uploads/upload-test-1')
  })
})
