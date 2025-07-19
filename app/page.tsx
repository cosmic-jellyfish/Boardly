"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Target, Users, ArrowRight, Sparkles } from "lucide-react"
import { userStore } from "@/lib/local-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"

export default function Home() {
  const router = useRouter()
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  useEffect(() => {
    const onboardingStatus = userStore.hasCompletedOnboarding()
    setHasCompletedOnboarding(onboardingStatus)
    
    // If user has completed onboarding, redirect to dashboard
    if (onboardingStatus) {
      router.push("/dashboard")
    }
  }, [router])

  if (hasCompletedOnboarding === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (hasCompletedOnboarding) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-3xl space-y-8">
          {/* Hero Section */}
          <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Welcome to <span className="bg-blue-600 bg-clip-text text-transparent">Boardly</span>
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 font-medium">
              Your personal task management companion.
            </p>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-6">
              Organise, track, and complete your tasks with ease. <br/>Stay focused, hit your goals, and own your productivity journey.
            </p>
            <div className="flex justify-center w-full mt-6">
              <Button 
                size="lg"
                className="text-lg px-8 py-4 h-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-3 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-blue-400"
                onClick={() => router.push("/onboarding")}
              >
                <span>Get Started</span>
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 ml-2">
                  <ArrowRight className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </span>
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 flex flex-col items-center shadow-sm">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400 mb-2" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Task Management</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Create, organise, and track your tasks with the intuitive kanban board.</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 flex flex-col items-center shadow-sm">
              <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Time Tracking</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Monitor your progress with detailed timelines and activity logs.</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-lg p-5 flex flex-col items-center shadow-sm">
              <Target className="h-7 w-7 text-purple-600 dark:text-purple-400 mb-2" />
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Goal Setting</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Set priorities and deadlines to stay focused on what matters most.</div>
            </div>
          </div>

          {/* Privacy Notice Button */}
          <div className="flex justify-center">
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 text-sm px-4 py-2 border-gray-300 dark:border-gray-700 animate-pulse-border relative overflow-hidden">
                  <Users className="h-4 w-4 mr-2" /> Your Data, Your Control
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Data, Your Control</DialogTitle>
                  <DialogDescription>
                    <div className="text-left text-gray-700 dark:text-gray-200 space-y-3 mt-2">
                      <p>
                        <b>Boardly</b> is designed with your privacy in mind. Everything you do here - your tasks, progress, and notes - stays <b>only</b> on your device.
                      </p>
                      <ul className="list-disc pl-5 text-sm">
                        <li>No accounts or sign-ups required.</li>
                        <li>No data is sent to any server or cloud.</li>
                        <li>No ads, no tracking, no personal analytics.</li>
                        <li>You are completely in control of your information.</li>
                      </ul>
                      <p>
                        If you ever clear your browser data, your tasks will be erased. If you want to keep your data, make sure to back it up regularly.
                      </p>
                      <p className="text-sm text-gray-500 mt-2 italic">
                        Note: I collect website traffic analytics to help improve the service.
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {/* Sticky Footer */}
      <footer className="w-full py-6 text-center text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md fixed bottom-0 left-0 z-50">
      <a href="https://github.com/cosmic-jellyfish" className="text-blue-300 hover:underline">Made with love by cosmic-jellyfish</a> ❤️
      </footer>
      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s infinite;
        }
        @keyframes pulse-once {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
          70% { box-shadow: 0 0 0 16px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        .animate-pulse-once {
          animation: pulse-once 1.2s 1;
        }
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.4), 0 0 0 0 rgba(168,85,247,0.3);
          }
          60%, 97% {
            box-shadow: 0 0 0 6px rgba(59,130,246,0), 0 0 0 12px rgba(168,85,247,0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.0), 0 0 0 0 rgba(168,85,247,0.0);
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
