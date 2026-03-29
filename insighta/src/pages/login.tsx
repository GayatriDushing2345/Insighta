import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Redirect } from "wouter";

export default function Login() {
  const { isAuthenticated, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Insighta
            </span>
          </div>
          
          <h2 className="mt-8 text-3xl font-display font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Log in to manage your business data, generate AI insights, and explore market trends.
          </p>

          <div className="mt-10">
            <Button 
              size="lg" 
              className="w-full h-14 text-base" 
              onClick={() => login()}
            >
              Continue with Replit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
      
      <div className="hidden md:block relative flex-1 bg-muted overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract geometric data visualization"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-center">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium leading-relaxed text-foreground/90 font-display">
              "Insighta transformed how we look at our internal data. The AI spots trends we completely missed."
            </p>
            <footer className="text-sm font-semibold text-muted-foreground">
              — Sarah Jenkins, CEO of TechFlow
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
