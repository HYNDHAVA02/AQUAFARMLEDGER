import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AuthComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-700">Aqua Farm Ledger</CardTitle>
          <CardDescription className="mt-2 text-base text-gray-600">
            Sign in to manage your aqua farm expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Auth 
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
            showLinks={true}
            magicLink={false}
            view="sign_in"
          />
        </CardContent>
        <div className="text-center text-xs text-gray-400 pb-2 pt-4">
          <a href="#" className="hover:underline text-blue-500">Need help?</a> &middot; <a href="#" className="hover:underline text-blue-500">Privacy Policy</a>
        </div>
      </Card>
    </div>
  )
}