'use client'

import Link from 'next/link'

function MainNavigation() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Sharpii.ai
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/ai-image-enhancement" className="text-gray-600 hover:text-gray-900">
              AI Enhancement
            </Link>
            <Link href="/magical-portrait" className="text-gray-600 hover:text-gray-900">
              Magical Portrait
            </Link>
            <Link 
              href="/editor/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Editor Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default MainNavigation
