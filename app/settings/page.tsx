"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Upload, User, Save, Trash2, ArrowLeft, Download, Upload as UploadIcon } from "lucide-react"
import { userStore, taskStore, activityStore, commentStore } from "@/lib/local-store"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const EMOJI_AVATARS = [
  "👨‍💻", "👩‍💻", "👨‍🔬", "👩‍🔬", "👨‍⚕️", "👩‍⚕️", "👨‍🏫", "👩‍🏫",
  "👨‍🎨", "👩‍🎨", "👨‍🚀", "👩‍🚀", "👨‍🍳", "👩‍🍳", "👨‍💼", "👩‍💼",
  "🧑‍💻", "🧑‍🔬", "🧑‍⚕️", "🧑‍🏫", "🧑‍🎨", "🧑‍🚀", "🧑‍🍳", "🧑‍💼",
  "😎", "🤓", "🧐", "🤩", "🥳", "😊", "😄", "🤗",
  "👨", "👩", "🧑", "👴", "👵", "👶", "👧", "👦",
  "🎩", "👒", "🧢", "👑", "🎓", "⛑️", "🪖", "👷‍♂️"
]

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importFileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const [user, setUser] = useState<{ name: string; avatar: string; avatarType: 'emoji' | 'upload' | 'url' } | null>(null)
  const [name, setName] = useState("")
  const [avatarType, setAvatarType] = useState<'emoji' | 'upload' | 'url'>('emoji')
  const [selectedEmoji, setSelectedEmoji] = useState("😀")
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const currentUser = userStore.getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    
    setUser(currentUser)
    setName(currentUser.name)
    setAvatarType(currentUser.avatarType)
    
    if (currentUser.avatarType === 'emoji') {
      setSelectedEmoji(currentUser.avatar)
    } else if (currentUser.avatarType === 'upload') {
      setUploadedImage(currentUser.avatar)
    } else if (currentUser.avatarType === 'url') {
      setImageUrl(currentUser.avatar)
    }
  }, [router])

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

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    
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

      setUser({
        name: name.trim(),
        avatar,
        avatarType: avatarTypeFinal
      })
    } catch (error) {
      console.error('Error saving user data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = () => {
    try {
      // Collect all data from local storage
      const exportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        user: userStore.getCurrentUser(),
        tasks: taskStore.getAll(),
        activities: activityStore.getAll(),
        users: userStore.getAll()
      }

      // Create and download the file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `boardly-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Data exported successfully",
        description: "Your data has been exported to a JSON file.",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        // Validate the import data structure
        if (!importData.version || !importData.tasks || !importData.activities) {
          throw new Error("Invalid data format")
        }

        // Import the data
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

        // Update the current user state
        const currentUser = userStore.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setName(currentUser.name)
          setAvatarType(currentUser.avatarType)
          
          if (currentUser.avatarType === 'emoji') {
            setSelectedEmoji(currentUser.avatar)
          } else if (currentUser.avatarType === 'upload') {
            setUploadedImage(currentUser.avatar)
          } else if (currentUser.avatarType === 'url') {
            setImageUrl(currentUser.avatar)
          }
        }

        toast({
          title: "Data imported successfully",
          description: "Your data has been imported. The page will refresh to show the changes.",
        })

        // Refresh the page to show imported data
        setTimeout(() => {
          window.location.reload()
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
    
    // Reset the file input
    event.target.value = ''
  }

  const handleResetData = () => {
    // Clear all local storage data
    localStorage.clear()
    userStore.clearUser()
    router.push("/")
  }

  const canSave = name.trim().length > 0 && (
    avatarType === 'emoji' || 
    (avatarType === 'upload' && uploadedImage) || 
    (avatarType === 'url' && imageUrl)
  )

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>

            <div className="grid gap-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your name and avatar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Avatar</Label>
                    
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

                  <Button 
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Data Export/Import */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Export/Import</CardTitle>
                  <CardDescription>
                    Export your data to backup or transfer to another device, or import data from a previous export.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Export Data</h3>
                        <p className="text-sm text-gray-500">
                          Download all your tasks, comments, activities, and profile data as a JSON file.
                        </p>
                      </div>
                      <Button onClick={handleExportData} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Import Data</h3>
                        <p className="text-sm text-gray-500">
                          Import data from a previously exported JSON file. This will replace your current data.
                        </p>
                      </div>
                      <div>
                        <input
                          ref={importFileRef}
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <UploadIcon className="h-4 w-4 mr-2" />
                              Import Data
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Import data?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will replace all your current data with the imported data. 
                                This action cannot be undone. Make sure you have a backup of your current data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => importFileRef.current?.click()}
                              >
                                Import Data
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Manage your local data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Remove Default Tasks</h3>
                        <p className="text-sm text-gray-500">
                          Remove the welcome and example tasks that were created when you first started.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Defaults
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove default tasks?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the welcome and example tasks that were created when you first started using Boardly. 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                taskStore.removeDefaultTasks()
                                toast({
                                  title: "Default tasks removed",
                                  description: "The welcome and example tasks have been removed.",
                                })
                              }}
                            >
                              Remove Default Tasks
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Reset All Data</h3>
                        <p className="text-sm text-gray-500">
                          This will permanently delete all your tasks, activities, and profile data.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Reset Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete all your tasks, 
                              activities, and profile data from your local storage.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetData} className="bg-red-600 hover:bg-red-700">
                              Yes, reset all data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 