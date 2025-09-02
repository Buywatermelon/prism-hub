'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  value?: string
  defaultValue?: string
  onSearch: (value: string) => void
  onValueChange?: (value: string) => void
  className?: string
  showButton?: boolean
  buttonText?: string
  disabled?: boolean
  maxWidth?: string
}

export function SearchInput({
  placeholder = '搜索...',
  value: controlledValue,
  defaultValue = '',
  onSearch,
  onValueChange,
  className,
  showButton = true,
  buttonText = '搜索',
  disabled = false,
  maxWidth = 'max-w-2xl'
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  const handleSearch = () => {
    onSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={cn('flex gap-3', maxWidth, className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-10"
        />
      </div>
      {showButton && (
        <Button 
          onClick={handleSearch} 
          disabled={disabled}
        >
          <Search className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      )}
    </div>
  )
}