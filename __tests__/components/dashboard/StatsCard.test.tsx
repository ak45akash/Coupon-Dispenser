import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/dashboard/StatsCard'
import { Store } from 'lucide-react'

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard title="Total Vendors" value={10} icon={Store} />
    )

    expect(screen.getByText('Total Vendors')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should render trend when provided', () => {
    render(
      <StatsCard
        title="Total Vendors"
        value={10}
        icon={Store}
        trend={{ value: '+5%', positive: true }}
      />
    )

    expect(screen.getByText('+5%')).toBeInTheDocument()
    // Trend icon is rendered as SVG, verified by presence of trend value
  })

  it('should render negative trend', () => {
    render(
      <StatsCard
        title="Total Vendors"
        value={10}
        icon={Store}
        trend={{ value: '-3%', positive: false }}
      />
    )

    expect(screen.getByText('-3%')).toBeInTheDocument()
    // Trend icon is rendered as SVG, verified by presence of trend value
  })

  it('should accept string values', () => {
    render(
      <StatsCard title="Status" value="Active" icon={Store} />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

