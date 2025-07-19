"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, User, Sparkles, ArrowRight, Check } from "lucide-react"
import { userStore } from "@/lib/local-store"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload as UploadIcon } from "lucide-react"

const EMOJI_AVATARS = [
  "👨‍💻", "👩‍💻", "👨‍🔬", "👩‍🔬", "👨‍⚕️", "👩‍⚕️", "👨‍🏫", "👩‍🏫",
  "👨‍🎨", "👩‍🎨", "👨‍🚀", "👩‍🚀", "👨‍🍳", "👩‍🍳", "👨‍💼", "👩‍💼",
  "🧑‍💻", "🧑‍🔬", "🧑‍⚕️", "🧑‍🏫", "🧑‍🎨", "🧑‍🚀", "🧑‍🍳", "🧑‍💼",
  "😎", "🤓", "🧐", "🤩", "🥳", "😊", "😄", "🤗",
  "👨", "👩", "🧑", "👴", "👵", "👶", "👧", "👦",
  "🎩", "👒", "🧢", "👑", "🎓", "⛑️", "🪖", "👷‍♂️"
]

export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importFileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [avatarType, setAvatarType] = useState<'emoji' | 'upload' | 'url'>('emoji')
  const [selectedEmoji, setSelectedEmoji] = useState("😀")
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Import logic
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        if (!importData.version || !importData.tasks || !importData.activities) {
          throw new Error("Invalid data format")
        }
        if (importData.user) {
          userStore.setCurrentUser(importData.user)
        }
        if (importData.tasks) {
          localStorage.setItem("kanban-tasks", JSON.stringify(importData.tasks))
        }
        if (importData.activities) {
          localStorage.setItem("kanban-activity", JSON.stringify(importData.activities))
        }
        if (importData.users) {
          localStorage.setItem("kanban-users", JSON.stringify(importData.users))
        }
        toast({
          title: "Data imported successfully",
          description: "Your data has been imported. The page will refresh to show the changes.",
        })
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1500)
      } catch (error) {
        console.error('Error importing data:', error)
        toast({
          title: "Import failed",
          description: "The file format is invalid or corrupted. Please try a different file.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleComplete = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    
    try {
      let avatar = selectedEmoji
      let avatarTypeFinal: 'emoji' | 'upload' | 'url' = 'emoji'

      if (avatarType === 'upload' && uploadedImage) {
        avatar = uploadedImage
        avatarTypeFinal = 'upload'
      } else if (avatarType === 'url' && imageUrl) {
        avatar = imageUrl
        avatarTypeFinal = 'url'
      }

      userStore.setCurrentUser({
        name: name.trim(),
        avatar,
        avatarType: avatarTypeFinal
      })

      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push("/dashboard")
    } catch (error) {
      console.error('Error saving user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = name.trim().length > 0 && (
    avatarType === 'emoji' || 
    (avatarType === 'upload' && uploadedImage) || 
    (avatarType === 'url' && imageUrl)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to Boardly</CardTitle>
            <CardDescription className="text-lg">
              Let's set up your profile to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Step 1: Name Input */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    What should we call you?
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>
                
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="w-full h-12 text-lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="flex flex-col items-center gap-2 mt-6">
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => importFileRef.current?.click()}
                    className="w-full flex items-center justify-center"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Import Data from Backup
                  </Button>
                  <span className="text-xs text-gray-500 mt-1">Already have a backup? Import your data here.</span>
                </div>
              </div>
            )}

            {/* Step 2: Avatar Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Choose your avatar
                  </Label>
                  
                  <Tabs value={avatarType} onValueChange={(value) => setAvatarType(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="emoji" className="flex items-center gap-2">
                        <span>😀</span>
                        <span className="hidden sm:inline">Emoji</span>
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Upload</span>
                      </TabsTrigger>
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">URL</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="emoji" className="space-y-4">
                      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                        {EMOJI_AVATARS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setSelectedEmoji(emoji)}
                            className={`p-2 text-2xl rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              selectedEmoji === emoji ? 'bg-blue-100 dark:bg-blue-900/20 ring-2 ring-blue-500' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{selectedEmoji}</div>
                        <p className="text-sm text-gray-500">Selected emoji</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {uploadedImage ? (
                          <div className="space-y-4">
                            <img 
                              src={uploadedImage} 
                              alt="Uploaded avatar" 
                              className="w-24 h-24 rounded-full mx-auto object-cover"
                            />
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Choose Different Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="h-12 w-12 mx-auto text-gray-400" />
                            <div>
                              <p className="text-lg font-medium">Upload an image</p>
                              <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-4">
                        <Input
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="h-12"
                        />
                        {imageUrl && (
                          <div className="text-center">
                            <img 
                              src={imageUrl} 
                              alt="Avatar preview" 
                              className="w-24 h-24 rounded-full mx-auto object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <p className="text-sm text-gray-500 mt-2">Image preview</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleComplete}
                    disabled={!canProceed || isLoading}
                    className="flex-1 h-12"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        Complete Setup
                        <Check className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 