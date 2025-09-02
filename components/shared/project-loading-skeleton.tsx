import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const TableLoadingSkeleton = () => {
  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg">
        <div className="grid grid-cols-6 gap-4 p-4 border-b">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
        {[...Array(7)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4 border-b">
            {[...Array(6)].map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableLoadingSkeleton