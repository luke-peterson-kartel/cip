import { useLocation, Link } from 'react-router-dom'

function getBreadcrumbs(pathname: string): { name: string; href: string }[] {
  const parts = pathname.split('/').filter(Boolean)
  const breadcrumbs: { name: string; href: string }[] = []

  let currentPath = ''
  for (const part of parts) {
    currentPath += `/${part}`

    // Convert path part to readable name
    let name = part.charAt(0).toUpperCase() + part.slice(1)

    // Handle special cases
    if (part === 'settings') name = 'Settings'
    if (part === 'organization') name = 'Organization'
    if (part === 'users') name = 'Users'
    if (part === 'uploads') name = 'Uploads'
    if (part === 'request-agent') name = 'Request Agent'
    if (part === 'conversations') name = 'Conversations'
    if (part === 'audit') name = 'Audit Log'

    // Skip UUIDs in breadcrumbs display but keep the path
    if (part.match(/^[a-z]+-\d+$/) || part.match(/^[0-9a-f-]{36}$/)) {
      name = 'Details'
    }

    breadcrumbs.push({ name, href: currentPath })
  }

  return breadcrumbs
}

export function Header() {
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center space-x-2">
            <span className="text-gray-300">/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.name}</span>
            ) : (
              <Link to={crumb.href} className="text-gray-500 hover:text-gray-700">
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
