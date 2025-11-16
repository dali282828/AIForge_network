interface ComingSoonProps {
  feature: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'card' | 'section'
}

export default function ComingSoon({ feature, description, size = 'md', variant = 'badge' }: ComingSoonProps) {
  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
      } bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border border-orange-200`}>
        <svg className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{feature}</span>
        <span className="text-orange-600">· Coming Soon</span>
      </span>
    )
  }

  if (variant === 'card') {
    return (
      <div className="card p-6 text-center border-2 border-dashed border-gray-300 bg-gray-50/50">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-4">
            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-4 max-w-md">{description}</p>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border border-orange-200">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'section') {
    return (
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-sm">
            <svg className="h-10 w-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h3>
          {description && (
            <p className="text-gray-600 mb-6">{description}</p>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-orange-200 shadow-sm">
            <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-orange-700">Coming Soon</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

