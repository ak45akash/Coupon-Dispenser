import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

// Mark as dynamic since we use session/auth
export const dynamic = 'force-dynamic'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/login')
    }

    return <DashboardLayout user={session.user}>{children}</DashboardLayout>
  } catch (error) {
    console.error('Error in dashboard layout:', error)
    redirect('/login')
  }
}

