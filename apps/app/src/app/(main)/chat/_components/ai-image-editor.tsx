'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/components/ui/select'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Slider } from '@bulkit/ui/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { PenTool, Image, Palette, ArrowUpDown, Eraser, Loader2, Download, Copy, Upload } from 'react-icons/lu'

interface AIImageEditorProps {
  conversationId: string
  onComplete: () => void
}

export function AIImageEditor({ conversationId, onComplete }: AIImageEditorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    imageUrl: '',
    editType: 'inpaint',
    editInstruction: '',
    maskUrl: '',
    styleUrl: '',
    strength: [0.8],
    scale: 2,
  })

  const editTypes = [
    { value: 'inpaint', label: 'Inpaint', icon: PenTool, description: 'Fill or modify specific areas' },
    { value: 'outpaint', label: 'Outpaint', icon: Image, description: 'Extend image boundaries' },
    { value: 'style_transfer', label: 'Style Transfer', icon: Palette, description: 'Apply artistic style' },
    { value: 'upscale', label: 'Upscale', icon: ArrowUpDown, description: 'Increase resolution' },
    { value: 'remove_background', label: 'Remove BG', icon: Eraser, description: 'Remove background' },
    { value: 'variation', label: 'Variation', icon: Image, description: 'Create similar images' },
  ]

  const handleEdit = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/ai/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: formData.imageUrl,
          editType: formData.editType,
          editInstruction: formData.editInstruction,
          maskUrl: formData.maskUrl,
          styleUrl: formData.styleUrl,
          strength: formData.strength[0],
          scale: formData.scale,
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setEditedImage(result.data.editedImage.url)
      }
    } catch (error) {
      console.error('Edit failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedEditType = editTypes.find(type => type.value === formData.editType)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Source Image URL *</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Edit Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {editTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={formData.editType === type.value ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, editType: type.value }))}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs opacity-70">{type.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {(formData.editType === 'inpaint' || formData.editType === 'outpaint' || formData.editType === 'variation') && (
            <div className="space-y-2">
              <Label htmlFor="editInstruction">Edit Instructions *</Label>
              <Textarea
                id="editInstruction"
                placeholder={
                  formData.editType === 'inpaint' ? "Replace the sky with a sunset..." :
                  formData.editType === 'outpaint' ? "Extend the landscape with mountains..." :
                  "Create a variation with different lighting..."
                }
                value={formData.editInstruction}
                onChange={(e) => setFormData(prev => ({ ...prev, editInstruction: e.target.value }))}
                className="min-h-20"
              />
            </div>
          )}

          {formData.editType === 'inpaint' && (
            <div className="space-y-2">
              <Label htmlFor="maskUrl">Mask Image URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="maskUrl"
                  placeholder="https://example.com/mask.jpg"
                  value={formData.maskUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, maskUrl: e.target.value }))}
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                White areas will be edited, black areas preserved
              </div>
            </div>
          )}

          {formData.editType === 'style_transfer' && (
            <div className="space-y-2">
              <Label htmlFor="styleUrl">Style Reference Image URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="styleUrl"
                  placeholder="https://example.com/style.jpg"
                  value={formData.styleUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, styleUrl: e.target.value }))}
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {formData.editType === 'upscale' && (
            <div className="space-y-2">
              <Label htmlFor="scale">Scale Factor</Label>
              <Select value={formData.scale.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, scale: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x (Double Size)</SelectItem>
                  <SelectItem value="4">4x (Quadruple Size)</SelectItem>
                  <SelectItem value="8">8x (8x Larger)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {(formData.editType === 'inpaint' || formData.editType === 'style_transfer' || formData.editType === 'variation') && (
            <div className="space-y-2">
              <Label>Edit Strength: {formData.strength[0].toFixed(1)}</Label>
              <Slider
                value={formData.strength}
                onValueChange={(value) => setFormData(prev => ({ ...prev, strength: value }))}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Higher values make more dramatic changes
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Edit Type Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {selectedEditType && (
                  <>
                    <selectedEditType.icon className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">{selectedEditType.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEditType.description}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Original Image */}
      {formData.imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Original Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={formData.imageUrl} 
              alt="Original image" 
              className="w-full rounded-lg border max-h-64 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Edited Image Display */}
      {editedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Edited Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <img 
                src={editedImage} 
                alt="Edited image" 
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleEdit} 
          disabled={!formData.imageUrl || isProcessing || 
            (formData.editType === 'style_transfer' && !formData.styleUrl) ||
            ((formData.editType === 'inpaint' || formData.editType === 'outpaint' || formData.editType === 'variation') && !formData.editInstruction)
          }
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PenTool className="w-4 h-4 mr-2" />
              Apply Edit
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onComplete}>
          Close
        </Button>
      </div>
    </div>
  )
}