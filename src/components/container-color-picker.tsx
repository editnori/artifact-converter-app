import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X, Palette, RotateCcw } from 'lucide-react'

interface ContainerColorPickerProps {
  isOpen: boolean
  onClose: () => void
  onApply: (colors: ContainerColors) => void
  initialColors: ContainerColors
  elementId: string
  elementType: string
}

export interface ContainerColors {
  backgroundColor: string
  borderColor: string
  textColor: string
}

const PRESET_COLORS = [
  // Basic colors
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Light Gray', value: '#E5E7EB' },
  
  // Primary colors
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  
  // Pastel colors
  { name: 'Light Red', value: '#FEE2E2' },
  { name: 'Light Blue', value: '#DBEAFE' },
  { name: 'Light Green', value: '#D1FAE5' },
  { name: 'Light Yellow', value: '#FEF3C7' },
  
  // Additional colors
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
]

export function ContainerColorPicker({
  isOpen,
  onClose,
  onApply,
  initialColors,
  elementId,
  elementType
}: ContainerColorPickerProps) {
  const [colors, setColors] = useState<ContainerColors>(initialColors)
  const [activeTab, setActiveTab] = useState<'background' | 'border' | 'text'>('background')

  useEffect(() => {
    setColors(initialColors)
  }, [initialColors])

  if (!isOpen) return null

  const handleColorChange = (type: keyof ContainerColors, value: string) => {
    setColors(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handlePresetClick = (color: string) => {
    const key = `${activeTab}Color` as keyof ContainerColors
    handleColorChange(key, color)
  }

  const handleTransparent = () => {
    if (activeTab === 'background') {
      handleColorChange('backgroundColor', 'transparent')
    }
  }

  const handleReset = () => {
    setColors(initialColors)
  }

  const handleApply = () => {
    onApply(colors)
    onClose()
  }

  const getActiveColor = () => {
    const key = `${activeTab}Color` as keyof ContainerColors
    return colors[key]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Container Colors</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Element Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              Editing: <span className="font-medium">{elementType}</span>
            </p>
          </div>

          {/* Color Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={activeTab === 'background' ? 'default' : 'outline'}
              onClick={() => setActiveTab('background')}
              className="flex-1"
            >
              Background
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'border' ? 'default' : 'outline'}
              onClick={() => setActiveTab('border')}
              className="flex-1"
            >
              Border
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'text' ? 'default' : 'outline'}
              onClick={() => setActiveTab('text')}
              className="flex-1"
            >
              Text
            </Button>
          </div>

          {/* Current Color Display */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Current Color</Label>
            <div className="flex gap-2">
              <div 
                className="w-full h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center"
                style={{ 
                  backgroundColor: getActiveColor() === 'transparent' ? 'white' : getActiveColor(),
                  backgroundImage: getActiveColor() === 'transparent' 
                    ? 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #ffffff 10px, #ffffff 20px)' 
                    : undefined
                }}
              >
                {getActiveColor() === 'transparent' && (
                  <span className="text-sm text-gray-500">Transparent</span>
                )}
              </div>
              <Input
                type="text"
                value={getActiveColor()}
                onChange={(e) => handleColorChange(`${activeTab}Color` as keyof ContainerColors, e.target.value)}
                className="w-32"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Color Input */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Pick a Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={getActiveColor() === 'transparent' ? '#ffffff' : getActiveColor()}
                onChange={(e) => handleColorChange(`${activeTab}Color` as keyof ContainerColors, e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
              {activeTab === 'background' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTransparent}
                  className="whitespace-nowrap"
                >
                  Transparent
                </Button>
              )}
            </div>
          </div>

          {/* Preset Colors */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Preset Colors</Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className="w-full h-8 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div 
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: colors.backgroundColor === 'transparent' ? 'white' : colors.backgroundColor,
                borderColor: colors.borderColor,
                color: colors.textColor,
                backgroundImage: colors.backgroundColor === 'transparent' 
                  ? 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #ffffff 10px, #ffffff 20px)' 
                  : undefined
              }}
            >
              <p className="font-medium">Sample Container</p>
              <p className="text-sm mt-1">This is how your container will look with the selected colors.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
            >
              Apply Colors
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}